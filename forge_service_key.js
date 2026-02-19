const fs = require('fs');
const jwt = require('jsonwebtoken');

try {
    // Read env_full.json (Auth container dump)
    const envData = JSON.parse(fs.readFileSync('env_full.json', 'utf8'));

    // Find secret
    let secret = null;
    // envData is array of strings "KEY=VAL"
    envData.forEach(line => {
        if (line.startsWith('GOTRUE_JWT_SECRET=')) {
            secret = line.split('=')[1];
        }
    });

    if (!secret) {
        console.error('GOTRUE_JWT_SECRET not found in env_full.json');
        // Fallback to default if known? 
        // "super-secret-jwt-token-with-at-least-32-characters-long"
        // But checking exact var is better.
        process.exit(1);
    }

    console.log('Secret found:', secret.substring(0, 5) + '...');

    // Create Service Role JWT
    const payload = {
        role: 'service_role',
        iss: 'supabase-demo',
        exp: 1983812996, // far future
        iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(payload, secret);
    console.log('Forged Service Key:', token);

    fs.writeFileSync('service_key.json', JSON.stringify({ service: token, url: 'http://127.0.0.1:54321' }, null, 2));

} catch (e) {
    console.error('Error:', e);
}
