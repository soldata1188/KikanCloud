const { exec } = require('child_process');
const fs = require('fs');

const cmd = 'docker inspect supabase_studio_kikan-saas';
console.log(`Running: ${cmd}`);

exec(cmd, { maxBuffer: 1024 * 1024 * 5 }, (err, stdout, stderr) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    // Look for anything resembling the key variable
    const lines = stdout.split('\n');
    const matches = lines.filter(line => line.includes('SERVICE_ROLE_KEY'));

    console.log('Found matches:', matches.length);
    if (matches.length > 0) {
        fs.writeFileSync('service_key_found.txt', matches.join('\n'));
        console.log('Matches written to service_key_found.txt');
    } else {
        // Fallback: Dump all env vars to investigate
        const envSection = stdout.match(/"Env": \[[^\]]+\]/s);
        if (envSection) {
            fs.writeFileSync('all_env_vars.txt', envSection[0]);
            console.log('Dumped all Env vars to all_env_vars.txt');
        }
    }
});
