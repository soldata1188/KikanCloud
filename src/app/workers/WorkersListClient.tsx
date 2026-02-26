'use client'

import React, { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import {
    Search, Clock, Briefcase, AlertTriangle, ChevronLeft, ChevronRight,
    Sparkles, Building2, Landmark, Calendar, ExternalLink, User,
    CheckCircle2, Circle
} from 'lucide-react'
import { bulkDeleteWorkers } from '@/app/actions/operations'
import { updateWorkerStatus } from '@/app/operations/actions'
import { ImportModal } from './ImportModal'
import { BulkEditModal } from './BulkEditModal'
import { DataTableToolbar } from '@/components/DataTableToolbar'

// ── Tab Config — Matching Companies Style ────────────────────────────
const TAB_CONFIG: Record<string, {
    label: string; icon: React.ReactNode
    tabActiveBg: string; tabActiveText: string; tabActiveBorder: string
    tabBg: string; tabText: string; tabBorder: string
    badgeBg: string; badgeText: string
}> = {
    waiting: {
        label: '未入国',
        icon: <Clock size={13} />,
        tabActiveBg: 'bg-amber-500', tabActiveText: 'text-white', tabActiveBorder: 'border-amber-500',
        tabBg: 'bg-white', tabText: 'text-amber-600', tabBorder: 'border-amber-200',
        badgeBg: 'bg-amber-50', badgeText: 'text-amber-600'
    },
    active: {
        label: '就業中・対応中',
        icon: <CheckCircle2 size={13} />,
        tabActiveBg: 'bg-emerald-500', tabActiveText: 'text-white', tabActiveBorder: 'border-emerald-500',
        tabBg: 'bg-white', tabText: 'text-emerald-600', tabBorder: 'border-emerald-200',
        badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600'
    },
    closed: {
        label: '失踪・帰国・転籍済',
        icon: <AlertTriangle size={13} />,
        tabActiveBg: 'bg-rose-500', tabActiveText: 'text-white', tabActiveBorder: 'border-rose-500',
        tabBg: 'bg-white', tabText: 'text-rose-600', tabBorder: 'border-rose-200',
        badgeBg: 'bg-rose-50', badgeText: 'text-rose-600'
    },
}
const TAB_KEYS = ['active', 'waiting', 'closed']

const reverseStatusMap: Record<string, string> = {
    'waiting': '未入国', 'standby': '対応中', 'working': '就業中', 'missing': '失踪', 'returned': '帰国'
}

const PAGE_SIZE = 25

export default function WorkersListClient({ initialWorkers, role, next90DaysStr }: { initialWorkers: any[], role: string, next90DaysStr: string }) {
    const [workers, setWorkers] = useState(initialWorkers)
    const [filtered, setFiltered] = useState(initialWorkers)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isPending, startTransition] = useTransition()
    const [activeTab, setActiveTab] = useState('active')
    const [layout, setLayout] = useState<'list' | 'grid'>('list')

    // Mobile layout optimization: Default to 'grid' on small screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setLayout('grid');
            }
        };
        handleResize(); // Check on mount
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [searchTerm, setSearchTerm] = useState('')
    const [filterCompany, setFilterCompany] = useState('all')
    const [filterIndustry, setFilterIndustry] = useState('all')
    const [filterVisaStatus, setFilterVisaStatus] = useState('all')
    const [filterNationality, setFilterNationality] = useState('all')
    const [filterEntryBatch, setFilterEntryBatch] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)

    // Derived filter lists
    const companiesList = Array.from(new Set(workers.map(w => w.companies?.name_jp).filter(Boolean))) as string[]
    const industryList = Array.from(new Set(workers.map(w => (w as any).industry_field).filter(Boolean))) as string[]
    const visaStatusList = Array.from(new Set(workers.map(w => (w as any).visa_status).filter(Boolean))) as string[]
    const nationalityList = Array.from(new Set(workers.map(w => (w as any).nationality).filter(Boolean))) as string[]
    const entryBatchList = Array.from(new Set(workers.map(w => (w as any).entry_batch).filter(Boolean))) as string[]

    useEffect(() => { setWorkers(initialWorkers); }, [initialWorkers])

    useEffect(() => {
        let result = workers
        const statuses = activeTab === 'active' ? ['working', 'standby'] : (activeTab === 'waiting' ? ['waiting'] : ['missing', 'returned', 'transferred'])
        result = result.filter(w => statuses.includes(w.status || ''))

        if (searchTerm) {
            const lower = searchTerm.toLowerCase()
            result = result.filter(w =>
                w.full_name_romaji?.toLowerCase().includes(lower) ||
                w.companies?.name_jp?.toLowerCase().includes(lower) ||
                w.nationality?.toLowerCase().includes(lower) ||
                (w as any).entry_date?.includes(searchTerm)
            )
        }

        if (filterCompany !== 'all') {
            result = result.filter(w => w.companies?.name_jp === filterCompany)
        }

        if (filterIndustry !== 'all') {
            result = result.filter(w => (w as any).industry_field === filterIndustry)
        }

        if (filterVisaStatus !== 'all') {
            result = result.filter(w => (w as any).visa_status === filterVisaStatus)
        }

        if (filterNationality !== 'all') {
            result = result.filter(w => (w as any).nationality === filterNationality)
        }

        if (filterEntryBatch !== 'all') {
            result = result.filter(w => (w as any).entry_batch === filterEntryBatch)
        }

        // Sort by entry_date DESC (Latest first)
        result.sort((a, b) => {
            const dateA = (a.entry_date || '0000-00-00')
            const dateB = (b.entry_date || '0000-00-00')
            return dateB.localeCompare(dateA)
        })

        setFiltered(result)
        setSelectedIds([])
        setCurrentPage(1)
    }, [searchTerm, filterCompany, filterIndustry, filterVisaStatus, filterNationality, filterEntryBatch, activeTab, workers])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    const handleChange = async (id: string, field: string, value: string) => {
        setWorkers(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w))
        try { await updateWorkerStatus(id, field, value) } catch { alert("更新エラー") }
    }

    const handleBulkDelete = () => {
        if (!confirm(`${selectedIds.length}件のデータを削除しますか？`)) return
        startTransition(async () => {
            await bulkDeleteWorkers(selectedIds)
            setSelectedIds([])
        })
    }

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id))
        else setSelectedIds([...selectedIds, id])
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === paginated.length) setSelectedIds([])
        else setSelectedIds(paginated.map(w => w.id))
    }

    const countByTab = (key: string) => {
        const statuses = key === 'active' ? ['working', 'standby'] : (key === 'waiting' ? ['waiting'] : ['missing', 'returned', 'transferred'])
        return workers.filter(w => statuses.includes(w.status || '')).length
    }

    const Pagination = () => totalPages > 1 ? (
        <div className="flex justify-center items-center gap-2 mt-8 pb-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
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
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronRight size={16} />
            </button>
        </div>
    ) : null

    const advancedFilters = (
        <div className="flex items-center gap-2">
            <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-2 text-[13px] outline-none focus:border-emerald-500 transition-colors text-slate-700 cursor-pointer truncate"
            >
                <option value="all">企業 (すべて)</option>
                {companiesList.sort().map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-2 text-[13px] font-bold outline-none focus:border-emerald-500 transition-colors text-slate-700 cursor-pointer truncate"
            >
                <option value="all">職種 (すべて)</option>
                {industryList.sort().map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <select
                value={filterVisaStatus}
                onChange={(e) => setFilterVisaStatus(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-2 text-[13px] font-bold outline-none focus:border-emerald-500 transition-colors text-slate-700 cursor-pointer truncate"
            >
                <option value="all">在留資格 (すべて)</option>
                {visaStatusList.sort().map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select
                value={filterNationality}
                onChange={(e) => setFilterNationality(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-2 text-[13px] font-bold outline-none focus:border-emerald-500 transition-colors text-slate-700 cursor-pointer truncate"
            >
                <option value="all">国籍 (すべて)</option>
                {nationalityList.sort().map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select
                value={filterEntryBatch}
                onChange={(e) => setFilterEntryBatch(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-2 text-[13px] font-bold outline-none focus:border-emerald-500 transition-colors text-slate-700 cursor-pointer truncate"
            >
                <option value="all">入国期生 (すべて)</option>
                {entryBatchList.sort((a, b) => b.localeCompare(a, undefined, { numeric: true })).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            {(filterCompany !== 'all' || filterIndustry !== 'all' || filterVisaStatus !== 'all' || filterNationality !== 'all' || filterEntryBatch !== 'all') && (
                <button
                    onClick={() => {
                        setFilterCompany('all');
                        setFilterIndustry('all');
                        setFilterVisaStatus('all');
                        setFilterNationality('all');
                        setFilterEntryBatch('all');
                    }}
                    className="text-[12px] text-emerald-600 hover:text-emerald-700 font-bold ml-1 transition-colors">
                    クリア
                </button>
            )}
        </div>
    )

    return (
        <div className="flex flex-col gap-5 bg-white min-h-screen">
            {/* Tab Bar — Matches Companies Design */}
            <div className="flex flex-wrap items-center gap-2 px-4 md:px-6 pt-2">
                {TAB_KEYS.map(key => {
                    const cfg = TAB_CONFIG[key]
                    const count = countByTab(key)
                    const isActive = activeTab === key
                    return (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[14px] font-bold transition-all duration-200 select-none
                                ${isActive ? `${cfg.tabActiveBg} ${cfg.tabActiveText} ${cfg.tabActiveBorder} shadow-md -translate-y-0.5` : `${cfg.tabBg} ${cfg.tabText} ${cfg.tabBorder} hover:bg-slate-50 hover:-translate-y-0.5`}`}
                        >
                            <span className="flex items-center gap-1.5">{cfg.icon}{cfg.label}</span>
                            <span className={`text-[12px] font-bold min-w-[20px] h-5 inline-flex items-center justify-center px-1.5 rounded-full ${isActive ? 'bg-white/20 text-white' : `${cfg.badgeBg} ${cfg.badgeText}`}`}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            <div className="px-4 md:px-6">
                <DataTableToolbar
                    data={filtered} filename="外国人材リスト" searchPlaceholder="氏名、企業名で検索..."
                    onSearch={(term) => setSearchTerm(term)} type="workers" role={role}
                    addLink="/workers/new"
                    importNode={(role === 'admin' || role === 'staff') && (
                        <div className="flex items-center gap-2">
                            <ImportModal />
                        </div>
                    )}
                    filterNode={advancedFilters}
                    layout={layout} onLayoutChange={setLayout}
                />
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="mx-4 md:mx-6 px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-4">
                        <span className="text-[12px] font-black text-emerald-400">{selectedIds.length} 名選択中</span>
                        <div className="w-px h-3 bg-slate-600" />
                        <button onClick={() => setIsBulkEditModalOpen(true)} className="text-[11px] font-black hover:text-emerald-400 transition-colors uppercase tracking-wider">一括編集</button>
                        <button onClick={handleBulkDelete} className="text-[11px] font-black text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-wider">削除</button>
                    </div>
                    <button onClick={() => setSelectedIds([])} className="text-[10px] font-black text-slate-400 hover:text-white uppercase px-2">解除</button>
                </div>
            )}

            <div className="px-4 md:px-6 pb-20">
                {layout === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginated.map((worker, index) => (
                            <div key={worker.id} className="group relative bg-white border border-slate-200 hover:border-[#24b47e] rounded-[24px] p-5 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md">
                                <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-300">#{(currentPage - 1) * PAGE_SIZE + index + 1}</div>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                                        {worker.avatar_url ? (
                                            <img src={worker.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={24} className="text-slate-300" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <Link href={`/workers/${worker.id}`} className="font-bold text-slate-800 hover:text-[#24b47e] transition-colors truncate block text-[15px]">{worker.full_name_romaji}</Link>
                                        <div className="text-[11px] text-indigo-600 font-extrabold truncate mt-0.5">{worker.companies?.name_jp || '未所属'}</div>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4 text-[11px]">
                                    <div className="flex justify-between"><span className="text-slate-400 font-bold">国籍</span><span className="font-medium text-slate-700">{worker.nationality || '---'}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400 font-bold">在留資格</span><span className="font-medium text-slate-700 truncate max-w-[120px]">{worker.visa_status || '---'}</span></div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 font-bold">職種区分</span>
                                        <span className="font-bold text-slate-700">{worker.industry_field || '---'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 font-bold">送出機関</span>
                                        <span className="font-bold text-slate-700">{worker.sending_org || '---'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 font-bold">旅券/保険期限</span>
                                        <div className="flex flex-col items-end">
                                            <span className="font-mono font-bold text-slate-700">{(worker.passport_exp || '---').replace(/-/g, '/')}</span>
                                            <span className="font-mono text-[9px] text-slate-400 font-bold">{(worker.insurance_exp || '---').replace(/-/g, '/')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <select
                                        value={worker.status}
                                        onChange={e => handleChange(worker.id, 'status', e.target.value)}
                                        className="text-[10px] font-black px-2 py-1 rounded-lg border-none bg-slate-100/50 text-slate-600 hover:bg-slate-100 transition-colors outline-none cursor-pointer">
                                        {Object.entries(reverseStatusMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                    <Link href={`/workers/${worker.id}`} className="text-xs font-bold text-[#24b47e] hover:underline px-2 py-1">詳細</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full border-collapse text-sm text-left">
                            <thead>
                                <tr className="bg-slate-800 shadow-sm border-b border-slate-700">
                                    <th className="px-4 py-3.5 w-[50px] text-center"><input type="checkbox" checked={selectedIds.length === paginated.length && paginated.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-600 accent-emerald-500" /></th>
                                    <th className="px-4 py-3.5 font-bold text-[13px] uppercase tracking-wider text-slate-200 min-w-[50px] text-center">No.</th>
                                    <th className="px-4 py-3.5 font-bold text-[13px] uppercase tracking-wider text-slate-200 min-w-[180px]">人材名 / 会社</th>
                                    <th className="px-4 py-3.5 font-bold text-[13px] uppercase tracking-wider text-slate-200 min-w-[160px]">フリガナ / 送出機関</th>
                                    <th className="px-4 py-3.5 font-bold text-[13px] uppercase tracking-wider text-slate-200 min-w-[120px] text-center">国籍 / 生年月日</th>
                                    <th className="px-4 py-3.5 font-bold text-[13px] uppercase tracking-wider text-slate-200 min-w-[180px]">在留資格 / 職種区分</th>
                                    <th className="px-4 py-3.5 font-bold text-[13px] uppercase tracking-wider text-slate-200 min-w-[140px]">在留期限</th>
                                    <th className="px-4 py-3.5 font-bold text-[13px] uppercase tracking-wider text-slate-200 min-w-[140px]">旅券 / 保険期限</th>
                                    <th className="px-4 py-3.5 font-bold text-[13px] uppercase tracking-wider text-slate-200 min-w-[100px] text-center">状態</th>
                                    <th className="px-4 py-3.5 w-[40px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {paginated.length === 0 && (
                                    <tr><td colSpan={10} className="px-5 py-20 text-center text-slate-400 font-medium">データがありません。</td></tr>
                                )}
                                {paginated.map((worker, index) => {
                                    const absIndex = (currentPage - 1) * PAGE_SIZE + index + 1
                                    return (
                                        <tr key={worker.id} className={`transition-all duration-150 ${index % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-slate-50/80'}`}>
                                            <td className="px-4 py-3.5 text-center"><input type="checkbox" checked={selectedIds.includes(worker.id)} onChange={() => toggleSelect(worker.id)} className="w-4 h-4 rounded border-slate-300 accent-slate-800" /></td>
                                            <td className="px-4 py-3.5 text-center font-mono text-slate-400 text-xs font-bold">{absIndex}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 shrink-0 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                                                        {worker.avatar_url ? <img src={worker.avatar_url} className="w-full h-full object-cover" /> : <User size={16} className="text-slate-400" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <Link href={`/workers/${worker.id}`} className="font-bold text-[17px] text-slate-800 hover:text-[#24b47e] transition-colors block">{worker.full_name_romaji}</Link>
                                                        <div className="text-[12px] text-indigo-600 font-extrabold mt-0.5">{worker.companies?.name_jp || '未所属'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="text-[13px] font-bold text-slate-400">{worker.full_name_kana || '---'}</div>
                                                <div className="text-[14px] font-black text-slate-800 mt-0.5">{worker.sending_org || '---'}</div>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="text-[14px] font-bold text-slate-700">{worker.nationality || '---'}</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">{(worker.dob || '---').replace(/-/g, '/')}</div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="text-[12px] font-bold text-slate-800">{worker.visa_status || '---'}</div>
                                                <div className="mt-1">
                                                    <span className="text-[10px] font-black text-slate-700">{worker.industry_field || '---'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={13} className={worker.zairyu_exp && worker.zairyu_exp <= next90DaysStr ? 'text-rose-500' : 'text-slate-300'} />
                                                    <div className="flex flex-col">
                                                        <span className={`text-[13px] font-black leading-tight ${worker.zairyu_exp && worker.zairyu_exp <= next90DaysStr ? 'text-rose-600' : 'text-slate-700'}`}>
                                                            {(worker.zairyu_exp || '---').replace(/-/g, '/')}
                                                        </span>
                                                        {worker.entry_date && (
                                                            <span className="text-[10px] text-slate-400 font-bold mt-0.5 whitespace-nowrap">入国: {worker.entry_date.replace(/-/g, '/')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-black text-slate-700 leading-tight">{(worker.passport_exp || '---').replace(/-/g, '/')}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold mt-0.5 whitespace-nowrap">保険: {(worker.insurance_exp || '---').replace(/-/g, '/')}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <select
                                                    value={worker.status}
                                                    onChange={e => handleChange(worker.id, 'status', e.target.value)}
                                                    className="appearance-none text-[10px] px-2.5 py-1 rounded-lg font-black bg-slate-100/50 text-slate-600 hover:bg-slate-100 transition-colors w-[80px] text-center cursor-pointer outline-none">
                                                    {Object.entries(reverseStatusMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <Link href={`/workers/${worker.id}`} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all block">
                                                    <ExternalLink size={16} />
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination />
            </div>

            {isBulkEditModalOpen && (
                <BulkEditModal
                    selectedIds={selectedIds}
                    onClose={() => setIsBulkEditModalOpen(false)}
                    onSuccess={() => { setIsBulkEditModalOpen(false); setSelectedIds([]) }}
                    companies={[]}
                />
            )}
        </div>
    )
}
