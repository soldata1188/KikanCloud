'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    const tenant_id = userProfile?.tenant_id

    // workers count
    const { count: totalWorkers } = await supabase
        .from('workers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id)

    // companies count
    const { count: totalCompanies } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id)
        .eq('is_deleted', false)

    // waiting count
    const { count: waitingCount } = await supabase
        .from('workers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id)
        .eq('status', 'waiting')

    // missing/returned count
    const { count: missingReturnedCount } = await supabase
        .from('workers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id)
        .in('status', ['missing', 'returned'])

    // nationality stats
    const { data: nationalityData } = await supabase
        .from('workers')
        .select('nationality')
        .eq('tenant_id', tenant_id)

    const nationalityStats: Record<string, number> = {}
    if (nationalityData) {
        nationalityData.forEach(w => {
            const nat = w.nationality || 'その他'
            nationalityStats[nat] = (nationalityStats[nat] || 0) + 1
        })
    }

    return {
        totalWorkers: totalWorkers || 0,
        totalCompanies: totalCompanies || 0,
        waitingCount: waitingCount || 0,
        missingReturnedCount: missingReturnedCount || 0,
        nationalityStats
    }
}

export async function getExpiringDocuments() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    const tenant_id = userProfile?.tenant_id
    const today = new Date()
    // Use local timezone offset if needed, but UTC is usually fine for daily diffs.
    // Reset today time to 00:00:00 to calculate full days
    today.setHours(0, 0, 0, 0)

    const ninetyDaysStr = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: workers } = await supabase
        .from('workers')
        .select(`
            id, full_name_romaji, zairyu_exp, passport_exp,
            companies!workers_company_id_fkey(name_jp)
        `)
        .eq('tenant_id', tenant_id)
        .or(`zairyu_exp.lte.${ninetyDaysStr},passport_exp.lte.${ninetyDaysStr}`)

    if (!workers) return []

    const docs: any[] = []

    workers.forEach(w => {
        if (w.zairyu_exp && w.zairyu_exp <= ninetyDaysStr) {
            const expDate = new Date(w.zairyu_exp)
            expDate.setHours(0, 0, 0, 0)
            const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

            docs.push({
                id: `${w.id}-zairyu`,
                full_name_romaji: w.full_name_romaji,
                company_name: (w.companies as any)?.name_jp || '-',
                doc_type: '在留カード',
                exp_date: w.zairyu_exp,
                days_left: daysLeft
            })
        }
        if (w.passport_exp && w.passport_exp <= ninetyDaysStr) {
            const expDate = new Date(w.passport_exp)
            expDate.setHours(0, 0, 0, 0)
            const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

            docs.push({
                id: `${w.id}-passport`,
                full_name_romaji: w.full_name_romaji,
                company_name: (w.companies as any)?.name_jp || '-',
                doc_type: 'パスポート',
                exp_date: w.passport_exp,
                days_left: daysLeft
            })
        }
    })

    docs.sort((a, b) => new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime())

    return docs
}
