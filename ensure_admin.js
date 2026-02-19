const { createClient } = require('@supabase/supabase-js');
const keys = require('./keys.json');

// Ensure keys are present
if (!keys.service || !keys.url || keys.service === 'null') {
    console.error('Sensitive keys missing in keys.json');
    process.exit(1);
}

const supabase = createClient(keys.url, keys.service, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

(async () => {
    console.log('Checking for admin user...');
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }

    const email = 'admin@mirai.com';
    const password = 'password123';

    const admin = users.find(u => u.email === email);

    if (admin) {
        console.log(`User ${email} found (ID: ${admin.id}). Resetting password...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            admin.id,
            { password: password }
        );
        if (updateError) {
            console.error('Error updating password:', updateError);
        } else {
            console.log('Password reset successfully.');
        }
    } else {
        console.log(`User ${email} not found. Creating...`);
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { role: 'union_admin' }
        });

        if (createError) {
            console.error('Error creating user:', createError);
        } else {
            console.log('User created successfully:', data.user.id);
        }
    }
})();
