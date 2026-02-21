const fs = require('fs');

const filesToUpdate = [
    'c:/ARATABIZ/kikan-saas/src/app/workers/[id]/page.tsx',
    'c:/ARATABIZ/kikan-saas/src/app/workers/[id]/edit/page.tsx',
    'c:/ARATABIZ/kikan-saas/src/app/workers/page.tsx',
    'c:/ARATABIZ/kikan-saas/src/app/workers/new/page.tsx',
    'c:/ARATABIZ/kikan-saas/src/app/page.tsx',
    'c:/ARATABIZ/kikan-saas/src/app/companies/page.tsx',
    'c:/ARATABIZ/kikan-saas/src/app/audits/page.tsx'
];

filesToUpdate.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // update select
        content = content.replace(/select\(\'full_name, role\'\)/g, "select('full_name, role, avatar_url')");

        // update UserMenu prop
        content = content.replace(/<UserMenu displayName=\{displayName\} email=\{user.email \|\| \'\'\} role=\{userProfile\?\.role\} \/>/g,
            "<UserMenu displayName={displayName} email={user.email || ''} role={userProfile?.role} avatarUrl={userProfile?.avatar_url} />");

        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated ' + file);
    } else {
        console.log('Not found ' + file);
    }
});
