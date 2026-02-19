const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debugAuth() {
    try {
        const keys = JSON.parse(fs.readFileSync('service_key.json', 'utf8'));
        const supabase = createClient(keys.url, keys.service);

        console.log('Listing ALL users in auth schema...');
        const { data: { users }, error } = await supabase.auth.admin.listUsers();

        if (error) {
            console.error('List Users Error:', error);
            // If API fails, try direct DB query via extensions/pg_graphql? No direct SQL access via client.
            // But we can infer if user exists by trying to CREATE it again and catch error.
        } else {
            console.log('Total Users Found:', users.length);
            users.forEach(u => console.log(`- ${u.email} (ID: ${u.id}) [Confirmed: ${u.email_confirmed_at}]`));
        }

        console.log('\nChecking if admin@mirai.com exists via create attempt...');
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email: 'admin@mirai.com',
            password: 'password123',
            email_confirm: true
        });

        if (createError) {
            console.log('Create Result: User likely exists or DB error.', createError.message);
            // If exists, try to update password
            if (createError.message.includes('already registered')) {
                console.log('User exists. Updating password to "password123"...');
                // ID required? Need to find ID first.
                const existingUser = users.find(u => u.email === 'admin@mirai.com');
                if (existingUser) {
                    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, { password: 'password123' });
                    if (updateError) console.error('Update Password Error:', updateError);
                    else console.log('Password updated successfully for', existingUser.id);
                } else {
                    console.error('User exists per error but not found in list?? sync issue.');
                }
            }
        } else {
            console.log('User created successfully during debug:', createData.user.id);
        }

    } catch (e) {
        console.error('Debug Script Error:', e);
    }
}

debugAuth();
