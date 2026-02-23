import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const allFiles = [];
walkDir('src', (f) => {
    if (f.match(/\.(tsx|ts|jsx|js)$/)) allFiles.push(f.replace(/\\/g, '/'));
});

const compFiles = [];
walkDir('src/components', (f) => {
    if (f.match(/\.(tsx|jsx)$/)) compFiles.push(f.replace(/\\/g, '/'));
});
walkDir('src/app', (f) => {
    if (f.match(/\.(tsx|jsx)$/) && !f.endsWith('page.tsx') && !f.endsWith('layout.tsx') && !f.endsWith('loading.tsx') && !f.endsWith('route.ts')) {
        compFiles.push(f.replace(/\\/g, '/'));
    }
});

const toDelete = [];

compFiles.forEach(compObj => {
    const baseName = path.basename(compObj, path.extname(compObj));
    let isImported = false;

    for (let f of allFiles) {
        if (f === compObj) continue;
        if (!fs.existsSync(f)) continue;

        let content = fs.readFileSync(f, 'utf-8');
        if (content.match(new RegExp(`\\b${baseName}\\b`))) {
            isImported = true;
            break;
        }
    }

    if (!isImported) {
        toDelete.push(compObj);
    }
});

toDelete.forEach(file => {
    console.log(`ORPHANED & DELETED: ${file}`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
});
