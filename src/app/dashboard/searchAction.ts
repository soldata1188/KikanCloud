'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchResult = {
    id: string;
    type: 'worker' | 'company' | 'chat';
    title: string;
    subtitle: string;
    link: string;
};

export async function globalOmniSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get tenant
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData?.tenant_id) return []

    const tenantId = userData.tenant_id;
    const searchPattern = `%${query.trim()}%`;
    const results: SearchResult[] = [];

    // Search Workers
    const { data: workers } = await supabase
        .from('workers')
        .select('id, full_name_romaji, full_name_kana, status')
        .eq('tenant_id', tenantId)
        .eq('is_deleted', false)
        .or(`full_name_romaji.ilike.${searchPattern},full_name_kana.ilike.${searchPattern}`)
        .limit(5);

    if (workers) {
        workers.forEach(w => {
            results.push({
                id: w.id,
                type: 'worker',
                title: w.full_name_romaji || '名前なし',
                subtitle: `外国人材 - ステータス: ${w.status}`,
                link: `/workers/${w.id}` // Defaulting to list right now if no detailed page
            });
        });
    }

    // Search Companies
    const { data: companies } = await supabase
        .from('companies')
        .select('id, name_jp, name_romaji, corporate_number')
        .eq('tenant_id', tenantId)
        .eq('is_deleted', false)
        .or(`name_jp.ilike.${searchPattern},name_romaji.ilike.${searchPattern},corporate_number.ilike.${searchPattern}`)
        .limit(5);

    if (companies) {
        companies.forEach(c => {
            results.push({
                id: c.id,
                type: 'company',
                title: c.name_jp,
                subtitle: `受入企業 - ${c.name_romaji || c.corporate_number || ''}`,
                link: `/companies/${c.id}`
            });
        });
    }

    // Search Chat Users (for direct messaging contacts)
    const { data: users } = await supabase
        .from('users')
        .select('id, full_name, login_id, role')
        .eq('tenant_id', tenantId)
        .or(`full_name.ilike.${searchPattern},login_id.ilike.${searchPattern}`)
        .limit(5);

    if (users) {
        users.forEach(u => {
            if (!results.find(r => r.id === u.id)) {
                results.push({
                    id: u.id,
                    type: 'chat',
                    title: u.full_name || u.login_id || '名無しユーザー',
                    subtitle: `連絡先 (${u.role})`,
                    link: `/b2b-chat`
                });
            }
        });
    }

    return results;
}
