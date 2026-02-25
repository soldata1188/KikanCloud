import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { User } from 'lucide-react'
import TeamManagerClient from './TeamManagerClient'

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role, tenant_id, email').eq('id', user.id).single()

    const { data: staffList } = await supabase.from('users').select('id, full_name, email, login_id, role, companies(name_jp)').eq('tenant_id', userProfile?.tenant_id).in('role', ['admin', 'staff', 'company_admin']).order('role', { ascending: true })
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('tenant_id', userProfile?.tenant_id).eq('is_deleted', false).order('name_jp', { ascending: true })

    const isAdmin = userProfile?.role === 'admin'

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="accounts" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="アカウント管理 (Account Management)" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-6xl mx-auto space-y-8">

                        <div className="bg-white border border-[#ededed] rounded-2xl p-8 shadow-sm relative overflow-hidden mb-8">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#24b47e]"></div>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-[#fbfcfd] border border-[#ededed] flex items-center justify-center text-2xl font-bold text-[#24b47e]">
                                    <User size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[#1f1f1f]">{userProfile?.full_name}</h2>
                                    <p className="text-[13px] font-mono text-[#878787] mt-1">{userProfile?.email}</p>
                                </div>
                            </div>
                        </div>

                        <TeamManagerClient staffList={staffList || []} isAdmin={isAdmin} companies={companies || []} />
                    </div>
                </main>
            </div>
        </div>
    )
}
