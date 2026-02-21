import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { ShieldAlert, UserPlus, Building2, UserCircle2, ArrowLeft } from 'lucide-react'
import { createAccount, deleteAccount } from './actions'
import { SaveButton, DeleteButton } from '@/components/SubmitButtons'

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userProfile?.role !== 'admin') redirect('/') // CHỈ QUẢN TRỊ TỐI CAO ĐƯỢC VÀO

    const { data: users } = await supabase.from('users').select('id, full_name, email, role, companies(name_jp)').order('created_at', { ascending: true })
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false)

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold border border-red-200 flex items-center gap-1 w-fit"><ShieldAlert size={12} /> 統括管理者</span>
            case 'staff': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-200 flex items-center gap-1 w-fit"><UserCircle2 size={12} /> 団体職員</span>
            case 'company_admin': return <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-[10px] font-bold border border-teal-200 flex items-center gap-1 w-fit"><Building2 size={12} /> 企業管理者</span>
            case 'company_user': return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-bold border border-gray-200 flex items-center gap-1 w-fit"><UserCircle2 size={12} /> 企業ユーザー</span>
            case 'worker': return <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-[10px] font-bold border border-pink-200 flex items-center gap-1 w-fit">実習生・労働者</span>
            default: return null
        }
    }

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden">
            <Sidebar active="accounts" />
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1100px] mx-auto p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 text-[#444746]"><ArrowLeft size={20} /></Link>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-[#1f1f1f] flex items-center gap-3"><ShieldAlert className="text-red-500" size={32} /> システム権限管理 (RBAC)</h2>
                            <p className="text-sm text-[#444746] mt-1">最高管理者専用のセキュリティコントロールパネルです。</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#e1e5ea] sticky top-8">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-[#1f1f1f]"><UserPlus size={20} className="text-[#4285F4]" /> 新規アカウント発行</h3>
                                <form action={createAccount} className="space-y-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">氏名 (Họ tên)</label><input type="text" name="fullName" required className="w-full bg-[#f0f4f9] border border-transparent focus:bg-white focus:border-[#4285F4] rounded-xl px-4 py-3 text-sm outline-none transition-colors" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">ログイン ID (Email)</label><input type="email" name="email" required className="w-full bg-[#f0f4f9] border border-transparent focus:bg-white focus:border-[#4285F4] rounded-xl px-4 py-3 text-sm outline-none transition-colors" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">パスワード (Mật khẩu)</label><input type="password" name="password" required minLength={6} className="w-full bg-[#f0f4f9] border border-transparent focus:bg-white focus:border-[#4285F4] rounded-xl px-4 py-3 text-sm outline-none transition-colors" /></div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">権限ロール (Vai trò)</label>
                                        <select name="role" required className="w-full bg-[#f0f4f9] border border-transparent focus:bg-white focus:border-[#4285F4] rounded-xl px-4 py-3 text-sm outline-none font-bold text-[#444746]">
                                            <option value="staff">団体職員 (Staff - Nghiệp đoàn)</option>
                                            <option value="company_admin">企業管理者 (Admin - Xí nghiệp)</option>
                                            <option value="company_user">企業ユーザー (User - Xí nghiệp)</option>
                                            <option value="worker">実習生・労働者 (KikanConnect)</option>
                                            <option value="admin">統括管理者 (Quản trị Tối cao)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">所属企業 (Chỉ dành cho Xí nghiệp)</label>
                                        <select name="companyId" className="w-full bg-[#f0f4f9] border border-transparent focus:bg-white focus:border-[#4285F4] rounded-xl px-4 py-3 text-sm outline-none text-gray-600">
                                            <option value="null">-- 監理団体・実習生の場合は選択不要 --</option>
                                            {companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                                        </select>
                                    </div>
                                    <div className="pt-2"><SaveButton /></div>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-[32px] shadow-sm border border-[#e1e5ea] overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <h3 className="font-bold text-[#1f1f1f]">発行済みアカウント一覧</h3>
                                    <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border shadow-sm">{users?.length || 0} 名</span>
                                </div>
                                <div className="overflow-x-auto p-2">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-[#f0f4f9] text-[12px] font-bold text-[#1f1f1f]"><tr><th className="px-4 py-3 rounded-tl-xl">氏名 / 所属</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">権限ロール</th><th className="px-4 py-3 rounded-tr-xl text-right">操作</th></tr></thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {users?.map(u => (
                                                <tr key={u.id} className="hover:bg-blue-50/30">
                                                    <td className="px-4 py-4"><div className="font-bold text-[#1f1f1f]">{u.full_name}</div><div className="text-[11px] text-gray-500 mt-0.5">{(u.companies as any) ? <><Building2 size={10} className="inline" /> {(u.companies as any).name_jp}</> : '🏢 内部 (Internal)'}</div></td>
                                                    <td className="px-4 py-4 text-xs font-mono text-gray-500">{u.email}</td>
                                                    <td className="px-4 py-4">{getRoleBadge(u.role)}</td>
                                                    <td className="px-4 py-4 text-right">
                                                        {u.id !== user.id && u.role !== 'admin' && (<form action={deleteAccount} className="inline-block"><input type="hidden" name="id" value={u.id} /><DeleteButton /></form>)}
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
    )
}
