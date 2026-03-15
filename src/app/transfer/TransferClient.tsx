'use client'

import React, { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    Car, Plus, Search, X, RefreshCw, ChevronDown, ChevronLeft, ChevronRight,
    MapPin, Clock, Plane, CheckCircle2, Loader2, Edit2, Save, XCircle,
    Calendar, Users, Building2,
} from 'lucide-react'
import {
    createTransferSchedule, updateTransferSchedule, updateTransferStatus,
    type TransferType, type TransferStatus, type TransferScheduleInput,
} from './actions'

// ── Types ──────────────────────────────────────────────────────────────────
interface Schedule {
    id: string
    type: TransferType
    scheduled_date: string
    scheduled_time: string | null
    departure_location: string | null
    destination: string | null
    flight_number: string | null
    status: TransferStatus
    pic_name: string | null
    notes: string | null
    worker_id: string
    company_id: string
    workers: { id: string; full_name: string; nationality: string | null }
    companies: { id: string; name_jp: string }
}

interface Props {
    schedules: Schedule[]
    workers: { id: string; full_name: string; nationality: string | null; company_id: string | null }[]
    companies: { id: string; name_jp: string }[]
    staffList: { id: string; name: string }[]
    defaultPicName: string
    userRole: string
}

// ── Config ─────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<TransferType, { label: string; emoji: string; cls: string }> = {
    airport_pickup: { label: '空港送迎', emoji: '🛬', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    airport_dropoff: { label: '空港見送り', emoji: '🛫', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    repatriation: { label: '帰国支援', emoji: '✈️', cls: 'bg-red-50 text-red-700 border-red-200' },
    hospital: { label: '病院送迎', emoji: '🏥', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    other: { label: 'その他', emoji: '🚗', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
}

const STATUS_CONFIG: Record<TransferStatus, { label: string; cls: string; dotCls?: string }> = {
    scheduled: { label: '予定', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    in_progress: { label: '進行中', cls: 'bg-amber-50 text-amber-700 border-amber-200', dotCls: 'bg-amber-500 animate-pulse' },
    completed: { label: '完了', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'キャンセル', cls: 'bg-gray-100 text-gray-400 border-gray-200' },
}

const NATIONALITY_FLAG: Record<string, string> = {
    vietnam: '🇻🇳', viet_nam: '🇻🇳', vietnam_: '🇻🇳',
    china: '🇨🇳', indonesia: '🇮🇩', philippines: '🇵🇭',
    myanmar: '🇲🇲', cambodia: '🇰🇭', thailand: '🇹🇭',
    nepal: '🇳🇵', bangladesh: '🇧🇩', india: '🇮🇳',
}

function getFlag(nationality: string | null) {
    if (!nationality) return ''
    return NATIONALITY_FLAG[nationality.toLowerCase().replace(/\s/g, '_')] ?? ''
}

function getWeekRange() {
    const now = new Date()
    const day = now.getDay()
    const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return { mon, sun }
}

const PAGE_SIZE = 20

// ── Drawer ─────────────────────────────────────────────────────────────────
function TransferDrawer({
    initial, workers, companies, staffList, defaultPicName, onClose, onSuccess,
}: {
    initial?: Schedule | null
    workers: Props['workers']
    companies: Props['companies']
    staffList: Props['staffList']
    defaultPicName: string
    onClose: () => void
    onSuccess: () => void
}) {
    const [type, setType] = useState<TransferType>(initial?.type ?? 'airport_pickup')
    const [status, setStatus] = useState<TransferStatus>(initial?.status ?? 'scheduled')
    const [workerId, setWorkerId] = useState(initial?.worker_id ?? '')
    const [workerSearch, setWorkerSearch] = useState(initial?.workers?.full_name ?? '')
    const [showWorkerList, setShowWorkerList] = useState(false)
    const [isPending, startTransition] = useTransition()

    const filteredWorkers = useMemo(() =>
        workers.filter(w => w.full_name.toLowerCase().includes(workerSearch.toLowerCase())).slice(0, 10),
        [workers, workerSearch])

    const selectedWorker = workers.find(w => w.id === workerId)
    const companyId = initial?.company_id ?? selectedWorker?.company_id ?? ''

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const input: TransferScheduleInput = {
            worker_id: workerId,
            company_id: fd.get('company_id') as string || companyId,
            type,
            status,
            scheduled_date: fd.get('scheduled_date') as string,
            scheduled_time: (fd.get('scheduled_time') as string) || undefined,
            departure_location: (fd.get('departure_location') as string) || undefined,
            destination: (fd.get('destination') as string) || undefined,
            flight_number: (fd.get('flight_number') as string) || undefined,
            pic_name: (fd.get('pic_name') as string) || undefined,
            notes: (fd.get('notes') as string) || undefined,
        }
        startTransition(async () => {
            const result = initial
                ? await updateTransferSchedule(initial.id, input)
                : await createTransferSchedule(input)
            if (!result?.error) onSuccess()
        })
    }

    const today = new Date().toISOString().split('T')[0]
    const showFlight = type === 'airport_pickup' || type === 'airport_dropoff' || type === 'repatriation'

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-end"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full md:w-[420px] h-full bg-white shadow-2xl flex flex-col animate-[slideInRight_0.2s_ease]"
                style={{ animation: 'slideInRight 0.2s ease' }}>
                {/* Header */}
                <div className="h-[52px] bg-[var(--brand-primary)] flex items-center justify-between px-5 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Car size={16} className="text-white/80" />
                        <span className="text-[14px] font-normal text-white">
                            {initial ? 'スケジュール編集' : '新規スケジュール登録'}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto thin-scrollbar p-5 space-y-4">
                    {/* 種別 */}
                    <div>
                        <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2">種別 *</label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {(Object.keys(TYPE_CONFIG) as TransferType[]).map(t => {
                                const cfg = TYPE_CONFIG[t]
                                return (
                                    <button key={t} type="button" onClick={() => setType(t)}
                                        className={`px-2 py-2 rounded-lg border text-[11px] font-normal transition-all text-center ${type === t ? cfg.cls + ' border-2' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                        {cfg.emoji} {cfg.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* ステータス */}
                    <div>
                        <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2">ステータス</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {(Object.keys(STATUS_CONFIG) as TransferStatus[]).map(s => {
                                const cfg = STATUS_CONFIG[s]
                                return (
                                    <button key={s} type="button" onClick={() => setStatus(s)}
                                        className={`px-3 py-2 rounded-lg border text-[11px] font-normal transition-all ${status === s ? cfg.cls + ' border-2' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                        {cfg.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* 労働者 */}
                    <div className="relative">
                        <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">労働者 *</label>
                        <div className="relative">
                            <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={workerSearch}
                                onChange={e => { setWorkerSearch(e.target.value); setWorkerId(''); setShowWorkerList(true) }}
                                onFocus={() => setShowWorkerList(true)}
                                placeholder="労働者名で検索..."
                                className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]"
                            />
                        </div>
                        {showWorkerList && filteredWorkers.length > 0 && (
                            <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredWorkers.map(w => (
                                    <button key={w.id} type="button"
                                        className="w-full text-left px-3 py-2 text-[12px] hover:bg-blue-50 flex items-center gap-2"
                                        onClick={() => { setWorkerId(w.id); setWorkerSearch(w.full_name); setShowWorkerList(false) }}>
                                        <span className="text-[14px]">{getFlag(w.nationality)}</span>
                                        {w.full_name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 日時 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">予定日 *</label>
                            <input name="scheduled_date" type="date" required defaultValue={initial?.scheduled_date ?? today}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]" />
                        </div>
                        <div>
                            <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">予定時刻</label>
                            <input name="scheduled_time" type="time" defaultValue={initial?.scheduled_time ?? ''}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]" />
                        </div>
                    </div>

                    {/* 出発地・目的地 */}
                    <div>
                        <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">出発地</label>
                        <div className="relative">
                            <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input name="departure_location" type="text" defaultValue={initial?.departure_location ?? ''}
                                placeholder="出発地を入力..."
                                className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">目的地</label>
                        <div className="relative">
                            <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input name="destination" type="text" defaultValue={initial?.destination ?? ''}
                                placeholder="目的地を入力..."
                                className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]" />
                        </div>
                    </div>

                    {/* フライト番号 */}
                    {showFlight && (
                        <div>
                            <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">フライト番号</label>
                            <div className="relative">
                                <Plane size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input name="flight_number" type="text" defaultValue={initial?.flight_number ?? ''}
                                    placeholder="例: VN201"
                                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]" />
                            </div>
                        </div>
                    )}

                    {/* 担当者 */}
                    <div>
                        <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">担当者</label>
                        <select name="pic_name" defaultValue={initial?.pic_name ?? defaultPicName}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)] appearance-none">
                            <option value="">— 選択 —</option>
                            {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* メモ */}
                    <div>
                        <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">メモ</label>
                        <textarea name="notes" defaultValue={initial?.notes ?? ''} rows={3}
                            placeholder="備考・特記事項..."
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)] resize-none" />
                    </div>
                </form>

                {/* Footer */}
                <div className="h-[60px] border-t border-gray-100 flex items-center gap-3 px-5 shrink-0">
                    <button type="button" onClick={onClose}
                        className="flex-1 h-9 text-[13px] text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        キャンセル
                    </button>
                    <button
                        type="submit"
                        form="transfer-form"
                        disabled={isPending || !workerId}
                        onClick={e => {
                            const form = document.getElementById('transfer-form') as HTMLFormElement
                            if (form) form.requestSubmit()
                        }}
                        className="flex-[2] h-9 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-lg text-[13px] flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-95">
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {isPending ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
            <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
        </div>
    )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function TransferClient({ schedules, workers, companies, staffList, defaultPicName, userRole }: Props) {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [monthFilter, setMonthFilter] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [page, setPage] = useState(1)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<Schedule | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [pendingStatusId, startStatusTransition] = useTransition()

    const handleRefresh = () => {
        setIsRefreshing(true)
        router.refresh()
        setTimeout(() => setIsRefreshing(false), 800)
    }

    const handleSuccess = () => {
        setDrawerOpen(false)
        setEditTarget(null)
        router.refresh()
    }

    const handleQuickComplete = (id: string) => {
        startStatusTransition(async () => {
            await updateTransferStatus(id, 'completed')
            router.refresh()
        })
    }

    // Stats
    const now = new Date()
    const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const { mon, sun } = getWeekRange()

    const statsScheduledMonth = schedules.filter(s =>
        s.scheduled_date?.startsWith(thisMonthStr) && s.status === 'scheduled').length
    const statsScheduledWeek = schedules.filter(s => {
        const d = new Date(s.scheduled_date)
        return d >= mon && d <= sun && s.status === 'scheduled'
    }).length
    const statsCompleted = schedules.filter(s =>
        s.scheduled_date?.startsWith(thisMonthStr) && s.status === 'completed').length
    const statsRepatriation = schedules.filter(s =>
        s.type === 'repatriation' && s.status === 'scheduled' && new Date(s.scheduled_date) >= now).length

    // Filtered
    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return schedules.filter(s => {
            if (typeFilter !== 'all' && s.type !== typeFilter) return false
            if (statusFilter !== 'all' && s.status !== statusFilter) return false
            if (monthFilter && !s.scheduled_date?.startsWith(monthFilter)) return false
            if (q) {
                const workerName = s.workers?.full_name?.toLowerCase() ?? ''
                const companyName = s.companies?.name_jp?.toLowerCase() ?? ''
                if (!workerName.includes(q) && !companyName.includes(q)) return false
            }
            return true
        })
    }, [schedules, search, typeFilter, statusFilter, monthFilter])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    // Month options
    const monthOptions = useMemo(() => {
        const opts: string[] = []
        for (let i = -2; i <= 4; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
            opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
        }
        return opts
    }, [])

    const canEdit = userRole === 'admin' || userRole === 'staff'

    return (
        <div className="flex flex-col h-full bg-[var(--input-bg)] overflow-hidden">
            {/* Header */}
            <div className="h-[44px] bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <Car size={16} className="text-[var(--brand-primary)]" />
                    <h2 className="text-[14px] font-normal text-gray-900 tracking-tight">送迎<span className="text-[var(--brand-primary)]">・</span>帰国支援</h2>
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}件</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleRefresh}
                        className={`p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : 'hover:text-blue-600 hover:bg-white'}`}>
                        <RefreshCw size={14} />
                    </button>
                    {canEdit && (
                        <button onClick={() => { setEditTarget(null); setDrawerOpen(true) }}
                            className="h-7 px-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-lg text-[12px] font-normal flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-blue-100">
                            <Plus size={13} />新規登録
                        </button>
                    )}
                </div>
            </div>

            {/* Filter bar */}
            <div className="h-[44px] bg-white border-b border-gray-200 flex items-center gap-2 px-4 shrink-0">
                {/* Search */}
                <div className="relative w-[200px]">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="労働者名・企業名で検索..." value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        className="w-full h-7 pl-7 pr-6 bg-gray-50 border border-gray-200 rounded-md text-xs outline-none focus:border-blue-500 focus:bg-white transition-all" />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                            <X size={11} />
                        </button>
                    )}
                </div>

                {/* Type filter */}
                <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
                    className="h-7 px-2 bg-gray-50 border border-gray-200 rounded-md text-xs outline-none appearance-none focus:border-blue-500 cursor-pointer">
                    <option value="all">すべての種別</option>
                    {(Object.keys(TYPE_CONFIG) as TransferType[]).map(t => (
                        <option key={t} value={t}>{TYPE_CONFIG[t].emoji} {TYPE_CONFIG[t].label}</option>
                    ))}
                </select>

                {/* Status filter */}
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                    className="h-7 px-2 bg-gray-50 border border-gray-200 rounded-md text-xs outline-none appearance-none focus:border-blue-500 cursor-pointer">
                    <option value="all">すべてのステータス</option>
                    {(Object.keys(STATUS_CONFIG) as TransferStatus[]).map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                </select>

                {/* Month filter */}
                <select value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setPage(1) }}
                    className="h-7 px-2 bg-gray-50 border border-gray-200 rounded-md text-xs outline-none appearance-none focus:border-blue-500 cursor-pointer">
                    <option value="">すべての月</option>
                    {monthOptions.map(m => (
                        <option key={m} value={m}>{m.replace('-', '年')}月</option>
                    ))}
                </select>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 px-4 py-3 shrink-0">
                {[
                    { label: '今月の予定', value: statsScheduledMonth, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: '今週の予定', value: statsScheduledWeek, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: '完了済み', value: statsCompleted, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: '帰国予定', value: statsRepatriation, icon: Plane, color: 'text-red-600', bg: 'bg-red-50' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                            <stat.icon size={15} className={stat.color} />
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-400 font-normal">{stat.label}</div>
                            <div className={`text-xl font-bold ${stat.color} leading-none mt-0.5`}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto thin-scrollbar mx-4 mb-4 bg-white rounded-lg border border-gray-200">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Car size={36} className="mb-3 opacity-20" />
                        <p className="text-[13px] mb-3">まだスケジュールがありません</p>
                        {canEdit && (
                            <button onClick={() => { setEditTarget(null); setDrawerOpen(true) }}
                                className="h-8 px-4 bg-[var(--brand-primary)] text-white rounded-lg text-[12px] flex items-center gap-1.5">
                                <Plus size={13} />新規登録
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ── Mobile card view ─────────────────────────────────────── */}
                        <div className="md:hidden space-y-2 p-3">
                            {paginated.map((s) => {
                                const typeCfg = TYPE_CONFIG[s.type]
                                const statusCfg = STATUS_CONFIG[s.status]
                                const flag = getFlag(s.workers?.nationality)
                                return (
                                    <div key={s.id}
                                        className={`bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-3 ${s.status === 'cancelled' ? 'opacity-50' : ''}`}
                                        style={{ boxShadow: 'var(--shadow-sm)' }}>
                                        {/* Header: type badge + date */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${typeCfg.cls}`}>
                                                {typeCfg.emoji} {typeCfg.label}
                                            </span>
                                            <div className="text-right">
                                                <div className="text-xs font-semibold text-[var(--color-text-primary)]">{s.scheduled_date?.replace(/-/g, '/')}</div>
                                                {s.scheduled_time && <div className="text-[10px] text-[var(--color-text-muted)]">{s.scheduled_time.slice(0, 5)}</div>}
                                            </div>
                                        </div>
                                        {/* Worker + company */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                                {s.workers?.full_name?.charAt(0) ?? '?'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-[var(--color-text-primary)]">
                                                    {flag && <span className="mr-1">{flag}</span>}{s.workers?.full_name}
                                                </div>
                                                <div className="text-xs text-[var(--color-text-muted)]">{s.companies?.name_jp}</div>
                                            </div>
                                        </div>
                                        {/* Route + info */}
                                        <div className="text-xs text-[var(--color-text-muted)] mb-2 space-y-0.5">
                                            <div className="flex items-center gap-1">
                                                <span className="truncate">{s.departure_location || '—'}</span>
                                                <span className="text-gray-300 shrink-0">→</span>
                                                <span className="truncate">{s.destination || '—'}</span>
                                            </div>
                                            {s.flight_number && <div>✈ {s.flight_number}</div>}
                                            {s.pic_name && <div>担当: {s.pic_name}</div>}
                                        </div>
                                        {/* Status + actions */}
                                        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusCfg.cls}`}>
                                                {statusCfg.dotCls && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${statusCfg.dotCls}`} />}
                                                {statusCfg.label}
                                            </span>
                                            {canEdit && (
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => { setEditTarget(s); setDrawerOpen(true) }}
                                                        className="h-7 px-3 text-xs border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors">
                                                        編集
                                                    </button>
                                                    {s.status !== 'completed' && s.status !== 'cancelled' && (
                                                        <button onClick={() => handleQuickComplete(s.id)}
                                                            className="h-7 px-3 text-xs border border-emerald-200 rounded-[var(--radius-sm)] text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                                                            完了
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {/* ── Desktop table ──────────────────────────────────────────── */}
                        <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {['日時', '種別', '労働者', '企業', '出発地 → 目的地', '担当者', 'ステータス', '操作'].map(h => (
                                    <th key={h} className="px-3.5 py-2.5 text-[11px] font-semibold text-gray-500 whitespace-nowrap border-b border-gray-200">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((s, idx) => {
                                const typeCfg = TYPE_CONFIG[s.type]
                                const statusCfg = STATUS_CONFIG[s.status]
                                const isCancelled = s.status === 'cancelled'
                                const flag = getFlag(s.workers?.nationality)
                                const rowBg = isCancelled ? 'opacity-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'

                                return (
                                    <tr key={s.id}
                                        className={`${rowBg} hover:bg-blue-50/30 transition-colors border-b border-gray-100 last:border-0 ${isCancelled ? 'line-through' : ''}`}>
                                        {/* 日時 */}
                                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                                            <div className="text-[12px] font-semibold text-gray-800">{s.scheduled_date?.replace(/-/g, '/')}</div>
                                            {s.scheduled_time && (
                                                <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <Clock size={9} />{s.scheduled_time.slice(0, 5)}
                                                </div>
                                            )}
                                        </td>

                                        {/* 種別 */}
                                        <td className="px-3.5 py-2.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${typeCfg.cls}`}>
                                                {typeCfg.emoji} {typeCfg.label}
                                            </span>
                                        </td>

                                        {/* 労働者 */}
                                        <td className="px-3.5 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                                    {s.workers?.full_name?.charAt(0) ?? '?'}
                                                </div>
                                                <div>
                                                    <div className="text-[12px] font-normal text-gray-800 whitespace-nowrap">
                                                        {flag && <span className="mr-1">{flag}</span>}
                                                        {s.workers?.full_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 企業 */}
                                        <td className="px-3.5 py-2.5 text-[12px] text-gray-500 max-w-[160px] truncate whitespace-nowrap">
                                            {s.companies?.name_jp}
                                        </td>

                                        {/* 出発地→目的地 */}
                                        <td className="px-3.5 py-2.5 max-w-[200px]">
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                                <span className="truncate max-w-[80px]">{s.departure_location || '—'}</span>
                                                <span className="text-gray-300 shrink-0">→</span>
                                                <span className="truncate max-w-[80px]">{s.destination || '—'}</span>
                                            </div>
                                            {s.flight_number && (
                                                <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <Plane size={9} />{s.flight_number}
                                                </div>
                                            )}
                                        </td>

                                        {/* 担当者 */}
                                        <td className="px-3.5 py-2.5 text-[12px] text-gray-500 whitespace-nowrap">
                                            {s.pic_name || '—'}
                                        </td>

                                        {/* ステータス */}
                                        <td className="px-3.5 py-2.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] border ${statusCfg.cls}`}>
                                                {statusCfg.dotCls && (
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotCls}`} />
                                                )}
                                                {statusCfg.label}
                                            </span>
                                        </td>

                                        {/* 操作 */}
                                        <td className="px-3.5 py-2.5">
                                            <div className="flex items-center gap-1.5">
                                                {canEdit && (
                                                    <button onClick={() => { setEditTarget(s); setDrawerOpen(true) }}
                                                        className="h-6 px-2 text-[11px] border border-gray-200 rounded text-gray-500 hover:bg-gray-50 flex items-center gap-1 transition-colors">
                                                        <Edit2 size={10} />編集
                                                    </button>
                                                )}
                                                {canEdit && s.status !== 'completed' && s.status !== 'cancelled' && (
                                                    <button onClick={() => handleQuickComplete(s.id)}
                                                        className="h-6 px-2 text-[11px] border border-emerald-200 rounded text-emerald-600 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1 transition-colors">
                                                        <CheckCircle2 size={10} />完了
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="h-[44px] bg-white border-t border-gray-200 flex items-center justify-between px-4 shrink-0">
                    <span className="text-[11px] text-gray-400">
                        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}件
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-[12px] text-gray-600 px-2">{page} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Drawer */}
            {drawerOpen && (
                <TransferDrawer
                    initial={editTarget}
                    workers={workers}
                    companies={companies}
                    staffList={staffList}
                    defaultPicName={defaultPicName}
                    onClose={() => { setDrawerOpen(false); setEditTarget(null) }}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
}
