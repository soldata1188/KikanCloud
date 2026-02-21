'use server'
import { createClient } from '@/lib/supabase/server'

export async function globalSearch(query: string) {
    if (!query || query.length < 2) return { workers: [], companies: [] }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { workers: [], companies: [] }

    const { data: userProfile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userProfile?.tenant_id) return { workers: [], companies: [] }

    const searchTerm = `%${query}%`

    const { data: workers } = await supabase.from('workers')
        .select('id, full_name_romaji, residence_card_number')
        .eq('tenant_id', userProfile.tenant_id)
        .or(`full_name_romaji.ilike.${searchTerm},residence_card_number.ilike.${searchTerm}`)
        .limit(5)

    const { data: companies } = await supabase.from('companies')
        .select('id, name_jp')
        .eq('tenant_id', userProfile.tenant_id)
        .eq('is_deleted', false)
        .ilike('name_jp', searchTerm)
        .limit(5)

    return { workers: workers || [], companies: companies || [] }
}
