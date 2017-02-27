#!/usr/bin/env node

var split = require('./split-file.js');

if (require.main === module) {
  cli();
}

function cli() {
  var option = process.argv[2];
  switch (option) {
    case '-m':
      cliMerge();
      break;
    case '-s':
      cliSplit();
      break;
    default:
      printLegend();
  }
}

function cliSplit() {
  var file = process.argv[3];
  var parts = parseInt(process.argv[4]);
  
  if (isNaN(parts)) {
    return printLegend();
  }

  split.splitFile(file, parts, function (err, names) {
    if (err) {
      console.log('An error occured:');
      console.log(err);
      return;
    }

    console.log('Successfully splitted into: ' + names);
  });
}

function cliMerge() {
  var files = [];
  var output_file = process.argv[3];

  for (var i = 4; i < process.argv.length; i++) {
    files.push(process.argv[i]);
  }

  split.mergeFiles(files, output_file, function (err, names) {
    if (err) {
      console.log('An error occured:');
      console.log(err);
      return;
    }

    console.log('Succesfully merged the parts into ' + output_file);
  });
}

function printLegend() {
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
