import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { Shield, Key, User } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role, tenant_id, email').eq('id', user.id).single()

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="accounts" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="アカウント設定 (Account Settings)" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <h1 className="text-2xl font-black text-[#1f1f1f] tracking-tight mb-6">プロフィール設定</h1>
                        <div className="bg-white border border-[#ededed] rounded-2xl p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#24b47e]"></div>
                            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-[#ededed]">
                                <div className="w-16 h-16 rounded-full bg-[#fbfcfd] border border-[#ededed] flex items-center justify-center text-2xl font-bold text-[#24b47e]">
                                    <User size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[#1f1f1f]">{userProfile?.full_name}</h2>
                                    <p className="text-[13px] font-mono text-[#878787] mt-1">{userProfile?.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[11px] font-bold text-[#878787] uppercase tracking-widest flex items-center gap-1.5 mb-2"><Shield size={14} /> 権限 (Role)</label>
                                        <div className="px-4 py-2.5 bg-[#fbfcfd] border border-[#ededed] rounded-lg text-[13px] font-medium text-[#1f1f1f] capitalize">{userProfile?.role?.replace('_', ' ')}</div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[11px] font-bold text-[#878787] uppercase tracking-widest flex items-center gap-1.5 mb-2"><Key size={14} /> テナントID</label>
                                        <div className="px-4 py-2.5 bg-[#fbfcfd] border border-[#ededed] rounded-lg text-[11px] font-mono text-[#878787] truncate">{userProfile?.tenant_id}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
