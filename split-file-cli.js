#!/usr/bin/env node

var split = require('./split-file.js');

var Cli = function () {};

/**
 * Parse cli option.
 */
Cli.prototype.parse = function (option) {
  this.option = option;

  switch (option) {
    case '-m':
      this.method = this.merge;
      break;
    case '-s':
      this.method = this.split;
      break;
    default:
      this.method = this.help;
  }

  return this;
}

/**
 * Print the legend.
 */
Cli.prototype.help = function () {
  console.log("Usage: split-file -s input.bin 5");
  console.log("       split-file -m output.bin part1 part2 ...");
  console.log("");
  console.log(" -s <input> <num_parts>");
  console.log("    Split the input file in the number of parts given.");
  console.log("");
  console.log(" -m <output> <part> <part> ...");
  console.log("    Merge the given parts into the output file.");
  console.log("");
  console.log("");
  console.log("NPM Module 'split-file' by Tom Valk.");
  console.log("Visit https://github.com/tomvlk/node-split-file for info and help.");
}

/**
 * Split command.
 */
Cli.prototype.split = function () {
  var file = process.argv[3];
  var parts = parseInt(process.argv[4]);
  
  if (isNaN(parts)) {
    return this.help();
  }

  split.splitFile(file, parts).then(function (names) {
    console.log('Successfully splitted into: ' + names);
  }).catch(function (err) {
    console.log('An error occured:');
    console.log(err);
  });
}

/**
 * Merge command.
 */
Cli.prototype.merge = function () {
  var files = [];
  var output_file = process.argv[3];

  for (var i = 4; i < process.argv.length; i++) {
    files.push(process.argv[i]);
  }

  split.mergeFiles(files, output_file).then(function() {
    console.log('Succesfully merged the parts into ' + output_file);
  }).catch(function (err) {
    console.log('An error occured:');
    console.log(err);
  });
}

Cli.prototype.run = function () {
  return this.method();
}

if (require.main === module) {
  var cli = new Cli();
  cli
    .parse(process.argv[2])
    .run();
}
