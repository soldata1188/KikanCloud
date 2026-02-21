import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { updateWorker } from '@/app/workers/actions'
import { ArrowLeft, Sparkles, FolderOpen, Map, FileText } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { UpdateButton } from '@/components/SubmitButtons'
import { AutoDocButton } from '@/components/AutoDocButton'
import { UserMenu } from '@/components/UserMenu'
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
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-[#f0f4f9] z-10">
                    <h1 className="text-[22px] font-normal text-[#444746] tracking-tight">KikanCloud</h1>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:flex px-3 py-1 bg-white rounded-[32px] text-[11px] font-semibold text-[#444746] tracking-wider">ULTRA</span>
                        <UserMenu displayName={displayName} email={user.email || ''} role={userProfile?.role} avatarUrl={userProfile?.avatar_url} />
                    </div>
                </header>

                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[800px] mx-auto mt-4 md:mt-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pl-2">
                        <div className="flex items-center gap-4">
                            <Link href="/workers" className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 text-[#444746] transition-colors"><ArrowLeft size={20} /></Link>
                            <h2 className="text-[28px] md:text-[32px] font-bold tracking-tight text-[#1f1f1f]">人材プロファイル</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <AutoDocButton worker={worker} />
                            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-full font-medium border border-gray-200 hidden sm:block">編集中</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-8 p-1.5 bg-white border border-gray-200 rounded-[20px] w-fit shadow-sm">
                        <Link href={`/workers/${worker.id}/edit`} className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-colors bg-blue-50 text-[#4285F4] shadow-sm pointer-events-none"><FileText size={18} /> 基本情報</Link>
                        <Link href={`/workers/${worker.id}/documents`} className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-colors text-gray-500 hover:text-gray-800 hover:bg-gray-50"><FolderOpen size={18} /> 関連書類</Link>
                        <Link href={`/workers/${worker.id}/timeline`} className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-colors text-gray-500 hover:text-gray-800 hover:bg-gray-50"><Map size={18} /> 手続ロードマップ</Link>
                    </div>

                    <form action={updateWorker} className="space-y-6">
                        <input type="hidden" name="id" value={worker.id} />
                        <input type="hidden" name="existing_avatar_url" value={worker.avatar_url || ''} />

                        {/* SECTION 1: 基本情報 */}
                        <div className="bg-white rounded-[32px] p-8">
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><Sparkles className="text-[#4285F4]" size={20} /> 基本情報</h3>
                            <div className="mb-6 flex items-center gap-6">
                                {worker.avatar_url && <img src={worker.avatar_url} alt="Avatar" className="w-16 h-16 rounded-[32px] object-cover border border-gray-200" />}
                                <div className="flex-1"><label className="block text-sm font-medium text-[#444746] mb-2">{worker.avatar_url ? '顔写真を変更' : '顔写真をアップロード'}</label><input name="avatar_file" type="file" accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-[32px] file:border-0 file:text-sm file:font-medium file:bg-[#f0f4f9] hover:file:bg-[#e1e5ea] outline-none cursor-pointer" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">氏名（ローマ字） <span className="text-red-500">*</span></label><input name="full_name_romaji" type="text" required defaultValue={worker.full_name_romaji} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none uppercase text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">氏名（カナ） <span className="text-red-500">*</span></label><input name="full_name_kana" type="text" required defaultValue={worker.full_name_kana} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">生年月日 <span className="text-red-500">*</span></label><input name="dob" type="date" required defaultValue={worker.dob} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">国籍</label><select name="nationality" defaultValue={worker.nationality || 'VNM'} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none appearance-none text-[#1f1f1f] transition-all"><option value="VNM">ベトナム</option><option value="IDN">インドネシア</option><option value="PHL">フィリピン</option><option value="MMR">ミャンマー</option><option value="CHN">中国</option></select></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-[#444746] mb-2">現住所</label><input name="address" type="text" defaultValue={worker.address || ''} placeholder="例：東京都新宿区..." className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                            </div>
                        </div>

                        {/* SECTION 2: 管理情報 */}
                        <div className="bg-white rounded-[32px] p-8">
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><Sparkles className="text-[#34A853]" size={20} /> 管理情報</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">制度区分 <span className="text-red-500">*</span></label><select name="system_type" required defaultValue={worker.system_type} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none appearance-none text-[#1f1f1f] transition-all"><option value="ikusei_shuro">育成就労</option><option value="tokuteigino">特定技能</option><option value="ginou_jisshu">技能実習</option></select></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">ステータス <span className="text-red-500">*</span></label><select name="status" required defaultValue={worker.status} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none appearance-none text-[#1f1f1f] transition-all"><option value="waiting">入国待ち</option><option value="working">就業中</option><option value="missing">失踪</option><option value="returned">帰国</option></select></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">配属先企業</label><select name="company_id" defaultValue={worker.company_id || ''} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none appearance-none text-[#1f1f1f] transition-all"><option value="">未配属</option>{companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}</select></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">送出機関</label><input name="sending_org" type="text" defaultValue={worker.sending_org || ''} placeholder="例：VINAJAPAN JSC" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">入国期生</label><input name="entry_batch" type="text" defaultValue={worker.entry_batch || ''} placeholder="例：第15期生" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">入国日</label><input name="entry_date" type="date" defaultValue={worker.entry_date || ''} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                            </div>
                        </div>

                        {/* SECTION 3: 期限・証明書 */}
                        <div className="bg-white rounded-[32px] p-8">
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><Sparkles className="text-[#EA4335]" size={20} /> 期限・証明書</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">在留カード番号</label><input name="zairyu_no" type="text" defaultValue={worker.zairyu_no || ''} placeholder="例：AB12345678CD" maxLength={12} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none uppercase text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">パスポート期限</label><input name="passport_exp" type="date" defaultValue={worker.passport_exp || ''} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">認定開始日</label><input name="cert_start_date" type="date" defaultValue={worker.cert_start_date || ''} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">認定修了日</label><input name="cert_end_date" type="date" defaultValue={worker.cert_end_date || ''} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">保険期限</label><input name="insurance_exp" type="date" defaultValue={worker.insurance_exp || ''} className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                            </div>
                        </div>
                        <div className="pt-4 pb-8 flex justify-end gap-3 sticky bottom-4">
                            <Link href="/workers" className="px-6 py-3 text-[#444746] bg-white font-medium hover:bg-gray-50 rounded-[32px] transition-colors">キャンセル</Link>
                            <UpdateButton />
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
