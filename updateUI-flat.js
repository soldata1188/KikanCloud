const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('c:/ARATABIZ/kikan-saas/src');
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Remove shadow-sm border border-[#e1e5ea] from boxes (rounded-[32px])
    // The typical container classes: "bg-white rounded-[32px] shadow-sm border border-[#e1e5ea] p-8"
    // Buttons still have shadow-sm ? The user said "tất cả các viên bao các hộp, trên tất cả các bảng tồn tại trong App" -> remove from boxes and tables
    // To be safe and comprehensive for Flat design, let's remove shadow-sm border border-[#e1e5ea] from anything rounded-[32px]

    // Regex replace shadow-sm and borders for rounded containers
    content = content.replace(/shadow-sm border border-\[#e1e5ea\]/g, '');
    content = content.replace(/border border-\[#e1e5ea\] shadow-sm/g, '');

    // Sometimes it's just shadow-sm or just border border-[#e1e5ea] on rounded-[32px]
    // Be careful not to break everything. We want to remove box borders.
    content = content.replace(/bg-white rounded-\[32px\] border border-\[#e1e5ea\]/g, 'bg-white rounded-[32px]');
    content = content.replace(/bg-white rounded-\[32px\] shadow-sm/g, 'bg-white rounded-[32px]');
    content = content.replace(/bg-gray-50\/50 rounded-\[32px\] border border-\[#e1e5ea\]/g, 'bg-gray-50/50 rounded-[32px]');

    // For pure tables and wrappers
    content = content.replace(/border border-\[#e1e5ea\] rounded-\[32px\] overflow-hidden/g, 'rounded-[32px] overflow-hidden');
    content = content.replace(/border border-\[#e1e5ea\] rounded-\[32px\]/g, 'rounded-[32px]');

    // On the WorkersClient / CompaniesClient components search forms
    content = content.replace(/bg-white rounded-\[32px\] p-4/g, 'bg-white rounded-[32px] p-4'); // Make sure no shadow

    // Replace standalone border border-[#e1e5ea] inside className strings that contain rounded-[32px]
    // Because it's too complex with regex, let's just do a string replace of the combinations seen:
    const replacements = [
        " shadow-sm border border-[#e1e5ea]",
        " border border-[#e1e5ea] shadow-sm",
        " shadow-sm border border-gray-100",
        " border border-gray-100 shadow-sm",
        " border border-[#e1e5ea]",
        " shadow-sm",
        " shadow-md",
        " shadow-lg",
        " shadow-xl",
        " shadow-2xl"
    ];

    // Read the file line by line to target only elements (table containers, UI structural boxes) using rounded-[32px]
    const lines = content.split('\n');
    let modifiedLines = lines.map(line => {
        if (line.includes('rounded-[32px]') && line.includes('className="')) {
            // Apply replacements on this line
            let newLine = line;
            replacements.forEach(rep => {
                // To avoid accidental removal inside text, we ensure it's within className string
                // But this is simple enough
                newLine = newLine.split(rep + '"').join('"');
                newLine = newLine.split(rep + ' ').join(' ');
            });
            // Clean up extra spaces
            newLine = newLine.replace(/  +/g, ' ');
            return newLine;
        }
        return line;
    });

    content = modifiedLines.join('\n');

    // Remove border from thead and internal containers if requested, but "bao các hộp" usually refers to the outer wrappers. Let's stick strictly to what we just replaced first.

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Updated: ' + file);
    }
});

console.log('Total files updated for flat UI: ' + changedCount);
