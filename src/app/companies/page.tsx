import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { deleteCompany } from './actions'
import { Plus, Users, Search, Edit2, Trash2, Building2, MapPin, Contact } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { CompanyDeleteButton } from '@/components/SubmitButtons'
import { ImportModal } from './ImportModal'
import { UserMenu } from '@/components/UserMenu'
import { redirect } from 'next/navigation'

export default async function CompaniesList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'

    const { data: companies } = await supabase.from('companies')
        .select('id, name_jp, name_romaji, corporate_number, address, representative, pic_name, workers(id, status, is_deleted)')
        .eq('is_deleted', false).order('created_at', { ascending: false })

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="companies" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-[#f0f4f9] z-10">
                    <h1 className="text-[22px] font-normal text-[#444746] tracking-tight">KikanCloud</h1>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:flex px-3 py-1 bg-white rounded-full text-[11px] font-semibold text-[#444746] tracking-wider border border-gray-200">ULTRA</span>
                        <UserMenu displayName={displayName} email={user.email || ''} role={userProfile?.role} />
                    </div>
                </header>

                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[1200px] mx-auto mt-4 md:mt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pl-2">
                        <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">受入企業 管理</h2>
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
                            {userProfile?.role === 'admin' && <ImportModal />}
                            <Link href="/companies/new" className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#1f1f1f] rounded-full text-sm font-medium transition-colors shadow-sm border border-[#e1e5ea] shrink-0">
                                <Plus size={18} strokeWidth={2} /> 新規登録
                            </Link>
                        </div>
                    </div>
                    <div className="bg-white rounded-[32px] p-2 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#e1e5ea] mb-6">
                        <div className="min-h-[48px] px-4 py-2 flex items-center gap-3 bg-[#f0f4f9] rounded-2xl border border-transparent focus-within:bg-white focus-within:border-[#4285F4] transition-colors">
                            <Search size={20} className="text-[#444746]" strokeWidth={1.5} />
                            <input type="text" placeholder="例：トヨタ自動車、または法人番号を入力..." className="w-full bg-transparent outline-none text-[16px] text-[#1f1f1f] placeholder:text-[#444746]/70" />
                        </div>
                    </div>

                    <div className="bg-white/80 rounded-[32px] shadow-sm border border-[#e1e5ea] overflow-hidden p-2">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-[#444746]">
                                <thead className="bg-transparent text-[12px] font-semibold text-[#444746]/60 border-b border-gray-200/50 uppercase tracking-widest whitespace-nowrap">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">企業名 / 法人番号</th>
                                        <th className="px-6 py-4 font-medium">所在地 / 代表者</th>
                                        <th className="px-6 py-4 font-medium">担当者 / 受入人数</th>
                                        <th className="px-6 py-4 font-medium text-right w-[120px]">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e1e5ea]">
                                    {companies?.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center text-[#444746]/60 font-medium">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Search size={32} className="text-gray-300" />
                                                    受入企業が見つかりません。
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {companies?.map((c) => {
                                        const activeWorkers = c.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false).length || 0;
                                        return (
                                            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[#f0f4f9] border border-[#e1e5ea] flex items-center justify-center shrink-0 text-[#444746] mt-0.5">
                                                            <Building2 size={18} strokeWidth={1.5} />
                                                        </div>
                                                        <div>
                                                            <Link href={`/companies/${c.id}/edit`} className="font-semibold text-[#1f1f1f] text-[15px] group-hover:text-[#4285F4] transition-colors block mb-1.5 leading-tight">{c.name_jp}</Link>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                {c.name_romaji && <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{c.name_romaji}</span>}
                                                                {c.name_romaji && <span className="text-gray-300 ml-1 mr-0.5">|</span>}
                                                                <span className="text-[11px] text-gray-500 font-mono">法人番号: {c.corporate_number || 'ー'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Address & Rep */}
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-start gap-2 text-[13px] text-[#1f1f1f]">
                                                            <MapPin size={15} className="mt-0.5 text-[#4285F4] shrink-0" strokeWidth={1.5} />
                                                            <span className="line-clamp-2 leading-relaxed max-w-[200px]">{c.address || '住所未登録'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[13px] text-[#1f1f1f]">
                                                            <Users size={15} className="text-[#34A853] shrink-0" strokeWidth={1.5} />
                                                            <span className="truncate">代表: {c.representative || '未設定'}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* PIC & Count */}
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 text-[13px] text-[#1f1f1f]">
                                                            <Contact size={15} className="text-[#EA4335] shrink-0" strokeWidth={1.5} />
                                                            <span className="truncate">担当: {c.pic_name || '未設定'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#f0f4f9] rounded-md text-[11px] font-bold border border-gray-200 text-[#444746]">
                                                                <Users size={12} strokeWidth={2} className="text-[#4285F4]" /> 在籍: {activeWorkers}名
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <Link href={`/companies/${c.id}/edit`} className="p-2 rounded-full text-[#444746] hover:text-[#4285F4] hover:bg-blue-50 transition-colors" title="編集">
                                                            <Edit2 size={18} strokeWidth={1.5} />
                                                        </Link>
                                                        {userProfile?.role === 'admin' && (
                                                            <form action={deleteCompany} className="inline-block">
                                                                <input type="hidden" name="id" value={c.id} />
                                                                <CompanyDeleteButton />
                                                            </form>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
