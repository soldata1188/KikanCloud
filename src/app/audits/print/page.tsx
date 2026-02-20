import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

    // Tự động kích hoạt hộp thoại in khi trang đã tải xong
    const printScript = `window.onload = function() { window.print(); }`;

    return (
        <div className="bg-white min-h-screen text-black p-4 max-w-[800px] mx-auto font-sans">
            <script dangerouslySetInnerHTML={{ __html: printScript }} />

            <div className="text-center mb-6 relative">
                <h1 className="text-xl font-bold border-b border-black inline-block pb-1">
                    {filterMonth.replace('-', '年')}月分 監査・訪問計画表
                </h1>
                <div className="absolute right-0 bottom-0 text-xs">
                    {new Date().toLocaleDateString('ja-JP')} 印刷
                </div>
            </div>

            <table className="w-full border-collapse border border-gray-400 text-[11px] leading-tight">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-400 px-1 py-1 w-[4%] text-center font-semibold tracking-tighter">No</th>
                        <th className="border border-gray-400 px-1.5 py-1 w-[22%] text-left font-semibold tracking-tighter">受入企業名</th>
                        <th className="border border-gray-400 px-1.5 py-1 w-[13%] text-left font-semibold tracking-tighter">在籍人数</th>
                        <th className="border border-gray-400 px-1.5 py-1 w-[10%] text-center font-semibold tracking-tighter">種別</th>
                        <th className="border border-gray-400 px-1.5 py-1 w-[14%] text-center font-semibold tracking-tighter">前回実績</th>
                        <th className="border border-gray-400 px-1.5 py-1 w-[13%] text-center font-semibold tracking-tighter">実施日</th>
                        <th className="border border-gray-400 px-1.5 py-1 w-[9%] text-center font-semibold tracking-tighter">担当</th>
                        <th className="border border-gray-400 px-1.5 py-1 w-[15%] text-left font-semibold tracking-tighter">メモ</th>
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
                            <tr key={row.company.id}>
                                <td className="border border-gray-400 px-1 py-1 text-center align-top">{i + 1}</td>
                                <td className="border border-gray-400 px-1.5 py-1 font-bold align-top leading-tight">{row.company.name_jp}</td>
                                <td className="border border-gray-400 px-1.5 py-1 align-top text-[10px]">
                                    <div className="font-semibold text-[11px]">{row.workerCounts.total}名</div>
                                    {row.workerCounts.total > 0 && (
                                        <div className="text-gray-600 tracking-tighter mt-0.5">
                                            育{row.workerCounts.ikusei} / 特{row.workerCounts.tokutei} / 技{row.workerCounts.ginou}
                                        </div>
                                    )}
                                </td>
                                <td className="border border-gray-400 px-1.5 py-1 text-center align-top whitespace-nowrap tracking-tighter">{typeLabel}</td>
                                <td className="border border-gray-400 px-1.5 py-1 text-center align-top text-[10px] whitespace-nowrap tracking-tighter">{lastAuditStr}</td>
                                <td className="border border-gray-400 px-1.5 py-1 text-center align-top text-[10px] font-medium whitespace-nowrap tracking-tighter">{dateStr}</td>
                                <td className="border border-gray-400 px-1.5 py-1 text-center align-top whitespace-nowrap tracking-tighter">{audit?.pic_name || '-'}</td>
                                <td className="border border-gray-400 px-1.5 py-1 text-[10px] text-gray-700 align-top leading-tight whitespace-pre-wrap break-all">{audit?.notes || '-'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4 portrait; margin: 8mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    .no-print { display: none !important; }
                }
            `}} />
        </div>
    );
}
