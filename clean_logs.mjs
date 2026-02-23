import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function processFiles() {
    let logRegex = /^[ \t]*console\.(log|info|table)\s*\([^;]*\)[;\n]/gm;
    let inlineLogRegex = /console\.(log|info|table)\s*\([^;]*\);?/g;

    walkDir('src', (filePath) => {
        if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) return;

        let content = fs.readFileSync(filePath, 'utf-8');
        let original = content;

        // Remove lines that are just console.log
        content = content.replace(logRegex, '');

        // Remove inline console.logs
        content = content.replace(inlineLogRegex, '');

        if (content !== original) {
            console.log('Cleaned consoles in:', filePath);
            fs.writeFileSync(filePath, content, 'utf-8');
        }
    });
}

processFiles();
