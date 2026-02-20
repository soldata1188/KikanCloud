import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createWorker } from '../actions'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { SaveButton } from '@/components/SubmitButtons'
import { UserMenu } from '@/components/UserMenu'
import { redirect } from 'next/navigation'

export default async function NewWorkerPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-[#f0f4f9] z-10">
                    <h1 className="text-[22px] font-normal text-[#444746] tracking-tight">KikanCloud</h1>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:flex px-3 py-1 bg-white rounded-full text-[11px] font-semibold text-[#444746] tracking-wider border border-gray-200">ULTRA</span>
                        <UserMenu displayName={displayName} email={user.email || ''} role={userProfile?.role} />
                    </div>
                </header>

                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[800px] mx-auto mt-4 md:mt-8">
                    <div className="flex items-center gap-4 mb-8 pl-2">
                        <Link href="/workers" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-[#444746]">
                            <ArrowLeft size={24} strokeWidth={1.5} />
                        </Link>
                        <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">新規登録</h2>
                    </div>

                    <form action={createWorker} className="space-y-6">
                        {/* SECTION 1: 基本情報 */}
                        <div className="bg-white rounded-[32px] shadow-sm border border-[#e1e5ea] p-8">
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><Sparkles className="text-[#4285F4]" size={20} /> 基本情報</h3>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-[#444746] mb-2">顔写真（アバター）</label>
                                <input name="avatar_file" type="file" accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#f0f4f9] hover:file:bg-[#e1e5ea] outline-none transition-colors cursor-pointer" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">氏名（ローマ字） <span className="text-red-500">*</span></label><input name="full_name_romaji" type="text" required placeholder="例：NGUYEN VAN A" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none uppercase text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">氏名（カナ） <span className="text-red-500">*</span></label><input name="full_name_kana" type="text" required placeholder="例：グエン ヴァン ア" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">生年月日 <span className="text-red-500">*</span></label><input name="dob" type="date" required className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">国籍</label><select name="nationality" defaultValue="VNM" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none appearance-none text-[#1f1f1f] transition-all"><option value="VNM">ベトナム</option><option value="IDN">インドネシア</option><option value="PHL">フィリピン</option><option value="MMR">ミャンマー</option><option value="CHN">中国</option></select></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-[#444746] mb-2">現住所</label><input name="address" type="text" placeholder="例：東京都新宿区..." className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                            </div>
                        </div>

                        {/* SECTION 2: 管理情報 */}
                        <div className="bg-white rounded-[32px] shadow-sm border border-[#e1e5ea] p-8">
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><Sparkles className="text-[#34A853]" size={20} /> 管理情報</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">制度区分 <span className="text-red-500">*</span></label><select name="system_type" required defaultValue="ikusei_shuro" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none appearance-none text-[#1f1f1f] transition-all"><option value="ikusei_shuro">育成就労</option><option value="tokuteigino">特定技能</option><option value="ginou_jisshu">技能実習</option></select></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">ステータス <span className="text-red-500">*</span></label><select name="status" required defaultValue="working" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none appearance-none text-[#1f1f1f] transition-all"><option value="waiting">入国待ち</option><option value="working">就業中</option><option value="missing">失踪</option><option value="returned">帰国</option></select></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">配属先企業</label><select name="company_id" defaultValue="" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none appearance-none text-[#1f1f1f] transition-all"><option value="">未配属</option>{companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}</select></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">送出機関</label><input name="sending_org" type="text" placeholder="例：VINAJAPAN JSC" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">入国期生</label><input name="entry_batch" type="text" placeholder="例：第15期生" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">入国日</label><input name="entry_date" type="date" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                            </div>
                        </div>

                        {/* SECTION 3: 期限・証明書 */}
                        <div className="bg-white rounded-[32px] shadow-sm border border-[#e1e5ea] p-8">
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><Sparkles className="text-[#EA4335]" size={20} /> 期限・証明書</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">在留カード番号</label><input name="zairyu_no" type="text" placeholder="例：AB12345678CD" maxLength={12} className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none uppercase text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">パスポート期限</label><input name="passport_exp" type="date" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">認定開始日</label><input name="cert_start_date" type="date" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">認定修了日</label><input name="cert_end_date" type="date" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">保険期限</label><input name="insurance_exp" type="date" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                            </div>
                        </div>
                        <div className="pt-4 pb-8 flex justify-end gap-3 sticky bottom-4">
                            <Link href="/workers" className="px-6 py-3 text-[#444746] bg-white border border-[#e1e5ea] font-medium hover:bg-gray-50 rounded-full transition-colors shadow-sm">キャンセル</Link>
                            <SaveButton />
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
