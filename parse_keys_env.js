const fs = require('fs');

try {
    const content = fs.readFileSync('keys_env_2.txt', 'utf8');
    const lines = content.split(/\r?\n/);
    let service = null;

    lines.forEach(line => {
        // line looks like: "SUPABASE_SERVICE_ROLE_KEY=eyJ...",
        const match = line.match(/SUPABASE_SERVICE_ROLE_KEY=([^",]+)/);
        if (match) {
            service = match[1];
        }
    });

    if (service) {
        console.log('SERVICE_ROLE_KEY FOUND');
        fs.writeFileSync('service_key.json', JSON.stringify({ service: service, url: 'http://127.0.0.1:54321' }, null, 2));
    } else {
        console.log('SERVICE_ROLE_KEY NOT FOUND in keys_env_2.txt');
    }

} catch (e) {
    console.error('Error reading/parsing file:', e);
}
