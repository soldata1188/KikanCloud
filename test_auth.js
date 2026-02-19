require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing login with:');
console.log('URL:', url);
console.log('Key (substring):', key ? key.substring(0, 10) + '...' : 'MISSING');

if (!url || !key) {
    console.error('Missing URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
    const email = 'admin@mirai.com';
    const password = 'password123';

    console.log(`Attempting login for ${email}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('LOGIN FAILED:', error.message);
        console.error('Error status:', error.status);
    } else {
        console.log('LOGIN SUCCESS!');
        console.log('User ID:', data.user.id);
        console.log('Access Token:', data.session.access_token.substring(0, 15) + '...');
    }
})();
