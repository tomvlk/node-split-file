#!/usr/bin/env node

var split = require('./split-file.js');

if(require.main === module) {
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
       console.log("Choose a option -s for split -m for merge");
   }

 }

 function cliSplit() {
   var file = process.argv[3];
   var parts = process.argv[4];

   split.splitFile(file, parts, function(err, names){
     console.log(err + ' : '+names);
   });
 }

 function cliMerge() {
   var files = [];
   var output_file = process.argv[3];

   for(var i = 4;i<process.argv.length;i++) {
     files.push(process.argv[i]);
   }

   split.mergeFiles(files, output_file, function(err, names){
     console.log(err +' : '+ names );
   });
 }
