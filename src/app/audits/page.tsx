import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { AuditsClient } from './AuditsClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default async function AuditsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const sp = await searchParams;
    const filterMonth = sp.month || new Date().toISOString().slice(0, 7);
    const startOfMonth = `${filterMonth}-01`;
    const endOfMonth = new Date(new Date(startOfMonth).getFullYear(), new Date(startOfMonth).getMonth() + 1, 0).toISOString().split('T')[0];

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role, full_name').eq('id', user.id).single()
    const { data: companies } = await supabase
        .from('companies')
        .select('id, name_jp, address, workers(id, system_type, visa_status, is_deleted)')
        .eq('is_deleted', false)
        .order('name_jp')

    // Current month audits
    const { data: audits } = await supabase.from('audits')
        .select('id, audit_type, company_id, scheduled_date, actual_date, status, pic_name, notes')
        .eq('is_deleted', false)
        .gte('scheduled_date', startOfMonth)
        .lte('scheduled_date', endOfMonth)
        .order('scheduled_date', { ascending: true })

    // Past completed audits (for 前回・前々回 and kansa cycle calc)
    const companyIds = companies?.map(c => c.id) || [];
    const { data: pastAuditsData } = await supabase.from('audits')
        .select('id, audit_type, company_id, actual_date, scheduled_date, status, pic_name')
        .eq('is_deleted', false)
        .eq('status', 'completed')
        .in('company_id', companyIds)
        .lt('scheduled_date', startOfMonth)
        .order('actual_date', { ascending: false })

    // ─── Build matrix ───
    const matrixData = companies?.map(company => {
        // Current month audits for this company
        const companyAudits = audits?.filter(a => a.company_id === company.id) || []
        const currentAudit = companyAudits[0] || null
        const auditsByType: Record<string, typeof companyAudits[0]> = {}
        companyAudits.forEach(a => {
            if (!auditsByType[a.audit_type]) auditsByType[a.audit_type] = a
        })

        // Worker stats
        const activeWorkers = company.workers?.filter((w: any) => !w.is_deleted) || [];
        const workerCounts = {
            total: activeWorkers.length,
            visaGroups: (() => {
                const grp: Record<string, number> = {}
                activeWorkers.forEach((w: any) => {
                    const v = w.visa_status || 'その他'
                    grp[v] = (grp[v] || 0) + 1
                })
                return grp
            })(),
        };

        // Past audits for this company
        const pastAudits = pastAuditsData?.filter(a => a.company_id === company.id) || [];

        // ─── Kansa (監査訪問) 3-month cycle status ───
        // Find most recent completed kansa
        const currentKansa = auditsByType['kansa']
        const recentCompletedKansa = currentKansa?.status === 'completed'
            ? currentKansa
            : pastAudits.find(a => a.audit_type === 'kansa')

        const lastKansaDate = recentCompletedKansa?.actual_date || null

        let kansaStatus: 'overdue' | 'no_data' | 'today_due' | 'future' = 'no_data'
        let nextKansaDue: string | null = null

        if (lastKansaDate) {
            const next = new Date(lastKansaDate)
            next.setMonth(next.getMonth() + 3)
            nextKansaDue = next.toISOString().split('T')[0]

            if (nextKansaDue < startOfMonth) {
                kansaStatus = 'overdue'       // 予定超過: already past due date
            } else if (nextKansaDue <= endOfMonth) {
                kansaStatus = 'today_due'     // 今月予定: due this month
            } else {
                kansaStatus = 'future'        // 次月以降: still within cycle
            }
        }

        // Priority for sort: overdue (1) → no_data (2) → today_due (3) → future (4)
        const priority = kansaStatus === 'overdue' ? 1
            : kansaStatus === 'no_data' ? 2
                : kansaStatus === 'today_due' ? 3
                    : 4

        // History for 前回・前々回 — kansa (監査訪問) only
        const kansaHistory = [
            ...(auditsByType['kansa']?.status === 'completed' && auditsByType['kansa']?.actual_date ? [auditsByType['kansa']] : []),
            ...pastAudits.filter(a => a.audit_type === 'kansa'),
        ]
        const lastAudits = kansaHistory.slice(0, 3)

        return {
            company, currentAudit, auditsByType, companyAudits,
            priority, kansaStatus, nextKansaDue, lastKansaDate,
            workerCounts, lastAudits,
        };
    }) || [];

    matrixData.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.company.name_jp.localeCompare(b.company.name_jp, 'ja');
    });

    return (
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="audits" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="監査・訪問指導" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-[1400px] mx-auto">
                        <AuditsClient
                            matrixData={matrixData}
                            filterMonth={filterMonth}
                            userRole={userProfile?.role}
                            companies={companies?.map(c => ({ id: c.id, name_jp: c.name_jp })) || []}
                            defaultPicName={userProfile?.full_name || ''}
                        />
                    </div>
                </main>
            </div>
        </div>
    )
}
