import fs from "fs";
import { basename, resolve } from "path";

// helper as replacement for Bluebird mapSeries
async function mapSeries(items, asyncFunc) {
  const results = [];

  for (const item of items) {
    results.push(await asyncFunc(item));
  }

  return results;
}


/**
 * Split file into number of parts
 * @param {string} file
 * @param {number} parts
 *
 * @returns {Promise}
 */
export async function splitFile(file, parts, dest) {
  if (parts < 1) {
    return Promise.reject(
      new Error(
        "Parameter 'parts is invalid. It must be a valid positive integer."
      )
    );
  }

  return fs.promises.stat(file).then(function (stat) {
    if (!stat.isFile()) {
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

    return __splitFile(file, partInfo, dest);
  });
}

/**
 * Split file into multiple parts based on max part size given
 * @param {string} file
 * @param {string} maxSize max part size in BYTES!
 * @returns {Promise}
 */
export async function splitFileBySize(file, maxSize, dest) {

  return fs.promises.stat(file).then(async function (stat) {
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

    return __splitFile(file, partInfo, dest);
  });
};

/**
 * Merge input files to output file.
 * @param {string[]} inputFiles
 * @param {string} outputFile
 *
 * @returns {Promise}
 */
export async function mergeFiles (inputFiles, outputFile) {
  // Validate parameters.
  if (inputFiles.length <= 0) {
    return Promise.reject(new Error("Make sure you input an array with files as first parameter!"));
  }

  var writer = fs.createWriteStream(outputFile, {
    encoding: null,
  });

  return mapSeries(inputFiles, function (file) {
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

/**
 * Split the file, given by partinfos and filepath
 * @access private
 * @param {string} file
 * @param {object} partInfo
 *
 * @returns {Promise}
 */
async function __splitFile (file, partInfo, dest) {
  // Now the magic. Read buffers with length..
  var partFiles = [];

  return mapSeries(partInfo, function (info) {
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
      // construct part number for current file part
      // <file>.sf-part01
      // ...
      // <file>.sf-part14
      const partNumber = String(info.number).padStart(maxPaddingCount, "0");
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
  }).then(() => {
    return Promise.resolve(partFiles);
  });
};
