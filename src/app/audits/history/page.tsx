import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { redirect } from 'next/navigation'
import HistoryClient from './HistoryClient'

export const dynamic = 'force-dynamic'

export default async function AuditHistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase
        .from('users').select('role, full_name, tenant_id').eq('id', user.id).single()

    const [
        { data: companies },
        { data: staffList },
        { data: audits },
    ] = await Promise.all([
        supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp'),
        supabase.from('users').select('id, full_name').eq('tenant_id', userProfile?.tenant_id).order('full_name'),
        supabase.from('audits')
            .select('id, audit_type, company_id, scheduled_date, actual_date, status, pic_name, notes')
            .eq('is_deleted', false)
            .order('scheduled_date', { ascending: false })
            .limit(1000),
    ])

    const companyMap: Record<string, string> = {}
    ;(companies || []).forEach(c => { companyMap[c.id] = c.name_jp })

    const enrichedAudits = (audits || []).map(a => ({
        ...a,
        company_name: companyMap[a.company_id] || '不明',
    }))

    return (
        <div className="seamless-block">
            <Sidebar active="audits" />
            <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                <TopNav role={userProfile?.role} />
                <HistoryClient
                    audits={enrichedAudits}
                    companies={companies || []}
                    staffList={(staffList || []).map(s => ({ id: s.id, name: s.full_name || '' }))}
                    defaultPicName={userProfile?.full_name || ''}
                    userRole={userProfile?.role || 'staff'}
                />
            </div>
        </div>
    )
}
