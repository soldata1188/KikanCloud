import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Calendar, AlertCircle, CheckCircle2, CalendarCheck, Building2, User, Edit2, Printer } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { MonthFilter } from './MonthFilter'
import { SmartActionCell } from './SmartActionCell'
import { ExportExcelButton } from './ExportExcelButton'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default async function AuditsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const sp = await searchParams;
    const filterMonth = sp.month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const startOfMonth = `${filterMonth}-01`;
    const endOfMonth = new Date(new Date(startOfMonth).getFullYear(), new Date(startOfMonth).getMonth() + 1, 0).toISOString().split('T')[0];

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    const { data: companies } = await supabase.from('companies').select('id, name_jp, workers(id, system_type, is_deleted)').eq('is_deleted', false).order('name_jp')

    const { data: audits } = await supabase.from('audits')
        .select('id, audit_type, company_id, scheduled_date, actual_date, status, pic_name, notes, companies(name_jp)')
        .eq('is_deleted', false)
        .gte('scheduled_date', startOfMonth)
        .lte('scheduled_date', endOfMonth)

    const companyIds = companies?.map(c => c.id) || [];
    const { data: pastAuditsData } = await supabase.from('audits')
        .select('id, audit_type, company_id, actual_date, status')
        .eq('is_deleted', false)
        .eq('status', 'completed')
        .in('company_id', companyIds)
        .lt('scheduled_date', startOfMonth)
        .order('actual_date', { ascending: false })

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });

    const matrixData = companies?.map(company => {
        const currentAudit = audits?.find(a => a.company_id === company.id) || null;

        const activeWorkers = company.workers?.filter((w: any) => !w.is_deleted) || [];
        const workerCounts = {
            total: activeWorkers.length,
            ikusei: activeWorkers.filter((w: any) => w.system_type === 'ikusei_shuro').length,
            tokutei: activeWorkers.filter((w: any) => w.system_type === 'tokuteigino').length,
            ginou: activeWorkers.filter((w: any) => w.system_type === 'ginou_jisshu').length,
        };

        let priority = 5;
        let statusLabel = { text: '今月完了済', bg: 'bg-transparent text-[#24b47e]', border: 'border-[#24b47e]' };

        if (!currentAudit) {
            priority = 2; // 🟠 Ưu tiên 2 (Cam): Chưa có lịch
            statusLabel = { text: '予定未作成', bg: 'bg-[#fbfcfd] text-[#878787]', border: 'border-[#ededed]' };
        } else if (currentAudit.status === 'planned' || currentAudit.status === 'in_progress') {
            if (currentAudit.scheduled_date < todayStr) {
                priority = 1; // 🔴 Ưu tiên 1 (Đỏ): Trễ hạn
                statusLabel = { text: '期限超過', bg: 'bg-[#fbfcfd] text-red-600', border: 'border-red-200' };
            } else {
                priority = 4; // 🔵 Ưu tiên 4 (Xanh dương): Tương lai an toàn
                statusLabel = { text: '予定あり', bg: 'bg-[#fbfcfd] text-blue-600', border: 'border-blue-200' };
            }
        } else if (currentAudit.status === 'completed') {
            priority = 5; // 🟢 Ưu tiên 5 (Xanh lá - chìm đáy): Đã xong
            statusLabel = { text: '提出済', bg: 'bg-[#fbfcfd] text-[#878787]', border: 'border-[#ededed]' };
        }

        const pastAudits = pastAuditsData?.filter(a => a.company_id === company.id) || [];
        const historyList = currentAudit?.status === 'completed' && currentAudit?.actual_date
            ? [currentAudit, ...pastAudits]
            : pastAudits;
        const lastTwoAudits = historyList.slice(0, 2);

        return { company, currentAudit, priority, statusLabel, workerCounts, lastTwoAudits };
    }) || [];

    matrixData.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.company.name_jp.localeCompare(b.company.name_jp, 'ja');
    });

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="audits" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="監査・訪問指導" role={userProfile?.role} userProfileStr={JSON.stringify(userProfile)} />
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <h1 className="text-[28px] font-normal tracking-tight text-[#1f1f1f]">監査・訪問指導 一覧</h1>

                            <div className="flex items-center gap-3">
                                <MonthFilter defaultValue={filterMonth} />

                                {userProfile?.role === 'admin' && <ExportExcelButton data={matrixData} month={filterMonth} />}

                                <Link href={`/audits/print?month=${filterMonth}`} target="_blank" className="h-[32px] px-3 bg-[#fbfcfd] border border-[#ededed] hover:bg-[#f4f5f7] text-[#1f1f1f] rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors">
                                    <Printer size={14} /> PDF出力
                                </Link>

                                <Link href="/audits/new" className="h-[32px] px-3 bg-[#24b47e] hover:bg-[#1e9a6a] text-white rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors">
                                    <Plus size={14} /> 新規登録
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white border border-[#ededed] rounded-lg shadow-sm overflow-hidden mb-12">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[13px]">
                                    <thead className="bg-[#fbfcfd] border-b border-[#ededed] text-[11px] font-medium text-[#878787] uppercase tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">受入企業</th>
                                            <th className="px-5 py-3 font-medium">ステータス</th>
                                            <th className="px-5 py-3 font-medium">予定日 / 完了日</th>
                                            <th className="px-5 py-3 font-medium">担当</th>
                                            <th className="px-5 py-3 font-medium text-right w-[160px]">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#ededed]">
                                        {matrixData.map((row) => (
                                            <tr key={row.company.id} className="hover:bg-[#fbfcfd] transition-colors group">
                                                {/* 1. Tên Xí Nghiệp */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-md border border-[#ededed] bg-[#fbfcfd] flex items-center justify-center shrink-0 text-[#878787]">
                                                            <Building2 size={16} />
                                                        </div>
                                                        <div>
                                                            <Link href={`/companies/${row.company.id}/edit`} className="font-medium text-[#1f1f1f] group-hover:text-[#24b47e] transition-colors block mb-1 leading-tight">{row.company.name_jp}</Link>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="text-[11px] text-[#878787] font-medium whitespace-nowrap">計 <span className="text-[#1f1f1f]">{row.workerCounts.total}</span>名</span>
                                                                {row.workerCounts.total > 0 && <span className="text-gray-300 ml-1 mr-0.5">|</span>}
                                                                {row.workerCounts.ikusei > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-[#fbfcfd] text-[#878787] border border-[#ededed] rounded-[4px] flex items-center gap-1 whitespace-nowrap">育成 {row.workerCounts.ikusei}</span>}
                                                                {row.workerCounts.tokutei > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-[#fbfcfd] text-[#878787] border border-[#ededed] rounded-[4px] flex items-center gap-1 whitespace-nowrap">特定 {row.workerCounts.tokutei}</span>}
                                                                {row.workerCounts.ginou > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-[#fbfcfd] text-[#878787] border border-[#ededed] rounded-[4px] flex items-center gap-1 whitespace-nowrap">技能 {row.workerCounts.ginou}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. Trạng thái */}
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border inline-flex items-center gap-1 ${row.statusLabel.bg} ${row.statusLabel.border}`}>
                                                        {row.priority === 1 || row.priority === 2 ? <AlertCircle size={10} /> : row.priority === 5 ? <CheckCircle2 size={10} /> : <CalendarCheck size={10} />}
                                                        {row.statusLabel.text}
                                                    </span>
                                                </td>

                                                {/* 3. Ngày */}
                                                <td className="px-5 py-3.5 align-top">
                                                    <div className="flex flex-col gap-2">
                                                        {/* Current Month */}
                                                        {row.currentAudit ? (
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2"><Calendar size={12} className="text-[#878787]" /> <span className="text-[12px] text-[#1f1f1f] font-mono">{row.currentAudit.scheduled_date.replace(/-/g, '/')}</span> <span className="text-[9px] px-1 bg-[#fbfcfd] text-[#878787] rounded border border-[#ededed]">予定</span></div>
                                                            </div>
                                                        ) : <div className="h-[24px] flex items-center"><span className="text-gray-300 font-medium">-</span></div>}

                                                        {/* History */}
                                                        <div className="border-t border-[#ededed] pt-2 mt-1">
                                                            <div className="flex flex-col gap-1">
                                                                {row.lastTwoAudits.length > 0 ? (
                                                                    row.lastTwoAudits.map((pa: any) => (
                                                                        <div key={pa.id} className="text-[11px] text-[#878787] flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="font-mono tracking-tight">{pa.actual_date?.replace(/-/g, '/')}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="px-1 py-0.5 bg-[#fbfcfd] border border-[#ededed] rounded-[4px] text-[9px] text-[#878787]">
                                                                                    {pa.audit_type === 'kansa' ? '監査' : pa.audit_type === 'homon' ? '訪問' : '臨時'}
                                                                                </span>
                                                                                <Link href={`/audits/${pa.id}/edit`} className="text-[#878787] hover:text-[#24b47e] transition-colors p-0.5 rounded-[4px] hover:bg-[#ededed]" title="編集">
                                                                                    <Edit2 size={10} />
                                                                                </Link>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="text-[11px] text-gray-300 font-medium flex items-center h-[20px]">-</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 4. PIC */}
                                                <td className="px-5 py-3.5">
                                                    {row.currentAudit?.pic_name ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-[4px] bg-[#fbfcfd] text-[#878787] flex items-center justify-center text-[10px] font-bold shrink-0 border border-[#ededed]">
                                                                {row.currentAudit.pic_name.charAt(0)}
                                                            </div>
                                                            <span className="text-[12px] font-medium text-[#1f1f1f]">{row.currentAudit.pic_name}</span>
                                                        </div>
                                                    ) : <span className="text-gray-300 font-medium">-</span>}
                                                </td>

                                                {/* 5. Action */}
                                                <td className="px-5 py-3.5 text-right">
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
                    </div>
                </main>
            </div>
        </div>
    )
}
