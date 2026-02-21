'use server'

import { createClient } from '@/lib/supabase/server'

export async function searchGlobal(query: string) {
    if (!query || query.trim().length < 2) return { workers: [], companies: [] }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { workers: [], companies: [] }

    const { data: userData } = await supabase.from('users').select('tenant_id, role, company_id').eq('id', user.id).single()
    if (!userData) return { workers: [], companies: [] }

    const q = `%${query.trim()}%`

    // Query Workers
    let workerQuery = supabase.from('workers').select('id, full_name_romaji, full_name_kana, companies(name_jp)')
        .eq('is_deleted', false)
        .or(`full_name_romaji.ilike.${q},full_name_kana.ilike.${q}`)
        .limit(5)

    // Query Companies
    let compQuery = supabase.from('companies').select('id, name_jp, name_romaji')
        .eq('is_deleted', false)
        .or(`name_jp.ilike.${q},name_romaji.ilike.${q}`)
        .limit(5)

    // Apply strict RL filters
    if (userData.role !== 'admin') {
        workerQuery = workerQuery.eq('tenant_id', userData.tenant_id)
        compQuery = compQuery.eq('tenant_id', userData.tenant_id)

        if (userData.role === 'company_admin' || userData.role === 'company_user') {
            workerQuery = workerQuery.eq('company_id', userData.company_id)
            compQuery = compQuery.eq('id', userData.company_id)
        }
    }

    const [workersRes, companiesRes] = await Promise.all([workerQuery, compQuery])

    return {
        workers: workersRes.data || [],
        companies: companiesRes.data || []
    }
}
