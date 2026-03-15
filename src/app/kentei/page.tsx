import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { redirect } from 'next/navigation'
import KenteiClient from './KenteiClient'

export const metadata = { title: '検定業務' }

export const dynamic = 'force-dynamic'

export default async function KenteiPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase
        .from('users').select('role, full_name, tenant_id').eq('id', user.id).single()

    const [{ data: workers }, { data: allWorkersRaw }, { data: staffList }] = await Promise.all([
        supabase
            .from('workers')
            .select('id, full_name_romaji, full_name_kana, nationality, entry_batch, entry_date, industry_field, company_id, kentei_status, companies(id, name_jp)')
            .eq('tenant_id', userProfile?.tenant_id)
            .eq('is_deleted', false)
            .not('kentei_status', 'is', null)
            .order('full_name_romaji'),
        supabase
            .from('workers')
            .select('id, full_name_romaji, full_name_kana, nationality, entry_batch, entry_date, industry_field, company_id, kentei_status, companies(id, name_jp)')
            .eq('tenant_id', userProfile?.tenant_id)
            .eq('is_deleted', false)
            .order('full_name_romaji'),
        supabase
            .from('users')
            .select('id, full_name')
            .eq('tenant_id', userProfile?.tenant_id)
            .order('full_name'),
    ])

    const kenteiWorkers = (workers || []).filter(w => {
        const ks = w.kentei_status as any
        return ks?.type && ks.type !== '---'
    })

    return (
        <div className="seamless-block">
            <Sidebar active="kentei" />
            <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                <TopNav role={userProfile?.role} />
                <KenteiClient
                    workers={kenteiWorkers as any}
                    allWorkers={(allWorkersRaw || []) as any}
                    staffList={(staffList || []).map(s => ({ id: s.id, name: s.full_name || '' }))}
                    userRole={userProfile?.role || 'staff'}
                />
            </div>
        </div>
    )
}
