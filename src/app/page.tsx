import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role, tenant_id').eq('id', user.id).single()
    if (userProfile?.role === 'company_admin') redirect('/portal')

    const tenantId = userProfile?.tenant_id

    // Fetch Stats (Dùng Promise.all tăng tốc)
    const [workersRes, companiesRes, workersDataRes] = await Promise.all([
        supabase.from('workers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_deleted', false),
        supabase.from('workers').select('id, full_name_romaji, nationality, status, residence_card_exp_date, passport_exp_date, companies(name_jp)').eq('tenant_id', tenantId)
    ])

    const workers = workersDataRes.data || []

    // Calculate Statuses
    const totalWorkers = workersRes.count || 0
    const totalCompanies = companiesRes.count || 0
    const enteringWorkers = workers.filter(w => w.status === 'entering' || w.status === 'pending').length
    const missingWorkers = workers.filter(w => w.status === 'missing' || w.status === 'returned').length

    // Calculate Nationalities
    const natCounts: Record<string, number> = {}
    workers.forEach(w => {
        const nat = w.nationality || '未登録'
        natCounts[nat] = (natCounts[nat] || 0) + 1
    })
    const nationalities = Object.entries(natCounts)
        .map(([name, count]) => ({ name, count, percentage: Math.round((count / (totalWorkers || 1)) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)

    // Calculate Expiring Alerts (Next 90 days)
    const today = new Date()
    const alerts: any[] = []

    workers.forEach(w => {
        if (w.residence_card_exp_date) {
            const exp = new Date(w.residence_card_exp_date)
            const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays >= 0 && diffDays <= 90) {
                alerts.push({ id: w.id + '_z', name: w.full_name_romaji, company: (w.companies as any)?.name_jp, type: '在留カード', expDate: w.residence_card_exp_date, daysLeft: diffDays })
            }
        }
        if (w.passport_exp_date) {
            const exp = new Date(w.passport_exp_date)
            const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays >= 0 && diffDays <= 90) {
                alerts.push({ id: w.id + '_p', name: w.full_name_romaji, company: (w.companies as any)?.name_jp, type: 'パスポート', expDate: w.passport_exp_date, daysLeft: diffDays })
            }
        }
    })
    alerts.sort((a, b) => a.daysLeft - b.daysLeft)

    const dashboardData = {
        stats: { totalWorkers, totalCompanies, enteringWorkers, missingWorkers },
        nationalities,
        alerts
    }

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="dashboard" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="ホーム" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <DashboardClient userName={userProfile?.full_name || 'スタッフ'} dashboardData={dashboardData} />
                </main>
            </div>
        </div>
    )
}
