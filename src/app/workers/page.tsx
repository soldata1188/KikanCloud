import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { deleteWorker } from './actions'
import { Plus, Users, Search, Edit2, Wallet, Briefcase, Clock, Tag } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { ImportModal } from './ImportModal'
import { DeleteButton } from '@/components/SubmitButtons'
import { UserMenu } from '@/components/UserMenu'
import { redirect } from 'next/navigation'

export default async function WorkersList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'

    const { data: workers } = await supabase.from('workers')
        .select('id, full_name_romaji, full_name_kana, system_type, status, entry_date, zairyu_no, avatar_url, nationality, entry_batch, companies(name_jp)')
        .eq('is_deleted', false).order('created_at', { ascending: false })

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-[#f0f4f9] z-10">
                    <h1 className="text-[22px] font-normal text-[#444746] tracking-tight">Kikan AI</h1>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:flex px-3 py-1 bg-white rounded-full text-[11px] font-semibold text-[#444746] tracking-wider border border-gray-200">ULTRA</span>
                        <UserMenu displayName={displayName} email={user.email || ''} role={userProfile?.role} />
                    </div>
                </header>

                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[1000px] mx-auto mt-4 md:mt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pl-2">
                        <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">外国人材 管理</h2>
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
                            <ImportModal />
                            <Link href="/workers/new" className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#1f1f1f] rounded-full text-sm font-medium transition-colors shadow-sm border border-[#e1e5ea] shrink-0">
                                <Plus size={18} strokeWidth={2} /> 新規登録
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] p-2 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-300 mb-8 border border-[#e1e5ea]">
                        <div className="min-h-[48px] px-4 py-2 flex items-center gap-3">
                            <Search size={20} className="text-[#444746]" strokeWidth={1.5} />
                            <input type="text" placeholder="例：NGUYEN VAN A、または在留カード番号を入力..." className="w-full bg-transparent outline-none text-[16px] text-[#1f1f1f] placeholder:text-[#444746]/70" />
                        </div>
                    </div>

                    <div className="bg-white/80 rounded-[32px] shadow-sm border border-[#e1e5ea] overflow-hidden p-2">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-[#444746]">
                                <thead className="bg-transparent text-[13px] font-medium text-gray-500 border-b border-gray-200/50">
                                    <tr>
                                        <th className="px-6 py-4 font-normal">氏名（ローマ字 / カナ）</th>
                                        <th className="px-6 py-4 font-normal hidden md:table-cell">在留カード番号</th>
                                        <th className="px-6 py-4 font-normal">制度区分</th>
                                        <th className="px-6 py-4 font-normal">ステータス</th>
                                        <th className="px-6 py-4 font-normal text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/50">
                                    {workers?.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-[#444746]/70">データがありません。</td></tr>}
                                    {workers?.map((w) => (
                                        <tr key={w.id} className="hover:bg-white transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#f0f4f9] border border-[#e1e5ea] overflow-hidden flex items-center justify-center shrink-0">
                                                        {w.avatar_url ? <img src={w.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-[#444746] font-medium text-sm">{w.full_name_romaji.charAt(0)}</span>}
                                                    </div>
                                                    <div>
                                                        <Link href={`/workers/${w.id}/edit`} className="block group-hover:text-[#4285F4] transition-colors" title="クリックして編集">
                                                            <div className="font-medium text-[#1f1f1f] group-hover:text-[#4285F4] flex items-center gap-2">
                                                                {w.full_name_romaji}
                                                                {w.nationality && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">{w.nationality}</span>}
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-0.5">{w.full_name_kana} {w.entry_batch && `・ ${w.entry_batch}`}</div>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell font-mono text-xs uppercase tracking-wider">{w.zairyu_no || 'ー'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${w.system_type === 'ikusei_shuro' ? 'bg-[#c4eed0] text-[#0d652d]' : w.system_type === 'tokuteigino' ? 'bg-[#c2e7ff] text-[#001d35]' : 'bg-[#fce8e6] text-[#b31412]'}`}>
                                                    {w.system_type === 'ikusei_shuro' ? '育成就労' : w.system_type === 'tokuteigino' ? '特定技能' : '技能実習'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`text-xs flex items-center gap-1.5 ${w.status === 'working' ? 'text-green-600' : w.status === 'missing' ? 'text-red-500' : w.status === 'returned' ? 'text-gray-500' : 'text-orange-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${w.status === 'working' ? 'bg-green-500' : w.status === 'missing' ? 'bg-red-500' : w.status === 'returned' ? 'bg-gray-400' : 'bg-orange-500'}`}></span>
                                                    {w.status === 'working' ? '就業中' : w.status === 'missing' ? '失踪' : w.status === 'returned' ? '帰国' : '入国待ち'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/workers/${w.id}/edit`} className="p-2 rounded-full text-[#444746] hover:text-[#4285F4] hover:bg-blue-50 transition-colors" title="編集">
                                                        <Edit2 size={18} strokeWidth={1.5} />
                                                    </Link>
                                                    <form action={deleteWorker} className="inline-block">
                                                        <input type="hidden" name="id" value={w.id} />
                                                        <DeleteButton />
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
