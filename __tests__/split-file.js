import { splitFile, splitFileBySize, mergeFiles } from '../split-file';
import {jest} from '@jest/globals'
import fs from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testRoot = __dirname;
const testSubFolders = ['test1', 'test2', 'output'];

function cleanUp() {
    testSubFolders.forEach((subFolder) => {
        const folderPath = path.join(testRoot, 'files', subFolder);
        if (!fs.existsSync(folderPath)) return;

        const files = fs.readdirSync(folderPath);
        files.forEach((fileName) => {
            if (fileName.includes('.sf-part') || fileName.includes('.out')) {
                try {
                    fs.unlinkSync(path.join(folderPath, fileName));
                } catch (err) {} // File is already deleted
            }
        });
    });
}

function checksum(data, algorithm = 'md5', encoding = 'hex') {
    return createHash(algorithm).update(data, 'utf8').digest(encoding);
}

function checksumFile(filePath, algorithm, encoding) {
    const data = fs.readFileSync(filePath);
    return checksum(data, algorithm, encoding);
}

const md5Zip = '561a3c354bbca14cf501d5e252383387';
const md5Pdf = '6bb492c383240fcd87b5c42958c2e482';

describe('split and merge on size', () => {
    afterAll(cleanUp);

    test('should create the parts based on bytes of split parts', async () => {
        const input = path.join(__dirname, 'files/test1/sample.zip');
        const inputStat = await fs.promises.stat(input);
        const splitSize = 100000;

        try {
            const parts = await splitFileBySize(input, splitSize);
            let totalSize = 0;

            parts.forEach((part) => {
                const stat = fs.statSync(part);
                expect(stat.size).toBeLessThanOrEqual(splitSize);
                totalSize += stat.size;
            });

            expect(totalSize).toBe(inputStat.size);
        } catch (err) {
            console.error(err);
            expect(err).toBeNull();
        }
    });

    test('should merge the split files', async () => {
        const dirPath = path.join(testRoot, 'files/test1');
        const fileList = await fs.promises.readdir(dirPath)
        const files = fileList.filter(file => file.includes('.sf-part')).map(file => path.join(dirPath, file));

        const output = path.join(dirPath, 'sample.out');
        const input = path.join(dirPath, 'sample.zip');
        

        try {
            await mergeFiles(files, output);
            const originalSize = await fs.promises.stat(input).size;
            const mergedSize = await fs.promises.stat(output).size;

            expect(mergedSize).toBe(originalSize);
            expect(checksumFile(output)).toBe(md5Zip);
        } catch (err) {
            console.error(err);
            expect(err).toBeNull();
        }
    });
});

describe('split and merge by number of parts', () => {
    afterAll(cleanUp);

    test('should split file into N parts', async () => {
        const input = path.join(__dirname, 'files/test2/sample.pdf');
        const inputStat = fs.statSync(input);
        const numberOfParts = 512;

        try {
            const parts = await splitFile(input, numberOfParts);
            const totalSize = parts.reduce((acc, part) => acc + fs.statSync(part).size, 0);

            expect(totalSize).toBe(inputStat.size);
        } catch (err) {
            console.error(err);
            expect(err).toBeNull();
        }
    });

    test('should merge split files', async () => {
        const dirPath = path.join(testRoot, 'files/test2');
        const files = fs.readdirSync(dirPath)
            .filter(file => file.includes('.sf-part'))
            .map(file => path.join(dirPath, file));

        const output = path.join(dirPath, 'sample.out');
        const input = path.join(dirPath, 'sample.pdf');

        try {
            await mergeFiles(files, output);
            const originalSize = fs.statSync(input).size;
            const mergedSize = fs.statSync(output).size;

            expect(mergedSize).toBe(originalSize);
            expect(checksumFile(output)).toBe(md5Pdf);
        } catch (err) {
            console.error(err);
            expect(err).toBeNull();
        }
    });
});

describe('split files to destination folder', () => {
    afterAll(cleanUp);

    test('should files to specific folder', async () => {
        const input = path.join(__dirname, 'files/test2/sample.pdf');
        const outputFolder = path.join(__dirname, 'files/output');
        if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

        const inputStat = fs.statSync(input);
        const numberOfParts = 512;

        try {
            const parts = await splitFile(input, numberOfParts, outputFolder);
            const totalSize = parts.reduce((acc, part) => acc + fs.statSync(part).size, 0);

            expect(totalSize).toBe(inputStat.size);

            const dirFiles = fs.readdirSync(outputFolder);
            expect(dirFiles.length).toBe(numberOfParts);
        } catch (err) {
            console.error(err);
            expect(err).toBeNull();
        }
    });
});
