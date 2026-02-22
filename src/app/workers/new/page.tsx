import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createWorker } from '../actions'
import { ArrowLeft } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { SaveButton } from '@/components/SubmitButtons'
import { UserMenu } from '@/components/UserMenu'
import { AvatarUploadZone } from '@/components/AvatarUploadZone'
import { AIScannerZone } from '@/components/AIScannerZone'
import { redirect } from 'next/navigation'

export default async function NewWorkerPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role, avatar_url').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')

    return (
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <header className="flex justify-between items-center px-3 py-2.5 text-sm md:px-6 md:py-4 sticky top-0 bg-white z-10">
                    <h1 className="text-[22px] font-normal text-[#1f1f1f] tracking-tight">KikanCloud</h1>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:flex px-3 py-1 bg-white rounded-md text-[11px] font-semibold text-[#1f1f1f] tracking-wider">ULTRA</span>
                        <UserMenu displayName={displayName} email={user.email || ''} role={userProfile?.role} avatarUrl={userProfile?.avatar_url} />
                    </div>
                </header>

                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[800px] mx-auto mt-4 md:mt-8">
                    <form action={createWorker} className="flex flex-col h-full relative space-y-6">
                        {/* Top Menu Sticky Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pl-2 sticky top-14 bg-white z-20 py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                            <div className="flex items-center gap-4">
                                <Link href="/workers" className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors text-[#1f1f1f]">
                                    <ArrowLeft size={24} strokeWidth={1.5} />
                                </Link>
                                <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">外国人材 新規登録</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link href="/workers" className="px-6 py-3 text-[#1f1f1f] bg-white font-medium hover:bg-gray-50 rounded-md transition-colors border border-gray-200">キャンセル</Link>
                                <SaveButton />
                            </div>
                        </div>

                        <AIScannerZone />

                        {/* SECTION 1: 基本情報 */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                            <div className="px-6 py-4 border-b border-gray-200 bg-white">
                                <h3 className="text-[15px] font-medium text-[#1f1f1f] flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1f1f1f] text-white text-[11px] font-bold">1</span>
                                    基本情報
                                </h3>
                            </div>
                            <div className="p-6 md:p-8">
                                <div className="mb-8">
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-3">
                                        顔写真（アバター）
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                    </label>
                                    <AvatarUploadZone />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            氏名（ローマ字）
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">必須</span>
                                        </label>
                                        <input name="full_name_romaji" type="text" required placeholder="例：NGUYEN VAN A" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none uppercase text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            氏名（カナ）
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">必須</span>
                                        </label>
                                        <input name="full_name_kana" type="text" required placeholder="例：グエン ヴァン ア" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            生年月日
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">必須</span>
                                        </label>
                                        <input name="dob" type="date" required className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            国籍
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">必須</span>
                                        </label>
                                        <select name="nationality" required defaultValue="ベトナム" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none appearance-none text-[#1f1f1f] transition-all">
                                            <option value="ベトナム">ベトナム</option>
                                            <option value="インドネシア">インドネシア</option>
                                            <option value="フィリピン">フィリピン</option>
                                            <option value="カンボジア">カンボジア</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            現住所
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="address" type="text" placeholder="例：東京都新宿区..." className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: 管理情報 */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                            <div className="px-6 py-4 border-b border-gray-200 bg-white">
                                <h3 className="text-[15px] font-medium text-[#1f1f1f] flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1f1f1f] text-white text-[11px] font-bold">2</span>
                                    管理情報
                                </h3>
                            </div>
                            <div className="p-6 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            制度区分
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">必須</span>
                                        </label>
                                        <select name="system_type" required defaultValue="ikusei_shuro" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none appearance-none text-[#1f1f1f] transition-all">
                                            <option value="ikusei_shuro">育成就労</option>
                                            <option value="tokuteigino">特定技能</option>
                                            <option value="ginou_jisshu">技能実習</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            ステータス
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">必須</span>
                                        </label>
                                        <select name="status" required defaultValue="working" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none appearance-none text-[#1f1f1f] transition-all">
                                            <option value="waiting">入国待ち</option>
                                            <option value="standby">待機中</option>
                                            <option value="working">就業中</option>
                                            <option value="missing">失踪</option>
                                            <option value="returned">帰国</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            配属先企業
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <select name="company_id" defaultValue="" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none appearance-none text-[#1f1f1f] transition-all">
                                            <option value="">未配属</option>
                                            {companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            職種 (Job Category)
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="industry_field" type="text" placeholder="例：機械加工、溶接、建設など" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            送出機関
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="sending_org" type="text" placeholder="例：VINAJAPAN JSC" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            入国期生
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="entry_batch" type="text" placeholder="例：第15期生" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            入国日
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="entry_date" type="date" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: 期限・証明書 */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                            <div className="px-6 py-4 border-b border-gray-200 bg-white">
                                <h3 className="text-[15px] font-medium text-[#1f1f1f] flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1f1f1f] text-white text-[11px] font-bold">3</span>
                                    期限・証明書
                                </h3>
                            </div>
                            <div className="p-6 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            在留資格 (Visa Status)
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="visa_status" type="text" placeholder="例：技能実習第1号イ" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            在留カード番号
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="zairyu_no" type="text" placeholder="例：AB12345678CD" maxLength={12} className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none uppercase text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            在留期限
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="zairyu_exp" type="date" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            パスポート番号
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="passport_no" type="text" placeholder="例：C1234567" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none uppercase text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            パスポート期限
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="passport_exp" type="date" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            認定開始日
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="cert_start_date" type="date" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            認定修了日
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="cert_end_date" type="date" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                            保険期限
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-[#878787] bg-white">任意</span>
                                        </label>
                                        <input name="insurance_exp" type="date" className="w-full bg-white focus:bg-white border border-gray-300 focus:border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
