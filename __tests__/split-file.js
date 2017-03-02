
const splitFile = require('../split-file');
const fs = require('fs');

const testRoot = __dirname;

describe('split', () => {
    it('should create 5 zip parts', (done) => {
        const input = __dirname + '/files/sample.zip';

        splitFile.splitFile(input, 5)
            .then((parts) => {
                if (parts) {
                    return done();
                }
                return done(new Error('Parts not defined or filled!'));
            }).catch((err) => {
                return done(err);
            });
    });
});

describe('merge', () => {
    it('should merge the splitted files', (done) => {
        let files = [];
        
        const base = __dirname + '/files/sample.zip.sf-part';
        const output = __dirname + '/files/sample.out';
        const input = __dirname + '/files/sample.zip'

        for (var i = 0; i < 3; i++) {
            files.push(base + (i+1));
        }

        splitFile.mergeFiles([files], output)
            .then(() => {
                const originalStat = fs.statSync(input);
                const mergedStat = fs.statSync(output);

                if (originalStat.size === mergedStat.size) {
                    return done();
                }
                return done(new Error('Input and output doesn\'t equal in size'));
            }).catch((err) => {
                return done(err);
            });
    });
});
