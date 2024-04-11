/*!
 * Split File
 * MIT License
 * Tom Valk
 */

/**
 *  Require Modules
 */
var Promise = require("bluebird");
var fs = require("fs");
const { basename, resolve } = require("path");
/**
 * splitFileInParallel Require Modules
 */
const fsp = Promise.promisifyAll(require("fs"));
const path = require("path");
const v8 = require('v8');

// Get heap statistics at the start of the process
const heapStats = v8.getHeapStatistics();
const heapSizeLimit = heapStats.heap_size_limit;

/**
 * Split File module.
 */
var SplitFile = function () {};

/**
 * Split file into number of parts
 * @param {string} file
 * @param {number} parts
 *
 * @returns {Promise}
 */
SplitFile.prototype.splitFile = function (file, parts, dest) {
  var self = this;

  // Validate parameters.
  if (parts < 1) {
    return Promise.reject(new Error("Parameter 'parts' is invalid, must contain an integer value."));
  }

  return Promise.promisify(fs.stat)(file).then(function (stat) {
    if (!stat.isFile) {
      return Promise.reject(new Error("Given file is not valid"));
    }
    if (!stat.size) {
      return Promise.reject(new Error("File is empty"));
    }

    var totalSize = stat.size;
    var splitSize = Math.floor(totalSize / parts);

    // If size of the parts is 0 then you have more parts than bytes.
    if (splitSize < 1) {
      return Promise.reject(new Error("Too many parts, or file too small!"));
    }

    // Get last split size, this is different from the others because it uses scrap value.
    var lastSplitSize = splitSize + (totalSize % parts);

    // Capture the partinfo in here:
    var partInfo = [];

    // Iterate the parts
    for (var i = 0; i < parts; i++) {
      partInfo[i] = {
        number: i + 1,

        // Set buffer read start position
        start: i * splitSize,

        // Set total ending position
        end: i * splitSize + splitSize,
      };

      if (i === parts - 1) {
        partInfo[i].end = i * splitSize + lastSplitSize;
      }
    }

    return self.__splitFile(file, partInfo, dest);
  });
};

/**
 * Split file into multiple parts based on max part size given
 * @param {string} file
 * @param {string} maxSize max part size in BYTES!
 * @returns {Promise}
 */
SplitFile.prototype.splitFileBySize = function (file, maxSize, dest) {
  var self = this;

  return Promise.promisify(fs.stat)(file).then(function (stat) {
    if (!stat.isFile) {
      return Promise.reject(new Error("Given file is not valid"));
    }
    if (!stat.size) {
      return Promise.reject(new Error("File is empty"));
    }

    var totalSize = stat.size;

    // Number of parts (exclusive last part!)
    var parts = Math.ceil(totalSize / maxSize);
    var splitSize = Math.round(maxSize);

    // If size of the parts is 0 then you have more parts than bytes.
    if (splitSize < 1) {
      return Promise.reject(new Error("Too many parts, or file too small!"));
    }

    // Capture the partinfo in here:
    var partInfo = [];

    // Iterate the parts
    for (var i = 0; i < parts; i++) {
      partInfo[i] = {
        number: i + 1,

        // Set buffer read start position
        start: i * splitSize,

        // Set total ending position
        end: i * splitSize + splitSize,
      };
    }

    // recalculate the size of the last chunk
    partInfo[partInfo.length - 1].end = totalSize;

    return self.__splitFile(file, partInfo, dest);
  });
};

/**
 * Merge input files to output file.
 * @param {string[]} inputFiles
 * @param {string} outputFile
 *
 * @returns {Promise}
 */
SplitFile.prototype.mergeFiles = function (inputFiles, outputFile) {
  // Validate parameters.
  if (inputFiles.length <= 0) {
    return Promise.reject(new Error("Make sure you input an array with files as first parameter!"));
  }

  var writer = fs.createWriteStream(outputFile, {
    encoding: null,
  });

  // 각 파일 처리시 새로운 프로미스와 스트림을 생성하여 처리
  return Promise.mapSeries(inputFiles, function (file) {
    return new Promise(function (resolve, reject) {
      var reader = fs.createReadStream(file, { encoding: null });
      reader.pipe(writer, { end: false });
      reader.on("error", reject);
      reader.on("end", resolve);
    });
  }).then(function () {
    writer.close();
    return Promise.resolve(outputFile);
  });
};

// // mergeFiles 함수를 pipeNext 함수를 사용하여 스트림을 연결하여 구현, 메모리 사용 최적화
// SplitFile.prototype.mergeFiles = function (inputFiles, outputFile) {
//   return new Promise((resolve, reject) => {
//     // 비동기 흐름 제어 및 메모리 사용 최적화
//     // 파일 병합 과정에서 하나의 파일만 메모리에 로드하여 처리합니다.
//     if (inputFiles.length <= 0) {
//       return reject(new Error("Make sure you input an array with files as first parameter!"));
//     }

//     const writer = fs.createWriteStream(outputFile, { encoding: null });

//     let currentFileIndex = 0;

//     const pipeNext = () => {
//       if (currentFileIndex >= inputFiles.length) {
//         writer.end(); // 리소스 관리: 모든 파일이 처리된 후 쓰기 스트림을 올바르게 종료합니다.
//         return;
//       }

//       // 파일 하나씩 순차적으로 처리: 성능 및 안정성 향상
//       const reader = fs.createReadStream(inputFiles[currentFileIndex], { encoding: null });
//       reader.on('end', () => {
//         currentFileIndex++;
//         pipeNext(); // 다음 파일로 넘어가 처리합니다.
//       });
//       reader.on('error', (err) => reject(err));
//       reader.pipe(writer, { end: false }); // 쓰기 스트림을 파일이 끝날 때마다 종료하지 않습니다.
//     };

//     writer.on('finish', () => resolve(outputFile)); // 모든 파일이 성공적으로 병합되면 프로미스를 이행합니다.
//     writer.on('error', (err) => reject(err));

//     pipeNext(); // 파일 병합 과정을 시작합니다.
//   });
// };


/**
 * Split the file, given by partinfos and filepath
 * @access private
 * @param {string} file
 * @param {object} partInfo
 *
 * @returns {Promise}
 */
SplitFile.prototype.__splitFile = function (file, partInfo, dest) {
  // Now the magic. Read buffers with length..
  var partFiles = [];

  return Promise.mapSeries(partInfo, function (info) {
    return new Promise(function (resolve, reject) {
      // Open up a reader
      var reader = fs.createReadStream(file, {
        encoding: null,
        start: info.start,
        end: info.end - 1,
      });

      // Part name (file name of part)
      // get the max number of digits to generate for part number
      // ex. if original file is split into 4 files, then it will be 1
      // ex. if original file is split into 14 files, then it will be 2
      // etc.
      var maxPaddingCount = String(partInfo.length).length;
      // initial part number
      // ex. '0', '00', '000', etc.
      var currentPad = "";
      for (var i = 0; i < maxPaddingCount; i++) {
        currentPad += "0";
      }
      // construct part number for current file part
      // <file>.sf-part01
      // ...
      // <file>.sf-part14
      var unpaddedPartNumber = "" + info.number;
      var partNumber = currentPad.substring(0, currentPad.length - unpaddedPartNumber.length) + unpaddedPartNumber;
      var partName = file + ".sf-part" + partNumber;

      const outputFile = (filename) => {
        const writer = fs.createWriteStream(filename);
        const pipe = reader.pipe(writer);
        pipe.on("error", reject);
        pipe.on("finish", resolve);
      };

      if (dest) {
        const filename = basename(partName);
        if (dest.charAt(dest.length - 1) !== "/") {
          dest += "/";
        }
        outputFile(dest + filename);
        partFiles.push(dest + filename);
      } else {
        outputFile(partName);
        partFiles.push(partName);
      }
      // Pipe reader to writer
    });
  }).then(function () {
    return Promise.resolve(partFiles);
  });
};

/**
 * Split file into number of parts in parallel (use Promise.all)
 * @description The concurrency is dynamically controlled based on the size of the file and the heap memory size of the Node.js process. 
 * This ensures efficient memory usage and prevents out-of-memory errors.
 * @param {*} file 
 * @param {*} numberOfParts 
 * @param {*} dest 
 * @returns 
 */
SplitFile.prototype.splitFileInParallel = function(file, numberOfParts, dest) {
  return fsp.statAsync(file).then((stat) => {
      if (!stat.isFile()) {
          throw new Error("Given file is not valid");
      }
      if (!stat.size) {
          throw new Error("File is empty");
      }

      const totalSize = stat.size;

      // Use the pre-calculated heapSizeLimit
      // heapSizeLimit의 75%를 사용
      let concurrencyLimit = Math.min(numberOfParts, Math.floor((heapSizeLimit * 0.75) / totalSize));
      concurrencyLimit = Math.max(1, concurrencyLimit); // Ensure at least one task runs

      // Number of parts (exclusive last part!)
      const partSize = Math.ceil(totalSize / numberOfParts);
      const maxPaddingCount = String(numberOfParts).length;
      const tasks = [];

      for (let part = 0; part < numberOfParts; part++) {
          const start = part * partSize;
          const end = (part === numberOfParts) ? totalSize : start + partSize; // Adjust end for the last part

          // construct part number for current file part
          // <file>.sf-part01
          // ...
          // <file>.sf-part14
          const partNumber = String(part + 1).padStart(maxPaddingCount, '0');
          const fileName = path.basename(file);
          const partName = `${fileName}.sf-part${partNumber}`;
          
          const fileDirectory = path.dirname(file);
          // dest가 있으면 dest에 저장, 없으면 원본 파일과 같은 경로에 저장
          const outputPath = dest ? path.join(dest, partName) : path.join(fileDirectory, partName);
          // 작업을 생성하고 배열에 추가, 바로 실행하지 않음
          tasks.push(() => writePartToFile(file, start, end, outputPath));
      }
      // 동시성 제어 로직
      return executeWithConcurrencyLimit(tasks, concurrencyLimit);
  });
};

// 주어진 파일의 특정 부분을 읽어서 새로운 파일로 쓰는 작업을 수행하는 함수
function writePartToFile(sourceFile, start, end, outputPath) {
  return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(sourceFile, { start, end: end - 1 });
      const writeStream = fs.createWriteStream(outputPath);

      readStream.pipe(writeStream)
          .on("error", reject)
          .on("finish", () => resolve(outputPath));
  });
};

// 동시성 제어 함수
function executeWithConcurrencyLimit(tasks, limit) {
  let index = 0;
  const results = [];

  function executeNextBatch() {
    if (index >= tasks.length) {
      // 모든 작업이 완료된 경우, 결과를 반환
      return Promise.resolve(results);
    }

    // 현재 배치의 작업을 실행
    const batch = tasks.slice(index, index + limit).map(task => task());
    index += limit;

    // 현재 배치가 완료된 후 다음 배치 실행
    return Promise.all(batch).then(batchResults => {
      results.push(...batchResults);
      return executeNextBatch();
    });
  }

  return executeNextBatch();
}

module.exports = new SplitFile();
