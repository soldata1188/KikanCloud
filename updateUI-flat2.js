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

const files = walk('c:/ARATABIZ/kikan-saas/src/app');
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    const lines = content.split('\n');
    let modifiedLines = lines.map(line => {
        // Only target containers that have rounded-[32px] and bg-white (or bg-white/80)
        // because these are our main dashboard/table wrapper boxes
        if (line.includes('rounded-[32px]') && line.includes('bg-white') && line.includes('className="')) {
            // we will replace 'border border-[#...]' 'shadow-sm' 'shadow-[...]'
            // Use regex to remove shadow-* completely on these lines
            line = line.replace(/shadow-\[.*?\]/g, ''); // shadow-[0_..]
            line = line.replace(/shadow-[a-z0-9]+/g, ''); // shadow-sm, shadow-md, shadow-lg, shadow-xl
            line = line.replace(/shadow\s/g, ''); // shadow

            // remove border classes entirely from these wrappers. 
            // e.g. "border border-[#e1e5ea]", "border border-gray-200"
            line = line.replace(/border-\[.*?\]/g, ''); // border-[#e1e5ea]
            line = line.replace(/border-gray-[0-9]+/g, ''); // border-gray-100, border-gray-200

            // replace exact word "border" (not border-t, border-b)
            line = line.replace(/\bborder\b/g, '');

            // Clean up multiple spaces that might result from removal
            line = line.replace(/\s+/g, ' ');
            line = line.replace(/className=\" /g, 'className=\"');
            line = line.replace(/ \"/g, '\"');
        }
        return line;
    });

    content = modifiedLines.join('\n');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Updated: ' + file);
    }
});
console.log('Total files updated: ' + changedCount);
