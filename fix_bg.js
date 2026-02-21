const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Replace hover states to use a darker gray for contrast against white
    content = content.replace(/hover:bg-\[\#fbfcfd\]/g, 'hover:bg-gray-50');

    // 2. Replace background off-white with pure white
    content = content.replace(/bg-\[\#fbfcfd\]/g, 'bg-gray-50/30'); // Use a very subtle gray if needed? No, user wants pure white.

    // Actually, user wants "trắng nguyên bản" -> pure white.
    // I already replaced hover:bg-[#fbfcfd] with hover:bg-gray-50.
    // Replace remaining bg-[#fbfcfd] with bg-white.
    // Wait, let's revert the above line and do it correctly.

    // Restore
    content = original;
    content = content.replace(/hover:bg-\[\#fbfcfd\]/g, 'hover:bg-gray-50');
    content = content.replace(/bg-\[\#fbfcfd\]/g, 'bg-white');

    // To prevent inputs/buttons from blurring into the white background, 
    // let's adjust border-[#ededed] to border-gray-200 for slightly more contrast.
    content = content.replace(/border-\[\#ededed\]/g, 'border-gray-200');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
    }
});

console.log(`Global Background Refactor Complete. Updated ${changedFiles} files.`);
