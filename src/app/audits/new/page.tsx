import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createAudit } from '../actions'
import { ArrowLeft, CalendarCheck } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { SaveButton } from '@/components/SubmitButtons'
import { redirect } from 'next/navigation'

export default async function NewAuditPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: userProfile } = await supabase.from('users').select('full_name').eq('id', user.id).single()
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="audits" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[800px] mx-auto mt-4 md:mt-8">
                    <div className="flex items-center gap-4 mb-8 pl-2">
                        <Link href="/audits" className="w-10 h-10 flex items-center justify-center rounded-[32px] hover:bg-black/5 transition-colors text-[#444746]"><ArrowLeft size={24} strokeWidth={1.5} /></Link>
                        <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">スケジュールの追加</h2>
                    </div>
                    <form action={createAudit} className="space-y-6">
                        <div className="bg-white rounded-[32px] shadow-sm border border-[#e1e5ea] p-8">
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><CalendarCheck className="text-[#4285F4]" size={20} /> 訪問詳細</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-[#444746] mb-2">対象企業 <span className="text-red-500">*</span></label><select name="company_id" required className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-[32px] px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="">選択してください</option>{companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}</select></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">訪問・監査 種別 <span className="text-red-500">*</span></label><select name="audit_type" required defaultValue="homon" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-[32px] px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="homon">訪問 (毎月)</option><option value="kansa">監査 (3ヶ月)</option><option value="rinji">臨時対応・その他</option></select></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">予定日 <span className="text-red-500">*</span></label><input name="scheduled_date" type="date" required className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">担当スタッフ</label><input name="pic_name" type="text" defaultValue={userProfile?.full_name || ''} className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div>
                                <div><label className="block text-sm font-medium text-[#444746] mb-2">初期ステータス</label><select name="status" defaultValue="planned" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-[32px] px-4 py-3 outline-none appearance-none cursor-pointer text-[#1f1f1f] transition-all"><option value="planned">予定（未実施）</option><option value="completed">完了（提出済）</option></select></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-[#444746] mb-2">特記事項・メモ</label><textarea name="notes" rows={3} placeholder="例：社長と面談予定。" className="w-full bg-[#f0f4f9] focus:bg-white border border-transparent focus:border-[#4285F4] rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all resize-none"></textarea></div>
                            </div>
                        </div>
                        <div className="pt-4 pb-8 flex justify-end gap-3 sticky bottom-4"><Link href="/audits" className="px-6 py-3 text-[#444746] bg-white border border-[#e1e5ea] font-medium hover:bg-gray-50 rounded-[32px] transition-colors shadow-sm">キャンセル</Link><SaveButton /></div>
                    </form>
                </div>
            </main>
        </div>
    )
}
