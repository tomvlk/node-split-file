
const splitFile = require('../split-file');
const fs = require('fs');

const testRoot = __dirname;

describe('split', () => {
    it('should create 6 parts based on bytes of split parts', (done) => {
        const input = __dirname + '/files/sample.zip';
        const splitSize = 100000;

        splitFile.splitFileBySize(input, splitSize).then((parts) => {
            if (parts.length === 6) {
                return done();
            }
            throw new Error('Wrong number of splitted parts! Got ' + parts.length);
    	});
    });

    it('should create 6 zip parts', (done) => {
        const input = __dirname + '/files/sample.zip';

        splitFile.splitFile(input, 6)
            .then((parts) => {
                if (parts) {
                    return done();
                }
                throw new Error('Parts not defined or filled!');
            }).catch((err) => {
                throw err;
            });
    });
});

describe('merge', () => {
    it('should merge the splitted files', (done) => {
        let files = [];

        const base = __dirname + '/files/sample.zip.sf-part';
        const output = __dirname + '/files/sample.out';
        const input = __dirname + '/files/sample.zip'

        for (var i = 1; i <= 6; i++) {
            files.push(base + i);
        }

        splitFile.mergeFiles(files, output)
            .then(() => {
                const originalStat = fs.statSync(input);
                const mergedStat = fs.statSync(output);

                if (originalStat.size === mergedStat.size) {
                    return done();
                }
                throw new Error('Input and output doesn\'t equal in size');
            }).catch((err) => {
                throw err;
            });
    });
});
