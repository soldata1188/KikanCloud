import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { redirect } from 'next/navigation'
import TransferClient from './TransferClient'

export const metadata = { title: '送迎・帰国' }

export const dynamic = 'force-dynamic'

export default async function TransferPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase
        .from('users').select('role, full_name, tenant_id').eq('id', user.id).single()

    const [
        { data: schedules },
        { data: workers },
        { data: companies },
        { data: staffList },
    ] = await Promise.all([
        supabase
            .from('transfer_schedules')
            .select(`*, workers!inner(id, full_name, nationality), companies!inner(id, name_jp)`)
            .eq('is_deleted', false)
            .order('scheduled_date', { ascending: true })
            .order('scheduled_time', { ascending: true }),
        supabase
            .from('workers')
            .select('id, full_name, nationality, company_id')
            .eq('tenant_id', userProfile?.tenant_id)
            .eq('is_deleted', false)
            .in('status', ['working', 'standby'])
            .order('full_name'),
        supabase
            .from('companies')
            .select('id, name_jp')
            .eq('tenant_id', userProfile?.tenant_id)
            .eq('is_deleted', false)
            .order('name_jp'),
        supabase
            .from('users')
            .select('id, full_name')
            .eq('tenant_id', userProfile?.tenant_id)
            .order('full_name'),
    ])

    return (
        <div className="seamless-block">
            <Sidebar active="transfer" />
            <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                <TopNav role={userProfile?.role} />
                <TransferClient
                    schedules={schedules ?? []}
                    workers={workers ?? []}
                    companies={companies ?? []}
                    staffList={(staffList ?? []).map(s => ({ id: s.id, name: s.full_name || '' }))}
                    defaultPicName={userProfile?.full_name || ''}
                    userRole={userProfile?.role || 'staff'}
                />
            </div>
        </div>
    )
}
