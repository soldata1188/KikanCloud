const fs = require('fs');

try {
    const env = JSON.parse(fs.readFileSync('docker_env.json', 'utf8'));
    let service = null;

    // Env is an array of strings like "KEY=VALUE"
    if (Array.isArray(env)) {
        env.forEach(entry => {
            if (entry.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
                service = entry.split('=')[1];
            }
        });
    }

    if (service) {
        console.log('SERVICE_ROLE_KEY FOUND');
        const keys = {
            service: service,
            url: 'http://127.0.0.1:54321'
        };
        fs.writeFileSync('service_key.json', JSON.stringify(keys, null, 2));
    } else {
        console.log('SERVICE_ROLE_KEY NOT FOUND in env');
    }

} catch (e) {
    console.error('Error parsing:', e);
}
