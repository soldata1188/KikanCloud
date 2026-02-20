require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const keyData = JSON.parse(fs.readFileSync('service_key.json', 'utf8'));
const supabaseUrl = keyData.url;
const supabaseServiceKey = keyData.service;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function seedHistory() {
    const { data: companies } = await supabaseAdmin.from('companies').select('*');
    if (!companies || companies.length === 0) {
        console.log('No companies found to attach history to.');
        return;
    }

    const { data: tenant } = await supabaseAdmin.from('tenants').select('id').limit(1).single();
    const tenantId = tenant ? tenant.id : null;

    if (!tenantId) {
        console.log('No tenant found.');
        return;
    }

    const audits = [];
    companies.forEach(company => {
        // Create 2 past completed audits for each company
        // Month - 1
        audits.push({
            tenant_id: tenantId,
            company_id: company.id,
            audit_type: 'kansa',
            scheduled_date: '2026-01-15',
            actual_date: '2026-01-14',
            status: 'completed',
            pic_name: '田中',
        });
        // Month - 2
        audits.push({
            tenant_id: tenantId,
            company_id: company.id,
            audit_type: 'homon',
            scheduled_date: '2025-12-10',
            actual_date: '2025-12-15',
            status: 'completed',
            pic_name: '鈴木',
        });
    });

    const { error } = await supabaseAdmin.from('audits').insert(audits);
    if (error) {
        console.error('Error seeding audits:', error);
    } else {
        console.log('Successfully seeded past audits.');
    }
}

seedHistory();
