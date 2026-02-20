import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { updateAudit, deleteAudit } from '@/app/audits/actions'
import { ArrowLeft, CalendarCheck } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { UpdateButton, AuditEditDeleteButton } from '@/components/SubmitButtons'
import { redirect, notFound } from 'next/navigation'

export default async function EditAuditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    const { data: audit } = await supabase.from('audits').select('*').eq('id', id).eq('is_deleted', false).single()
    if (!audit) notFound()

    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="audits" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[800px] mx-auto mt-4 md:mt-8">
                    <div className="flex items-center gap-4 mb-8 pl-2">
                        <Link href="/audits" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-[#444746]"><ArrowLeft size={24} strokeWidth={1.5} /></Link>
                        <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">スケジュールの編集</h2>
                    </div>
                    <form action={updateAudit} className="space-y-6">
                        <input type="hidden" name="id" value={audit.id} />
                        <div className="bg-white rounded-[32px] shadow-sm border border-[#e1e5ea] p-8">
                            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-medium text-[#1f1f1f] flex items-center gap-2"><CalendarCheck className="text-[#4285F4]" size={20} /> 訪問詳細</h3><span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">編集中</span></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-[#444746] mb-2">対象企業 <span className="text-red-500">*</span></label><select name="company_id" required defaultValue={audit.company_id} className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all">{companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}</select></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">訪問・監査 種別 <span className="text-red-500">*</span></label><select name="audit_type" required defaultValue={audit.audit_type} className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="homon">訪問 (毎月)</option><option value="kansa">監査 (3ヶ月)</option><option value="rinji">臨時対応・その他</option></select></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">予定日 <span className="text-red-500">*</span></label><input name="scheduled_date" type="date" required defaultValue={audit.scheduled_date} className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">担当スタッフ</label><input name="pic_name" type="text" defaultValue={audit.pic_name || ''} className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">ステータス <span className="text-red-500">*</span></label><select name="status" required defaultValue={audit.status === 'in_progress' ? 'planned' : audit.status} className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="planned">予定（未実施）</option><option value="completed">完了（提出済）</option></select></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-[#444746] mb-2">特記事項・メモ</label><textarea name="notes" rows={3} defaultValue={audit.notes || ''} className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-2xl px-4 py-3 outline-none text-[#1f1f1f] transition-all resize-none"></textarea></div>
                            </div>
                        </div>
                        <div className="pt-4 pb-8 flex justify-between items-center sticky bottom-4">
                            {userProfile?.role === 'admin' ? <AuditEditDeleteButton deleteAction={deleteAudit} /> : <div></div>}
                            <div className="flex gap-3"><Link href="/audits" className="px-6 py-3 text-[#444746] bg-white border border-[#e1e5ea] font-medium hover:bg-gray-50 rounded-full transition-colors shadow-sm">キャンセル</Link><UpdateButton /></div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
