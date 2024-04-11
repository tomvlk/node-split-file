
const splitFile = require('../split-file');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');


const testRoot = __dirname;
const testSubFolders = ['test1', 'test2', 'output'];

const testCases = require(path.join(__dirname, 'testCases.json')); // testCases.json 파일을 로드합니다.

function cleanUp() {
    testCases.forEach(({ outputFolder }) => {
        const fullPath = path.join(__dirname, 'files', outputFolder);
        if (fs.existsSync(fullPath)) {
            fs.readdirSync(fullPath).forEach(file => {
                if (file.includes('.sf-part') || file.includes('.out')) {
                    fs.unlinkSync(path.join(fullPath, file));
                }
            });
        }
    });
}
// function cleanUp() {
//     testSubFolders.forEach((subFolder) => {
//         let folder = fs.readdirSync(testRoot + '/files/' + subFolder + '/');
//         folder.forEach((fileName) => {
//             if (fileName.indexOf('sf-part') != -1 || fileName.indexOf('.out') != -1) {
//                 fs.unlinkSync(testRoot + '/files/' + subFolder + '/' + fileName);
//             }
//         });
//     });
// }

// // TODO: 삭제
// function checksum (str, algorithm, encoding) {
//     return crypto.createHash(algorithm || 'md5').update(str, 'utf8').digest(encoding || 'hex');
// }
// function checksumFile(file, algorithm, encoding) {
//     let data = fs.readFileSync(file);
//     return checksum(data, algorithm || 'md5', encoding || 'hex');
// }

function checksumFile(file, algorithm, encoding) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algorithm || 'md5');
        const stream = fs.createReadStream(file);

        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest(encoding || 'hex')));
        stream.on('error', (error) => reject(error));
    });
}

const md5Zip = '561a3c354bbca14cf501d5e252383387';
const md5Pdf = '6bb492c383240fcd87b5c42958c2e482';


// describe('split and merge on size', () => {
//     test('should create the parts based on bytes of split parts', (done) => {
//         const input = __dirname + '/files/test1/sample.zip';
//         const inputStat = fs.statSync(input);
//         const splitSize = 100000;

//         return splitFile.splitFileBySize(input, splitSize).then((parts) => {
//             let totalPartsSize = 0;
//             parts.forEach((part) => {
//                 let stat = fs.statSync(part);
//                 expect(stat.size).toBeLessThanOrEqual(splitSize);

//                 totalPartsSize += stat.size;
//             });
//             expect(totalPartsSize).toBe(inputStat.size);
//             done();
//     	}).catch((err) => {
//             console.error(err);
//             expect(err).toBeNull();
//             done();
//         });
//     });

//     test('should merge the splitted files', (done) => {
//         let files = [];

//         const base = __dirname + '/files/test1/sample.zip.sf-part';
//         const output = __dirname + '/files/test1/sample.out';
//         const input = __dirname + '/files/test1/sample.zip'

//         const dir = fs.readdirSync(testRoot + '/files/test1/');
//         dir.forEach((file) => {
//             if (file.indexOf('sf-part') != -1) {
//                 files.push(testRoot + '/files/test1/' + file);
//             }
//         })

//         splitFile.mergeFiles(files, output)
//             .then(() => {
//                 const originalStat = fs.statSync(input);
//                 const mergedStat = fs.statSync(output);

//                 expect(mergedStat.size).toBe(originalStat.size);
//                 expect(md5Zip).toBe(checksumFile(output));
//                 done();
//             }).catch((err) => {
//                 console.error(err);
//                 expect(err).toBeNull();
//                 done();
//             });
//     });


//     afterAll(() => {
//         cleanUp();
//     });
// });



// describe('split and merge on number of parts', () => {
//     test('should create the parts based on number of given parts', (done) => {
//         const input = __dirname + '/files/test2/sample.pdf';
//         const inputStat = fs.statSync(input);
//         const numberOfParts = 512;

//         return splitFile.splitFile(input, numberOfParts).then((parts) => {
//             let totalPartsSize = 0;
//             parts.forEach((part) => {
//                 let stat = fs.statSync(part);
//                 totalPartsSize += stat.size;
//             });
//             expect(totalPartsSize).toBe(inputStat.size);
//             done();
//     	}).catch((err) => {
//             console.error(err);
//             expect(err).toBeNull();
//             done();
//         });
//     });

//     test('should merge the splitted files', (done) => {
//         let files = [];

//         const base = __dirname + '/files/test2/sample.pdf.sf-part';
//         const output = __dirname + '/files/test2/sample.out';
//         const input = __dirname + '/files/test2/sample.pdf'

//         const dir = fs.readdirSync(testRoot + '/files/test2/');
//         dir.forEach((file) => {
//             if (file.indexOf('sf-part') != -1) {
//                 files.push(testRoot + '/files/test2/' + file);
//             }
//         })

//         splitFile.mergeFiles(files, output)
//             .then(() => {
//                 const originalStat = fs.statSync(input);
//                 const mergedStat = fs.statSync(output);

//                 expect(mergedStat.size).toBe(originalStat.size);
//                 expect(md5Pdf).toBe(checksumFile(output));
//                 done();
//             }).catch((err) => {
//                 console.error(err);
//                 expect(err).toBeNull();
//                 done();
//             });
//     });


//     afterAll(() => {
//         cleanUp();
//     });
// });


// describe('split files to destination folder', () => {
//     test('should output files to specific folder', (done) => {
//         const input = __dirname + '/files/test2/sample.pdf';
//         const outputFolder = __dirname + '/files/output';
//         if (! fs.existsSync(outputFolder)) {
//             fs.mkdirSync(outputFolder);
//         }
//         const inputStat = fs.statSync(input);
//         const numberOfParts = 512;

//         return splitFile.splitFile(input, numberOfParts, outputFolder).then((parts) => {
//             let totalPartsSize = 0;
//             parts.forEach((part) => {
//                 let stat = fs.statSync(part);
//                 totalPartsSize += stat.size;
//             });
//             expect(totalPartsSize).toBe(inputStat.size);

//             let dirFiles = fs.readdirSync(outputFolder);
//             expect(dirFiles.length).toBe(numberOfParts);

//             done();
//     	}).catch((err) => {
//             console.error(err);
//             expect(err).toBeNull();
//             done();
//         });
//     });

//     afterAll(() => {
//         cleanUp();
//     });
// });


// describe('[splitFileInParallel] split and merge on number of parts', () => {
//     test('[splitFileInParallel] should create the parts based on number of given parts', async () => {
//         const input = __dirname + '/files/test2/sample.pdf';
//         const inputStat = fs.statSync(input);
//         const numberOfParts = 512;

//         return splitFile.splitFileInParallel(input, numberOfParts).then((parts) => {
//             let totalPartsSize = 0;
//             parts.forEach((part) => {
//                 let stat = fs.statSync(part);
//                 totalPartsSize += stat.size;
//             });
//             expect(totalPartsSize).toBe(inputStat.size);
//     	}).catch((err) => {
//             console.error(err);
//             expect(err).toBeNull();
//         });
//     });

//     test('should merge the splitted files', (done) => {
//         let files = [];

//         const base = __dirname + '/files/test2/sample.pdf.sf-part';
//         const output = __dirname + '/files/test2/sample.out';
//         const input = __dirname + '/files/test2/sample.pdf'

//         const dir = fs.readdirSync(testRoot + '/files/test2/');
//         dir.forEach((file) => {
//             if (file.indexOf('sf-part') != -1) {
//                 files.push(testRoot + '/files/test2/' + file);
//             }
//         })

//         splitFile.mergeFiles(files, output)
//             .then(() => {
//                 const originalStat = fs.statSync(input);
//                 const mergedStat = fs.statSync(output);

//                 expect(mergedStat.size).toBe(originalStat.size);
//                 expect(md5Pdf).toBe(checksumFile(output));
//                 done();
//             }).catch((err) => {
//                 console.error(err);
//                 expect(err).toBeNull();
//                 done();
//             });
//     });

//     afterAll(() => {
//         cleanUp();
//     });
// });


// describe('[splitFileInParallel] split files to destination folder', () => {
//     test('[splitFileInParallel] should output files to specific folder', async () => {
//         const input = __dirname + '/files/test2/sample.pdf';
//         const outputFolder = __dirname + '/files/output';
//         if (!fs.existsSync(outputFolder)) {
//             fs.mkdirSync(outputFolder);
//         }
//         const inputStat = fs.statSync(input);
//         const numberOfParts = 512; // Ensure this is consistent with your split logic

//         const parts = await splitFile.splitFileInParallel(input, numberOfParts, outputFolder);
//         let totalPartsSize = 0;
//         parts.forEach((part) => {
//             let stat = fs.statSync(part);
//             totalPartsSize += stat.size;
//         });
//         // Verify the total size of parts matches the original file's size
//         const originalFileSize = fs.statSync(input).size; // Obtain original file size dynamically
//         expect(totalPartsSize).toBe(originalFileSize);

//         // Verify the number of parts created matches the expectation
//         let dirFiles = fs.readdirSync(outputFolder).filter(file => file.includes('.sf-part'));
//         expect(dirFiles.length).toBe(numberOfParts);
//     });

//     afterAll(() => {
//         cleanUp();
//     });
// });

// 동적 테스트 케이스
jest.setTimeout(30000); // 30 seconds

function removeTestFolders() {
    testCases.forEach(({ description, outputFolder }) => {
        const uniqueOutputFolder = path.join(outputFolder, description);
        const outputPath = path.join(__dirname, 'files', uniqueOutputFolder);

        if (fs.existsSync(outputPath)) {
            fs.readdirSync(outputPath).forEach((file) => {
                fs.unlinkSync(path.join(outputPath, file)); // 폴더 내의 모든 파일을 삭제합니다.
            });

            fs.rmdirSync(outputPath); // 폴더를 삭제합니다.
        }
    });
}

describe('Dynamic Split File Testing', () => {
    testCases.forEach(({ description, inputFile, outputFolder, numberOfParts }) => {
        const uniqueOutputFolder = path.join(outputFolder, description);
        const inputPath = path.join(__dirname, 'files', inputFile);
        const outputPath = path.join(__dirname, 'files', uniqueOutputFolder);
    
        try {
            fs.mkdirSync(outputPath, { recursive: true }); // 폴더를 생성합니다. 이미 존재하는 경우 에러가 발생하지 않도록 recursive 옵션을 true로 설정합니다.
        } catch (err) {
            console.error(`Failed to create directory: ${err}`);
        }
    
        test(`${description} - should split and verify parts`, async () => {
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }
            const parts = await splitFile.splitFileInParallel(inputPath, numberOfParts, outputPath);
            let totalPartsSize = parts.reduce((sum, part) => sum + fs.statSync(part).size, 0);
            const inputStat = fs.statSync(inputPath);
            expect(totalPartsSize).toBe(inputStat.size);

            const dirFiles = fs.readdirSync(outputPath).filter(file => file.includes('.sf-part'));
            expect(dirFiles.length).toBe(numberOfParts);
        });

        test(`${description} - should merge parts and compare file size`, async () => {
            const files = fs.readdirSync(outputPath).filter(file => file.includes('.sf-part')).map(file => path.join(outputPath, file));
            const mergedFilePath = path.join(outputPath, 'merged.out');
            await splitFile.mergeFiles(files, mergedFilePath);
            const mergedStat = fs.statSync(mergedFilePath);
            const originalStat = fs.statSync(inputPath);
            expect(mergedStat.size).toBe(originalStat.size);

            const originalChecksum = await checksumFile(inputPath);
            const mergedChecksum = await checksumFile(mergedFilePath);
            expect(mergedChecksum).toBe(originalChecksum);
        }, 120000);

        afterAll(removeTestFolders);
    });
});