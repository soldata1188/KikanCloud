import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getShienLogs } from './actions';
import ShienLogClient from './ShienLogClient';

export default async function ShienLogPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Unauthorized</div>;

    const [logs, { data: companies }, { data: workers }] = await Promise.all([
        getShienLogs(),
        supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp'),
        supabase.from('workers').select('id, full_name_romaji, company_id').eq('is_deleted', false).order('full_name_romaji')
    ]);

    return (
        <ShienLogClient
            initialLogs={logs}
            companies={companies || []}
            workers={workers || []}
        />
    );
}
