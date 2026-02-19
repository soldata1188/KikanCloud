const fs = require('fs');

async function diagnose() {
    let keys;
    try {
        keys = JSON.parse(fs.readFileSync('keys.json', 'utf8'));
    } catch (e) {
        console.error('Keys missing. Run extract_keys.js first.');
        return;
    }

    const { url, anon } = keys;
    console.log('Testing against:', url);

    // 1. Health Check
    try {
        const healthUrl = `${url}/auth/v1/health`;
        const res = await fetch(healthUrl);
        console.log(`Health Check (${healthUrl}):`, res.status, res.statusText);
        const text = await res.text();
        console.log('Health Body:', text);
    } catch (e) {
        console.error('Health Check Failed:', e.message);
    }

    // 2. Login Attempt (Raw)
    try {
        const loginUrl = `${url}/auth/v1/token?grant_type=password`;
        console.log(`Attempting login to: ${loginUrl}`);
        const res = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': anon
            },
            body: JSON.stringify({
                email: 'admin@mirai.com',
                password: 'password123'
            })
        });

        console.log('Login Response Status:', res.status);
        const json = await res.json();
        if (!res.ok) {
            console.error('Login Error Body:', JSON.stringify(json, null, 2));
        } else {
            console.log('Login Success! User ID:', json.user.id);
        }
    } catch (e) {
        console.error('Login Fetch Error:', e.message);
    }
}

diagnose();
