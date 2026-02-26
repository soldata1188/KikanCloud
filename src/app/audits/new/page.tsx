import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
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
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="audits" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <NewAuditForm
                    companies={companies || []}
                    defaultCompanyId={sp.company_id || ''}
                    defaultMonth={sp.month || ''}
                    defaultPicName={userProfile?.full_name || ''}
                    userRole={userProfile?.role || 'staff'}
                />
            </main>
        </div>
    )
}
