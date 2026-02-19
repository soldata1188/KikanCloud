import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createWorker } from '../actions'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { SaveButton } from '@/components/SubmitButtons'
import { redirect } from 'next/navigation'

export default async function NewWorkerPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="workers" />
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

                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[800px] mx-auto mt-4 md:mt-8">
                    <div className="flex items-center gap-4 mb-8 pl-2">
                        <Link href="/workers" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-[#444746]">
                            <ArrowLeft size={24} strokeWidth={1.5} />
                        </Link>
                        <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">新規登録</h2>
                    </div>

                    <div className="bg-white rounded-[32px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#e1e5ea] p-8 md:p-10">
                        <div className="flex items-center gap-3 mb-8">
                            <Sparkles className="text-[#4285F4]" size={24} strokeWidth={1.5} />
                            <h3 className="text-xl font-medium text-[#1f1f1f]">外国人材の基本情報</h3>
                        </div>

                        <form action={createWorker} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-[#444746] mb-2">氏名（ローマ字） <span className="text-red-500 ml-1">*</span></label>
                                    <input name="full_name_romaji" type="text" required placeholder="NGUYEN VAN A" className="w-full bg-[#f0f4f9] hover:bg-[#e1e5ea]/50 focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3.5 outline-none transition-all uppercase text-[#1f1f1f]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#444746] mb-2">氏名（カナ） <span className="text-red-500 ml-1">*</span></label>
                                    <input name="full_name_kana" type="text" required placeholder="グエン ヴァン ア" className="w-full bg-[#f0f4f9] hover:bg-[#e1e5ea]/50 focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3.5 outline-none transition-all text-[#1f1f1f]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-[#444746] mb-2">生年月日 <span className="text-red-500 ml-1">*</span></label>
                                    <input name="dob" type="date" required className="w-full bg-[#f0f4f9] hover:bg-[#e1e5ea]/50 focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3.5 outline-none transition-all text-[#1f1f1f]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#444746] mb-2">在留カード番号</label>
                                    <input name="zairyu_no" type="text" placeholder="AB12345678CD" maxLength={12} className="w-full bg-[#f0f4f9] hover:bg-[#e1e5ea]/50 focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3.5 outline-none transition-all uppercase text-[#1f1f1f]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#f0f4f9]">
                                <div>
                                    <label className="block text-sm font-medium text-[#444746] mb-2">制度区分 <span className="text-red-500 ml-1">*</span></label>
                                    <select name="system_type" required className="w-full bg-[#f0f4f9] hover:bg-[#e1e5ea]/50 focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3.5 outline-none transition-all appearance-none cursor-pointer text-[#1f1f1f]">
                                        <option value="ikusei_shuro">育成就労 (Ikusei Shuro)</option>
                                        <option value="tokuteigino">特定技能 (Tokuteigino)</option>
                                        <option value="ginou_jisshu">技能実習 (Ginou Jisshu)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#444746] mb-2">ステータス <span className="text-red-500 ml-1">*</span></label>
                                    <select name="status" required className="w-full bg-[#f0f4f9] hover:bg-[#e1e5ea]/50 focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3.5 outline-none transition-all appearance-none cursor-pointer text-[#1f1f1f]">
                                        <option value="waiting">待機中 (Chờ bay)</option>
                                        <option value="working" selected>就業中 (Đang làm)</option>
                                        <option value="missing">失踪 (Bỏ trốn)</option>
                                        <option value="returned">帰国 (Về nước)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-[#444746] mb-2">配属先企業</label>
                                    <select name="company_id" className="w-full bg-[#f0f4f9] hover:bg-[#e1e5ea]/50 focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3.5 outline-none transition-all appearance-none cursor-pointer text-[#1f1f1f]">
                                        <option value="">未配属 (Chưa quyết định)</option>
                                        {companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#444746] mb-2">入国日</label>
                                    <input name="entry_date" type="date" className="w-full bg-[#f0f4f9] hover:bg-[#e1e5ea]/50 focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3.5 outline-none transition-all text-[#1f1f1f]" />
                                </div>
                            </div>

                            <div className="pt-8 flex justify-end gap-3">
                                <Link href="/workers" className="px-6 py-3 text-[#444746] font-medium hover:bg-gray-100 rounded-full transition-colors">キャンセル</Link>
                                <SaveButton />
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    )
}
