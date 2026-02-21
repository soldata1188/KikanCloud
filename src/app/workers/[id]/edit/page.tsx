import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { updateWorker } from '@/app/workers/actions'
import { ArrowLeft, Sparkles, FolderOpen, Map, FileText } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { UpdateButton } from '@/components/SubmitButtons'
import { AutoDocButton } from '@/components/AutoDocButton'
import { UserMenu } from '@/components/UserMenu'
import { AvatarUploadZone } from '@/components/AvatarUploadZone'
import { redirect, notFound } from 'next/navigation'

export default async function EditWorkerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role, avatar_url').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'

    const { data: worker } = await supabase.from('workers').select('*').eq('id', id).eq('is_deleted', false).single()
    if (!worker) notFound()

    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-[#fbfcfd] z-10">
                    <h1 className="text-[22px] font-normal text-[#1f1f1f] tracking-tight">KikanCloud</h1>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:flex px-3 py-1 bg-white rounded-md text-[11px] font-semibold text-[#1f1f1f] tracking-wider">ULTRA</span>
                        <UserMenu displayName={displayName} email={user.email || ''} role={userProfile?.role} avatarUrl={userProfile?.avatar_url} />
                    </div>
                </header>

                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[800px] mx-auto mt-4 md:mt-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pl-2">
                        <div className="flex items-center gap-4">
                            <Link href="/workers" className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-[#ededed] hover:bg-[#fbfcfd] text-[#1f1f1f] transition-colors"><ArrowLeft size={20} /></Link>
                            <h2 className="text-[28px] md:text-[32px] font-bold tracking-tight text-[#1f1f1f]">人材プロファイル</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <AutoDocButton worker={worker} role={userProfile?.role} />
                            <span className="text-xs text-[#878787] bg-gray-100 px-3 py-2 rounded-full font-medium border border-[#ededed] hidden sm:block">編集中</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-8 p-1.5 bg-white border border-[#ededed] rounded-[20px] w-fit shadow-sm">
                        <Link href={`/workers/${worker.id}/edit`} className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-colors bg-[#fbfcfd] text-[#24b47e] shadow-sm pointer-events-none"><FileText size={18} /> 基本情報</Link>
                        <Link href={`/workers/${worker.id}/documents`} className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-colors text-[#878787] hover:text-gray-800 hover:bg-[#fbfcfd]"><FolderOpen size={18} /> 関連書類</Link>
                        <Link href={`/workers/${worker.id}/timeline`} className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-colors text-[#878787] hover:text-gray-800 hover:bg-[#fbfcfd]"><Map size={18} /> 手続ロードマップ</Link>
                    </div>

                    <form action={updateWorker} className="space-y-6">
                        <input type="hidden" name="id" value={worker.id} />
                        <input type="hidden" name="existing_avatar_url" value={worker.avatar_url || ''} />

                        {/* SECTION 1: 基本情報 */}
                        <div className="bg-white rounded-md p-8">
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><Sparkles className="text-[#24b47e]" size={20} /> 基本情報</h3>
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-[#1f1f1f] mb-3">顔写真（アバター）</label>
                                <AvatarUploadZone defaultUrl={worker.avatar_url} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">氏名（ローマ字） <span className="text-red-500">*</span></label><input name="full_name_romaji" type="text" required defaultValue={worker.full_name_romaji} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none uppercase text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">氏名（カナ） <span className="text-red-500">*</span></label><input name="full_name_kana" type="text" required defaultValue={worker.full_name_kana} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">生年月日 <span className="text-red-500">*</span></label><input name="dob" type="date" required defaultValue={worker.dob} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div>
                                    <label className="block text-sm font-medium text-[#1f1f1f] mb-2">国籍</label>
                                    <select name="nationality" required defaultValue={worker.nationality === 'VNM' ? 'ベトナム' : worker.nationality === 'IDN' ? 'インドネシア' : worker.nationality === 'PHL' ? 'フィリピン' : worker.nationality === 'MMR' ? 'ミャンマー' : worker.nationality || 'ベトナム'} className="w-full bg-[#fbfcfd] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none appearance-none text-[#1f1f1f] transition-all">
                                        <option value="ベトナム">ベトナム</option>
                                        <option value="インドネシア">インドネシア</option>
                                        <option value="フィリピン">フィリピン</option>
                                        <option value="カンボジア">カンボジア</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-[#1f1f1f] mb-2">現住所</label><input name="address" type="text" defaultValue={worker.address || ''} placeholder="例：東京都新宿区..." className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                            </div>
                        </div>

                        {/* SECTION 2: 管理情報 */}
                        <div className="bg-white rounded-md p-8">
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><Sparkles className="text-[#34A853]" size={20} /> 管理情報</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">制度区分 <span className="text-red-500">*</span></label><select name="system_type" required defaultValue={worker.system_type} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none appearance-none text-[#1f1f1f] transition-all"><option value="ikusei_shuro">育成就労</option><option value="tokuteigino">特定技能</option><option value="ginou_jisshu">技能実習</option></select></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">ステータス <span className="text-red-500">*</span></label><select name="status" required defaultValue={worker.status} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none appearance-none text-[#1f1f1f] transition-all"><option value="waiting">入国待ち</option><option value="working">就業中</option><option value="missing">失踪</option><option value="returned">帰国</option></select></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">配属先企業</label><select name="company_id" defaultValue={worker.company_id || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none appearance-none text-[#1f1f1f] transition-all"><option value="">未配属</option>{companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}</select></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">職種 (Job Category)</label><input name="industry_field" type="text" defaultValue={worker.industry_field || ''} placeholder="例：機械加工、溶接、建設など" className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">送出機関</label><input name="sending_org" type="text" defaultValue={worker.sending_org || ''} placeholder="例：VINAJAPAN JSC" className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">入国期生</label><input name="entry_batch" type="text" defaultValue={worker.entry_batch || ''} placeholder="例：第15期生" className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">入国日</label><input name="entry_date" type="date" defaultValue={worker.entry_date || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                            </div>
                        </div>

                        {/* SECTION 3: 期限・証明書 */}
                        <div className="bg-white rounded-md p-8">
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><Sparkles className="text-[#EA4335]" size={20} /> 期限・証明書</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">在留資格</label><input name="visa_status" type="text" defaultValue={worker.visa_status || ''} placeholder="例：技能実習第1号イ" className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">在留カード番号</label><input name="zairyu_no" type="text" defaultValue={worker.zairyu_no || ''} placeholder="例：AB12345678CD" maxLength={12} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none uppercase text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">在留期限</label><input name="zairyu_exp" type="date" defaultValue={worker.zairyu_exp || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">パスポート番号</label><input name="passport_no" type="text" defaultValue={worker.passport_no || ''} placeholder="例：C1234567" className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none uppercase text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">パスポート期限</label><input name="passport_exp" type="date" defaultValue={worker.passport_exp || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">認定開始日</label><input name="cert_start_date" type="date" defaultValue={worker.cert_start_date || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">認定修了日</label><input name="cert_end_date" type="date" defaultValue={worker.cert_end_date || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#1f1f1f] mb-2">保険期限</label><input name="insurance_exp" type="date" defaultValue={worker.insurance_exp || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                            </div>
                        </div>
                        <div className="pt-4 pb-8 flex justify-end gap-3 sticky bottom-4">
                            <Link href="/workers" className="px-6 py-3 text-[#1f1f1f] bg-white font-medium hover:bg-[#fbfcfd] rounded-md transition-colors">キャンセル</Link>
                            <UpdateButton />
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
