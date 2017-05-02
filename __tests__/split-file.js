
const splitFile = require('../split-file');
const fs = require('fs');
const crypto = require('crypto');

const testRoot = __dirname;
const testSubFolders = ['test1', 'test2'];

function cleanUp() {
    testSubFolders.forEach((subFolder) => {
        let folder = fs.readdirSync(testRoot + '/files/' + subFolder + '/');
        folder.forEach((fileName) => {
            if (fileName.indexOf('sf-part') != -1 || fileName.indexOf('.out') != -1) {
                fs.unlinkSync(testRoot + '/files/' + subFolder + '/' + fileName);
            }
        })
    });
}
function checksum (str, algorithm, encoding) {
    return crypto.createHash(algorithm || 'md5').update(str, 'utf8').digest(encoding || 'hex');
}
function checksumFile(file, algorithm, encoding) {
    let data = fs.readFileSync(file);
    return checksum(data, algorithm || 'md5', encoding || 'hex');
}

const md5Zip = '561a3c354bbca14cf501d5e252383387';


describe('split and merge on size', () => {
    test('should create the parts based on bytes of split parts', (done) => {
        const input = __dirname + '/files/test1/sample.zip';
        const inputStat = fs.statSync(input);
        const splitSize = 100000;

        return splitFile.splitFileBySize(input, splitSize).then((parts) => {
            let totalPartsSize = 0;
            parts.forEach((part) => {
                let stat = fs.statSync(part);
                expect(stat.size).toBeLessThanOrEqual(splitSize);

                totalPartsSize += stat.size;
            });
            expect(totalPartsSize).toBe(inputStat.size);
            done();
    	}).catch((err) => {
            console.error(err);
            expect(err).toBeNull();
            done();
        });
    });

    test('should merge the splitted files', (done) => {
        let files = [];

        const base = __dirname + '/files/test1/sample.zip.sf-part';
        const output = __dirname + '/files/test1/sample.out';
        const input = __dirname + '/files/test1/sample.zip'

        const dir = fs.readdirSync(testRoot + '/files/test1/');
        dir.forEach((file) => {
            if (file.indexOf('sf-part') != -1) {
                files.push(testRoot + '/files/test1/' + file);
            }
        })

        splitFile.mergeFiles(files, output)
            .then(() => {
                const originalStat = fs.statSync(input);
                const mergedStat = fs.statSync(output);

                expect(mergedStat.size).toBe(originalStat.size);
                expect(md5Zip).toBe(checksumFile(output));
                done();
            }).catch((err) => {
                console.error(err);
                expect(err).toBeNull();
                done();
            });
    });


    afterAll(() => {
        cleanUp();
    });
});
