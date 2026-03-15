import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic';

type PriorityLevel = 'critical' | 'warning' | 'normal';

export interface TimelineMonth {
    monthKey: string;
    monthLabel: string;
    year: number;
    month: number;
    zairyu: number;
    passport: number;
    total: number;
}

export interface GroupedAlert {
    workerId: string;
    name: string;
    company: string;
    avatar: string;
    items: { type: string; expDate: string; daysLeft: number }[];
    minDaysLeft: number;
}

export interface PriorityItem {
    id: string;
    level: PriorityLevel;
    category: string;
    title: string;
    subtitle: string;
    href: string;
}

export default async function DashboardPage() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) redirect('/login')

        const { data: userProfile, error: profileError } = await supabase
            .from('users').select('full_name, role, tenant_id').eq('id', user.id).single()
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
        const today = new Date()
        const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()).toISOString().split('T')[0]
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000).toISOString()

        // All queries in parallel
        const [workersRes, companiesRes, workersDataRes, pendingAuditsRes, allCompaniesRes, recentAuditCompaniesRes] = await Promise.all([
            supabase.from('workers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_deleted', false),
            supabase.from('companies').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_deleted', false),
            supabase.from('workers')
                .select('id, full_name_romaji, nationality, status, visa_status, residence_card_exp_date, passport_exp_date, industry_field, updated_at, companies(id, name_jp)')
                .eq('tenant_id', tenantId).eq('is_deleted', false),
            // Audits not yet completed this month
            supabase.from('audits')
                .select('id, audit_type, company_id, scheduled_date, status')
                .eq('is_deleted', false)
                .neq('status', 'completed')
                .gte('scheduled_date', monthStart)
                .lte('scheduled_date', monthEnd)
                .limit(20),
            // All companies (id + name)
            supabase.from('companies')
                .select('id, name_jp')
                .eq('tenant_id', tenantId)
                .eq('is_deleted', false),
            // Companies that had a completed audit in last 6 months
            supabase.from('audits')
                .select('company_id')
                .eq('is_deleted', false)
                .eq('status', 'completed')
                .gte('actual_date', sixMonthsAgo),
        ])

        const workers = workersDataRes.data || []
        const pendingAudits = pendingAuditsRes.data || []
        const allCompanies = allCompaniesRes.data || []
        const recentAuditCompanyIds = new Set((recentAuditCompaniesRes.data || []).map(a => a.company_id))
        const companyMap = new Map(allCompanies.map(c => [c.id, c.name_jp]))

        // ── Stats ──────────────────────────────────────────────────────────────
        const totalWorkers = workersRes.count || 0
        const totalCompanies = companiesRes.count || 0
        const enteringWorkers = workers.filter(w => w.status === 'entering' || w.status === 'pending').length
        const missingWorkers = workers.filter(w => w.status === 'missing' || w.status === 'returned').length

        // ── Nationalities ──────────────────────────────────────────────────────
        const natCounts: Record<string, number> = {}
        workers.forEach(w => {
            const nat = w.nationality || '未登録'
            natCounts[nat] = (natCounts[nat] || 0) + 1
        })
        const nationalities = Object.entries(natCounts)
            .map(([name, count]) => ({ name, count, percentage: Math.round((count / (totalWorkers || 1)) * 100) }))
            .sort((a, b) => b.count - a.count).slice(0, 4)

        // ── Visa status types (在留資格) ──────────────────────────────────────
        const visaCounts: Record<string, number> = {}
        workers.forEach(w => {
            const v = (w.visa_status as string | null)?.trim() || '未登録'
            visaCounts[v] = (visaCounts[v] || 0) + 1
        })
        const visaTypes = Object.entries(visaCounts)
            .map(([name, count]) => ({ name, count, percentage: Math.round((count / (totalWorkers || 1)) * 100) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)

        // ── Industries ────────────────────────────────────────────────────────
        const indCounts: Record<string, number> = {}
        workers.forEach(w => {
            const ind = w.industry_field || '未設定'
            indCounts[ind] = (indCounts[ind] || 0) + 1
        })
        const industries = Object.entries(indCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count).slice(0, 5)

        // ── Grouped Alerts by worker (next 90 days) ───────────────────────────
        const alertGroupMap = new Map<string, GroupedAlert>()
        workers.forEach(w => {
            [
                { date: w.residence_card_exp_date, type: '在留カード' },
                { date: w.passport_exp_date, type: 'パスポート' },
            ].forEach(({ date, type }) => {
                if (!date) return
                const diffDays = Math.ceil((new Date(date).getTime() - today.getTime()) / 86400000)
                if (diffDays < 0 || diffDays > 90) return
                const name = w.full_name_romaji || '不明'
                const parts = name.trim().split(/\s+/)
                const avatar = parts.length === 1
                    ? parts[0].charAt(0)
                    : parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
                const existing = alertGroupMap.get(w.id)
                if (existing) {
                    existing.items.push({ type, expDate: date, daysLeft: diffDays })
                    existing.items.sort((a, b) => a.daysLeft - b.daysLeft)
                    if (diffDays < existing.minDaysLeft) existing.minDaysLeft = diffDays
                } else {
                    alertGroupMap.set(w.id, {
                        workerId: w.id,
                        name,
                        company: (w.companies as any)?.name_jp || '企業不明',
                        avatar,
                        items: [{ type, expDate: date, daysLeft: diffDays }],
                        minDaysLeft: diffDays,
                    })
                }
            })
        })
        const groupedAlerts: GroupedAlert[] = Array.from(alertGroupMap.values())
            .sort((a, b) => a.minDaysLeft - b.minDaysLeft)

        // ── Predictive Timeline (next 30 / 60 / 90 days, grouped by month) ──
        function buildTimeline(maxDays: number): TimelineMonth[] {
            const map = new Map<string, { zairyu: number; passport: number }>()
            workers.forEach(w => {
                [
                    { date: w.residence_card_exp_date, key: 'zairyu' },
                    { date: w.passport_exp_date, key: 'passport' },
                ].forEach(({ date, key }) => {
                    if (!date) return
                    const diffDays = Math.ceil((new Date(date).getTime() - today.getTime()) / 86400000)
                    if (diffDays < 0 || diffDays > maxDays) return
                    const monthKey = date.slice(0, 7)
                    const existing = map.get(monthKey) || { zairyu: 0, passport: 0 }
                    if (key === 'zairyu') existing.zairyu++
                    else existing.passport++
                    map.set(monthKey, existing)
                })
            })
            return Array.from(map.entries())
                .map(([monthKey, data]) => {
                    const [y, m] = monthKey.split('-').map(Number)
                    return {
                        monthKey,
                        monthLabel: `${m}月`,
                        year: y,
                        month: m,
                        zairyu: data.zairyu,
                        passport: data.passport,
                        total: data.zairyu + data.passport,
                    }
                })
                .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
        }
        const timeline = {
            d30: buildTimeline(30),
            d60: buildTimeline(60),
            d90: buildTimeline(90),
        }

        // ── Priority Queue ────────────────────────────────────────────────────
        const levelOrder: Record<PriorityLevel, number> = { critical: 0, warning: 1, normal: 2 }
        const priorityItems: PriorityItem[] = []

        // 1. CRITICAL — visa/passport expiring within 14 days (grouped by worker)
        const urgentWorkerMap = new Map<string, { name: string; company: string; labels: string[]; minDays: number }>()
        workers.forEach(w => {
            [
                { date: w.residence_card_exp_date, label: '在留カード' },
                { date: w.passport_exp_date, label: 'パスポート' },
            ].forEach(({ date, label }) => {
                if (!date) return
                const days = Math.ceil((new Date(date).getTime() - today.getTime()) / 86400000)
                if (days >= 0 && days <= 14) {
                    const existing = urgentWorkerMap.get(w.id)
                    if (existing) {
                        existing.labels.push(`${label}残り${days}日`)
                        if (days < existing.minDays) existing.minDays = days
                    } else {
                        urgentWorkerMap.set(w.id, {
                            name: w.full_name_romaji || '不明',
                            company: (w.companies as any)?.name_jp || '企業不明',
                            labels: [`${label}残り${days}日`],
                            minDays: days,
                        })
                    }
                }
            })
        })
        urgentWorkerMap.forEach((info, workerId) => {
            priorityItems.push({
                id: `visa_${workerId}`,
                level: 'critical',
                category: '在留・パスポート',
                title: `${info.name} の書類期限が迫っています`,
                subtitle: `${info.labels.join('、')} · ${info.company}`,
                href: `/workers/${workerId}`,
            })
        })

        // 2. WARNING — pending audits this month
        pendingAudits.slice(0, 3).forEach(a => {
            const companyName = companyMap.get(a.company_id) || '不明'
            const typeLabel = a.audit_type === 'kansa' ? '監査訪問' : a.audit_type === 'visit' ? '定期訪問' : (a.audit_type || '監査')
            priorityItems.push({
                id: `audit_${a.id}`,
                level: 'warning',
                category: '監査・訪問',
                title: `${companyName} の${typeLabel}が未完了`,
                subtitle: `予定日: ${a.scheduled_date}`,
                href: '/audits',
            })
        })

        // 3. NORMAL — workers with no update for 30+ days
        const staleWorkers = workers
            .filter(w => w.status === 'active' && w.updated_at && w.updated_at < thirtyDaysAgo)
            .slice(0, 2)
        staleWorkers.forEach(w => {
            priorityItems.push({
                id: `stale_${w.id}`,
                level: 'normal',
                category: '労働者情報',
                title: `${w.full_name_romaji || '不明'} の情報が未更新`,
                subtitle: `30日以上更新なし · ${(w.companies as any)?.name_jp || '企業不明'}`,
                href: `/workers/${w.id}`,
            })
        })

        // 4. NORMAL — companies with workers but no audit in 6+ months
        const workerCompanyIds = new Set(workers.map(w => (w.companies as any)?.id).filter(Boolean))
        allCompanies
            .filter(c => workerCompanyIds.has(c.id) && !recentAuditCompanyIds.has(c.id))
            .slice(0, 2)
            .forEach(c => {
                priorityItems.push({
                    id: `audit_overdue_${c.id}`,
                    level: 'normal',
                    category: '監査サイクル',
                    title: `${c.name_jp} の監査が長期未実施`,
                    subtitle: '6ヶ月以上、完了済み監査なし',
                    href: '/audits',
                })
            })

        priorityItems.sort((a, b) => levelOrder[a.level] - levelOrder[b.level])
        const priorityQueue = priorityItems.slice(0, 7)

        const dashboardData = {
            stats: { totalWorkers, totalCompanies, enteringWorkers, missingWorkers },
            nationalities,
            visaTypes,
            industries,
            groupedAlerts,
            alertsCount: groupedAlerts.length,
            priorityQueue,
            pendingAuditsCount: pendingAudits.length,
            timeline,
        }

        return (
            <div className="flex h-screen font-sans text-slate-900 overflow-hidden selection:bg-emerald-500/20">
                <Sidebar active="dashboard" />
                <div className="flex-1 flex flex-col relative min-w-0">
                    <TopNav title="" role={userProfile?.role} />
                    <main className="flex-1 overflow-hidden relative bg-[#f8fafc]">
                        <DashboardClient userName={userProfile?.full_name || 'スタッフ'} dashboardData={dashboardData} />
                    </main>
                </div>
            </div>
        )
    } catch (error: any) {
        if (error?.digest?.includes('NEXT_REDIRECT')) throw error;
        console.error('[DashboardPage] Server render error:', error);
        return (
            <div className="flex h-screen items-center justify-center bg-white p-8 text-center">
                <div className="max-w-lg space-y-4">
                    <h1 className="text-xl font-bold text-gray-900">ページの読み込みに失敗しました</h1>
                    <p className="text-gray-500 text-sm">サーバーエラーが発生しました。ページを再読み込みしてください。</p>
                    <p className="text-xs text-red-400 font-mono bg-red-50 p-3 rounded-lg text-left break-all">
                        {String(error?.message || error || 'Unknown error')}
                    </p>
                    <Link href="/" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md text-sm">再読み込み</Link>
                </div>
            </div>
        )
    }
}
