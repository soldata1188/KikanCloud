const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function runTest() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, anonKey);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@mirai.com',
        password: 'password123',
    });

    if (authError) {
        console.error('SignIn Error:', authError.message);
        return;
    }

    const user = authData.user;
    const { data: userData, error: userError } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
    if (userError) {
        console.error('Fetch tenant error:', userError);
        return;
    }
    const tenant_id = userData.tenant_id;

    const companies = [
        { tenant_id, name_jp: 'トヨタ自動車 (DEMO)', address: '愛知県豊田市', corporate_number: '1111111111111' },
        { tenant_id, name_jp: 'ソニー (DEMO)', address: '東京都港区', corporate_number: '2222222222222' }
    ];

    const { data: insertedCompanies, error: insertError } = await supabase.from('companies').insert(companies).select();
    if (insertError) {
        console.error('Insert Error:', JSON.stringify(insertError, null, 2));
    } else {
        console.log('Success:', insertedCompanies);
    }
}

runTest();
