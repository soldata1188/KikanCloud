import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { redirect } from 'next/navigation'
import { NewAuditForm } from './NewAuditForm'

export default async function NewAuditPage({
    searchParams,
}: {
    searchParams: Promise<{ company_id?: string; month?: string }>
}) {
    const sp = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role').eq('id', user.id).single()
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden selection:bg-emerald-500/20">
            <Sidebar active="audits" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="新規スケジュール作成" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto no-scrollbar relative bg-slate-50">
                    <NewAuditForm
                        companies={companies || []}
                        defaultCompanyId={sp.company_id || ''}
                        defaultMonth={sp.month || ''}
                        defaultPicName={userProfile?.full_name || ''}
                        userRole={userProfile?.role || 'staff'}
                    />
                </main>
            </div>
        </div>
    )
}
