const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function seed() {
    try {
        const keys = JSON.parse(fs.readFileSync('service_key.json', 'utf8'));
        const supabase = createClient(keys.url, keys.service, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Create Tenant
        console.log('Creating Tenant...');
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({ name: '株式会社ミライワークス', org_type: 'kanri_dantai', domain: 'mirai.com' })
            .select()
            .single();

        if (tenantError) {
            console.error('Tenant Error:', tenantError);
            // If already exists (rare after reset), try to fetch
            // But reset wipes public schema.
            return;
        }
        console.log('Tenant ID:', tenant.id);

        // 2. Create Auth User (Admin)
        console.log('Creating Admin User...');
        const email = 'admin@mirai.com';
        const password = 'password123';

        // Check if user exists first? No, reset wiped auth.
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { role: 'union_admin' }
        });

        if (authError) {
            console.error('Auth Create Error:', authError);
            return;
        }
        const userId = authData.user.id;
        console.log('User ID:', userId);

        // 3. Create Public User Profile
        console.log('Creating Public Profile...');
        const { error: profileError } = await supabase.from('users').insert({
            id: userId,
            tenant_id: tenant.id,
            full_name: 'システム管理者',
            role: 'union_admin'
        });

        if (profileError) console.error('Profile Error:', profileError);
        else console.log('Profile Created.');

        // 4. Create Dummy Companies
        console.log('Creating Companies...');
        const companies = [
            { tenant_id: tenant.id, name_jp: 'トヨタ自動車株式会社', address: '愛知県豊田市' },
            { tenant_id: tenant.id, name_jp: '日立製作所', address: '東京都千代田区' },
            { tenant_id: tenant.id, name_jp: 'パナソニック', address: '大阪府門真市' }
        ];

        for (const c of companies) {
            const { error } = await supabase.from('companies').insert(c);
            if (error) console.error('Company Insert Error:', error);
        }
        console.log('Companies Created.');

    } catch (e) {
        console.error('Script Error:', e);
    }
}

seed();
