const fs = require('fs');

try {
    const content = fs.readFileSync('env_dump.txt', 'utf8');
    const lines = content.split(/\r?\n/);
    let service = null;

    lines.forEach(line => {
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
            service = line.substring('SUPABASE_SERVICE_ROLE_KEY='.length).trim();
        }
    });

    if (service) {
        console.log('SERVICE_ROLE_KEY FOUND');
        fs.writeFileSync('service_key.json', JSON.stringify({ service: service, url: 'http://127.0.0.1:54321' }, null, 2));
    } else {
        console.log('SERVICE_ROLE_KEY NOT FOUND in env_dump.txt');
    }

} catch (e) {
    console.error('Error reading/parsing env file:', e);
}
