const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { Client } = require('pg');

// Direct Postgres connection since Auth API is broken (500 error)
// Connection string for local Supabase Postgres: postgres://postgres:postgres@127.0.0.1:54322/postgres
// OR default port 5432? usually 54322 for local supabase db container access from host.
// Let's try to connect directly and Nuke the user.

async function nukeUser() {
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    });

    try {
        await client.connect();
        console.log('Connected to Postgres directly.');

        console.log('Deleting admin@mirai.com from auth.users...');
        const res = await client.query("DELETE FROM auth.users WHERE email = 'admin@mirai.com'");
        console.log('Deleted count:', res.rowCount);

        await client.end();
        console.log('Disconnected. Now attempting to recreate via API...');

        // Now run the seed script again to recreate cleanly
        const { execSync } = require('child_process');
        execSync('node seed_data_jp.js', { stdio: 'inherit' });

    } catch (e) {
        console.error('Direct SQL Error:', e);
        // Fallback: maybe port is 5432?
        if (e.code === 'ECONNREFUSED') {
            console.log('Retrying on port 5432...');
            const client2 = new Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres' });
            try {
                await client2.connect();
                const res = await client2.query("DELETE FROM auth.users WHERE email = 'admin@mirai.com'");
                console.log('Deleted count (5432):', res.rowCount);
                await client2.end();
                const { execSync } = require('child_process');
                execSync('node seed_data_jp.js', { stdio: 'inherit' });
            } catch (e2) {
                console.error('Retry Failed:', e2);
            }
        }
    }
}

nukeUser();
