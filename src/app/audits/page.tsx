import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { AuditsClient } from './AuditsClient'
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
            priority = 2; // 🟠 優先度2 (オレンジ): スケジュール未設定
            statusLabel = { text: '予定未作成', bg: 'bg-white text-[#878787]', border: 'border-gray-350' };
        } else if (currentAudit.status === 'planned' || currentAudit.status === 'in_progress') {
            if (currentAudit.scheduled_date < todayStr) {
                priority = 1; // 🔴 優先度1 (赤): 期限遅延
                statusLabel = { text: '期限超過', bg: 'bg-white text-red-600', border: 'border-red-200' };
            } else {
                priority = 4; // 🔵 優先度4 (青): 将来の予定
                statusLabel = { text: '予定あり', bg: 'bg-white text-blue-600', border: 'border-blue-200' };
            }
        } else if (currentAudit.status === 'completed') {
            priority = 5; // 🟢 優先度5 (緑 - 最下部): 完了済
            statusLabel = { text: '提出済', bg: 'bg-white text-[#878787]', border: 'border-gray-350' };
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
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="audits" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="監査・訪問指導" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-[1200px] mx-auto">

                        <AuditsClient matrixData={matrixData} filterMonth={filterMonth} userRole={userProfile?.role} />
                    </div>
                </main>
            </div>
        </div>
    )
}
