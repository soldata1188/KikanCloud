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
        <div className="bg-white min-h-screen text-black p-8 max-w-[1200px] mx-auto font-sans" style={{ minWidth: "1000px" }}>
            <script dangerouslySetInnerHTML={{ __html: printScript }} />

            <div className="text-center mb-8 relative">
                <h1 className="text-2xl font-bold border-b border-black inline-block pb-1">
                    {filterMonth.replace('-', '年')}月分 監査・訪問計画表
                </h1>
                <div className="absolute right-0 bottom-0 text-sm">
                    {new Date().toLocaleDateString('ja-JP')} 印刷
                </div>
            </div>

            <table className="w-full border-collapse border border-gray-400 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-400 px-2 py-2 w-[4%] text-center">No.</th>
                        <th className="border border-gray-400 px-3 py-2 w-[22%] text-left">受入企業名</th>
                        <th className="border border-gray-400 px-3 py-2 w-[14%] text-left">在籍人数</th>
                        <th className="border border-gray-400 px-3 py-2 w-[12%] text-center">訪問種別</th>
                        <th className="border border-gray-400 px-3 py-2 w-[16%] text-center">前回の実績</th>
                        <th className="border border-gray-400 px-3 py-2 w-[12%] text-center">実施日</th>
                        <th className="border border-gray-400 px-3 py-2 w-[10%] text-center">担当スタッフ</th>
                        <th className="border border-gray-400 px-3 py-2 w-[20%] text-left">特記事項・メモ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                    {matrixData.map((row, i) => {
                        const audit = row.currentAudit;
                        let typeLabel = '-';
                        if (audit?.audit_type === 'kansa') typeLabel = '監査(3ヶ月)';
                        if (audit?.audit_type === 'homon') typeLabel = '定期訪問';
                        if (audit?.audit_type === 'rinji') typeLabel = '臨時対応';

                        const hasLastAudit = row.lastTwoAudits && row.lastTwoAudits.length > 0 && row.lastTwoAudits[0].actual_date;
                        const lastAuditStr = hasLastAudit
                            ? `${row.lastTwoAudits[0].actual_date.replace(/-/g, '/')} (${row.lastTwoAudits[0].audit_type === 'kansa' ? '監査' : row.lastTwoAudits[0].audit_type === 'homon' ? '訪問' : '臨時'})`
                            : '-';

                        const dateStr = audit?.actual_date
                            ? audit.actual_date.replace(/-/g, '/')
                            : (audit?.scheduled_date ? audit.scheduled_date.replace(/-/g, '/') + ' (予定)' : '-');

                        return (
                            <tr key={row.company.id}>
                                <td className="border border-gray-400 px-2 py-2 text-center align-top">{i + 1}</td>
                                <td className="border border-gray-400 px-3 py-2 font-medium align-top">{row.company.name_jp}</td>
                                <td className="border border-gray-400 px-3 py-2 align-top text-xs">
                                    <div className="font-medium text-sm">{row.workerCounts.total}名</div>
                                    {row.workerCounts.total > 0 && (
                                        <div className="text-gray-600 mt-1 whitespace-nowrap">
                                            (育成: {row.workerCounts.ikusei} / 特定: {row.workerCounts.tokutei} / 技能: {row.workerCounts.ginou})
                                        </div>
                                    )}
                                </td>
                                <td className="border border-gray-400 px-3 py-2 text-center align-top">{typeLabel}</td>
                                <td className="border border-gray-400 px-3 py-2 text-center align-top whitespace-nowrap">{lastAuditStr}</td>
                                <td className="border border-gray-400 px-3 py-2 text-center align-top whitespace-nowrap">{dateStr}</td>
                                <td className="border border-gray-400 px-3 py-2 text-center align-top">{audit?.pic_name || '-'}</td>
                                <td className="border border-gray-400 px-3 py-2 text-xs text-gray-700 align-top leading-relaxed whitespace-pre-wrap">{audit?.notes || '-'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4 landscape; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    .no-print { display: none !important; }
                }
            `}} />
        </div>
    );
}
