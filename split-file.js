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
            var partName = file + ".sf-part" + info.number;
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
    });
};


module.exports.splitFile.splitFileOnSize = function(file, partSize, callback) {

};

module.exports.splitFile.mergeFiles = function(directory, output, callback) {

};