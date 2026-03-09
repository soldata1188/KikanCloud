import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getTasks } from './actions';
import KanbanClient from './KanbanClient';

export default async function KanbanPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Unauthorized</div>;

    const [tasks, { data: companies }, { data: workers }, { data: staff }] = await Promise.all([
        getTasks(),
        supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp'),
        supabase.from('workers').select('id, full_name_romaji, company_id').eq('is_deleted', false).order('full_name_romaji'),
        supabase.from('users').select('id, full_name').eq('tenant_id', (await supabase.from('users').select('tenant_id').eq('id', user.id).single()).data?.tenant_id).order('full_name')
    ]);

    return (
        <KanbanClient
            initialTasks={tasks}
            companies={companies || []}
            workers={workers || []}
            staff={staff || []}
        />
    );
}
