# Split File
[![Build Status](https://travis-ci.org/tomvlk/node-split-file.svg?branch=master)](https://travis-ci.org/tomvlk/node-split-file)

Split and merge file in multiple parts. Splittable with number of parts or maximum bytes per part

## Programmatically usage
This section contains information on how to use the split-file module in your code.

### Installation
You can install and save an entry to your package.json with the following command:
```
npm i --save split-file
```

### Usage
All methods return a Promise (bluebird) which results in some respose if some.

#### Splitting file with number of parts
```
splitFile(file) => Promise<string[]>
```
**Consumes**:
- file: Path to the file to split.

**Produces**:
- Promise<string[]>: Promise with results in an array of part names (full paths) of the splitted files.

Example:
```javascript
const splitFile = require('split-file');

splitFile.splitFile(__dirname + '/testfile.bin', 3)
  .then((names) => {
    console.log(names);
  })
  .catch((err) => {
    console.log('Error: ', err);
  });
```

#### Splitting file with maximum bytes per part
```
splitFileBySize(file, maxSize) => Promise<string[]>
```
**Consumes**:
- file: Path to the file to split.
- maxSize: Max size of the splitted parts. (bytes)

**Produces**:
- Promise<string[]>: Promise with results in an array of part names (full paths) of the splitted files.

Example:
```javascript
const splitFile = require('split-file');

splitFile.splitFileBySize(__dirname + '/testfile.bin', 457000)
  .then((names) => {
    console.log(names);
  })
  .catch((err) => {
    console.log('Error: ', err);
  });
```

#### Merge parts
```
mergeFiles(names, outputFile) => Promise<>
```
**Consumes**:
- names: Input files, array with full part paths.
- outputFile: Full path of the output file.

**Produces**:
- Promise<>: Promise that results in an empty resolving.


Example:
```javascript
const splitFile = require('split-file');

splitFile.mergeFiles(names, __dirname + '/testfile-output.bin')
  .then(() => {
    console.log('Done!');
  })
  .catch((err) => {
    console.log('Error: ', err);
  });
```

## CLI Tool

### Installation

To use the module from the commandline you can install this package in your global context:
```
npm i -g split-file
```
*Some situations you need admin rights (sudo or windows run as admin)*

### Usage

The CLI tool works like you use it in your own package.

```
Usage: split-file -s input.bin 5
       split-file -m output.bin part1 part2 ...

 -s <input> <num_parts>
    Split the input file in the number of parts given.

 -m <output> <part> <part> ...
    Merge the given parts into the output file.
```


# License
License is MIT, see LICENSE