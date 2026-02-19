const { spawn } = require('child_process');
const fs = require('fs');

console.log('Spawning docker inspect...');
const child = spawn('docker', ['inspect', 'supabase_auth_kikan-saas']);

let stdout = '';
let stderr = '';

child.stdout.on('data', (data) => {
    stdout += data.toString();
});

child.stderr.on('data', (data) => {
    stderr += data.toString();
});

child.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
    if (code !== 0) {
        console.error(`Error output: ${stderr}`);
        return;
    }

    try {
        const data = JSON.parse(stdout);
        if (data && data.length > 0 && data[0].Config && data[0].Config.Env) {
            fs.writeFileSync('env_full.json', JSON.stringify(data[0].Config.Env, null, 2));
            console.log('Env dumped to env_full.json');

            // Search
            const env = data[0].Config.Env;
            const service = env.find(e => e.includes('SERVICE_ROLE_KEY'));
            if (service) {
                console.log('FOUND:', service);
                const key = service.split('=')[1];
                fs.writeFileSync('service_key.json', JSON.stringify({ service: key, url: 'http://127.0.0.1:54321' }, null, 2));
            } else {
                console.log('SERVICE_ROLE_KEY NOT FOUND in Env list');
            }
        } else {
            console.log('Invalid JSON structure or empty Env');
        }
    } catch (e) {
        console.error('JSON parse error:', e);
        fs.writeFileSync('stdout_dump.txt', stdout);
    }
});
