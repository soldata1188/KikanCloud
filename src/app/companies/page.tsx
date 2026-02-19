import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { deleteCompany } from './actions'
import { Plus, Search, Edit2, Users, Building2, MapPin, Contact } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { CompanyDeleteButton } from '@/components/SubmitButtons'
import { redirect } from 'next/navigation'

export default async function CompaniesList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'

    const { data: companies } = await supabase.from('companies')
        .select('id, name_jp, name_romaji, corporate_number, address, representative, pic_name, workers(id, status, is_deleted)')
        .eq('is_deleted', false).order('created_at', { ascending: false })

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="companies" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-[#f0f4f9] z-10">
                    <h1 className="text-[22px] font-normal text-[#444746] tracking-tight">Kikan AI</h1>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:flex px-3 py-1 bg-white rounded-full text-[11px] font-semibold text-[#444746] tracking-wider border border-gray-200">ULTRA</span>
                        <button className="flex items-center gap-2 pl-4 pr-1.5 py-1.5 bg-white rounded-full text-sm font-medium text-[#444746] hover:bg-gray-50 transition border border-gray-200 shadow-sm cursor-pointer">
                            仕事 <div className="w-8 h-8 rounded-full bg-[#d81b60] text-white flex items-center justify-center text-xs font-bold">{displayName.charAt(0)}</div>
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[1200px] mx-auto mt-4 md:mt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pl-2">
                        <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">受入企業 管理</h2>
                        <Link href="/companies/new" className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#1f1f1f] rounded-full text-sm font-medium transition-colors shadow-sm border border-[#e1e5ea]">
                            <Plus size={18} strokeWidth={2} /> 新規登録
                        </Link>
                    </div>

                    <div className="bg-white rounded-[32px] p-2 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#e1e5ea] mb-8 max-w-[800px]">
                        <div className="min-h-[48px] px-4 py-2 flex items-center gap-3">
                            <Search size={20} className="text-[#444746]" strokeWidth={1.5} />
                            <input type="text" placeholder="例：トヨタ自動車、または法人番号を入力..." className="w-full bg-transparent outline-none text-[16px] text-[#1f1f1f] placeholder:text-[#444746]/70" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies?.length === 0 && <div className="col-span-full py-12 text-center text-[#444746]/70 bg-white/50 rounded-[32px] border border-[#e1e5ea] border-dashed">データがありません。</div>}

                        {companies?.map((c) => {
                            const activeWorkers = c.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false).length || 0;
                            return (
                                <div key={c.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-[#e1e5ea] hover:shadow-md transition-all group relative flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#f0f4f9] text-[#4285F4] flex items-center justify-center shrink-0 border border-[#e1e5ea]">
                                            <Building2 size={24} strokeWidth={1.5} />
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/companies/${c.id}/edit`} className="p-2 rounded-full text-[#444746] hover:text-[#4285F4] hover:bg-blue-50 transition-colors" title="編集"><Edit2 size={18} strokeWidth={1.5} /></Link>
                                            <form action={deleteCompany}><input type="hidden" name="id" value={c.id} /><CompanyDeleteButton /></form>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-medium text-[#1f1f1f] mb-1 leading-tight group-hover:text-[#4285F4] transition-colors">
                                        <Link href={`/companies/${c.id}/edit`}>{c.name_jp}</Link>
                                    </h3>
                                    {c.name_romaji ? <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">{c.name_romaji}</p> : <p className="text-xs text-transparent mb-4">_</p>}

                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-start gap-2.5 text-sm text-[#444746]">
                                            <MapPin size={16} className="mt-0.5 text-[#4285F4] shrink-0" strokeWidth={1.5} />
                                            <span className="line-clamp-2 leading-relaxed">{c.address || '住所未登録'}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm text-[#444746]">
                                            <Users size={16} className="text-[#34A853] shrink-0" strokeWidth={1.5} />
                                            <span className="truncate">代表: {c.representative || '未設定'}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm text-[#444746]">
                                            <Contact size={16} className="text-[#EA4335] shrink-0" strokeWidth={1.5} />
                                            <span className="truncate">担当: {c.pic_name || '未設定'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-mono text-gray-500">法人番号: {c.corporate_number || 'ー'}</span>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#f0f4f9] rounded-full text-sm font-medium text-[#444746]">
                                            <Users size={14} className="text-[#4285F4]" strokeWidth={2} /> {activeWorkers}名
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </main>
        </div>
    )
}
