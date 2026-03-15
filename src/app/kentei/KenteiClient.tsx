'use client'

import React, { useState, useMemo, useTransition, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Search, X, RefreshCw, ChevronLeft, ChevronRight,
    Edit2, Save, Loader2, User, ExternalLink, Plus, Trash2,
    CheckCircle, XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { updateKenteiRecord, deleteKenteiRecord, type KenteiData } from './actions'

// ── Types ──────────────────────────────────────────────────────────────────
interface KenteiStatus {
    type?: string
    progress?: string
    assignee?: string
    institution?: string
    location?: string
    exam_date_written?: string
    exam_date_practical?: string
    exam_result_written?: string
    exam_result_practical?: string
    witness?: string
    gakka_result?: string
    jitsugi_result?: string
    result_memo?: string
    soegai_memo?: string
}

interface KenteiWorker {
    id: string
    full_name_romaji: string | null
    full_name_kana: string | null
    nationality: string | null
    entry_batch: string | null
    entry_date: string | null
    industry_field: string | null
    company_id: string | null
    kentei_status: KenteiStatus | null
    companies: { id: string; name_jp: string } | null
}

interface Toast {
    id: string
    type: 'success' | 'error'
    message: string
}

interface Props {
    workers: KenteiWorker[]
    allWorkers: KenteiWorker[]
    staffList: { id: string; name: string }[]
    userRole: string
}

// ── Config ─────────────────────────────────────────────────────────────────
const EXAM_TYPES = ['初級', '基礎級', '専門級', '随時３級'] as const
const PROGRESS_OPTIONS = ['未着手', '進行中', '完了'] as const
const RESULT_OPTIONS = ['未受験', '合格', '不合格', '採点中'] as const
type ResultOption = typeof RESULT_OPTIONS[number]

const EXAM_TYPE_CONFIG: Record<string, { cls: string }> = {
    '初級':    { cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    '基礎級':  { cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    '専門級':  { cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    '随時３級': { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

const PROGRESS_CONFIG: Record<string, { cls: string }> = {
    '未着手': { cls: 'bg-gray-100 text-gray-500 border-gray-200' },
    '進行中': { cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    '完了':   { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

const NATIONALITY_FLAG: Record<string, string> = {
    vietnam: '🇻🇳', china: '🇨🇳', indonesia: '🇮🇩',
    philippines: '🇵🇭', myanmar: '🇲🇲', cambodia: '🇰🇭',
    thailand: '🇹🇭', nepal: '🇳🇵', bangladesh: '🇧🇩', india: '🇮🇳',
}

const PAGE_SIZE = 20

// ── Helpers ────────────────────────────────────────────────────────────────
function getFlag(nat: string | null) {
    if (!nat) return ''
    return NATIONALITY_FLAG[nat.toLowerCase().replace(/[\s-]/g, '_')] ?? ''
}

function mapOldResult(old: string | null | undefined): string {
    if (old === '○') return '合格'
    if (old === '×') return '不合格'
    return '未受験'
}

function getEffectiveResult(newResult: string | null | undefined, oldResult: string | null | undefined): string {
    if (newResult) return newResult
    return mapOldResult(oldResult)
}

function GraduationIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
    )
}

// ── Result Badge ───────────────────────────────────────────────────────────
function ResultBadge({ value }: { value: string }) {
    if (value === '合格') return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap">✓ 合格</span>
    )
    if (value === '不合格') return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border bg-red-50 text-red-700 border-red-200 whitespace-nowrap">✗ 不合格</span>
    )
    if (value === '採点中') return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] border bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />採点中
        </span>
    )
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border bg-gray-50 text-gray-400 border-gray-200">---</span>
}

// ── Toast ──────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
    return (
        <div className="fixed bottom-5 right-5 z-[500] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} style={{ animation: 'slideInRight 0.2s ease' }}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium pointer-events-auto border
                        ${t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    {t.type === 'success'
                        ? <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                        : <XCircle size={15} className="text-red-600 shrink-0" />}
                    <span>{t.message}</span>
                    <button onClick={() => onDismiss(t.id)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
                        <X size={12} />
                    </button>
                </div>
            ))}
        </div>
    )
}

// ── Result Selector ────────────────────────────────────────────────────────
function ResultSelector({ value, onChange }: { value: ResultOption; onChange: (v: ResultOption) => void }) {
    return (
        <div className="grid grid-cols-4 gap-1.5">
            {RESULT_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => onChange(opt)}
                    className={`py-2 rounded-lg border text-[11px] transition-all text-center ${value === opt
                        ? opt === '合格' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 border-2'
                        : opt === '不合格' ? 'border-red-500 bg-red-50 text-red-700 border-2'
                        : opt === '採点中' ? 'border-amber-500 bg-amber-50 text-amber-700 border-2'
                        : 'border-gray-300 bg-gray-50 text-gray-600 border-2'
                        : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                    }`}>
                    {opt}
                </button>
            ))}
        </div>
    )
}

// ── Segmented Button ───────────────────────────────────────────────────────
function SegmentedButton<T extends string>({ options, value, onChange }: {
    options: readonly T[]
    value: T
    onChange: (v: T) => void
}) {
    return (
        <div className="flex gap-1 flex-wrap">
            {options.map(opt => (
                <button key={opt} type="button" onClick={() => onChange(opt)}
                    className={`px-3 py-1.5 rounded-lg border text-[12px] transition-all ${
                        value === opt
                            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white font-medium'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}>
                    {opt}
                </button>
            ))}
        </div>
    )
}

// ── Inline Result Dropdown ─────────────────────────────────────────────────
function InlineResultDropdown({ value, onChange, onClose }: {
    value: string
    onChange: (v: ResultOption) => void
    onClose: () => void
}) {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose()
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [onClose])

    return (
        <div ref={ref} className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[90px]">
            {RESULT_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => { onChange(opt); onClose() }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] hover:bg-gray-50 transition-colors ${opt === value ? 'text-[var(--brand-primary)] font-medium' : 'text-gray-700'}`}>
                    {opt}
                </button>
            ))}
        </div>
    )
}

// ── Drawer ─────────────────────────────────────────────────────────────────
interface DrawerProps {
    mode: 'edit' | 'create'
    worker?: KenteiWorker
    allWorkers?: KenteiWorker[]
    existingWorkerIds?: Set<string>
    staffList: { id: string; name: string }[]
    onClose: () => void
    onSuccess: (msg: string) => void
    onError: (msg: string) => void
}

function KenteiDrawer({ mode, worker, allWorkers = [], existingWorkerIds, staffList, onClose, onSuccess, onError }: DrawerProps) {
    const [createStep, setCreateStep] = useState<1 | 2>(1)
    const [selectedWorker, setSelectedWorker] = useState<KenteiWorker | null>(null)
    const [workerSearch, setWorkerSearch] = useState('')

    const activeWorker = mode === 'edit' ? worker! : selectedWorker
    const ks = activeWorker?.kentei_status || {}

    const [type, setType] = useState<string>(ks.type || '初級')
    const [progress, setProgress] = useState<string>(ks.progress || '未着手')
    const [institution, setInstitution] = useState(ks.institution || '')
    const [location, setLocation] = useState(ks.location || '')
    const [examDateWritten, setExamDateWritten] = useState(ks.exam_date_written || '')
    const [examDatePractical, setExamDatePractical] = useState(ks.exam_date_practical || '')
    const [assignee, setAssignee] = useState(ks.assignee || '')
    const [witness, setWitness] = useState(ks.witness || '')
    const [soegaiMemo, setSoegaiMemo] = useState(ks.soegai_memo || '')
    const [gakkaResult, setGakkaResult] = useState<ResultOption>(
        (ks.gakka_result as ResultOption) || (mapOldResult(ks.exam_result_written) as ResultOption) || '未受験'
    )
    const [jitsugiResult, setJitsugiResult] = useState<ResultOption>(
        (ks.jitsugi_result as ResultOption) || (mapOldResult(ks.exam_result_practical) as ResultOption) || '未受験'
    )
    const [resultMemo, setResultMemo] = useState(ks.result_memo || '')
    const [isPending, startTransition] = useTransition()

    const handleSelectWorker = (w: KenteiWorker) => {
        setSelectedWorker(w)
        const wks = w.kentei_status || {}
        setType(wks.type || '初級')
        setProgress(wks.progress || '未着手')
        setInstitution(wks.institution || '')
        setLocation(wks.location || '')
        setExamDateWritten(wks.exam_date_written || '')
        setExamDatePractical(wks.exam_date_practical || '')
        setAssignee(wks.assignee || '')
        setWitness(wks.witness || '')
        setSoegaiMemo(wks.soegai_memo || '')
        setGakkaResult((wks.gakka_result as ResultOption) || '未受験')
        setJitsugiResult((wks.jitsugi_result as ResultOption) || '未受験')
        setResultMemo(wks.result_memo || '')
        setCreateStep(2)
    }

    const handleSave = () => {
        if (!activeWorker) return
        startTransition(async () => {
            const data: KenteiData = {
                type, progress, institution, location,
                exam_date_written: examDateWritten,
                exam_date_practical: examDatePractical,
                assignee,
                tachiai_person: witness,
                gakka_result: gakkaResult,
                jitsugi_result: jitsugiResult,
                result_memo: resultMemo,
                soegai_memo: soegaiMemo,
            }
            const result = await updateKenteiRecord(activeWorker.id, data)
            if (result?.error) onError(result.error)
            else onSuccess(mode === 'create' ? '登録しました' : '保存しました')
        })
    }

    const filteredWorkers = useMemo(() => {
        const q = workerSearch.toLowerCase()
        if (!q) return allWorkers.slice(0, 30)
        return allWorkers.filter(w => {
            const name = (w.full_name_romaji || '').toLowerCase()
            const kana = (w.full_name_kana || '').toLowerCase()
            const co = ((w.companies as any)?.name_jp || '').toLowerCase()
            return name.includes(q) || kana.includes(q) || co.includes(q)
        }).slice(0, 30)
    }, [allWorkers, workerSearch])

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full md:w-[440px] h-full bg-white shadow-2xl flex flex-col"
                style={{ animation: 'slideInRight 0.2s ease' }}>

                {/* Header */}
                <div className="h-[52px] bg-[var(--brand-primary)] flex items-center justify-between px-5 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <GraduationIcon size={16} className="text-white/80" />
                        <span className="text-[14px] font-normal text-white">
                            {mode === 'create' ? '新規登録' : '検定業務 編集'}
                        </span>
                        {mode === 'create' && createStep === 2 && selectedWorker && (
                            <span className="text-[12px] text-white/70">— {selectedWorker.full_name_romaji}</span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Step 1: Worker selector (create mode) */}
                {mode === 'create' && createStep === 1 ? (
                    <div className="flex-1 overflow-y-auto thin-scrollbar p-5">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">労働者を選択</div>
                        <div className="relative mb-3">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="名前・企業名で検索..." value={workerSearch}
                                onChange={e => setWorkerSearch(e.target.value)} autoFocus
                                className="w-full h-9 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]" />
                        </div>
                        <div className="space-y-1">
                            {filteredWorkers.length === 0 ? (
                                <div className="text-[12px] text-gray-400 text-center py-8">見つかりませんでした</div>
                            ) : filteredWorkers.map(w => {
                                const alreadyHas = existingWorkerIds?.has(w.id)
                                return (
                                    <button key={w.id} type="button" onClick={() => handleSelectWorker(w)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 hover:border-[var(--brand-primary)] hover:bg-blue-50/30 transition-all text-left">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-[var(--brand-primary)] text-[11px] font-bold flex items-center justify-center shrink-0">
                                                {(w.full_name_romaji || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-[13px] text-gray-800">{w.full_name_romaji}</div>
                                                <div className="text-[10px] text-gray-400">{(w.companies as any)?.name_jp}</div>
                                            </div>
                                        </div>
                                        {alreadyHas && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">登録済み</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    /* Step 2 (create) or edit form */
                    <div className="flex-1 overflow-y-auto thin-scrollbar p-5 space-y-5">
                        {/* Info banner */}
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-100 text-[12px] text-blue-700">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                            </svg>
                            編集内容は業務管理ページにも自動反映されます
                        </div>

                        {/* Worker info (edit mode) */}
                        {mode === 'edit' && worker && (
                            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-[var(--brand-primary)] text-[11px] font-bold flex items-center justify-center shrink-0">
                                    {(worker.full_name_romaji || '?').charAt(0)}
                                </div>
                                <div>
                                    <div className="text-[13px] font-normal text-gray-800">{worker.full_name_romaji}</div>
                                    <div className="text-[11px] text-gray-400">{(worker.companies as any)?.name_jp}</div>
                                </div>
                                <Link href={`/workers/${worker.id}`} className="ml-auto text-[11px] text-blue-600 hover:underline flex items-center gap-1">
                                    詳細 <ExternalLink size={10} />
                                </Link>
                            </div>
                        )}

                        {/* Section 1: 基本情報 */}
                        <div className="space-y-4">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">基本情報</span>

                            <div>
                                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2">試験種別</label>
                                <SegmentedButton options={EXAM_TYPES} value={type as any} onChange={setType} />
                            </div>

                            <div>
                                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2">進捗</label>
                                <SegmentedButton options={PROGRESS_OPTIONS} value={progress as any} onChange={setProgress} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">検定機関</label>
                                    <input type="text" value={institution} onChange={e => setInstitution(e.target.value)}
                                        placeholder="機関名..."
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">試験会場</label>
                                    <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                                        placeholder="会場名..."
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">学科日程</label>
                                    <input type="date" value={examDateWritten} onChange={e => setExamDateWritten(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">実技日程</label>
                                    <input type="date" value={examDatePractical} onChange={e => setExamDatePractical(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">業務担当者</label>
                                <div className="relative">
                                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={assignee} onChange={e => setAssignee(e.target.value)}
                                        list="kentei-assignee-list" placeholder="担当者名..."
                                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]" />
                                    <datalist id="kentei-assignee-list">
                                        {staffList.map(s => <option key={s.id} value={s.name} />)}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: 管理情報 */}
                        <div className="space-y-4">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">管理情報</span>

                            <div>
                                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">立会者</label>
                                <div className="relative">
                                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={witness} onChange={e => setWitness(e.target.value)}
                                        list="kentei-staff-list" placeholder="立会者名..."
                                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)]" />
                                    <datalist id="kentei-staff-list">
                                        {staffList.map(s => <option key={s.id} value={s.name} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">送迎メモ</label>
                                <textarea value={soegaiMemo} onChange={e => setSoegaiMemo(e.target.value)} rows={2}
                                    placeholder="送迎・集合場所などメモ..."
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)] resize-none" />
                            </div>
                        </div>

                        {/* Section 3: 試験結果 */}
                        <div className="space-y-4">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">試験結果</span>

                            <div>
                                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2">学科結果</label>
                                <ResultSelector value={gakkaResult} onChange={setGakkaResult} />
                            </div>
                            <div>
                                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2">実技結果</label>
                                <ResultSelector value={jitsugiResult} onChange={setJitsugiResult} />
                            </div>
                            <div>
                                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5">結果メモ</label>
                                <textarea value={resultMemo} onChange={e => setResultMemo(e.target.value)} rows={2}
                                    placeholder="試験結果に関するメモ..."
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[var(--brand-primary)] resize-none" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="h-[60px] border-t border-gray-100 flex items-center gap-3 px-5 shrink-0">
                    {mode === 'create' && createStep === 2 ? (
                        <button type="button" onClick={() => setCreateStep(1)}
                            className="h-9 px-3 text-[13px] text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1">
                            <ChevronLeft size={14} /> 戻る
                        </button>
                    ) : (
                        <button type="button" onClick={onClose}
                            className="flex-1 h-9 text-[13px] text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            キャンセル
                        </button>
                    )}
                    {(mode === 'edit' || createStep === 2) && (
                        <button type="button" onClick={handleSave} disabled={isPending || !activeWorker}
                            className="flex-[2] h-9 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-lg text-[13px] flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-95">
                            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {isPending ? '保存中...' : mode === 'create' ? '登録する' : '保存'}
                        </button>
                    )}
                </div>
            </div>
            <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
        </div>
    )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function KenteiClient({ workers, allWorkers, staffList, userRole }: Props) {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [progressFilter, setProgressFilter] = useState('all')
    const [resultFilter, setResultFilter] = useState('all')
    const [monthFilter, setMonthFilter] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [page, setPage] = useState(1)
    const [editTarget, setEditTarget] = useState<KenteiWorker | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [fadingIds, setFadingIds] = useState<Set<string>>(new Set())
    const [toasts, setToasts] = useState<Toast[]>([])

    // Inline edit
    const [inlineTachiaiId, setInlineTachiaiId] = useState<string | null>(null)
    const [inlineTachiaiValue, setInlineTachiaiValue] = useState('')
    const [inlineResultEdit, setInlineResultEdit] = useState<{ id: string; field: 'gakka' | 'jitsugi' } | null>(null)
    const [, startInlineTransition] = useTransition()

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const showToast = useCallback((type: Toast['type'], message: string) => {
        const id = Math.random().toString(36).slice(2)
        setToasts(prev => [...prev, { id, type, message }])
        if (type === 'success') setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
    }, [])

    const dismissToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), [])

    const handleRefresh = () => {
        setIsRefreshing(true)
        router.refresh()
        setTimeout(() => setIsRefreshing(false), 800)
    }

    const handleSuccess = (msg: string) => {
        setEditTarget(null)
        setShowCreate(false)
        router.refresh()
        showToast('success', msg)
    }

    const handleError = (msg: string) => showToast('error', msg)

    const handleDelete = async (workerId: string) => {
        setFadingIds(prev => new Set(prev).add(workerId))
        setConfirmDeleteId(null)
        setTimeout(async () => {
            const result = await deleteKenteiRecord(workerId)
            if (result?.error) {
                showToast('error', result.error)
                setFadingIds(prev => { const s = new Set(prev); s.delete(workerId); return s })
            } else {
                showToast('success', '削除しました')
                router.refresh()
            }
        }, 300)
    }

    const handleInlineSaveTachiai = (workerId: string) => {
        const value = inlineTachiaiValue
        setInlineTachiaiId(null)
        startInlineTransition(async () => {
            const result = await updateKenteiRecord(workerId, { tachiai_person: value })
            if (result?.error) showToast('error', result.error)
            else router.refresh()
        })
    }

    const handleInlineSaveResult = (workerId: string, field: 'gakka' | 'jitsugi', value: ResultOption) => {
        setInlineResultEdit(null)
        startInlineTransition(async () => {
            const data: KenteiData = field === 'gakka' ? { gakka_result: value } : { jitsugi_result: value }
            const result = await updateKenteiRecord(workerId, data)
            if (result?.error) showToast('error', result.error)
            else router.refresh()
        })
    }

    const stats = useMemo(() => {
        const thisMonth = workers.filter(w => {
            const ks = w.kentei_status || {}
            return ks.exam_date_written?.startsWith(thisMonthStr) || ks.exam_date_practical?.startsWith(thisMonthStr)
        })
        const passed = thisMonth.filter(w => {
            const ks = w.kentei_status || {}
            return getEffectiveResult(ks.gakka_result, ks.exam_result_written) === '合格' ||
                getEffectiveResult(ks.jitsugi_result, ks.exam_result_practical) === '合格'
        })
        const failed = thisMonth.filter(w => {
            const ks = w.kentei_status || {}
            return getEffectiveResult(ks.gakka_result, ks.exam_result_written) === '不合格' ||
                getEffectiveResult(ks.jitsugi_result, ks.exam_result_practical) === '不合格'
        })
        const witnessNeeded = workers.filter(w => {
            const ks = w.kentei_status || {}
            const hasUpcoming = (ks.exam_date_written && ks.exam_date_written > today) ||
                (ks.exam_date_practical && ks.exam_date_practical > today)
            return hasUpcoming && !ks.witness
        })
        return { thisMonth: thisMonth.length, passed: passed.length, failed: failed.length, witnessNeeded: witnessNeeded.length }
    }, [workers, thisMonthStr, today])

    const uniqueTypes = useMemo(() => {
        const s = new Set(workers.map(w => w.kentei_status?.type).filter(Boolean) as string[])
        return Array.from(s).sort()
    }, [workers])

    const monthOptions = useMemo(() => {
        const opts: string[] = []
        for (let i = -3; i <= 5; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
            opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
        }
        return opts
    }, [])

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return workers.filter(w => {
            const ks = w.kentei_status || {}
            const companyName = (w.companies as any)?.name_jp || ''
            if (typeFilter !== 'all' && ks.type !== typeFilter) return false
            if (progressFilter !== 'all' && (ks.progress || '未着手') !== progressFilter) return false
            if (resultFilter !== 'all') {
                const g = getEffectiveResult(ks.gakka_result, ks.exam_result_written)
                const j = getEffectiveResult(ks.jitsugi_result, ks.exam_result_practical)
                if (g !== resultFilter && j !== resultFilter) return false
            }
            if (monthFilter) {
                const inMonth = ks.exam_date_written?.startsWith(monthFilter) || ks.exam_date_practical?.startsWith(monthFilter)
                if (!inMonth) return false
            }
            if (q) {
                const name = (w.full_name_romaji || '').toLowerCase()
                const kana = (w.full_name_kana || '').toLowerCase()
                const co = companyName.toLowerCase()
                if (!name.includes(q) && !kana.includes(q) && !co.includes(q) && !(ks.type || '').toLowerCase().includes(q)) return false
            }
            return true
        }).sort((a, b) => {
            const aDate = a.kentei_status?.exam_date_written || a.kentei_status?.exam_date_practical || '9999-99-99'
            const bDate = b.kentei_status?.exam_date_written || b.kentei_status?.exam_date_practical || '9999-99-99'
            return aDate.localeCompare(bDate)
        })
    }, [workers, search, typeFilter, progressFilter, resultFilter, monthFilter])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const canEdit = userRole === 'admin' || userRole === 'staff'
    const existingWorkerIds = useMemo(() => new Set(workers.map(w => w.id)), [workers])

    return (
        <div className="flex flex-col h-full bg-[var(--input-bg)] overflow-hidden">
            {/* Header */}
            <div className="h-[44px] bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <GraduationIcon size={16} className="text-[var(--brand-primary)]" />
                    <h2 className="text-[14px] font-normal text-gray-900 tracking-tight">
                        検定<span className="text-[var(--brand-primary)]">・</span>試験管理
                    </h2>
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}件</span>
                </div>
                <div className="flex items-center gap-2">
                    {canEdit && (
                        <button onClick={() => setShowCreate(true)}
                            className="h-7 px-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-lg text-[12px] flex items-center gap-1.5 transition-colors">
                            <Plus size={13} /> 新規登録
                        </button>
                    )}
                    <button onClick={handleRefresh}
                        className={`p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : 'hover:text-blue-600 hover:bg-white'}`}>
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div className="h-[44px] bg-white border-b border-gray-200 flex items-center gap-2 px-4 shrink-0">
                <div className="relative w-[210px]">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="労働者名・企業名・試験種別..." value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        className="w-full h-7 pl-7 pr-6 bg-gray-50 border border-gray-200 rounded-md text-xs outline-none focus:border-blue-500 focus:bg-white transition-all" />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                            <X size={11} />
                        </button>
                    )}
                </div>
                <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
                    className="h-7 px-2 bg-gray-50 border border-gray-200 rounded-md text-xs outline-none appearance-none focus:border-blue-500 cursor-pointer">
                    <option value="all">すべての種別</option>
                    {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={progressFilter} onChange={e => { setProgressFilter(e.target.value); setPage(1) }}
                    className="h-7 px-2 bg-gray-50 border border-gray-200 rounded-md text-xs outline-none appearance-none focus:border-blue-500 cursor-pointer">
                    <option value="all">すべての進捗</option>
                    {['未着手', '進行中', '完了'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={resultFilter} onChange={e => { setResultFilter(e.target.value); setPage(1) }}
                    className="h-7 px-2 bg-gray-50 border border-gray-200 rounded-md text-xs outline-none appearance-none focus:border-blue-500 cursor-pointer">
                    <option value="all">すべての結果</option>
                    {['合格', '不合格', '未受験', '採点中'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setPage(1) }}
                    className="h-7 px-2 bg-gray-50 border border-gray-200 rounded-md text-xs outline-none appearance-none focus:border-blue-500 cursor-pointer">
                    <option value="">すべての月</option>
                    {monthOptions.map(m => <option key={m} value={m}>{m.replace('-', '年')}月</option>)}
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 px-4 py-3 shrink-0">
                {[
                    { label: '今月の試験', value: stats.thisMonth, color: 'text-blue-600', border: 'border-l-blue-400' },
                    { label: '合格者', value: stats.passed, color: 'text-emerald-600', border: 'border-l-emerald-400' },
                    { label: '不合格者', value: stats.failed, color: 'text-red-600', border: 'border-l-red-400' },
                    { label: '立会い未定', value: stats.witnessNeeded, color: 'text-amber-600', border: 'border-l-amber-400' },
                ].map(s => (
                    <div key={s.label} className={`bg-white rounded-lg border border-gray-100 border-l-4 ${s.border} px-4 py-3`}>
                        <div className="text-[10px] text-gray-400">{s.label}</div>
                        <div className={`text-xl font-bold ${s.color} leading-none mt-0.5`}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto thin-scrollbar mx-4 mb-4 bg-white rounded-lg border border-gray-200">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <GraduationIcon size={36} className="mb-3 opacity-20" />
                        <p className="text-[13px] mb-2">検定データがありません</p>
                        {canEdit && (
                            <button onClick={() => setShowCreate(true)} className="text-[12px] text-blue-600 hover:underline flex items-center gap-1">
                                <Plus size={12} /> 新規登録する
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ── Mobile card view ────────────────────────────────────── */}
                        <div className="md:hidden space-y-2 p-3">
                            {paginated.map((w) => {
                                const ks = w.kentei_status || {}
                                const gakka = getEffectiveResult(ks.gakka_result, ks.exam_result_written)
                                const jitsugi = getEffectiveResult(ks.jitsugi_result, ks.exam_result_practical)
                                const progressCfg = PROGRESS_CONFIG[ks.progress || '未着手'] || PROGRESS_CONFIG['未着手']
                                const companyName = (w.companies as any)?.name_jp || ''
                                const hasUpcomingExam = (ks.exam_date_written && ks.exam_date_written > today) ||
                                    (ks.exam_date_practical && ks.exam_date_practical > today)
                                return (
                                    <div key={w.id}
                                        className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-3"
                                        style={{
                                            boxShadow: 'var(--shadow-sm)',
                                            borderLeft: gakka === '合格' && jitsugi === '合格'
                                                ? '3px solid var(--color-success)'
                                                : gakka === '不合格' || jitsugi === '不合格'
                                                ? '3px solid var(--color-danger)'
                                                : !ks.witness && hasUpcomingExam ? '3px solid var(--color-warning)'
                                                : undefined
                                        }}>
                                        {/* Name + progress */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--brand-primary-light)] flex items-center justify-center text-[10px] font-bold text-[var(--brand-primary)]">
                                                    {(w.full_name_romaji || '?').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium leading-tight text-[var(--color-text-primary)]">
                                                        {getFlag(w.nationality)} {w.full_name_romaji || '---'}
                                                    </div>
                                                    <div className="text-xs text-[var(--color-text-muted)]">{companyName}</div>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${progressCfg.cls}`}>
                                                {ks.progress || '未着手'}
                                            </span>
                                        </div>
                                        {/* Info grid */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2 text-xs text-[var(--color-text-muted)]">
                                            <div>学科日: {ks.exam_date_written ? ks.exam_date_written.replace(/-/g, '/') : '---'}</div>
                                            <div>実技日: {ks.exam_date_practical ? ks.exam_date_practical.replace(/-/g, '/') : '---'}</div>
                                            <div className={gakka === '合格' ? 'text-[var(--color-success)] font-medium' : gakka === '不合格' ? 'text-[var(--color-danger)] font-medium' : ''}>
                                                学科: {gakka}
                                            </div>
                                            <div className={jitsugi === '合格' ? 'text-[var(--color-success)] font-medium' : jitsugi === '不合格' ? 'text-[var(--color-danger)] font-medium' : ''}>
                                                実技: {jitsugi}
                                            </div>
                                            <div className={!ks.witness && hasUpcomingExam ? 'text-[var(--color-warning)] font-medium' : ''}>
                                                立会: {ks.witness || '未定'}
                                            </div>
                                            <div>種別: {ks.type || '---'}</div>
                                        </div>
                                        {/* Actions */}
                                        {canEdit && (
                                            <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
                                                <button onClick={() => setEditTarget(w)}
                                                    className="flex-1 h-7 text-xs border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors">
                                                    編集
                                                </button>
                                                <button onClick={() => setConfirmDeleteId(w.id)}
                                                    className="h-7 px-3 text-xs rounded-[var(--radius-sm)] border border-[var(--color-danger-light)] text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors">
                                                    削除
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        {/* ── Desktop table ────────────────────────────────────────── */}
                        <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {['試験日', '試験種別', '労働者', '企業', '試験会場', '立会者', '学科結果', '実技結果', '進捗', '操作'].map(h => (
                                    <th key={h} className="px-3.5 py-2.5 text-[11px] font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((w, idx) => {
                                const ks = w.kentei_status || {}
                                const gakka = getEffectiveResult(ks.gakka_result, ks.exam_result_written)
                                const jitsugi = getEffectiveResult(ks.jitsugi_result, ks.exam_result_practical)
                                const typeCfg = EXAM_TYPE_CONFIG[ks.type || ''] || { cls: 'bg-gray-100 text-gray-600 border-gray-200' }
                                const progressCfg = PROGRESS_CONFIG[ks.progress || '未着手'] || PROGRESS_CONFIG['未着手']
                                const flag = getFlag(w.nationality)
                                const hasUpcomingExam = (ks.exam_date_written && ks.exam_date_written > today) ||
                                    (ks.exam_date_practical && ks.exam_date_practical > today)
                                const isExamPast = (ks.exam_date_written && ks.exam_date_written <= today) ||
                                    (ks.exam_date_practical && ks.exam_date_practical <= today)
                                const resultsMissing = isExamPast && gakka === '未受験' && jitsugi === '未受験'

                                let rowBorderCls = ''
                                if (gakka === '合格' && jitsugi === '合格') rowBorderCls = 'border-l-4 border-l-emerald-400'
                                else if (gakka === '不合格' || jitsugi === '不合格') rowBorderCls = 'border-l-4 border-l-red-400'
                                else if (!ks.witness && hasUpcomingExam) rowBorderCls = 'border-l-4 border-l-amber-400'

                                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'
                                const isFading = fadingIds.has(w.id)
                                const isConfirming = confirmDeleteId === w.id

                                return (
                                    <tr key={w.id}
                                        className={`${rowBg} ${rowBorderCls} hover:bg-blue-50/30 border-b border-gray-100 last:border-0`}
                                        style={{ opacity: isFading ? 0 : 1, transition: 'opacity 0.3s ease' }}>

                                        {/* 試験日 */}
                                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                                            <div className="space-y-0.5">
                                                {ks.exam_date_written && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[9px] text-gray-400 w-5">学科</span>
                                                        <span className="text-[12px] font-semibold text-gray-800 font-mono">{ks.exam_date_written.replace(/-/g, '/')}</span>
                                                    </div>
                                                )}
                                                {ks.exam_date_practical && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[9px] text-gray-400 w-5">実技</span>
                                                        <span className="text-[12px] font-semibold text-gray-800 font-mono">{ks.exam_date_practical.replace(/-/g, '/')}</span>
                                                    </div>
                                                )}
                                                {resultsMissing && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 inline-block mt-0.5">結果未入力</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* 試験種別 */}
                                        <td className="px-3.5 py-2.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${typeCfg.cls}`}>{ks.type}</span>
                                        </td>

                                        {/* 労働者 */}
                                        <td className="px-3.5 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-blue-50 text-[var(--brand-primary)] text-[10px] font-bold flex items-center justify-center shrink-0">
                                                    {(w.full_name_romaji || '?').charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-[12px] font-normal text-gray-800 whitespace-nowrap">
                                                        {flag && <span className="mr-1">{flag}</span>}
                                                        {w.full_name_romaji || '---'}
                                                    </div>
                                                    {w.full_name_kana && <div className="text-[10px] text-gray-400">{w.full_name_kana}</div>}
                                                </div>
                                            </div>
                                        </td>

                                        {/* 企業 */}
                                        <td className="px-3.5 py-2.5 text-[12px] text-gray-500 max-w-[130px] truncate whitespace-nowrap">
                                            {(w.companies as any)?.name_jp || '---'}
                                        </td>

                                        {/* 試験会場 */}
                                        <td className="px-3.5 py-2.5 max-w-[130px]">
                                            <div className="text-[11px] text-gray-600 truncate">{ks.institution || '---'}</div>
                                            {ks.location && <div className="text-[10px] text-gray-400 truncate">{ks.location}</div>}
                                        </td>

                                        {/* 立会者 — inline edit */}
                                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                                            {inlineTachiaiId === w.id ? (
                                                <input autoFocus value={inlineTachiaiValue}
                                                    onChange={e => setInlineTachiaiValue(e.target.value)}
                                                    onBlur={() => handleInlineSaveTachiai(w.id)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleInlineSaveTachiai(w.id)
                                                        if (e.key === 'Escape') setInlineTachiaiId(null)
                                                    }}
                                                    list="inline-staff-list"
                                                    className="w-[90px] px-2 py-1 border border-[var(--brand-primary)] rounded text-[12px] outline-none bg-white" />
                                            ) : (
                                                <div onClick={() => canEdit && (setInlineTachiaiId(w.id), setInlineTachiaiValue(ks.witness || ''))}
                                                    className={canEdit ? 'cursor-pointer hover:bg-blue-50 rounded px-1 -mx-1 transition-colors' : ''}>
                                                    {ks.witness ? (
                                                        <div className="flex items-center gap-1 text-[12px] text-gray-600">
                                                            <User size={11} className="text-gray-400 shrink-0" />{ks.witness}
                                                        </div>
                                                    ) : hasUpcomingExam ? (
                                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">未定</span>
                                                    ) : (
                                                        <span className="text-[12px] text-gray-300">---</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* 学科結果 — inline dropdown */}
                                        <td className="px-3.5 py-2.5">
                                            <div className="relative inline-block">
                                                <div onClick={() => canEdit && setInlineResultEdit(
                                                    inlineResultEdit?.id === w.id && inlineResultEdit?.field === 'gakka' ? null : { id: w.id, field: 'gakka' }
                                                )} className={canEdit ? 'cursor-pointer' : ''}>
                                                    <ResultBadge value={gakka} />
                                                </div>
                                                {inlineResultEdit?.id === w.id && inlineResultEdit?.field === 'gakka' && (
                                                    <InlineResultDropdown value={gakka}
                                                        onChange={v => handleInlineSaveResult(w.id, 'gakka', v)}
                                                        onClose={() => setInlineResultEdit(null)} />
                                                )}
                                            </div>
                                        </td>

                                        {/* 実技結果 — inline dropdown */}
                                        <td className="px-3.5 py-2.5">
                                            <div className="relative inline-block">
                                                <div onClick={() => canEdit && setInlineResultEdit(
                                                    inlineResultEdit?.id === w.id && inlineResultEdit?.field === 'jitsugi' ? null : { id: w.id, field: 'jitsugi' }
                                                )} className={canEdit ? 'cursor-pointer' : ''}>
                                                    <ResultBadge value={jitsugi} />
                                                </div>
                                                {inlineResultEdit?.id === w.id && inlineResultEdit?.field === 'jitsugi' && (
                                                    <InlineResultDropdown value={jitsugi}
                                                        onChange={v => handleInlineSaveResult(w.id, 'jitsugi', v)}
                                                        onClose={() => setInlineResultEdit(null)} />
                                                )}
                                            </div>
                                        </td>

                                        {/* 進捗 */}
                                        <td className="px-3.5 py-2.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${progressCfg.cls}`}>
                                                {ks.progress || '未着手'}
                                            </span>
                                        </td>

                                        {/* 操作 */}
                                        <td className="px-3.5 py-2.5">
                                            {isConfirming ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[11px] text-gray-600 whitespace-nowrap">削除しますか？</span>
                                                    <button onClick={() => setConfirmDeleteId(null)}
                                                        className="h-6 px-2 text-[11px] border border-gray-200 rounded text-gray-500 hover:bg-gray-50 transition-colors">
                                                        キャンセル
                                                    </button>
                                                    <button onClick={() => handleDelete(w.id)}
                                                        className="h-6 px-2 text-[11px] border border-red-200 rounded text-red-600 bg-red-50 hover:bg-red-100 transition-colors whitespace-nowrap">
                                                        削除する
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    {canEdit && (
                                                        <button onClick={() => setEditTarget(w)}
                                                            className="h-6 px-2 text-[11px] border border-gray-200 rounded text-gray-500 hover:bg-gray-50 flex items-center gap-1 transition-colors">
                                                            <Edit2 size={10} />編集
                                                        </button>
                                                    )}
                                                    {canEdit && resultsMissing && (
                                                        <button onClick={() => setEditTarget(w)}
                                                            className="h-6 px-2 text-[11px] border border-amber-200 rounded text-amber-600 bg-amber-50 hover:bg-amber-100 flex items-center gap-1 transition-colors whitespace-nowrap">
                                                            結果入力
                                                        </button>
                                                    )}
                                                    {canEdit && (
                                                        <button onClick={() => setConfirmDeleteId(w.id)}
                                                            className="h-6 px-2 text-[11px] border border-red-100 rounded text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center gap-1 transition-colors">
                                                            <Trash2 size={10} />削除
                                                        </button>
                                                    )}
                                                </div>
                                            )}
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

            {/* Drawers */}
            {editTarget && (
                <KenteiDrawer mode="edit" worker={editTarget} staffList={staffList}
                    onClose={() => setEditTarget(null)} onSuccess={handleSuccess} onError={handleError} />
            )}
            {showCreate && (
                <KenteiDrawer mode="create" allWorkers={allWorkers} existingWorkerIds={existingWorkerIds}
                    staffList={staffList} onClose={() => setShowCreate(false)} onSuccess={handleSuccess} onError={handleError} />
            )}

            <datalist id="inline-staff-list">
                {staffList.map(s => <option key={s.id} value={s.name} />)}
            </datalist>

            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    )
}
