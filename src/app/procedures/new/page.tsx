import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createProcedure } from '../actions'
import { ArrowLeft, Landmark } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { SaveButton } from '@/components/SubmitButtons'
import { redirect } from 'next/navigation'

export default async function NewProcedurePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const sp = await searchParams;
    const prefillAgency = sp.agency || 'nyukan';

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role').eq('id', user.id).single()
    const { data: workers } = await supabase.from('workers').select('id, full_name_romaji, companies(name_jp)').eq('is_deleted', false).eq('status', 'working').order('full_name_romaji')
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden selection:bg-emerald-500/20">
            <Sidebar active="procedures" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="新規手続の登録" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto no-scrollbar relative bg-slate-50">
                    <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[800px] mx-auto mt-4 md:mt-8">
                        <div className="flex items-center gap-4 mb-8 pl-2">
                            <Link href="/procedures" className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors text-[#1f1f1f]"><ArrowLeft size={24} strokeWidth={1.5} /></Link>
                            <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">新規手続の登録</h2>
                        </div>
                        <form action={createProcedure} className="space-y-6">
                            <div className="bg-white rounded-md p-8"> <h3 className="text-lg font-bold text-[#1f1f1f] mb-6 flex items-center gap-2"><Landmark className="text-[#24b47e]" size={20} /> 手続詳細</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-bold text-[#1f1f1f] mb-2">提出先機関 <span className="text-red-500">*</span></label><select name="agency" required defaultValue={prefillAgency} className="w-full bg-white focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="nyukan">入管 (在留資格・ビザ等)</option><option value="kikou">機構 (技能実習計画等)</option><option value="kentei">検定協会 (技能検定)</option></select></div> <div><label className="block text-sm font-bold text-[#1f1f1f] mb-2">手続名称（種類） <span className="text-red-500">*</span></label><input name="procedure_name" type="text" required placeholder="例：在留期間更新許可申請" list="proc-list" className="w-full bg-white focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /> <datalist id="proc-list"><option value="在留期間更新許可申請" /><option value="在留資格変更許可申請" /><option value="在留資格認定証明書交付申請" /><option value="技能実習計画認定申請" /><option value="実習実施者届出" /><option value="随時3級 技能検定" /><option value="基礎級 技能検定" /></datalist>
                                    </div>
                                    <div className="md:col-span-2 pt-4 -t"><label className="block text-sm font-bold text-[#1f1f1f] mb-2">対象人材</label><select name="worker_id" className="w-full bg-white focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="">個人を指定しない（企業単体の手続）</option>{workers?.map(w => <option key={w.id} value={w.id}>{w.full_name_romaji} ({(w.companies as any)?.name_jp || '未配属'})</option>)}</select></div> <div className="md:col-span-2"><label className="block text-sm font-bold text-[#1f1f1f] mb-2">対象企業 <span className="text-[#878787] font-normal text-xs ml-1">(※人材を選択した場合は自動紐付されます)</span></label><select name="company_id" className="w-full bg-white focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="">指定しない</option>{companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}</select></div> <div className="pt-4 -t"><label className="block text-sm font-bold text-[#1f1f1f] mb-2">提出目標日 (期限)</label><input name="target_date" type="date" className="w-full bg-white focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> <div className="pt-4 -t"><label className="block text-sm font-bold text-[#1f1f1f] mb-2">担当スタッフ</label><input name="pic_name" type="text" defaultValue={userProfile?.full_name || ''} className="w-full bg-white focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> <div><label className="block text-sm font-bold text-[#1f1f1f] mb-2">初期ステータス</label><select name="status" defaultValue="preparing" className="w-full bg-white focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="preparing">書類準備中 (未提出)</option><option value="submitted">申請済・審査待ち</option><option value="completed">完了 (許可/認定/合格)</option></select></div> <div className="md:col-span-2"><label className="block text-sm font-bold text-[#1f1f1f] mb-2">備考・メモ</label><textarea name="notes" rows={2} placeholder="追加の特記事項があれば入力..." className="w-full bg-white focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all resize-none"></textarea></div>
                                </div>
                            </div>
                            <div className="pt-4 pb-8 flex justify-end gap-3 sticky bottom-4"><Link href="/procedures" className="px-6 py-3 text-[#1f1f1f] bg-white font-bold hover:bg-gray-50 rounded-md transition-colors">キャンセル</Link><SaveButton /></div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    )
}
