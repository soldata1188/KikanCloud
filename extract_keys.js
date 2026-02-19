const { exec } = require('child_process');
const fs = require('fs');

console.log('Running docker inspect on Kong...');
exec('docker inspect supabase_kong_kikan-saas', { encoding: 'utf8' }, (err, stdout, stderr) => {
    if (err) {
        console.error('Error executing command:', err);
        return;
    }

    try {
        const data = JSON.parse(stdout);
        if (!data || data.length === 0) {
            console.error('No container found');
            return;
        }

        const env = data[0].Config.Env;
        let anon = null;
        let service = null;

        // Read previous keys if any
        try {
            const prev = JSON.parse(fs.readFileSync('keys.json', 'utf8'));
            anon = prev.anon;
            service = prev.service;
        } catch (e) { }

        env.forEach(entry => {
            if (entry.startsWith('KONG_jwt_anon_key=')) { // Kong might use different var names? Or SUPABASE_...
                // No, standard is usually passed as well.
            }
            if (entry.includes('ANON_KEY=')) {
                anon = entry.split('=')[1];
            }
            if (entry.includes('SERVICE_ROLE_KEY=')) {
                service = entry.split('=')[1];
            }
        });

        const result = {
            anon: anon,
            service: service,
            url: 'http://127.0.0.1:54321'
        };

        fs.writeFileSync('keys.json', JSON.stringify(result, null, 2));
        console.log('Keys extracted:', JSON.stringify(result, null, 2));

    } catch (e) {
        console.error('JSON Parse error:', e);
    }
});
