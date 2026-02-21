import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { updateProcedure, deleteProcedure } from '@/app/procedures/actions'
import { ArrowLeft, Landmark } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { UpdateButton, ProcedureDeleteButton } from '@/components/SubmitButtons'
import { redirect, notFound } from 'next/navigation'

export default async function EditProcedurePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    const { data: proc } = await supabase.from('procedures').select('*').eq('id', id).eq('is_deleted', false).single()
    if (!proc) notFound()

    const { data: workers } = await supabase.from('workers').select('id, full_name_romaji, companies(name_jp)').eq('is_deleted', false).order('full_name_romaji')
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="procedures" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[800px] mx-auto mt-4 md:mt-8">
                    <div className="flex items-center gap-4 mb-8 pl-2">
 <Link href={`/procedures?tab=${proc.agency}`} className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors text-[#1f1f1f]"><ArrowLeft size={24} strokeWidth={1.5} /></Link>
                        <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">手続内容の編集</h2>
                    </div>
                    <form action={updateProcedure} className="space-y-6">
                        <input type="hidden" name="id" value={proc.id} />
 <div className="bg-white rounded-md p-8"> 
 <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-[#1f1f1f] flex items-center gap-2"><Landmark className="text-[#24b47e]" size={20} /> 手続詳細</h3><span className="text-xs text-[#878787] bg-gray-100 px-3 py-1 rounded-md font-medium">編集中</span></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div><label className="block text-sm font-bold text-[#1f1f1f] mb-2">提出先機関 <span className="text-red-500">*</span></label><select name="agency" required defaultValue={proc.agency} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="nyukan">入管 (在留資格・ビザ等)</option><option value="kikou">機構 (技能実習計画等)</option><option value="kentei">検定協会 (技能検定)</option></select></div> 
 <div><label className="block text-sm font-bold text-[#1f1f1f] mb-2">手続名称（種類） <span className="text-red-500">*</span></label><input name="procedure_name" type="text" required defaultValue={proc.procedure_name} list="proc-list" className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
 <div className="md:col-span-2"><label className="block text-sm font-bold text-[#1f1f1f] mb-2">対象人材</label><select name="worker_id" defaultValue={proc.worker_id || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="">個人を指定しない</option>{workers?.map(w => <option key={w.id} value={w.id}>{w.full_name_romaji} ({(w.companies as any)?.name_jp || '未配属'})</option>)}</select></div> 
 <div className="md:col-span-2"><label className="block text-sm font-bold text-[#1f1f1f] mb-2">対象企業</label><select name="company_id" defaultValue={proc.company_id || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="">指定しない</option>{companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}</select></div> 

                                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#ededed] mt-2">
 <div><label className="block text-sm font-bold text-[#1f1f1f] mb-2">提出目標日</label><input name="target_date" type="date" defaultValue={proc.target_date || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
 <div><label className="block text-sm font-bold text-blue-600 mb-2">実申請日</label><input name="submitted_date" type="date" defaultValue={proc.submitted_date || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
 <div><label className="block text-sm font-bold text-green-600 mb-2">完了・結果日</label><input name="completed_date" type="date" defaultValue={proc.completed_date || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
                                </div>

 <div><label className="block text-sm font-bold text-[#1f1f1f] mb-2">担当スタッフ</label><input name="pic_name" type="text" defaultValue={proc.pic_name || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
 <div><label className="block text-sm font-bold text-[#1f1f1f] mb-2">ステータス <span className="text-red-500">*</span></label><select name="status" required defaultValue={proc.status} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="preparing">書類準備中</option><option value="submitted">申請済・審査待ち</option><option value="completed">完了 (許可/認定/合格)</option><option value="issue">不備・不許可 (要対応)</option></select></div> 
 <div className="md:col-span-2"><label className="block text-sm font-bold text-[#1f1f1f] mb-2">備考・メモ</label><textarea name="notes" rows={3} defaultValue={proc.notes || ''} className="w-full bg-[#fbfcfd] focus:bg-white -transparent focus: rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all resize-none"></textarea></div> 
                            </div>
                        </div>
                        <div className="pt-4 pb-8 flex justify-between items-center sticky bottom-4">
                            {userProfile?.role === 'admin' ? <ProcedureDeleteButton /> : <div></div>}
 <div className="flex gap-3"><Link href={`/procedures?tab=${proc.agency}`} className="px-6 py-3 text-[#1f1f1f] bg-white font-bold hover:bg-[#fbfcfd] rounded-md transition-colors">キャンセル</Link><UpdateButton /></div> 
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
