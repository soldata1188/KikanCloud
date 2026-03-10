import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) redirect('/login')

        const { data: userProfile, error: profileError } = await supabase.from('users').select('full_name, role, tenant_id').eq('id', user.id).single()
        if (profileError || !userProfile) {
            return (
                <div className="flex h-screen items-center justify-center bg-white p-4 text-center">
                    <div className="max-w-md space-y-4">
                        <h1 className="text-xl font-bold text-gray-900">プロフィールが見つかりません</h1>
                        <p className="text-gray-500">アカウントの設定が完了していない可能性があります。管理者に問い合わせてください。</p>
                        <Link href="/login" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md">ログインに戻る</Link>
                    </div>
                </div>
            )
        }

        if (userProfile?.role === 'company_admin') redirect('/portal')

        const tenantId = userProfile.tenant_id

        // Fetch Stats (Dùng Promise.all tăng tốc)
        const [workersRes, companiesRes, workersDataRes] = await Promise.all([
            supabase.from('workers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_deleted', false),
            supabase.from('companies').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_deleted', false),
            supabase.from('workers').select('id, full_name_romaji, nationality, status, residence_card_exp_date, passport_exp_date, industry_field, companies(name_jp)').eq('tenant_id', tenantId).eq('is_deleted', false)
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

        // Calculate Industries
        const indCounts: Record<string, number> = {}
        workers.forEach(w => {
            const ind = w.industry_field || '未設定'
            indCounts[ind] = (indCounts[ind] || 0) + 1
        })
        const industries = Object.entries(indCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

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
            industries,
            alerts
        }

        return (
            <div className="flex h-screen font-sans text-slate-900 overflow-hidden selection:bg-emerald-500/20">
                <Sidebar active="dashboard" />
                <div className="flex-1 flex flex-col relative min-w-0">
                    <TopNav title="" role={userProfile?.role} />
                    <main className="flex-1 overflow-hidden relative bg-white">
                        <DashboardClient userName={userProfile?.full_name || 'スタッフ'} dashboardData={dashboardData} />
                    </main>
                </div>
            </div>
        )
    } catch (error: any) {
        // If it's a redirect (NEXT_REDIRECT), re-throw it
        if (error?.digest?.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error('[DashboardPage] Server render error:', error);
        return (
            <div className="flex h-screen items-center justify-center bg-white p-8 text-center">
                <div className="max-w-lg space-y-4">
                    <h1 className="text-xl font-bold text-gray-900">ページの読み込みに失敗しました</h1>
                    <p className="text-gray-500 text-sm">サーバーエラーが発生しました。ページを再読み込みしてください。</p>
                    <p className="text-xs text-red-400 font-mono bg-red-50 p-3 rounded-lg text-left break-all">
                        {String(error?.message || error || 'Unknown error')}
                    </p>
                    <a href="/" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md text-sm">再読み込み</a>
                </div>
            </div>
        )
    }
}
