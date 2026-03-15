'use client'
import { useState, useEffect, useCallback } from 'react'
import {
    ChevronRight, ClipboardList, ShieldCheck, Map, Users, Building2, Sparkles, Settings,
    Activity, RefreshCw, AlertTriangle, CheckCircle2, Clock, ListTodo, FileWarning, Info,
    CalendarDays, BrainCircuit, OctagonAlert, TriangleAlert, CircleAlert
} from 'lucide-react'
import Link from 'next/link'
import type { PriorityItem, GroupedAlert, TimelineMonth } from './page'
import type { AnomalyItem } from './api/ai/anomaly/route'

interface BriefingData {
    greeting: string;
    summary: string;
    actions: string[];
    meta: {
        urgentCount: number;
        pendingAudits: number;
        staleWorkers: number;
        generatedAt: string;
    };
}

function guessActionLink(action: string): string {
    if (/監査|訪問|巡回/.test(action)) return '/audits';
    if (/在留|パスポート|ビザ/.test(action)) return '/workers';
    if (/労働者|外国人|実習生/.test(action)) return '/workers';
    if (/企業|会社|受入/.test(action)) return '/companies';
    if (/業務|手続き|申請/.test(action)) return '/operations';
    return '/operations';
}

function BriefingSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="space-y-3">
                <div className="h-5 bg-white/20 rounded-lg w-52" />
                <div className="h-4 bg-white/15 rounded-lg w-full" />
                <div className="h-4 bg-white/15 rounded-lg w-4/5" />
                <div className="flex gap-2 pt-2">
                    <div className="h-7 bg-white/15 rounded-full w-36" />
                    <div className="h-7 bg-white/15 rounded-full w-44" />
                    <div className="h-7 bg-white/15 rounded-full w-32" />
                </div>
            </div>
        </div>
    );
}

const LEVEL_CONFIG = {
    critical: {
        border: 'border-l-red-500',
        badge: 'bg-red-100 text-red-600',
        icon: <AlertTriangle size={13} className="text-red-500 shrink-0" />,
        label: '緊急',
        dot: 'bg-red-500',
    },
    warning: {
        border: 'border-l-amber-400',
        badge: 'bg-amber-100 text-amber-600',
        icon: <FileWarning size={13} className="text-amber-500 shrink-0" />,
        label: '要対応',
        dot: 'bg-amber-400',
    },
    normal: {
        border: 'border-l-gray-300',
        badge: 'bg-gray-100 text-gray-500',
        icon: <Info size={13} className="text-gray-400 shrink-0" />,
        label: '確認',
        dot: 'bg-gray-300',
    },
} as const;

export default function DashboardClient({ userName, dashboardData }: { userName: string, dashboardData: any }) {
    const [currentTime, setCurrentTime] = useState<Date | null>(null)
    const [briefing, setBriefing] = useState<BriefingData | null>(null)
    const [briefingLoading, setBriefingLoading] = useState(true)
    const [briefingError, setBriefingError] = useState<string | null>(null)
    const [timelineTab, setTimelineTab] = useState<'d30' | 'd60' | 'd90'>('d30')
    const [anomalies, setAnomalies] = useState<AnomalyItem[]>([])
    const [anomalyLoading, setAnomalyLoading] = useState(true)
    const [anomalyError, setAnomalyError] = useState<string | null>(null)
    const [anomalyGeneratedAt, setAnomalyGeneratedAt] = useState<string | null>(null)

    useEffect(() => {
        setCurrentTime(new Date())
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const fetchBriefing = useCallback(async () => {
        setBriefingLoading(true)
        setBriefingError(null)
        try {
            const res = await fetch('/api/ai/briefing')
            if (!res.ok) throw new Error(`サーバーエラー (${res.status})`)
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setBriefing(data)
        } catch (err) {
            setBriefingError(err instanceof Error ? err.message : 'エラーが発生しました')
        } finally {
            setBriefingLoading(false)
        }
    }, [])

    useEffect(() => { fetchBriefing() }, [fetchBriefing])

    const ANOMALY_CACHE_KEY = 'kikan_anomaly_cache'
    const ANOMALY_TTL = 60 * 60 * 1000 // 1 hour

    const fetchAnomalies = useCallback(async (forceRefresh = false) => {
        setAnomalyLoading(true)
        setAnomalyError(null)
        try {
            // Check localStorage cache
            if (!forceRefresh && typeof window !== 'undefined') {
                const cached = localStorage.getItem(ANOMALY_CACHE_KEY)
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached)
                    if (Date.now() - timestamp < ANOMALY_TTL) {
                        setAnomalies(data.anomalies ?? [])
                        setAnomalyGeneratedAt(data.generatedAt ?? null)
                        setAnomalyLoading(false)
                        return
                    }
                }
            }
            const res = await fetch('/api/ai/anomaly')
            if (!res.ok) throw new Error(`サーバーエラー (${res.status})`)
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setAnomalies(data.anomalies ?? [])
            setAnomalyGeneratedAt(data.generatedAt ?? null)
            if (typeof window !== 'undefined') {
                localStorage.setItem(ANOMALY_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
            }
        } catch (err) {
            setAnomalyError(err instanceof Error ? err.message : 'エラーが発生しました')
        } finally {
            setAnomalyLoading(false)
        }
    }, [])

    useEffect(() => { fetchAnomalies() }, [fetchAnomalies])

    if (!currentTime) return null;

    const formatDate = (date: Date) => {
        const days = ['日', '月', '火', '水', '木', '金', '土']
        return `${date.getFullYear()}年 ${date.getMonth() + 1}月 ${date.getDate()}日 (${days[date.getDay()]})`
    }
    const formatTime = (date: Date) =>
        `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

    const priorityQueue: PriorityItem[] = dashboardData?.priorityQueue || []
    const criticalCount = priorityQueue.filter((p: PriorityItem) => p.level === 'critical').length
    const warningCount = priorityQueue.filter((p: PriorityItem) => p.level === 'warning').length

    const formatDisplayDate = (d: Date | null) => {
        if (!d) return '—';
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const week = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
        return `${y}年${m}月${day}日 (${week})`;
    };

    return (
        <div className="w-full h-full pb-20 overflow-y-auto thin-scrollbar bg-[var(--input-bg)]">
            <div className="max-w-[1400px] mx-auto px-6 pt-6 space-y-6">

                {/* ─── Page header: ダッシュボード + 日付 ───────────────────────── */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">ダッシュボード</h1>
                    <p className="text-sm text-gray-600 tabular-nums">{formatDisplayDate(currentTime)}</p>
                </div>

                {/* ─── AI Morning Briefing ──────────────────────────────────────── */}
                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] via-[var(--brand-primary-dark)] to-[#003d8f] text-white shadow-lg shadow-[var(--brand-primary)]/20">
                    <div className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/5" />
                    <div className="pointer-events-none absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5" />

                    <div className="relative px-4 py-3 md:px-6 md:py-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                                    <Sparkles size={15} className="text-white" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">AI ブリーフィング</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-mono text-white/50 hidden sm:block">
                                    {formatDate(currentTime)} &nbsp; {formatTime(currentTime)}
                                </span>
                                <button
                                    onClick={fetchBriefing}
                                    disabled={briefingLoading}
                                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <RefreshCw size={13} className={briefingLoading ? 'animate-spin text-white/60' : 'text-white/60'} />
                                </button>
                            </div>
                        </div>

                        {briefingLoading ? <BriefingSkeleton /> : briefingError ? (
                            <div className="flex items-center gap-3 py-2">
                                <AlertTriangle size={18} className="text-amber-300 shrink-0" />
                                <div>
                                    <p className="text-sm text-white/80">{briefingError}</p>
                                    <button onClick={fetchBriefing} className="text-xs text-white/50 hover:text-white mt-1 underline underline-offset-2">再試行</button>
                                </div>
                            </div>
                        ) : briefing ? (
                            <div className="space-y-3">
                                <p className="text-lg font-semibold leading-snug">{briefing.greeting}</p>
                                <p className="text-sm text-white/80 leading-relaxed font-normal">{briefing.summary}</p>
                                {briefing.meta && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {briefing.meta.urgentCount > 0 && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/30 text-red-100 text-[10px] font-bold">
                                                <AlertTriangle size={9} /> 緊急 {briefing.meta.urgentCount}件
                                            </span>
                                        )}
                                        {briefing.meta.pendingAudits > 0 && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-100 text-[10px] font-bold">
                                                <Clock size={9} /> 未完了監査 {briefing.meta.pendingAudits}件
                                            </span>
                                        )}
                                        {briefing.meta.urgentCount === 0 && briefing.meta.pendingAudits === 0 && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[10px] font-bold">
                                                <CheckCircle2 size={9} /> 緊急案件なし
                                            </span>
                                        )}
                                    </div>
                                )}
                                {briefing.actions.length > 0 && (
                                    <div className="pt-1">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-2">今日のアクション</p>
                                        <div className="flex flex-wrap gap-2">
                                            {briefing.actions.map((action, i) => (
                                                <Link key={i} href={guessActionLink(action)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-[11px] font-medium text-white/90 transition-all">
                                                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</span>
                                                    {action}
                                                    <ChevronRight size={10} className="text-white/40 shrink-0" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </section>

                {/* ─── Stats 4-column grid ─────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: '在籍労働者',
                            value: dashboardData?.stats?.totalWorkers ?? 0,
                            sub: '名',
                            color: 'text-emerald-600',
                            border: 'border-l-emerald-500',
                            bg: 'bg-emerald-50/50',
                            href: '/workers',
                        },
                        {
                            label: '期限切れ警告',
                            value: dashboardData?.alertsCount ?? 0,
                            sub: '名',
                            color: 'text-red-600',
                            border: 'border-l-red-500',
                            bg: (dashboardData?.alertsCount ?? 0) > 0 ? 'bg-red-50/60' : '',
                            href: '/workers',
                        },
                        {
                            label: '未完了監査',
                            value: dashboardData?.pendingAuditsCount ?? 0,
                            sub: '件',
                            color: 'text-amber-600',
                            border: 'border-l-amber-400',
                            bg: (dashboardData?.pendingAuditsCount ?? 0) > 0 ? 'bg-amber-50/40' : '',
                            href: '/audits',
                        },
                        {
                            label: '受入企業',
                            value: dashboardData?.stats?.totalCompanies ?? 0,
                            sub: '社',
                            color: 'text-[var(--brand-primary)]',
                            border: 'border-l-[var(--brand-primary)]',
                            bg: 'bg-blue-50/30',
                            href: '/companies',
                        },
                    ].map(({ label, value, sub, color, border, bg, href }) => (
                        <Link key={label} href={href}
                            className={`app-card border-l-4 ${border} ${bg} px-5 py-4 flex flex-col gap-1 hover:shadow-md transition-shadow group`}>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{label}</span>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-3xl font-bold font-mono ${color}`}>{value}</span>
                                <span className="text-[11px] text-gray-400 font-normal">{sub}</span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ─── Two-column: Priority Queue + Alerts ─────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Priority Queue */}
                    <section className="app-card overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ListTodo size={16} className="text-gray-500" />
                                <h2 className="text-[11px] font-black text-gray-700 uppercase tracking-[0.18em]">本日の優先タスク</h2>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {criticalCount > 0 && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                                        緊急 {criticalCount}
                                    </span>
                                )}
                                {warningCount > 0 && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">
                                        要対応 {warningCount}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {priorityQueue.length === 0 ? (
                                <div className="py-10 text-center">
                                    <CheckCircle2 size={28} className="mx-auto text-emerald-200 mb-2" />
                                    <p className="text-xs text-gray-300 font-normal">本日の優先タスクはありません</p>
                                </div>
                            ) : (
                                priorityQueue.map((item: PriorityItem) => {
                                    const cfg = LEVEL_CONFIG[item.level]
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            className={`flex items-start gap-3 px-4 py-3 border-l-[3px] ${cfg.border} hover:bg-gray-50/70 transition-colors group`}
                                        >
                                            <div className="mt-0.5 shrink-0">{cfg.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <p className="text-[12px] font-semibold text-gray-800 leading-snug truncate group-hover:text-gray-900">
                                                    {item.title}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-normal mt-0.5 truncate">
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                            <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 shrink-0 mt-1 transition-colors" />
                                        </Link>
                                    )
                                })
                            )}
                        </div>

                        <Link href="/operations"
                            className="block text-center py-3 text-[10px] font-bold text-gray-400 hover:text-emerald-600 transition-colors border-t border-gray-50 uppercase tracking-widest">
                            すべて見る →
                        </Link>
                    </section>

                    {/* Alerts */}
                    <section className="app-card overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-gray-400" />
                                <h2 className="text-[11px] font-black text-gray-700 uppercase tracking-[0.15em]">期限アラート</h2>
                            </div>
                            {dashboardData?.alerts?.length > 0 && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                                    {dashboardData.alerts.length}件
                                </span>
                            )}
                        </div>

                        <div className="divide-y divide-gray-50">
                            {(!dashboardData?.groupedAlerts || dashboardData.groupedAlerts.length === 0) ? (
                                <div className="py-10 text-center">
                                    <CheckCircle2 size={28} className="mx-auto text-emerald-200 mb-2" />
                                    <p className="text-xs font-normal text-gray-300">期限切れ警告はありません</p>
                                </div>
                            ) : (
                                (dashboardData.groupedAlerts as GroupedAlert[]).slice(0, 5).map((group) => (
                                    <Link
                                        key={group.workerId}
                                        href={`/workers/${group.workerId}`}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors group"
                                    >
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 select-none
                                            ${group.minDaysLeft <= 14
                                                ? 'bg-red-100 text-red-600'
                                                : group.minDaysLeft <= 30
                                                    ? 'bg-amber-100 text-amber-600'
                                                    : 'bg-gray-100 text-gray-500'}`}>
                                            {group.avatar}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-semibold text-gray-800 leading-snug truncate group-hover:text-gray-900">
                                                {group.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 truncate leading-none mt-0.5">
                                                {group.company}
                                            </p>
                                            {/* Type badges */}
                                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                                {group.items.map(item => (
                                                    <span key={item.type}
                                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none
                                                            ${item.daysLeft <= 14
                                                                ? 'bg-red-100 text-red-600'
                                                                : item.daysLeft <= 30
                                                                    ? 'bg-amber-100 text-amber-600'
                                                                    : 'bg-gray-100 text-gray-500'}`}>
                                                        {item.type} {item.daysLeft}日
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Urgency badge */}
                                        <span className={`text-[10px] font-bold font-mono shrink-0 px-1.5 py-0.5 rounded
                                            ${group.minDaysLeft <= 14
                                                ? 'bg-red-100 text-red-600'
                                                : group.minDaysLeft <= 30
                                                    ? 'bg-amber-100 text-amber-600'
                                                    : 'bg-gray-100 text-gray-500'}`}>
                                            {group.minDaysLeft}日
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>

                        <Link href="/workers"
                            className="block text-center py-3 text-[10px] font-bold text-gray-400 hover:text-emerald-600 transition-colors border-t border-gray-50 uppercase tracking-widest">
                            すべて見る →
                        </Link>
                    </section>
                </div>

                {/* ─── Two-column: Timeline + Anomaly ─────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Timeline */}
                {(() => {
                    const tl: TimelineMonth[] = dashboardData?.timeline?.[timelineTab] ?? []
                    const maxTotal = Math.max(...tl.map((m: TimelineMonth) => m.total), 1)
                    const todayMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                    const tabTotals = {
                        d30: (dashboardData?.timeline?.d30 ?? []).reduce((s: number, m: TimelineMonth) => s + m.total, 0),
                        d60: (dashboardData?.timeline?.d60 ?? []).reduce((s: number, m: TimelineMonth) => s + m.total, 0),
                        d90: (dashboardData?.timeline?.d90 ?? []).reduce((s: number, m: TimelineMonth) => s + m.total, 0),
                    }
                    return (
                        <section className="app-card overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={16} className="text-gray-400" />
                                    <h2 className="text-[11px] font-black text-gray-700 uppercase tracking-[0.18em]">予測タイムライン</h2>
                                    <span className="text-[10px] font-normal text-gray-400">今後の書類期限を月別に表示</span>
                                </div>
                                {/* Tabs */}
                                <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
                                    {([
                                        { key: 'd30', label: '30日', count: tabTotals.d30 },
                                        { key: 'd60', label: '60日', count: tabTotals.d60 },
                                        { key: 'd90', label: '90日', count: tabTotals.d90 },
                                    ] as const).map(({ key, label, count }) => (
                                        <button
                                            key={key}
                                            onClick={() => setTimelineTab(key)}
                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all
                                                ${timelineTab === key
                                                    ? 'bg-white text-gray-800 shadow-sm'
                                                    : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {label}
                                            {count > 0 && (
                                                <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full leading-none
                                                    ${timelineTab === key ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                {tl.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <CheckCircle2 size={24} className="mx-auto text-emerald-200 mb-2" />
                                        <p className="text-xs text-gray-300 font-normal">この期間に期限切れ予定の書類はありません</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {tl.map((m: TimelineMonth) => {
                                            const isCurrentMonth = m.monthKey === todayMonth
                                            const zairyuPct = maxTotal > 0 ? (m.zairyu / maxTotal) * 100 : 0
                                            const passportPct = maxTotal > 0 ? (m.passport / maxTotal) * 100 : 0
                                            return (
                                                <div key={m.monthKey}
                                                    className={`rounded-xl p-4 border ${isCurrentMonth ? 'border-red-200 bg-red-50/40' : 'border-gray-100 bg-gray-50/50'}`}>
                                                    {/* Month header */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-base font-bold ${isCurrentMonth ? 'text-red-600' : 'text-gray-700'}`}>
                                                                {m.year}年 {m.monthLabel}
                                                            </span>
                                                            {isCurrentMonth && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">今月</span>
                                                            )}
                                                        </div>
                                                        <span className={`text-lg font-bold font-mono ${isCurrentMonth ? 'text-red-600' : 'text-gray-600'}`}>
                                                            {m.total}<span className="text-[10px] font-normal ml-0.5 text-gray-400">件</span>
                                                        </span>
                                                    </div>

                                                    {/* Bars */}
                                                    <div className="space-y-2.5">
                                                        {m.zairyu > 0 && (
                                                            <div>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-[10px] text-gray-500 font-normal">在留カード</span>
                                                                    <span className="text-[11px] font-bold text-gray-700 font-mono">{m.zairyu}</span>
                                                                </div>
                                                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                                                        style={{ width: `${zairyuPct}%` }} />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {m.passport > 0 && (
                                                            <div>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-[10px] text-gray-500 font-normal">パスポート</span>
                                                                    <span className="text-[11px] font-bold text-gray-700 font-mono">{m.passport}</span>
                                                                </div>
                                                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-[var(--brand-primary)]/60 rounded-full transition-all duration-500"
                                                                        style={{ width: `${passportPct}%` }} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>
                    )
                })()}

                {/* Anomaly Detection */}
                {(() => {
                    const severityConfig = {
                        high: {
                            border: 'border-l-red-500',
                            badge: 'bg-red-100 text-red-600',
                            icon: <OctagonAlert size={15} className="text-red-500 shrink-0" />,
                            label: '高',
                        },
                        medium: {
                            border: 'border-l-amber-400',
                            badge: 'bg-amber-100 text-amber-600',
                            icon: <TriangleAlert size={15} className="text-amber-500 shrink-0" />,
                            label: '中',
                        },
                        low: {
                            border: 'border-l-blue-400',
                            badge: 'bg-blue-100 text-blue-600',
                            icon: <CircleAlert size={15} className="text-blue-400 shrink-0" />,
                            label: '低',
                        },
                    } as const

                    const iconMap: Record<AnomalyItem['icon'], React.ReactNode> = {
                        building: <Building2 size={13} />,
                        user: <Users size={13} />,
                        file: <FileWarning size={13} />,
                        clock: <Clock size={13} />,
                    }

                    const fmtCacheTime = (iso: string | null) => {
                        if (!iso) return null
                        const d = new Date(iso)
                        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} 更新`
                    }

                    return (
                        <section className="app-card overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BrainCircuit size={16} className="text-violet-500" />
                                    <h2 className="text-[11px] font-black text-gray-700 uppercase tracking-[0.18em]">AI 異常検知</h2>
                                    <span className="text-[10px] font-normal text-gray-400">Gemini 2.5 Flash 分析</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {anomalyGeneratedAt && !anomalyLoading && (
                                        <span className="text-[9px] text-gray-300 font-mono">{fmtCacheTime(anomalyGeneratedAt)}</span>
                                    )}
                                    <button
                                        onClick={() => fetchAnomalies(true)}
                                        disabled={anomalyLoading}
                                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                        title="キャッシュをクリアして再分析"
                                    >
                                        <RefreshCw size={12} className={anomalyLoading ? 'animate-spin text-gray-400' : 'text-gray-400'} />
                                    </button>
                                </div>
                            </div>

                            {anomalyLoading ? (
                                <div className="p-5 space-y-3 animate-pulse">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-gray-200 rounded w-32" />
                                                <div className="h-3 bg-gray-100 rounded w-full" />
                                                <div className="h-3 bg-gray-100 rounded w-3/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : anomalyError ? (
                                <div className="p-5 flex items-center gap-3">
                                    <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-600">{anomalyError}</p>
                                        <button onClick={() => fetchAnomalies(true)} className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 underline underline-offset-2">
                                            再試行
                                        </button>
                                    </div>
                                </div>
                            ) : anomalies.length === 0 ? (
                                <div className="py-10 text-center">
                                    <CheckCircle2 size={28} className="mx-auto text-emerald-200 mb-2" />
                                    <p className="text-xs text-gray-300 font-normal">AIが異常パターンを検出しませんでした</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {anomalies.map((item) => {
                                        const cfg = severityConfig[item.severity] ?? severityConfig.low
                                        return (
                                            <Link
                                                key={item.id}
                                                href={item.href}
                                                className={`flex items-start gap-3 px-5 py-4 border-l-[3px] ${cfg.border} hover:bg-gray-50/60 transition-colors group`}
                                            >
                                                {/* Severity icon circle */}
                                                <div className="mt-0.5 shrink-0">{cfg.icon}</div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                                                            {iconMap[item.icon]}
                                                            リスク{cfg.label}
                                                        </span>
                                                        {item.count != null && item.count > 0 && (
                                                            <span className="text-[9px] font-bold text-gray-400">{item.count}件</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[12px] font-semibold text-gray-800 leading-snug group-hover:text-gray-900">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 font-normal mt-1 leading-relaxed">
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 shrink-0 mt-1 transition-colors" />
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </section>
                    )
                })()}

                </div>{/* end Timeline + Anomaly grid */}

                {/* ─── Quick Access (full width) ───────────────────────────────── */}
                <section className="app-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Sparkles className="text-emerald-500" size={16} />
                        <h2 className="text-[11px] font-black text-gray-700 uppercase tracking-[0.18em]">クイックアクセス</h2>
                    </div>
                    <div className="p-5 grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {[
                            { id: "operations", name: "業務管理", href: "/operations", icon: <ClipboardList size={20} />, color: "text-emerald-600", hover: "group-hover:bg-emerald-100" },
                            { id: "workers", name: "外国人材", href: "/workers", icon: <Users size={20} />, color: "text-[var(--brand-primary)]", hover: "group-hover:bg-blue-100" },
                            { id: "companies", name: "受入企業", href: "/companies", icon: <Building2 size={20} />, color: "text-violet-600", hover: "group-hover:bg-violet-100" },
                            { id: "audits", name: "監査・訪問", href: "/audits", icon: <ShieldCheck size={20} />, color: "text-amber-600", hover: "group-hover:bg-amber-100" },
                            { id: "routing", name: "マップ", href: "/routing", icon: <Map size={20} />, color: "text-teal-600", hover: "group-hover:bg-teal-100" },
                            { id: "settings", name: "設定", href: "/settings", icon: <Settings size={20} />, color: "text-gray-500", hover: "group-hover:bg-gray-100" },
                        ].map((item) => (
                            <Link key={item.id} href={item.href}
                                className="p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 flex flex-col items-center text-center gap-2.5 group border border-transparent hover:border-gray-100">
                                <div className={`w-12 h-12 rounded-xl bg-gray-50 ${item.color} flex items-center justify-center transition-all ${item.hover} group-hover:scale-105 border border-gray-100`}>
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 leading-tight tracking-tight">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ─── Bottom info: Nationality + Visa types ──────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4">
                    {dashboardData?.nationalities?.length > 0 && (
                        <div className="app-card p-5 space-y-3">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em]">国籍別</h3>
                            <div className="space-y-2.5">
                                {dashboardData.nationalities.map(({ name, count, percentage }: any) => (
                                    <div key={name}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[11px] text-gray-600 font-normal truncate pr-2">{name}</span>
                                            <span className="text-[11px] font-bold font-mono text-gray-600 shrink-0">{count}<span className="font-normal text-gray-400 ml-0.5">名</span></span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {dashboardData?.visaTypes?.length > 0 && (
                        <div className="app-card p-5 space-y-3">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em]">在留資格別</h3>
                            <div className="space-y-2.5">
                                {dashboardData.visaTypes.map(({ name, count, percentage }: any) => (
                                    <div key={name}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[11px] text-gray-600 font-normal truncate pr-2">{name}</span>
                                            <span className="text-[11px] font-bold font-mono text-gray-600 shrink-0">{count}<span className="font-normal text-gray-400 ml-0.5">名</span></span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[var(--brand-primary)] rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
