import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PrintButton } from './PrintButton'

export default async function AuditPrintPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const sp = await searchParams;
    const filterMonth = sp.month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const startOfMonth = `${filterMonth}-01`;
    const endOfMonth = new Date(new Date(startOfMonth).getFullYear(), new Date(startOfMonth).getMonth() + 1, 0).toISOString().split('T')[0];

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

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

    const matrixData = companies?.map(company => {
        const currentAudit = audits?.find(a => a.company_id === company.id) || null;

        const activeWorkers = company.workers?.filter((w: any) => !w.is_deleted) || [];
        const workerCounts = {
            total: activeWorkers.length,
            ikusei: activeWorkers.filter((w: any) => w.system_type === 'ikusei_shuro').length,
            tokutei: activeWorkers.filter((w: any) => w.system_type === 'tokuteigino').length,
            ginou: activeWorkers.filter((w: any) => w.system_type === 'ginou_jisshu').length,
        };

        const pastAudits = pastAuditsData?.filter(a => a.company_id === company.id) || [];
        const historyList = currentAudit?.status === 'completed' && currentAudit?.actual_date
            ? [currentAudit, ...pastAudits]
            : pastAudits;
        const lastTwoAudits = historyList.slice(0, 2);

        return { company, currentAudit, workerCounts, lastTwoAudits };
    }) || [];

    return (
        <div className="bg-white min-h-screen text-black p-4 max-w-[800px] mx-auto font-sans print-container">
            <PrintButton />

            <div className="text-center mb-6 relative print-header">
                <h1 className="text-2xl font-black border-b-2 border-black inline-block pb-1 tracking-tight">
                    {filterMonth.replace('-', '年')}月分 監査・訪問計画表
                </h1>
                <div className="absolute right-0 bottom-0 text-[11px] font-mono text-gray-500">
                    {new Date().toLocaleDateString('ja-JP')} 印刷
                </div>
            </div>

            <table className="w-full border-collapse border-2 border-gray-800 text-[11px] leading-tight print-table">
                <thead>
                    <tr className="bg-gray-100/80">
                        <th className="border border-gray-400 border-t-2 border-b-2 border-gray-800 px-1 py-1.5 w-[4%] text-center font-bold tracking-tighter text-gray-800">No</th>
                        <th className="border border-gray-400 border-t-2 border-b-2 border-gray-800 px-2 py-1.5 w-[22%] text-left font-bold tracking-tighter text-gray-800">受入企業名</th>
                        <th className="border border-gray-400 border-t-2 border-b-2 border-gray-800 px-1.5 py-1.5 w-[13%] text-left font-bold tracking-tighter text-gray-800">在籍人数</th>
                        <th className="border border-gray-400 border-t-2 border-b-2 border-gray-800 px-1.5 py-1.5 w-[10%] text-center font-bold tracking-tighter text-gray-800">種別</th>
                        <th className="border border-gray-400 border-t-2 border-b-2 border-gray-800 px-1.5 py-1.5 w-[14%] text-center font-bold tracking-tighter text-gray-800">前回実績</th>
                        <th className="border border-gray-400 border-t-2 border-b-2 border-gray-800 px-1.5 py-1.5 w-[13%] text-center font-bold tracking-tighter text-gray-800">実施日</th>
                        <th className="border border-gray-400 border-t-2 border-b-2 border-gray-800 px-1.5 py-1.5 w-[9%] text-center font-bold tracking-tighter text-gray-800">担当</th>
                        <th className="border border-gray-400 border-t-2 border-b-2 border-gray-800 px-2 py-1.5 w-[15%] text-left font-bold tracking-tighter text-gray-800">メモ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                    {matrixData.map((row, i) => {
                        const audit = row.currentAudit;
                        let typeLabel = '-';
                        if (audit?.audit_type === 'kansa') typeLabel = '監査';
                        if (audit?.audit_type === 'homon') typeLabel = '訪問';
                        if (audit?.audit_type === 'rinji') typeLabel = '臨時';

                        const hasLastAudit = row.lastTwoAudits && row.lastTwoAudits.length > 0 && row.lastTwoAudits[0].actual_date;
                        const lastAuditStr = hasLastAudit
                            ? `${row.lastTwoAudits[0].actual_date.replace(/-/g, '/').slice(2)} (${row.lastTwoAudits[0].audit_type === 'kansa' ? '監' : row.lastTwoAudits[0].audit_type === 'homon' ? '訪' : '臨'})`
                            : '-';

                        const dateStr = audit?.actual_date
                            ? audit.actual_date.replace(/-/g, '/').slice(2)
                            : (audit?.scheduled_date ? audit.scheduled_date.replace(/-/g, '/').slice(2) + ' (予)' : '-');

                        return (
                            <tr key={row.company.id} className="print-row">
                                <td className="border border-gray-300 px-1 py-1.5 text-center align-top text-gray-600">{i + 1}</td>
                                <td className="border border-gray-300 px-2 py-1.5 font-bold align-top leading-tight text-gray-900">{row.company.name_jp}</td>
                                <td className="border border-gray-300 px-1.5 py-1.5 align-top text-[10px]">
                                    <div className="font-bold text-[11px] text-gray-900">{row.workerCounts.total}名</div>
                                    {row.workerCounts.total > 0 && (
                                        <div className="text-gray-500 tracking-tighter mt-0.5 font-medium">
                                            育{row.workerCounts.ikusei} / 特{row.workerCounts.tokutei} / 技{row.workerCounts.ginou}
                                        </div>
                                    )}
                                </td>
                                <td className="border border-gray-300 px-1.5 py-1.5 text-center align-top whitespace-nowrap tracking-tighter font-medium">{typeLabel}</td>
                                <td className="border border-gray-300 px-1.5 py-1.5 text-center align-top text-[10px] whitespace-nowrap tracking-tighter text-gray-600 font-mono">{lastAuditStr}</td>
                                <td className="border border-gray-300 px-1.5 py-1.5 text-center align-top text-[11px] font-bold whitespace-nowrap tracking-tighter text-gray-900">{dateStr}</td>
                                <td className="border border-gray-300 px-1.5 py-1.5 text-center align-top whitespace-nowrap tracking-tighter text-gray-800">{audit?.pic_name || '-'}</td>
                                <td className="border border-gray-300 px-2 py-1.5 text-[10px] text-gray-600 align-top leading-relaxed whitespace-pre-wrap break-all">{audit?.notes || '-'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 10mm 15mm; /* Lề in chuẩn */
                    }
                    body { 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                        background-color: white !important; 
                        color: black !important;
                    }
                    .no-print { display: none !important; }
                    /* Chống gãy hàng bảng biểu giữa 2 trang in */
                    .print-row {
                        page-break-inside: avoid;
                    }
                    /* Border rõ nét khi in A4 */
                    table { border-collapse: collapse; width: 100%; border: 2px solid #000; }
                    th { background-color: #f3f4f6 !important; border: 1px solid #000 !important; border-top: 2px solid #000 !important; border-bottom: 2px solid #000 !important; }
                    td { border: 1px solid #444 !important; }
                    /* Phủ định css Tailwind conflict với print */
                    .print-container { max-width: 100% !important; padding: 0 !important; }
                }
            `}} />
        </div>
    );
}
