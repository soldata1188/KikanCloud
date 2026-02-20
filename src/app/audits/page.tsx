import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Calendar, AlertCircle, CheckCircle2, CalendarCheck } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { MonthFilter } from './MonthFilter'
import { SmartActionCell } from './SmartActionCell'
import { ExportExcelButton } from './ExportExcelButton'
import { redirect } from 'next/navigation'

export default async function AuditsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const sp = await searchParams;
    const filterMonth = sp.month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const startOfMonth = `${filterMonth}-01`;
    const endOfMonth = new Date(new Date(startOfMonth).getFullYear(), new Date(startOfMonth).getMonth() + 1, 0).toISOString().split('T')[0];

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'

    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')

    const { data: audits } = await supabase.from('audits')
        .select('id, audit_type, company_id, scheduled_date, actual_date, status, pic_name, notes, companies(name_jp)')
        .eq('is_deleted', false)
        .gte('scheduled_date', startOfMonth)
        .lte('scheduled_date', endOfMonth)

    // TÍNH ĐIỂM ƯU TIÊN (Priority Score)
    // 1: Trễ hạn (Red) | 2: Chưa lên lịch (Orange) | 4: Tương lai an toàn (Blue) | 5: Xong (Green)
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });

    const matrixData = companies?.map(company => {
        const currentAudit = audits?.find(a => a.company_id === company.id) || null;

        let priority = 5;
        let statusLabel = { text: '今月完了済', bg: 'bg-green-100 text-green-700', border: 'border-l-green-500' };

        if (!currentAudit) {
            priority = 2; // 🟠 Ưu tiên 2 (Cam): Chưa có lịch
            statusLabel = { text: '予定未作成', bg: 'bg-orange-100 text-orange-800', border: 'border-l-orange-500' };
        } else if (currentAudit.status === 'planned' || currentAudit.status === 'in_progress') {
            if (currentAudit.scheduled_date < todayStr) {
                priority = 1; // 🔴 Ưu tiên 1 (Đỏ): Trễ hạn
                statusLabel = { text: '期限超過', bg: 'bg-red-100 text-red-700 animate-pulse', border: 'border-l-red-500' };
            } else {
                priority = 4; // 🔵 Ưu tiên 4 (Xanh dương): Tương lai an toàn
                statusLabel = { text: '予定あり', bg: 'bg-blue-100 text-blue-700', border: 'border-l-blue-500' };
            }
        } else if (currentAudit.status === 'completed') {
            priority = 5; // 🟢 Ưu tiên 5 (Xanh lá - chìm đáy): Đã xong
            statusLabel = { text: '提出済', bg: 'bg-gray-100 text-gray-500', border: 'border-l-gray-300' };
        }

        return { company, currentAudit, priority, statusLabel };
    }) || [];

    matrixData.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.company.name_jp.localeCompare(b.company.name_jp, 'ja');
    });

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="audits" />
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
                        <div>
                            <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">監査・定期訪問</h2>
                            <p className="text-[#444746] mt-1">期日が過ぎている予定は赤くハイライトされます。</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 md:pb-0">
                            <MonthFilter defaultValue={filterMonth} />

                            <ExportExcelButton data={matrixData} month={filterMonth} />

                            <Link href="/audits/new" className="flex items-center gap-2 px-6 py-2.5 bg-[#4285F4] text-white rounded-full text-sm font-medium hover:bg-[#3367d6] transition-colors shadow-sm border border-transparent shrink-0">
                                <Plus size={18} strokeWidth={2} /> 予定登録
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-[#e1e5ea]">
                        <table className="w-full text-left text-sm text-[#444746]">
                            <thead className="bg-[#f0f4f9] border-b border-[#e1e5ea] text-xs uppercase text-[#444746] font-medium tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-[32px]">受入企業</th>
                                    <th className="px-6 py-4">ステータス</th>
                                    <th className="px-6 py-4">予定日 / 完了日</th>
                                    <th className="px-6 py-4">担当</th>
                                    <th className="px-6 py-4 rounded-tr-[32px] text-center w-[160px]">アクション</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e1e5ea]">
                                {matrixData.map((row) => (
                                    <tr key={row.company.id} className="hover:bg-gray-50 transition-colors">
                                        {/* 1. Tên Xí Nghiệp */}
                                        <td className="px-6 py-5">
                                            <Link href={`/companies/${row.company.id}/edit`} className="font-medium text-[#1f1f1f] text-base hover:text-[#4285F4] transition-colors">{row.company.name_jp}</Link>
                                        </td>

                                        {/* 2. Trạng thái */}
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${row.statusLabel.bg}`}>
                                                {row.priority === 1 || row.priority === 2 ? <AlertCircle size={14} /> : row.priority === 5 ? <CheckCircle2 size={14} /> : <CalendarCheck size={14} />}
                                                {row.statusLabel.text}
                                            </span>
                                        </td>

                                        {/* 3. Ngày */}
                                        <td className="px-6 py-5">
                                            {row.currentAudit ? (
                                                <div>
                                                    <div className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> <span className="text-[#1f1f1f]">{row.currentAudit.scheduled_date.replace(/-/g, '/')}</span> 予定</div>
                                                    {row.currentAudit.actual_date && <div className="text-xs text-green-600 font-medium mt-1 inline-flex items-center gap-1"><CheckCircle2 size={12} /> {row.currentAudit.actual_date.replace(/-/g, '/')} 完了</div>}
                                                </div>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>

                                        {/* 4. PIC */}
                                        <td className="px-6 py-5">
                                            {row.currentAudit?.pic_name || <span className="text-gray-400">-</span>}
                                        </td>

                                        {/* 5. Action */}
                                        <td className="px-6 py-5">
                                            <SmartActionCell
                                                auditId={row.currentAudit?.id || null}
                                                status={row.currentAudit?.status || null}
                                                companyId={row.company.id}
                                                filterMonth={filterMonth}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
