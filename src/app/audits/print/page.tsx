import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PrintButton } from './PrintButton'

function calcKansaStatus(lastKansaDate: string | null, startOfMonth: string, endOfMonth: string): string {
    if (!lastKansaDate) return 'no_data'
    const next = new Date(lastKansaDate)
    next.setMonth(next.getMonth() + 3)
    const nextStr = next.toISOString().split('T')[0]
    if (nextStr < startOfMonth) return 'overdue'
    if (nextStr <= endOfMonth) return 'today_due'
    return 'future'
}

const STATUS_LABEL: Record<string, string> = {
    overdue: '超過', no_data: '未作', today_due: '今月', future: '次月↑',
}

export default async function AuditPrintPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const sp = await searchParams
    const filterMonth = sp.month || new Date().toISOString().slice(0, 7)
    const startOfMonth = `${filterMonth}-01`
    const endOfMonth = new Date(
        new Date(startOfMonth).getFullYear(),
        new Date(startOfMonth).getMonth() + 1, 0
    ).toISOString().split('T')[0]

    const filterStatuses = sp.statuses ? sp.statuses.split(',').filter(Boolean) : []
    const filterPic = sp.pic || ''

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name').eq('id', user.id).single()

    const { data: companies } = await supabase
        .from('companies')
        .select('id, name_jp, address, workers(id, visa_status, is_deleted)')
        .eq('is_deleted', false)
        .order('name_jp')

    const { data: audits } = await supabase.from('audits')
        .select('id, audit_type, company_id, scheduled_date, actual_date, status, pic_name')
        .eq('is_deleted', false)
        .gte('scheduled_date', startOfMonth)
        .lte('scheduled_date', endOfMonth)
        .order('scheduled_date', { ascending: true })

    const companyIds = companies?.map(c => c.id) || []
    const { data: pastAuditsData } = await supabase.from('audits')
        .select('id, audit_type, company_id, actual_date, scheduled_date, status, pic_name')
        .eq('is_deleted', false)
        .eq('status', 'completed')
        .in('company_id', companyIds)
        .lt('scheduled_date', startOfMonth)
        .order('actual_date', { ascending: false })

    // Build matrix
    let matrixData = (companies?.map(company => {
        const companyAudits = audits?.filter(a => a.company_id === company.id) || []
        const auditsByType: Record<string, any> = {}
        companyAudits.forEach(a => { if (!auditsByType[a.audit_type]) auditsByType[a.audit_type] = a })

        const activeWorkers = company.workers?.filter((w: any) => !w.is_deleted) || []

        const VISA_ORDER = ['実習生１号', '実習生２号', '実習生３号', '技能実習1号', '技能実習2号', '技能実習3号']
        const visaGroups: Record<string, number> = {}
        activeWorkers.forEach((w: any) => {
            const v = w.visa_status || 'その他'
            visaGroups[v] = (visaGroups[v] || 0) + 1
        })

        const pastAudits = pastAuditsData?.filter(a => a.company_id === company.id) || []
        const currentKansa = auditsByType['kansa']
        const recentKansa = currentKansa?.status === 'completed' ? currentKansa
            : pastAudits.find(a => a.audit_type === 'kansa')
        const lastKansaDate = recentKansa?.actual_date || null
        const kansaStatus = calcKansaStatus(lastKansaDate, startOfMonth, endOfMonth)

        const currentAudit = companyAudits[0] || null
        const historyAll = [
            ...(currentAudit?.status === 'completed' && currentAudit?.actual_date ? [currentAudit] : []),
            ...pastAudits,
        ]
        const lastAudit = historyAll[0] || null

        const kansaPic = auditsByType['kansa']?.pic_name || recentKansa?.pic_name || ''
        const homonPic = auditsByType['homon']?.pic_name || ''

        return {
            company, auditsByType, kansaStatus, lastKansaDate, lastAudit,
            total: activeWorkers.length, visaGroups, VISA_ORDER,
            kansaPic, homonPic,
        }
    }) || [])

    // Sort
    const PRIORITY: Record<string, number> = { overdue: 1, no_data: 2, today_due: 3, future: 4 }
    matrixData.sort((a, b) => {
        const pa = PRIORITY[a.kansaStatus] || 9
        const pb = PRIORITY[b.kansaStatus] || 9
        return pa !== pb ? pa - pb : a.company.name_jp.localeCompare(b.company.name_jp, 'ja')
    })

    // Apply filters
    if (filterStatuses.length > 0) {
        matrixData = matrixData.filter(r => filterStatuses.includes(r.kansaStatus))
    }
    if (filterPic) {
        matrixData = matrixData.filter(r =>
            Object.values(r.auditsByType).some((a: any) => a?.pic_name === filterPic)
        )
    }

    const printDate = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })
    const filterDesc = [
        filterStatuses.length > 0 && filterStatuses.length < 4
            ? filterStatuses.map(s => STATUS_LABEL[s] || s).join('・')
            : '',
        filterPic ? `担当: ${filterPic}` : '',
    ].filter(Boolean).join('　')

    // Helper: format date as YY/MM/DD
    const fmt = (d?: string | null) => d ? d.slice(2).replace(/-/g, '/') : ''

    return (
        <div className="bg-white min-h-screen text-black font-sans">
            <PrintButton />

            <div className="print-container mx-auto px-5 py-4" style={{ maxWidth: 680 }}>

                {/* Header */}
                <div className="flex items-end justify-between pb-2 mb-3 border-b-2 border-black">
                    <div>
                        <h1 className="text-[15px] font-black tracking-tight leading-tight">
                            {filterMonth.replace('-', '年')}月　監査・訪問指導　計画表
                        </h1>
                        {filterDesc && (
                            <div className="text-[9px] text-gray-500 mt-0.5">
                                絞り込み：{filterDesc}　／　対象 {matrixData.length} 社
                            </div>
                        )}
                    </div>
                    <div className="text-right text-[8.5px] text-gray-400 font-mono leading-snug">
                        <div>{printDate} 印刷</div>
                        {userProfile?.full_name && <div>{userProfile.full_name}</div>}
                    </div>
                </div>

                {/* Table — 7 cols, A4 portrait */}
                <table className="w-full border-collapse text-[9px] leading-tight print-table">
                    <colgroup>
                        <col style={{ width: '4%' }} />    {/* No */}
                        <col style={{ width: '28%' }} />   {/* 受入企業 */}
                        <col style={{ width: '10%' }} />   {/* 在籍 */}
                        <col style={{ width: '14%' }} />   {/* 監査訪問日 */}
                        <col style={{ width: '10%' }} />   {/* 担当(kansa) */}
                        <col style={{ width: '14%' }} />   {/* 社宅訪問日 */}
                        <col style={{ width: '10%' }} />   {/* 担当(homon) */}
                        <col style={{ width: '10%' }} />   {/* 前回監査 */}
                    </colgroup>
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-400 py-1 text-center font-bold text-gray-700">No</th>
                            <th className="border border-gray-400 px-1.5 py-1 text-left font-bold text-gray-700">受入企業</th>
                            <th className="border border-gray-400 px-1 py-1 text-center font-bold text-gray-700">在籍</th>
                            <th className="border border-gray-400 px-1 py-1 text-center font-bold text-gray-700">監査訪問</th>
                            <th className="border border-gray-400 px-1 py-1 text-center font-bold text-gray-700">担当</th>
                            <th className="border border-gray-400 px-1 py-1 text-center font-bold text-gray-700">社宅訪問</th>
                            <th className="border border-gray-400 px-1 py-1 text-center font-bold text-gray-700">担当</th>
                            <th className="border border-gray-400 px-1 py-1 text-center font-bold text-gray-700">前回監査</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matrixData.map((row, i) => {
                            const kansa = row.auditsByType['kansa']
                            const homon = row.auditsByType['homon']

                            const kansaStr = kansa?.actual_date
                                ? `${fmt(kansa.actual_date)} ✓`
                                : kansa?.scheduled_date
                                    ? `${fmt(kansa.scheduled_date)}（予）`
                                    : '—'
                            const homonStr = homon?.actual_date
                                ? `${fmt(homon.actual_date)} ✓`
                                : homon?.scheduled_date
                                    ? `${fmt(homon.scheduled_date)}（予）`
                                    : '—'
                            const lastStr = row.lastAudit?.actual_date
                                ? fmt(row.lastAudit.actual_date)
                                : '—'

                            const isKansaDone = kansa?.status === 'completed'
                            const isHomonDone = homon?.status === 'completed'

                            // Visa rows
                            const visaRows = row.VISA_ORDER
                                .filter((v: string) => (row.visaGroups[v] || 0) > 0)
                                .map((v: string) => ({
                                    label: v.replace('実習生', '').replace('技能実習', '技'),
                                    cnt: row.visaGroups[v],
                                }))
                            const othersTotal = Object.entries(row.visaGroups)
                                .filter(([v]: any) => !row.VISA_ORDER.includes(v))
                                .reduce((s: number, [, c]: any) => s + (c as number), 0)

                            // Row bg based on status
                            const rowBg = row.kansaStatus === 'overdue' ? '#fff5f5'
                                : row.kansaStatus === 'today_due' ? '#f0f7ff'
                                    : 'transparent'

                            return (
                                <tr key={row.company.id} className="print-row" style={{ backgroundColor: rowBg }}>
                                    <td className="border border-gray-300 py-1 text-center text-gray-500 align-top">{i + 1}</td>
                                    <td className="border border-gray-300 px-1.5 py-1 align-top">
                                        <div className="font-bold text-gray-900 leading-tight break-words">{row.company.name_jp}</div>
                                        {row.company.address && (
                                            <div className="text-[7.5px] text-gray-400 leading-tight mt-0.5 break-words">{row.company.address}</div>
                                        )}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1 text-center align-top">
                                        <div className="font-bold">{row.total}名</div>
                                        {visaRows.slice(0, 3).map(({ label, cnt }: { label: string; cnt: number }) => (
                                            <div key={label} className="flex justify-between text-[7.5px] text-gray-500 leading-tight">
                                                <span>{label}</span><span>{cnt}</span>
                                            </div>
                                        ))}
                                        {othersTotal > 0 && <div className="text-[7px] text-gray-400">他{othersTotal}</div>}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1 text-center align-top font-mono">
                                        <span className={isKansaDone ? 'font-bold text-gray-900' : 'text-gray-500'}>{kansaStr}</span>
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1 text-center align-top">
                                        {kansa?.pic_name || ''}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1 text-center align-top font-mono">
                                        <span className={isHomonDone ? 'font-bold text-gray-900' : 'text-gray-500'}>{homonStr}</span>
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1 text-center align-top">
                                        {homon?.pic_name || ''}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1 text-center align-top font-mono text-gray-500">
                                        {lastStr}
                                    </td>
                                </tr>
                            )
                        })}
                        {matrixData.length === 0 && (
                            <tr>
                                <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center text-gray-400">
                                    対象データがありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="mt-2 flex items-center justify-between text-[7.5px] text-gray-400">
                    <span>✓ = 実施済み　（予）= 予定</span>
                    <span>背景薄赤 = 予定超過　背景薄青 = 今月予定</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 12mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        font-size: 8px;
                    }
                    .no-print { display: none !important; }
                    .print-row { page-break-inside: avoid; }
                    .print-container {
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        font-size: 8px;
                    }
                    th { background-color: #f3f4f6 !important; }
                    th, td { border: 1px solid #666 !important; }
                }
            `}} />
        </div>
    )
}