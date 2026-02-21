const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function generateData() {
    try {
        console.log('--- KIKANCLOUD MASSIVE DATA GENERATOR ---');
        const keys = JSON.parse(fs.readFileSync('service_key.json', 'utf8'));
        const supabase = createClient(keys.url, keys.service, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Get ALL active tenants from users
        const { data: users, error: uErr } = await supabase.from('users').select('id, tenant_id, role').not('tenant_id', 'is', null);
        if (uErr || !users || users.length === 0) {
            console.error('Could not find active tenant users.', uErr);
            return;
        }

        // Extract distinct tenants
        const targetTenants = [...new Map(users.map(item => [item['tenant_id'], item])).values()];

        for (const user of targetTenants) {
            const tenant_id = user.tenant_id;
            const admin_id = user.id;
            console.log(`\n\n=== Targeting Tenant: ${tenant_id} ===`);

            // 1. Generate Companies
            console.log('Generating Companies...');
            const newCompanies = [
                { tenant_id, name_jp: '株式会社サクラシステムズ', address: '東京都品川区', industry: 'IT・情報通信', is_deleted: false, representative: '田中 太郎' },
                { tenant_id, name_jp: '富士山建設工業', address: '静岡県富士市', industry: '建設・土木', is_deleted: false, representative: '鈴木 健一' },
                { tenant_id, name_jp: '京都伝統織物協同組合', address: '京都府京都市', industry: '繊維・衣服', is_deleted: false, representative: '佐藤 和子' },
                { tenant_id, name_jp: '北海道ファームホールディングス', address: '北海道札幌市', industry: '農業', is_deleted: false, representative: '高橋 誠' },
                { tenant_id, name_jp: 'オオサカ精密機械株式会社', address: '大阪府東大阪市', industry: '機械金属', is_deleted: false, representative: '伊藤 博' },
                { tenant_id, name_jp: 'みらいメディカルケア', address: '福岡県福岡市', industry: '介護・医療', is_deleted: false, representative: '渡辺 結衣' },
                { tenant_id, name_jp: '横浜グローバルロジスティクス', address: '神奈川県横浜市', industry: '運輸・物流', is_deleted: false, representative: '山本 大地' },
                { tenant_id, name_jp: 'ナゴヤ・オートパーツ製造', address: '愛知県名古屋市', industry: '自動車部品', is_deleted: false, representative: '中村 翔' },
                { tenant_id, name_jp: '仙台フーズ株式会社', address: '宮城県仙台市', industry: '食品製造', is_deleted: false, representative: '小林 香織' },
                { tenant_id, name_jp: '沖縄リゾート開発', address: '沖縄県那覇市', industry: '宿泊・観光', is_deleted: false, representative: '加藤 琉' }
            ];

            const { data: insertedCompanies, error: compErr } = await supabase.from('companies').insert(newCompanies).select('id');
            if (compErr) throw new Error(`Company Insert Error: ${compErr.message}`);
            console.log(`Inserted ${insertedCompanies.length} companies.`);

            // 2. Generate Workers
            console.log('Generating Workers...');
            const nationalities = ['ベトナム', 'インドネシア', 'フィリピン', 'カンボジア', 'ミャンマー'];
            const statuses = ['working', 'working', 'working', 'waiting', 'standby', 'returned'];
            const systems = ['ginou_jisshu', 'tokuteigino', 'ikusei_shuro'];
            const firstNames = ['NGUYEN', 'TRAN', 'LE', 'PHAM', 'BUDHI', 'SARI', 'SANTOSO', 'CRUZ', 'REYES', 'GARCIA'];
            const lastNames = ['VAN A', 'THI B', 'MINH C', 'THU D', 'SETIAWAN', 'WIDJAJA', 'DELA CRUZ', 'SANTOS'];

            let newWorkers = [];
            for (let i = 0; i < 40; i++) {
                const compId = insertedCompanies[Math.floor(Math.random() * insertedCompanies.length)].id;
                const romaji = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
                let zno = 'AB' + Math.floor(10000000 + Math.random() * 90000000) + 'CD';

                newWorkers.push({
                    tenant_id,
                    company_id: compId,
                    full_name_romaji: romaji,
                    full_name_kana: 'テスト フリガナ',
                    nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
                    dob: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    system_type: systems[Math.floor(Math.random() * systems.length)],
                    zairyu_no: zno,
                    visa_status: '技能実習1号ロ',
                    zairyu_exp: new Date(Date.now() + Math.random() * 31536000000).toISOString().split('T')[0] // within next year
                });
            }

            const { data: insertedWorkers, error: workErr } = await supabase.from('workers').insert(newWorkers).select('id');
            if (workErr) throw new Error(`Worker Insert Error: ${workErr.message}`);
            console.log(`Inserted ${insertedWorkers.length} workers.`);

            // 3. Generate Audits
            console.log('Generating Audits (監査/訪問)...');
            const auditTypes = ['kansa', 'homon', 'rinji'];
            const auditStatuses = ['planned', 'in_progress', 'completed'];

            let newAudits = [];
            for (let i = 0; i < 20; i++) {
                const compId = insertedCompanies[Math.floor(Math.random() * insertedCompanies.length)].id;
                const d = new Date();
                d.setDate(d.getDate() + (Math.floor(Math.random() * 60) - 30));

                newAudits.push({
                    tenant_id,
                    company_id: compId,
                    audit_type: auditTypes[Math.floor(Math.random() * auditTypes.length)],
                    scheduled_date: d.toISOString().split('T')[0],
                    status: auditStatuses[Math.floor(Math.random() * auditStatuses.length)],
                    pic_name: '担当者 テスト',
                    notes: 'システム自動生成データのテスト監査記録です。'
                });
            }

            const { error: audErr } = await supabase.from('audits').insert(newAudits);
            if (audErr) throw new Error(`Audit Insert Error: ${audErr.message}`);
            console.log(`Inserted ${newAudits.length} audits.`);

            // 4. Generate Procedures
            console.log('Generating Procedures (行政手続き)...');
            const procTypes = ['在留期間更新', '在留資格変更', '技能実習計画認定', '技能検定受検', '住居地変更届'];
            const agencies = ['nyukan', 'kikou', 'kentei'];
            const procStatuses = ['preparing', 'submitted', 'completed', 'issue'];

            let newProcs = [];
            for (let i = 0; i < 25; i++) {
                const workerId = insertedWorkers[Math.floor(Math.random() * insertedWorkers.length)].id;
                const compId = insertedCompanies[Math.floor(Math.random() * insertedCompanies.length)].id;
                const status = procStatuses[Math.floor(Math.random() * procStatuses.length)];

                newProcs.push({
                    tenant_id,
                    worker_id: workerId,
                    company_id: compId,
                    procedure_name: procTypes[Math.floor(Math.random() * procTypes.length)],
                    agency: agencies[Math.floor(Math.random() * agencies.length)],
                    status: status,
                    submitted_date: status === 'submitted' || status === 'completed' ? new Date().toISOString().split('T')[0] : null,
                    notes: '入管への一括申請テスト用データ',
                    pic_name: '申請担当者 テスト'
                });
            }

            const { error: procErr } = await supabase.from('procedures').insert(newProcs);
            if (procErr) throw new Error(`Procedure Insert Error: ${procErr.message}`);
            console.log(`Inserted ${newProcs.length} procedures.`);
        }

        console.log('\n✅ ALL VIRTUAL TEST DATA GENERATED SUCCESSFULLY FOR ALL TENANTS!');

    } catch (e) {
        console.error('SCRIPT ABORTED: ', e.message || e);
    }
}

generateData();
