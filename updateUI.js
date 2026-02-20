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
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
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

    // Reduce row height across the app
    // standard table padding px-6 py-4 -> px-4 py-2 
    content = content.replace(/px-6 py-4/g, 'px-4 py-2');
    // standard table padding px-6 py-5 -> px-4 py-2.5
    content = content.replace(/px-6 py-5/g, 'px-4 py-2.5');
    // other padding py-6 -> py-3 if it's in a td
    // we'll just global replace py-4 to py-2 in specific known classes if they exist, but let's stick to the common ones

    // Changing standard table headers and rows
    content = content.replace(/className="px-6 py-4/g, 'className="px-4 py-2');
    content = content.replace(/className="px-6 py-5/g, 'className="px-4 py-2.5');
    content = content.replace(/px-6 py-5 align-top/g, 'px-4 py-2.5 align-top');
    content = content.replace(/px-6 py-16/g, 'px-4 py-8'); // empty states

    // The user said: "bo tròn nút giống các hộp trong trang" (Round buttons like boxes on the page)
    // The boxes have rounded-[32px].
    // Let's replace 'rounded-full' and 'rounded-xl' and 'rounded-2xl' used on Action buttons.
    // To be safe, let's just replace all rounded-full/xl/2xl to rounded-[32px] 
    // Wait, replacing 'rounded-full' with 'rounded-[32px]' globally is fine as 32px acts as a full circle for sizes < 64px.
    content = content.replace(/rounded-full/g, 'rounded-[32px]');
    content = content.replace(/rounded-xl/g, 'rounded-[32px]');
    content = content.replace(/rounded-2xl/g, 'rounded-[32px]');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Updated: ' + file);
    }
});

const componentFiles = walk('c:/ARATABIZ/kikan-saas/src/components');
componentFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    content = content.replace(/rounded-full/g, 'rounded-[32px]');
    content = content.replace(/rounded-xl/g, 'rounded-[32px]');
    content = content.replace(/rounded-2xl/g, 'rounded-[32px]');
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Updated: ' + file);
    }
});

console.log('Total files updated: ' + changedCount);
