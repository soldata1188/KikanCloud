const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

try {
    const keys = JSON.parse(fs.readFileSync('service_key.json', 'utf8'));
    const supabase = createClient(keys.url, keys.service, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    (async () => {
        const email = 'admin@mirai.com';
        const password = 'password123';

        console.log(`Creating user ${email}...`);

        // We expect user to be deleted already via SQL
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { role: 'union_admin' }
        });

        if (createError) {
            console.error('Create User Error:', createError);
        } else {
            console.log('User created successfully:', data.user.id);
        }

    })();

} catch (e) {
    console.error('Error:', e);
}
