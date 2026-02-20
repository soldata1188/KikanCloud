const { createClient } = require('@supabase/supabase-js');

const fs = require('fs');

const keyData = JSON.parse(fs.readFileSync('service_key.json', 'utf8'));
const supabaseUrl = keyData.url;
const supabaseServiceKey = keyData.service;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in service_key.json');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAuth = createClient(supabaseUrl, keyData.anon || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createDemoAccount() {
    const email = 'demo@kikancloud.com';
    const password = 'demo123';
    const fullName = 'Kikan Demo User';

    console.log('1. Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (authError) {
        if (authError.message.includes('already') || authError.code === 'email_exists') {
            console.log('User already exists in Auth. Fetching user ID...');
        } else {
            console.error('Error creating auth user:', authError);
            return;
        }
    }

    let userId;
    if (authData && authData.user) {
        userId = authData.user.id;
    } else {
        const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
            email,
            password
        });
        if (signInError) {
            console.error("Could not sign in to fetch user ID:", signInError);
            return;
        }
        userId = signInData.user.id;
        // Also update password just to be sure we can sign in!
    }

    console.log(`User ID: ${userId}`);

    console.log('2. Creating Tenant...');
    const { data: tenantData, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert([{ name: 'KikanCloud Demo Org' }])
        .select()
        .single();

    if (tenantError) {
        console.error('Error creating tenant:', tenantError);
        return;
    }
    const tenantId = tenantData.id;
    console.log(`Tenant created with ID: ${tenantId}`);

    console.log('3. Ensuring User Profile in public.users...');
    const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
            id: userId,
            tenant_id: tenantId,
            full_name: fullName,
            role: 'super_admin'
        });

    if (profileError) {
        console.error('Error creating user profile:', profileError);
        return;
    }

    console.log('✅ Demo account setup complete!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Tenant ID: ${tenantId}`);
}

createDemoAccount();
