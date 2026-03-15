'use client'

import React, { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Plus, Search, X, Save, Clock,
    CheckCircle2, CalendarCheck, CalendarPlus, RefreshCw,
} from 'lucide-react'
import AuditTypeBadge, { AUDIT_TYPE_CONFIG } from '../AuditTypeBadge'
import { createAuditInline } from '../actions'

interface Audit {
    id: string
    audit_type: string
    company_id: string
    company_name: string
    scheduled_date: string | null
    actual_date: string | null
    status: string
    pic_name: string | null
    notes: string | null
}

interface Props {
    audits: Audit[]
    companies: { id: string; name_jp: string }[]
    staffList: { id: string; name: string }[]
    defaultPicName: string
    userRole: string
}

const TYPE_KEYS = ['homon', 'kansa', 'rinji'] as const
const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    completed: { label: '完了', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    planned:   { label: '予定', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
}

function AddModal({ companies, staffList, defaultPicName, onClose, onSuccess }: {
    companies: Props['companies']
    staffList: Props['staffList']
    defaultPicName: string
    onClose: () => void
    onSuccess: () => void
}) {
    const [status, setStatus] = useState<'planned' | 'completed'>('completed')
    const [isPending, startTransition] = useTransition()

    const today = new Date().toISOString().split('T')[0]

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        startTransition(async () => {
            const result = await createAuditInline(new FormData(e.currentTarget))
            if (!result?.error) onSuccess()
        })
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden border border-gray-200 shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <CalendarPlus size={18} className="text-blue-600" />
                        <h3 className="font-normal text-gray-900 text-[15px] tracking-tight">新規スケジュールの追加</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* ステータス */}
                    <div className="grid grid-cols-2 gap-2">
                        {(['planned', 'completed'] as const).map(s => (
                            <button key={s} type="button" onClick={() => setStatus(s)}
                                className={`px-4 py-2.5 rounded-lg border-2 flex items-center gap-2.5 transition-all ${status === s
                                    ? s === 'completed' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                                {s === 'planned' ? <CalendarCheck size={15} /> : <CheckCircle2 size={15} />}
                                <span className="text-[13px] font-normal">{s === 'planned' ? '予定' : '完了（実績）'}</span>
                            </button>
                        ))}
                    </div>
                    <input type="hidden" name="status" value={status} />

                    {/* 対象企業 */}
                    <div>
                        <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5 pl-1">対象企業 *</label>
                        <select name="company_id" required
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none text-[13px] font-normal focus:border-[#0067b8] appearance-none">
                            <option value="">企業を選択してください</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                        </select>
                    </div>

                    {/* 種別 & 担当者 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5 pl-1">種別 *</label>
                            <select name="audit_type" required defaultValue="homon"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none text-[13px] font-normal focus:border-[#0067b8] appearance-none">
                                {TYPE_KEYS.map(k => (
                                    <option key={k} value={k}>{AUDIT_TYPE_CONFIG[k].label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5 pl-1">担当者</label>
                            <select name="pic_name" defaultValue={defaultPicName}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none text-[13px] font-normal focus:border-[#0067b8] appearance-none">
                                <option value="">— 選択 —</option>
                                {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* 日付 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5 pl-1">予定日 *</label>
                            <input name="scheduled_date" type="date" required defaultValue={today}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none text-[13px] font-normal focus:border-[#0067b8]" />
                        </div>
                        {status === 'completed' && (
                            <div>
                                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-1.5 pl-1">実施日</label>
                                <input name="actual_date" type="date" defaultValue={today}
                                    className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 outline-none text-[13px] font-normal focus:border-emerald-500" />
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 text-[13px] font-normal text-gray-500 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                            キャンセル
                        </button>
                        <button type="submit" disabled={isPending}
                            className="flex-[2] py-2.5 bg-blue-600 text-white rounded-lg text-[13px] font-normal flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 disabled:opacity-40 transition-all">
                            {isPending ? <Clock size={15} className="animate-spin" /> : <Save size={15} />}
                            {isPending ? '保存中...' : '記録を保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function HistoryClient({ audits, companies, staffList, defaultPicName, userRole }: Props) {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [showAddModal, setShowAddModal] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return audits.filter(a => {
            if (typeFilter !== 'all' && a.audit_type !== typeFilter) return false
            if (q && !a.company_name.toLowerCase().includes(q) && !(a.pic_name || '').toLowerCase().includes(q)) return false
            return true
        })
    }, [audits, search, typeFilter])

    const handleRefresh = () => {
        setIsRefreshing(true)
        router.refresh()
        setTimeout(() => setIsRefreshing(false), 800)
    }

    const handleSuccess = () => {
        setShowAddModal(false)
        router.refresh()
    }

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
            {/* Header */}
            <div className="h-[44px] bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <Link href="/audits"
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
                        <ArrowLeft size={16} />
                    </Link>
                    <div className="w-px h-4 bg-gray-200" />
                    <h2 className="text-[14px] font-normal text-gray-900 tracking-tight">
                        監査<span className="text-blue-700">・</span>訪問 履歴管理
                    </h2>
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {filtered.length}件
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative w-[180px] group">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="企業名・担当者" value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-7 pl-7 pr-6 bg-gray-50 border border-gray-200 rounded-md text-xs outline-none focus:border-blue-500 focus:bg-white transition-all" />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                                <X size={11} />
                            </button>
                        )}
                    </div>

                    <button onClick={handleRefresh}
                        className={`p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : 'hover:text-blue-600 hover:bg-white'}`}>
                        <RefreshCw size={14} />
                    </button>

                    {(userRole === 'admin' || userRole === 'staff') && (
                        <button onClick={() => setShowAddModal(true)}
                            className="h-7 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[12px] font-normal flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-blue-100">
                            <Plus size={13} />新規スケジュール追加
                        </button>
                    )}
                </div>
            </div>

            {/* Type filter bar */}
            <div className="h-[40px] bg-white border-b border-gray-200 flex items-center px-4 gap-1 shrink-0">
                {[{ key: 'all', label: 'すべて' }, ...TYPE_KEYS.map(k => ({ key: k, label: AUDIT_TYPE_CONFIG[k].label }))].map(item => (
                    <button key={item.key} onClick={() => setTypeFilter(item.key)}
                        className={`h-[26px] px-3 rounded-full text-[12px] font-normal transition-all ${typeFilter === item.key
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {item.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto thin-scrollbar">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <CalendarCheck size={28} className="mb-2 opacity-30" />
                        <p className="text-[12px]">該当する記録がありません</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                                {['日付', '企業名', '種別', '担当者', 'ステータス', '備考'].map(h => (
                                    <th key={h} className="px-4 py-2.5 text-[10px] font-normal text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(a => {
                                const dateStr = a.actual_date || a.scheduled_date
                                const statusCfg = STATUS_LABEL[a.status] || { label: a.status, cls: 'bg-gray-100 text-gray-500 border-gray-200' }
                                return (
                                    <tr key={a.id} className="hover:bg-blue-50/20 transition-colors">
                                        <td className="px-4 py-2.5 text-[12px] text-gray-600 font-mono whitespace-nowrap">
                                            {dateStr?.replace(/-/g, '/') || '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-[13px] font-normal text-gray-900 max-w-[220px] truncate">
                                            {a.company_name}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <AuditTypeBadge type={a.audit_type} />
                                        </td>
                                        <td className="px-4 py-2.5 text-[12px] text-gray-600 whitespace-nowrap">
                                            {a.pic_name || '—'}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-normal border ${statusCfg.cls}`}>
                                                {statusCfg.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[12px] text-gray-400 max-w-[200px] truncate">
                                            {a.notes || '—'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <AddModal
                    companies={companies}
                    staffList={staffList}
                    defaultPicName={defaultPicName}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
}
