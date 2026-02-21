const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');

const s1 = content.indexOf('            {/* Metrics Grid */}');
const s2 = content.indexOf('            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">');
const s3 = content.indexOf('          </div>\n        </main>');

if (s1 === -1 || s2 === -1 || s3 === -1) {
    console.error('Could not find boundaries.');
    process.exit(1);
}

const part1 = content.slice(0, s1);
const metricsStr = content.slice(s1, s2);
const alertsStr = content.slice(s2, s3);
const part3 = content.slice(s3);

fs.writeFileSync('src/app/page.tsx', part1 + alertsStr + metricsStr + part3, 'utf8');
console.log('Swapped successfully!');
