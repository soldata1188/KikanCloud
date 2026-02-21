import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { ShieldAlert, UserPlus, Building2, UserCircle2, ArrowLeft } from 'lucide-react'
import { createAccount, deleteAccount } from './actions'
import { SaveButton, DeleteButton } from '@/components/SubmitButtons'

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userProfile?.role !== 'admin') redirect('/') // 最高管理者のみアクセス可能

    const { data: users } = await supabase.from('users').select('id, full_name, email, role, companies(name_jp)').order('created_at', { ascending: true })
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false)

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-red-200 flex items-center gap-1 w-fit"><ShieldAlert size={10} /> 統括管理者</span>
            case 'staff': return <span className="bg-[#fbfcfd] text-[#1f1f1f] px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-[#ededed] flex items-center gap-1 w-fit"><UserCircle2 size={10} /> 団体職員</span>
            case 'company_admin': return <span className="bg-[#fbfcfd] text-emerald-700 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-emerald-200 flex items-center gap-1 w-fit"><Building2 size={10} /> 企業管理者</span>
            case 'company_user': return <span className="bg-[#fbfcfd] text-[#878787] px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-[#ededed] flex items-center gap-1 w-fit"><UserCircle2 size={10} /> 企業ユーザー</span>
            case 'worker': return <span className="bg-[#fbfcfd] text-[#878787] px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-[#ededed] flex items-center gap-1 w-fit">実習生・労働者</span>
            default: return null
        }
    }

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="accounts" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="IAM Roles" role={userProfile?.role} userProfileStr={JSON.stringify(userProfile)} />
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-md border border-[#ededed] hover:bg-[#ededed] text-[#878787] hover:text-[#1f1f1f] transition-colors"><ArrowLeft size={16} /></Link>
                            <div>
                                <h1 className="text-[28px] font-normal tracking-tight text-[#1f1f1f] flex items-center gap-3">システム権限管理</h1>
                                <p className="text-[13px] text-[#878787] mt-1">最高管理者専用のセキュリティコントロールパネルです。</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-lg p-6 shadow-sm border border-[#ededed] sticky top-8">
                                    <h3 className="text-[14px] font-medium mb-6 flex items-center gap-2 text-[#1f1f1f] uppercase tracking-wider"><UserPlus size={16} className="text-[#878787]" /> 新規アカウント発行</h3>
                                    <form action={createAccount} className="space-y-4">
                                        <div><label className="block text-[11px] font-medium text-[#878787] mb-1.5 uppercase tracking-wider">氏名</label><input type="text" name="fullName" required className="w-full h-[36px] bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#878787] rounded-md px-3 text-[13px] text-[#1f1f1f] outline-none transition-colors" /></div>
                                        <div><label className="block text-[11px] font-medium text-[#878787] mb-1.5 uppercase tracking-wider">ログイン ID</label><input type="email" name="email" required className="w-full h-[36px] bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#878787] rounded-md px-3 text-[13px] text-[#1f1f1f] outline-none transition-colors" /></div>
                                        <div><label className="block text-[11px] font-medium text-[#878787] mb-1.5 uppercase tracking-wider">パスワード</label><input type="password" name="password" required minLength={6} className="w-full h-[36px] bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#878787] rounded-md px-3 text-[13px] text-[#1f1f1f] outline-none transition-colors" /></div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-[#878787] mb-1.5 uppercase tracking-wider">権限ロール</label>
                                            <select name="role" required className="w-full h-[36px] bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#878787] rounded-md px-3 text-[13px] text-[#1f1f1f] outline-none">
                                                <option value="staff">団体職員 (Staff)</option>
                                                <option value="company_admin">企業管理者 (Admin)</option>
                                                <option value="company_user">企業ユーザー (User)</option>
                                                <option value="worker">実習生・労働者 (Connect)</option>
                                                <option value="admin">統括管理者 (Super Admin)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-[#878787] mb-1.5 uppercase tracking-wider">所属企業</label>
                                            <select name="companyId" className="w-full h-[36px] bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#878787] rounded-md px-3 text-[13px] text-[#878787] outline-none">
                                                <option value="null">-- 選択不要 --</option>
                                                {companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                                            </select>
                                        </div>
                                        <div className="pt-2 flex justify-center">
                                            <SaveButton />
                                        </div>
                                    </form>
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg shadow-sm border border-[#ededed] overflow-hidden">
                                    <div className="px-5 py-4 border-b border-[#ededed] bg-[#fbfcfd] flex items-center justify-between">
                                        <h3 className="font-medium text-[13px] text-[#1f1f1f] uppercase tracking-wider">発行済みアカウント一覧</h3>
                                        <span className="text-[10px] font-mono text-[#878787] bg-white px-2 py-0.5 rounded border border-[#ededed]">{users?.length || 0} 名</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-[13px] whitespace-nowrap">
                                            <thead className="bg-[#fbfcfd] text-[11px] font-medium text-[#878787] uppercase tracking-wider border-b border-[#ededed]">
                                                <tr>
                                                    <th className="px-5 py-3 font-medium">氏名 / 所属</th>
                                                    <th className="px-5 py-3 font-medium">Email</th>
                                                    <th className="px-5 py-3 font-medium">権限ロール</th>
                                                    <th className="px-5 py-3 font-medium text-right">操作</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#ededed]">
                                                {users?.map(u => (
                                                    <tr key={u.id} className="hover:bg-[#fbfcfd] transition-colors">
                                                        <td className="px-5 py-3.5">
                                                            <div className="font-medium text-[#1f1f1f]">{u.full_name}</div>
                                                            <div className="text-[11px] text-[#878787] mt-0.5 flex items-center gap-1">
                                                                {(u.companies as any) ? <><Building2 size={10} /> {(u.companies as any).name_jp}</> : '内部 (Internal)'}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-[12px] font-mono text-[#878787]">{u.email}</td>
                                                        <td className="px-5 py-3.5">{getRoleBadge(u.role)}</td>
                                                        <td className="px-5 py-3.5 text-right">
                                                            {u.id !== user.id && u.role !== 'admin' && (
                                                                <form action={deleteAccount} className="inline-block">
                                                                    <input type="hidden" name="id" value={u.id} />
                                                                    <DeleteButton />
                                                                </form>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
