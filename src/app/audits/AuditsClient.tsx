'use client'

import React, { useState, useEffect, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Building2, Search, AlertCircle, CheckCircle2, CalendarCheck,
    Printer, ChevronLeft, ChevronRight, Circle,
    X, Clock, CalendarPlus, Save, Check, Pencil, Plus, FileDown, Filter
} from 'lucide-react'
import { DataTableToolbar } from '@/components/DataTableToolbar'
import { MonthFilter } from './MonthFilter'
import { createAuditInline, upsertAuditSchedule } from './actions'

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 20

const AUDIT_TYPES = [
    { key: 'homon', label: '社宅訪問', badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
    { key: 'kansa', label: '監査訪問', badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
] as const

const TYPE_LABEL: Record<string, string> = { homon: '社宅訪問', kansa: '監査訪問', rinji: '臨時対応' }
const TYPE_COLOR: Record<string, string> = {
    homon: 'bg-blue-50 text-blue-600',
    kansa: 'bg-indigo-50 text-indigo-600',
    rinji: 'bg-amber-50 text-amber-600',
}

// Visa status display order
const VISA_ORDER = ['実習生１号', '実習生２号', '実習生３号', '技能実習1号', '技能実習2号', '技能実習3号']

// Kansa-cycle status tabs
const STATUS_TABS: Record<string, {
    label: string; icon: React.ReactNode
    activeBg: string; activeText: string; activeBorder: string
    bg: string; text: string; border: string
    badgeBg: string; badgeText: string; dot: string
}> = {
    all: { label: '全社', icon: <Building2 size={13} />, activeBg: 'bg-slate-800', activeText: 'text-white', activeBorder: 'border-slate-800', bg: 'bg-white', text: 'text-slate-500', border: 'border-slate-200', badgeBg: 'bg-slate-100', badgeText: 'text-slate-600', dot: 'bg-slate-400' },
    overdue: { label: '予定超過', icon: <AlertCircle size={13} />, activeBg: 'bg-red-500', activeText: 'text-white', activeBorder: 'border-red-500', bg: 'bg-white', text: 'text-red-500', border: 'border-red-200', badgeBg: 'bg-red-50', badgeText: 'text-red-600', dot: 'bg-red-500' },
    no_data: { label: '予定未作', icon: <Circle size={13} />, activeBg: 'bg-slate-500', activeText: 'text-white', activeBorder: 'border-slate-500', bg: 'bg-white', text: 'text-slate-500', border: 'border-slate-200', badgeBg: 'bg-slate-100', badgeText: 'text-slate-600', dot: 'bg-slate-400' },
    today_due: { label: '今月予定', icon: <CalendarCheck size={13} />, activeBg: 'bg-blue-500', activeText: 'text-white', activeBorder: 'border-blue-500', bg: 'bg-white', text: 'text-blue-600', border: 'border-blue-200', badgeBg: 'bg-blue-50', badgeText: 'text-blue-700', dot: 'bg-blue-500' },
    future: { label: '次月以降', icon: <CheckCircle2 size={13} />, activeBg: 'bg-emerald-500', activeText: 'text-white', activeBorder: 'border-emerald-500', bg: 'bg-white', text: 'text-emerald-600', border: 'border-emerald-200', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700', dot: 'bg-emerald-500' },
}
const TAB_KEYS = ['all', 'overdue', 'no_data', 'today_due', 'future']

function getTab(kansaStatus: string) {
    return kansaStatus in STATUS_TABS ? kansaStatus : 'no_data'
}

// Status labels for PDF modal
const PDF_STATUS_OPTIONS = [
    { key: 'overdue', label: '予定超過', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    { key: 'no_data', label: '予定未作', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
    { key: 'today_due', label: '今月予定', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { key: 'future', label: '次月以降', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
]

// ─────────────────────────────────────────────────────────────
// PdfSettingsModal
// ─────────────────────────────────────────────────────────────
function PdfSettingsModal({
    filterMonth, matrixData, onClose,
}: {
    filterMonth: string
    matrixData: any[]
    onClose: () => void
}) {
    // Collect distinct pic_names from all audits in matrixData
    const picSet = new Set<string>()
    matrixData.forEach(row => {
        Object.values(row.auditsByType || {}).forEach((a: any) => {
            if (a?.pic_name) picSet.add(a.pic_name)
        })
    })
    const picOptions = Array.from(picSet).sort((a, b) => a.localeCompare(b, 'ja'))

    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['overdue', 'no_data', 'today_due', 'future'])
    const [selectedPic, setSelectedPic] = useState('')

    const toggleStatus = (key: string) =>
        setSelectedStatuses(prev =>
            prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
        )

    const targetCount = matrixData.filter(row => {
        const statusOk = selectedStatuses.length === 0 || selectedStatuses.includes(row.kansaStatus || 'no_data')
        const picOk = !selectedPic || Object.values(row.auditsByType || {}).some((a: any) => a?.pic_name === selectedPic)
        return statusOk && picOk
    }).length

    const handlePrint = () => {
        const params = new URLSearchParams()
        params.set('month', filterMonth)
        if (selectedStatuses.length > 0 && selectedStatuses.length < 4) {
            params.set('statuses', selectedStatuses.join(','))
        }
        if (selectedPic) params.set('pic', selectedPic)
        window.open(`/audits/print?${params.toString()}`, '_blank')
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-slate-800">
                    <div className="flex items-center gap-2.5">
                        <FileDown size={16} className="text-emerald-400" />
                        <h3 className="font-bold text-white text-[15px]">PDF出力設定</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Status filter */}
                    <div>
                        <div className="flex items-center gap-2 mb-2.5">
                            <Filter size={13} className="text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ステータスで絞り込み</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {PDF_STATUS_OPTIONS.map(opt => {
                                const isOn = selectedStatuses.includes(opt.key)
                                return (
                                    <button key={opt.key} type="button" onClick={() => toggleStatus(opt.key)}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${isOn ? `${opt.bg} border-current` : 'bg-slate-50 border-slate-100 opacity-50'
                                            }`}>
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isOn ? 'bg-current border-current' : 'bg-white border-slate-300'
                                            }`}>
                                            {isOn && <Check size={9} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <span className={`text-[12px] font-bold ${opt.color}`}>{opt.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Person filter */}
                    <div>
                        <div className="flex items-center gap-2 mb-2.5">
                            <Filter size={13} className="text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">担当者で絞り込み</span>
                        </div>
                        <select value={selectedPic} onChange={e => setSelectedPic(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none text-slate-700 font-medium text-sm">
                            <option value="">全担当者（絞り込みなし）</option>
                            {picOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {/* Preview count */}
                    <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-[12px] text-slate-500 font-medium">対象社数</span>
                        <span className="text-[20px] font-black text-slate-800">
                            {targetCount} <span className="text-[13px] font-bold text-slate-400">社</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-sm">
                        キャンセル
                    </button>
                    <button onClick={handlePrint} disabled={targetCount === 0}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm disabled:opacity-40 transition-all">
                        <Printer size={14} /> PDFを開く ({targetCount}社)
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// InlineTypeCell — input row for one audit type (date + person)
// ─────────────────────────────────────────────────────────────
function InlineTypeCell({
    auditType, typeLabel, typeBadge,
    companyId, filterMonth, existingAudit, onSaved,
}: {
    auditType: string; typeLabel: string; typeBadge: string
    companyId: string; filterMonth: string
    existingAudit?: any; onSaved: () => void
}) {
    const defaultDate = filterMonth ? `${filterMonth}-15` : ''
    const [date, setDate] = useState(existingAudit?.scheduled_date || '')
    const [person, setPerson] = useState(existingAudit?.pic_name || '')
    const [isDirty, setIsDirty] = useState(false)
    const [isSaving, startSave] = useTransition()
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        setDate(existingAudit?.scheduled_date || '')
        setPerson(existingAudit?.pic_name || '')
        setIsDirty(false)
        setSaved(false)
    }, [existingAudit?.id, existingAudit?.scheduled_date, existingAudit?.pic_name])

    const markDirty = () => { setIsDirty(true); setSaved(false) }

    const handleSave = () => {
        if (!date) return
        startSave(async () => {
            const result = await upsertAuditSchedule({
                companyId, auditType, month: filterMonth,
                scheduledDate: date, picName: person,
                markCompleted: existingAudit?.status === 'completed',
                existingId: existingAudit?.id,
            })
            if (!result?.error) { setIsDirty(false); setSaved(true); onSaved() }
        })
    }

    const isDone = existingAudit?.status === 'completed'

    return (
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${isDone ? 'bg-emerald-50/70' : 'bg-slate-50/80'}`}>
            {/* Type badge */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${typeBadge}`}
                style={{ minWidth: 60, textAlign: 'center' }}>
                {typeLabel}
            </span>

            {/* 実施日 */}
            <input
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); markDirty() }}
                className={`h-7 text-[11px] font-mono font-bold px-2 rounded-lg border outline-none transition-all w-[118px] shrink-0
                    ${isDone
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 opacity-70'
                        : 'bg-white border-slate-200 focus:border-[#24b47e] text-slate-700'}`}
            />

            {/* 担当 */}
            <input
                type="text"
                value={person}
                onChange={e => { setPerson(e.target.value); markDirty() }}
                placeholder="担当"
                className="h-7 text-[11px] px-2 rounded-lg border border-slate-200 focus:border-[#24b47e] bg-white text-slate-700 outline-none transition-all flex-1 min-w-0 placeholder:text-slate-300"
            />

            {/* Save button — appears when dirty */}
            {isDirty && date ? (
                <button type="button" onClick={handleSave} disabled={isSaving}
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-[#24b47e] hover:bg-[#1e9a6a] text-white transition-all shrink-0 disabled:opacity-50"
                    title="保存">
                    {isSaving ? <Clock size={10} className="animate-spin" /> : <Save size={10} />}
                </button>
            ) : saved ? (
                <span className="text-[10px] text-emerald-500 font-bold shrink-0">✓</span>
            ) : null}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// InlineOpsCell — 操作 buttons for one audit type
// ─────────────────────────────────────────────────────────────
function InlineOpsCell({
    existingAudit, companyId, auditType, filterMonth, onSaved, onOpenModal,
}: {
    existingAudit?: any; companyId: string; auditType: string
    filterMonth: string; onSaved: () => void
    onOpenModal?: (companyId: string, auditType: string) => void
}) {
    const [isPending, startTransition] = useTransition()

    const handleComplete = () => {
        if (!existingAudit?.id) return
        if (!confirm('このスケジュールを「完了」にしますか？\n（本日の日付が実施日として自動記録されます）')) return
        startTransition(async () => {
            await upsertAuditSchedule({
                companyId, auditType, month: filterMonth,
                scheduledDate: existingAudit.scheduled_date,
                picName: existingAudit.pic_name,
                markCompleted: true,
                existingId: existingAudit.id,
            })
            onSaved()
        })
    }

    // No audit yet — show quick-add button
    if (!existingAudit) {
        return (
            <div className="flex items-center h-[36px] px-1">
                <button
                    onClick={() => onOpenModal?.(companyId, auditType)}
                    className="flex items-center gap-1 px-2 h-6 bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 text-[10px] font-bold rounded-md border border-slate-200 hover:border-emerald-300 transition-all"
                    title="スケジュール追加">
                    <Plus size={10} strokeWidth={2.5} />
                    <span>追加</span>
                </button>
            </div>
        )
    }

    // Completed
    if (existingAudit.status === 'completed') {
        return (
            <div className="flex items-center gap-1.5 h-[36px] px-1">
                <div className="flex items-center gap-1 text-emerald-500 text-[11px] font-bold">
                    <CheckCircle2 size={12} /> <span>完了済</span>
                </div>
                <Link href={`/audits/${existingAudit.id}/edit`}
                    className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
                    title="編集">
                    <Pencil size={11} />
                </Link>
            </div>
        )
    }

    // Planned (or in_progress)
    return (
        <div className="flex items-center gap-1.5 h-[36px] px-1">
            <button onClick={handleComplete} disabled={isPending}
                className="flex items-center gap-1 px-2 h-6 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-md transition-all disabled:opacity-50 shrink-0"
                title="完了にする">
                {isPending ? <Clock size={10} className="animate-spin" /> : <Check size={10} strokeWidth={3} />}
                <span>{isPending ? '...' : '完了'}</span>
            </button>
            <Link href={`/audits/${existingAudit.id}/edit`}
                className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
                title="編集">
                <Pencil size={11} />
            </Link>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Add Schedule Modal
// ─────────────────────────────────────────────────────────────
function AddScheduleModal({ companies, defaultPicName, defaultCompanyId, defaultAuditType = 'homon', filterMonth, onClose, onSuccess }: {
    companies: { id: string; name_jp: string }[]
    defaultPicName: string; defaultCompanyId: string; defaultAuditType?: string; filterMonth: string
    onClose: () => void; onSuccess: () => void
}) {
    const [status, setStatus] = useState<'planned' | 'completed'>('planned')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const formRef = useRef<HTMLFormElement>(null)
    const today = new Date().toISOString().split('T')[0]
    const defaultDate = filterMonth ? `${filterMonth}-01` : today

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        startTransition(async () => {
            const result = await createAuditInline(new FormData(e.currentTarget))
            if (result?.error) { setError(result.error); return }
            onSuccess()
        })
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-slate-800 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <CalendarPlus size={16} className="text-emerald-400" />
                        <h3 className="font-bold text-white text-[15px]">スケジュールの追加</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
                    {/* Status */}
                    <div className="grid grid-cols-2 gap-2">
                        {(['planned', 'completed'] as const).map(s => {
                            const isSelected = status === s
                            const color = s === 'planned' ? 'blue' : 'emerald'
                            return (
                                <button key={s} type="button" onClick={() => setStatus(s)}
                                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer
                                        ${isSelected ? `border-${color}-500 bg-${color}-50` : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? `bg-${color}-500` : 'bg-slate-100'}`}>
                                        {s === 'planned'
                                            ? <CalendarCheck size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                            : <CheckCircle2 size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />}
                                    </div>
                                    <div className={`font-bold text-[13px] ${isSelected ? `text-${color}-700` : 'text-slate-600'}`}>
                                        {s === 'planned' ? '予定' : '完了'}
                                    </div>
                                    {isSelected && (
                                        <div className={`absolute top-2 right-2 w-4 h-4 rounded-full bg-${color}-500 flex items-center justify-center`}>
                                            <Check size={9} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                    <input type="hidden" name="status" value={status} />

                    {/* 対象企業 */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">対象企業 <span className="text-red-400">*</span></label>
                        <select name="company_id" required defaultValue={defaultCompanyId}
                            className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none appearance-none text-slate-800 font-medium text-sm">
                            <option value="">選択してください</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">種別 <span className="text-red-400">*</span></label>
                            <select name="audit_type" required defaultValue={defaultAuditType}
                                className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none appearance-none text-slate-800 font-medium text-sm">
                                <option value="homon">社宅訪問</option>
                                <option value="kansa">監査訪問</option>
                                <option value="rinji">臨時対応</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">担当スタッフ</label>
                            <input name="pic_name" type="text" defaultValue={defaultPicName} placeholder="担当者名"
                                className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none text-slate-800 font-medium text-sm placeholder:text-slate-300" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">予定日 <span className="text-red-400">*</span></label>
                            <input name="scheduled_date" type="date" required defaultValue={defaultDate}
                                className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none text-slate-800 font-medium text-sm" />
                        </div>
                        {status === 'completed' && (
                            <div>
                                <label className="block text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">実施日 <span className="text-red-400">*</span></label>
                                <input name="actual_date" type="date" required defaultValue={today}
                                    className="w-full bg-emerald-50 border border-emerald-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 outline-none text-slate-800 font-medium text-sm" />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">メモ</label>
                        <textarea name="notes" rows={2} placeholder="特記事項があれば..."
                            className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none text-slate-800 text-sm placeholder:text-slate-300 resize-none" />
                    </div>

                    {error && <div className="text-red-500 text-[12px] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
                </form>

                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                    <button onClick={onClose} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-sm">
                        キャンセル
                    </button>
                    <button type="button" disabled={isPending} onClick={() => formRef.current?.requestSubmit()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 text-sm disabled:opacity-40 shadow-sm">
                        {isPending ? <><Clock size={14} className="animate-spin" /> 保存中...</> : <><CheckCircle2 size={14} /> 保存する</>}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Main AuditsClient
// ─────────────────────────────────────────────────────────────
export function AuditsClient({
    matrixData, filterMonth, userRole,
    companies = [], defaultPicName = '',
}: {
    matrixData: any[]; filterMonth: string; userRole?: string
    companies?: { id: string; name_jp: string }[]
    defaultPicName?: string
}) {
    const router = useRouter()
    const [filtered, setFiltered] = useState(matrixData)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [showModal, setShowModal] = useState(false)
    const [preselectedCompanyId, setPreselectedCompanyId] = useState('')
    const [preselectedAuditType, setPreselectedAuditType] = useState('homon')
    const [showPdfModal, setShowPdfModal] = useState(false)

    useEffect(() => {
        let result = matrixData
        if (searchTerm) {
            const lower = searchTerm.toLowerCase()
            result = result.filter(row => row.company.name_jp?.toLowerCase().includes(lower))
        }
        if (activeTab !== 'all') result = result.filter(row => getTab(row.kansaStatus) === activeTab)
        setFiltered(result)
        setCurrentPage(1)
    }, [searchTerm, activeTab, matrixData])

    const countByTab = (key: string) => key === 'all' ? matrixData.length
        : matrixData.filter(row => getTab(row.kansaStatus) === key).length

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    const openModal = (companyId = '', auditType = 'homon') => { setPreselectedCompanyId(companyId); setPreselectedAuditType(auditType); setShowModal(true) }
    const handleSaved = () => router.refresh()

    const getStatusBadge = (row: any) => {
        const ks = row.kansaStatus || 'no_data'
        const cfg = STATUS_TABS[ks] || STATUS_TABS.no_data
        const nextLabel = row.nextKansaDue
            ? row.nextKansaDue.replace(/-/g, '/').substring(0, 7)  // YYYY/MM
            : null
        return (
            <div className="flex flex-col items-center gap-0.5">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                </span>
                {nextLabel && (
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {ks === 'overdue' ? '期限: ' : '次回: '}{nextLabel}
                    </span>
                )}
            </div>
        )
    }

    const Pagination = () => totalPages > 1 ? (
        <div className="flex justify-center items-center gap-2 mt-8 pb-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${currentPage === page ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                        {page}
                    </button>
                ))}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight size={16} />
            </button>
            <span className="text-[11px] text-slate-400 ml-2">
                {filtered.length} 社中 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} 社
            </span>
        </div>
    ) : null

    return (
        <div className="flex flex-col gap-5">
            {showModal && (
                <AddScheduleModal
                    companies={companies} defaultPicName={defaultPicName}
                    defaultCompanyId={preselectedCompanyId}
                    defaultAuditType={preselectedAuditType}
                    filterMonth={filterMonth}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); router.refresh() }}
                />
            )}
            {showPdfModal && (
                <PdfSettingsModal
                    filterMonth={filterMonth}
                    matrixData={matrixData}
                    onClose={() => setShowPdfModal(false)}
                />
            )}

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                {TAB_KEYS.map(key => {
                    const cfg = STATUS_TABS[key]
                    const count = countByTab(key)
                    const isActive = activeTab === key
                    return (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] font-bold transition-all select-none
                                ${isActive ? `${cfg.activeBg} ${cfg.activeText} ${cfg.activeBorder} shadow-md -translate-y-0.5` : `${cfg.bg} ${cfg.text} ${cfg.border} hover:bg-slate-50 hover:-translate-y-0.5`}`}>
                            <span className="flex items-center gap-1.5">{cfg.icon}{cfg.label}</span>
                            <span className={`text-[10px] font-bold min-w-[20px] h-5 inline-flex items-center justify-center px-1.5 rounded-full ${isActive ? 'bg-white/20 text-white' : `${cfg.badgeBg} ${cfg.badgeText}`}`}>{count}</span>
                        </button>
                    )
                })}
            </div>

            {/* Toolbar */}
            <DataTableToolbar
                data={filtered} filename={`監査訪問指導_${filterMonth}`}
                searchPlaceholder="企業名で検索..." onSearch={term => setSearchTerm(term)}
                type="companies" role="staff"
                filterNode={
                    <div className="flex items-center gap-2 flex-wrap">
                        <MonthFilter defaultValue={filterMonth} />
                    </div>
                }
                importNode={
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowPdfModal(true)}
                            className="inline-flex items-center gap-1.5 h-[32px] px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-md transition-colors">
                            <FileDown size={13} /><span>PDF出力</span>
                        </button>
                        <button onClick={() => openModal()}
                            className="inline-flex items-center gap-1.5 h-[32px] px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-md transition-colors shadow-sm">
                            <CalendarPlus size={13} /> スケジュール追加
                        </button>
                    </div>
                }
            />

            {/* ════════ TABLE ════════ */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full border-collapse text-sm text-left" style={{ minWidth: 980 }}>
                    <thead>
                        <tr className="bg-slate-800">
                            {/* 1 No. */}
                            <th className="px-3 py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-300 w-[42px] text-center border-r border-slate-700">No.</th>
                            {/* 2 受入企業 */}
                            <th className="px-4 py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-300 border-r border-slate-700">受入企業</th>
                            {/* 3 在籍状況 */}
                            <th className="px-3 py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-300 w-[110px] border-r border-slate-700">在籍人数</th>
                            {/* 4 ステータス */}
                            <th className="px-3 py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-300 w-[120px] text-center border-r border-slate-700">ステータス</th>
                            {/* 5 今月予定 */}
                            <th className="px-4 py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-300 border-r border-slate-700">
                                今月予定
                                <span className="ml-1.5 text-slate-500 font-normal normal-case tracking-normal">— 実施日・担当</span>
                            </th>
                            {/* 6 前回 — 監査訪問のみ */}
                            <th className="px-4 py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-300 w-[150px] border-r border-slate-700">
                                前回
                                <span className="ml-1 text-slate-500 font-normal normal-case text-[10px]">監査</span>
                            </th>
                            {/* 7 前々回 — 監査訪問のみ */}
                            <th className="px-4 py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-300 w-[150px] border-r border-slate-700">
                                前々回
                                <span className="ml-1 text-slate-500 font-normal normal-case text-[10px]">監査</span>
                            </th>
                            {/* 8 操作 */}
                            <th className="px-3 py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-300 w-[130px]">操作</th>
                        </tr>
                    </thead>
                    <tbody className="">
                        {paginated.length === 0 && (
                            <tr><td colSpan={8} className="px-5 py-16 text-center text-slate-400 font-medium">
                                <Search size={32} className="mx-auto mb-2 opacity-30" />該当する企業がありません。
                            </td></tr>
                        )}
                        {paginated.map((row, index) => {
                            const absIndex = (currentPage - 1) * PAGE_SIZE + index
                            // Visa sort: 実習生１号 → ２号 → ３号 → others
                            const rawVisa = Object.entries(row.workerCounts?.visaGroups || {}) as [string, number][]
                            const visaEntries = rawVisa.sort(([a], [b]) => {
                                const ai = VISA_ORDER.findIndex(v => a.includes(v) || v.includes(a))
                                const bi = VISA_ORDER.findIndex(v => b.includes(v) || v.includes(b))
                                const ai2 = ai === -1 ? 99 : ai
                                const bi2 = bi === -1 ? 99 : bi
                                return ai2 !== bi2 ? ai2 - bi2 : a.localeCompare(b, 'ja')
                            })
                            const prevAudit = row.lastAudits?.[0]
                            const prevPrevAudit = row.lastAudits?.[1]

                            return (
                                <tr key={row.company.id}
                                    style={{ borderBottom: '1px solid #cbd5e1' }}
                                    className={`transition-all group ${absIndex % 2 === 0 ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/30 hover:bg-slate-50/60'}`}>

                                    {/* Col 1: No. */}
                                    <td className="px-3 py-4 text-center align-top font-mono text-slate-400 text-sm font-bold border-r border-slate-100">{absIndex + 1}</td>

                                    {/* Col 2: 受入企業 (no icon, with address) */}
                                    <td className="px-4 py-3 align-top border-r border-slate-100">
                                        <Link href={`/companies/${row.company.id}`} target="_blank"
                                            className="font-bold text-slate-800 hover:text-[#24b47e] transition-colors text-[13px] leading-snug block"
                                            title={row.company.name_jp}>
                                            {row.company.name_jp}
                                        </Link>
                                        {row.company.address && (
                                            <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{row.company.address}</div>
                                        )}
                                    </td>

                                    {/* Col 3: 在籍状況 — fixed grid, numbers aligned */}
                                    <td className="px-3 py-3 align-top border-r border-slate-100">
                                        <div className="w-full">
                                            <div className="grid text-[10px] pb-1 mb-1 border-b border-slate-100"
                                                style={{ gridTemplateColumns: '1fr 24px' }}>
                                                <span className="text-slate-400">合計</span>
                                                <span className="font-bold text-slate-700 text-right tabular-nums">{row.workerCounts?.total || 0}</span>
                                            </div>
                                            <div className="flex flex-col gap-px">
                                                {VISA_ORDER
                                                    .filter(visa => (row.workerCounts?.visaGroups?.[visa] || 0) > 0)
                                                    .map(visa => (
                                                        <div key={visa} className="grid text-[9px]"
                                                            style={{ gridTemplateColumns: '1fr 24px' }}>
                                                            <span className="text-slate-400 truncate">{visa}</span>
                                                            <span className="font-bold text-slate-500 text-right tabular-nums">{row.workerCounts.visaGroups[visa]}</span>
                                                        </div>
                                                    ))
                                                }
                                                {visaEntries
                                                    .filter(([v]) => !VISA_ORDER.includes(v as any))
                                                    .map(([visa, cnt]) => (
                                                        <div key={visa} className="grid text-[9px]"
                                                            style={{ gridTemplateColumns: '1fr 24px' }}>
                                                            <span className="text-slate-400 truncate">{visa}</span>
                                                            <span className="font-bold text-slate-500 text-right tabular-nums">{cnt}</span>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    </td>

                                    {/* Col 4: ステータス (kansa cycle) */}
                                    <td className="px-3 py-3 align-top text-center border-r border-slate-100">
                                        <div className="mt-1">{getStatusBadge(row)}</div>
                                    </td>

                                    {/* Col 4: 今月予定 (3 inline rows) */}
                                    <td className="px-4 py-3 align-top border-r border-slate-100">
                                        <div className="flex flex-col gap-1.5">
                                            {AUDIT_TYPES.map(({ key, label, badge }) => (
                                                <InlineTypeCell
                                                    key={key}
                                                    auditType={key} typeLabel={label} typeBadge={badge}
                                                    companyId={row.company.id} filterMonth={filterMonth}
                                                    existingAudit={row.auditsByType?.[key]}
                                                    onSaved={handleSaved}
                                                />
                                            ))}
                                        </div>
                                    </td>

                                    {/* Col 5: 前回 (監査訪問のみ) */}
                                    <td className="px-4 py-3 align-top border-r border-slate-100">
                                        {prevAudit ? (
                                            <div className="flex flex-col gap-1">
                                                <span className="font-mono text-[12px] text-slate-800 font-bold">
                                                    {(prevAudit.actual_date || prevAudit.scheduled_date)?.replace(/-/g, '/')}
                                                </span>
                                                {prevAudit.pic_name && (
                                                    <span className="text-[10px] text-slate-400">{prevAudit.pic_name}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 text-[12px]">-</span>
                                        )}
                                    </td>

                                    {/* Col 6: 前々回 (監査訪問のみ) */}
                                    <td className="px-4 py-3 align-top border-r border-slate-100">
                                        {prevPrevAudit ? (
                                            <div className="flex flex-col gap-1">
                                                <span className="font-mono text-[12px] text-slate-800 font-bold">
                                                    {(prevPrevAudit.actual_date || prevPrevAudit.scheduled_date)?.replace(/-/g, '/')}
                                                </span>
                                                {prevPrevAudit.pic_name && (
                                                    <span className="text-[10px] text-slate-400">{prevPrevAudit.pic_name}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 text-[12px]">-</span>
                                        )}
                                    </td>

                                    {/* Col 7: 操作 */}
                                    <td className="px-3 py-3 align-top">
                                        <div className="flex flex-col gap-1.5">
                                            {AUDIT_TYPES.map(({ key }) => (
                                                <InlineOpsCell
                                                    key={key}
                                                    existingAudit={row.auditsByType?.[key]}
                                                    companyId={row.company.id}
                                                    auditType={key}
                                                    filterMonth={filterMonth}
                                                    onSaved={handleSaved}
                                                    onOpenModal={openModal}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <Pagination />
        </div>
    )
}
