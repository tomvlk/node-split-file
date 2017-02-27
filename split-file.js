/*!
 * Split File
 * MIT License
 * Tom Valk
 */

/**
 *  Require Modules
 */
var fs      = require('fs');
var async   = require('async');
var path    = require('path');

module.exports = {};

/**
 * Split file into number of parts
 * @param {string} file
 * @param {number} parts
 * @param {splitCallback} callback
 * @returns {*}
 */
module.exports.splitFile = function(file, parts, callback) {
    if(parts < 1) return callback("No parts are given!");

    // Get information about the file
    fs.stat(file, function(err, stat) {
        // If its giving error, not a file, or the size = 0 the report back an error
        if(err) return callback(err);
        if(!stat.isFile) return callback("Given path to file is not valid, is not a file");
        if(stat.size == 0) return callback("File is empty");

        var totalSize = stat.size;
        var splitSize = Math.floor(totalSize / parts);

        // If size of the parts is 0 then you have more parts than bytes.
        if(splitSize < 1) return callback("Too many parts, or file too small!");

        // Get last split size, this is different from the others because it uses scrap value.
        var lastSplitSize = splitSize + totalSize % parts;

        // Capture the partinfo in here:
        var partInfo = [];

        // Iterate the parts
        for(var i = 0; i < parts; i ++) {
            partInfo[i] = {};

            partInfo[i].number = i + 1;

            // Set buffer read start position
            partInfo[i].start = i * splitSize;

            // Set total ending position
            partInfo[i].end = (i * splitSize) + splitSize;
            if(i == (parts - 1)) {
                partInfo[i].end = (i * splitSize) + lastSplitSize;
            }
        }

        splitFile(file, partInfo, function(err, names) {
            if(err) {return callback(err)}
            return callback(null, names);
        });
    });
};

/**
 * Split file into multiple parts based on max part size given
 * @param {string} file
 * @param {string} maxSize max part size in BYTES!
 * @param {splitCallback} callback
 * @returns {*}
 */
module.exports.splitFileBySize = function(file, maxSize, callback) {
    if(maxSize < 1) return callback("No maxSize is given!");

    // Get information about the file
    fs.stat(file, function(err, stat) {
        // If its giving error, not a file, or the size = 0 the report back an error
        if(err) return callback(err);
        if(!stat.isFile) return callback("Given path to file is not valid, is not a file");
        if(stat.size == 0) return callback("File is empty");

        var totalSize = stat.size;

        // Number of parts (exclusive last part!)
        var parts = Math.floor(totalSize / maxSize);
        var splitSize = maxSize;

        // If size of the parts is 0 then you have more parts than bytes.
        if(splitSize < 1) return callback("Too many parts, or file too small!");

        // Get last split size, this is different from the others because it uses scrap value.
        var lastSplitSize = totalSize - (splitSize * parts);

        // Capture the partinfo in here:
        var partInfo = [];

        // Iterate the parts
        for(var i = 0; i <= parts; i ++) {
            partInfo[i] = {};

            partInfo[i].number = i + 1;

            // Set buffer read start position
            partInfo[i].start = i * splitSize;

            // Set total ending position
            partInfo[i].end = (i * splitSize) + splitSize;
            if(i == (parts)) {
                partInfo[i].end = (i * splitSize) + lastSplitSize;
            }
        }

        splitFile(file, partInfo, function(err, names) {
            if(err) {return callback(err)}
            return callback(null, names);
        });
    });
};

/**
 * Merge input files to output file.
 * @param {string} inputFiles
 * @param {string} outputFile
 * @param {mergeCallback} callback
 * @returns {*}
 */
module.exports.mergeFiles = function(inputFiles, outputFile, callback) {
    if(inputFiles.length <= 0) return callback("Make sure you input an array with files as first parameter!");

    var writer = fs.createWriteStream(outputFile, {
        encoding: null
    });

    async.eachSeries(inputFiles, function(file, callback) {
        var reader = fs.createReadStream(file, {
            encoding: null
        });

        var pipe = reader.pipe( writer, {
            end: false
        });


        reader.on('end', callback);
    }, function(err) {
        if(err) {
            return callback(err);
        }
        return callback(null, outputFile);
    });
};

/**
 * Split the file, given by partinfos and filepath
 * @access private
 * @param {string} file
 * @param {object} partInfo
 * @param {splitCallback} callback
 */
function splitFile(file, partInfo, callback) {
    // Now the magic. Read buffers with length..

    var partFiles = [];
    async.eachSeries(partInfo, function(info, callback) {
        // Open up a reader
        var reader = fs.createReadStream(file, {
            encoding: null,
            start: info.start,
            end: info.end - 1
        });

        // Part name (file name of part)
        // get the max number of digits to generate for part number
        // ex. if original file is split into 4 files, then it will be 1
        // ex. if original file is split into 14 files, then it will be 2
        // etc.
        var maxPaddingCount = String(partInfo.length).length;
        // initial part number
        // ex. '0', '00', '000', etc.
        var currentPad = '';
        for (var i = 0; i < maxPaddingCount; i++) {
          currentPad += '0';
        }
        // construct part number for current file part
        // <file>.sf-part01
        // ...
        // <file>.sf-part14
        var unpaddedPartNumber = '' + info.number;
        var partNumber = currentPad.substring(0, currentPad.length - unpaddedPartNumber.length) + unpaddedPartNumber;
        var partName = file + '.sf-part' + partNumber;
        partFiles.push(partName);

        // Open up writer
        var writer = fs.createWriteStream(partName);

        // Pipe reader to writer
        var pipe = reader.pipe(writer);

        pipe.on('error', function(err) {
            callback(err);
        });

        pipe.on('finish', function() {
            callback();
        });
    }, function(err) {
        if(err) {
            return callback(err);
        }
        return callback(null, partFiles);
    });
}


/**
 * Callback on splitting files
 * @callback splitCallback
 * @param {object} error
 * @param {object} filenames
 */

/**
 * Callback on merging files
 * @callback mergeCallback
 * @param {object} error
 * @param {string} filename
 */
