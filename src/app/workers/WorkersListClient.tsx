'use client'

import React, { useState, useTransition, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
    Search, Clock, Briefcase, AlertTriangle, ChevronLeft, ChevronRight,
    Sparkles, Building2, Landmark, Calendar, ExternalLink, User, Users,
    CheckCircle2, Circle, Plus, X, SlidersHorizontal, LayoutGrid, List,
    ArrowLeft, RefreshCw
} from 'lucide-react'
import { bulkDeleteWorkers } from '@/app/actions/operations'
import { updateWorkerStatus } from '@/app/operations/actions'
import { BulkEditModal } from './BulkEditModal'
import { BulkImportModal } from './BulkImportModal'
import CompanyColumn from '../operations/CompanyColumn';
import WorkerListColumn from './WorkerListColumn';
import ProfileDetailColumn from './ProfileDetailColumn';
import EntryBatchColumn from './EntryBatchColumn';
import DocumentsColumn from './DocumentsColumn';

// ── Tab Config — Matching Companies Style ────────────────────────────
const TAB_CONFIG: Record<string, {
    label: string; icon: React.ReactNode
    activeBg: string; inactiveText: string
}> = {
    active: {
        label: '在籍中・対応中',
        icon: <CheckCircle2 size={16} />,
        activeBg: 'bg-emerald-50 text-emerald-700 border-emerald-500',
        inactiveText: 'text-gray-400 hover:text-emerald-600'
    },
    waiting: {
        label: '未入国',
        icon: <Clock size={16} />,
        activeBg: 'bg-blue-50 text-blue-700 border-blue-500',
        inactiveText: 'text-gray-400 hover:text-blue-600'
    },
    closed: {
        label: '失踪・返国・転籍済',
        icon: <AlertTriangle size={16} />,
        activeBg: 'bg-rose-50 text-rose-700 border-rose-500',
        inactiveText: 'text-gray-400 hover:text-rose-600'
    },
}
const TAB_KEYS = ['active', 'waiting', 'closed']

const reverseStatusMap: Record<string, string> = {
    'waiting': '未入国', 'standby': '対応中', 'working': '就業中', 'missing': '失踪', 'returned': '帰国', 'transferred': '転籍済'
}

// ステータス別 テキストカラー
const statusSelectCls = (s: string): string => {
    if (s === 'working') return 'text-emerald-700 font-black'
    if (s === 'standby') return 'text-blue-600 font-black'
    if (s === 'missing') return 'text-rose-600 font-black'
    if (s === 'transferred') return 'text-purple-600 font-black'
    return 'text-gray-500 font-bold' // waiting, returned
}

const PAGE_SIZE = 50

// ── Group color palette (Design A: Left Color Bar) ──────────────────────
const GROUP_COLORS = [
    '#0067b8', // brand blue
    '#059669', // emerald
    '#d97706', // amber
    '#7c3aed', // violet
    '#db2777', // pink
    '#0891b2', // cyan
    '#65a30d', // lime
    '#ea580c', // orange
]

export default function WorkersListClient({ initialWorkers, role, next90DaysStr }: { initialWorkers: any[], role: string, next90DaysStr: string }) {
    const [workers, setWorkers] = useState(initialWorkers)
    const [filtered, setFiltered] = useState(initialWorkers)
    const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [viewState, setViewState] = useState<'batches' | 'companies' | 'workers' | 'profile'>('batches');
    const [isPending, startTransition] = useTransition()
    const [activeTab, setActiveTab] = useState('active')
    const [layout, setLayout] = useState<'list' | 'grid'>('list')
    const [isRefreshing, setIsRefreshing] = useState(false);

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
    const [filterEntryYear, setFilterEntryYear] = useState('all')
    const [sortKey, setSortKey] = useState<'entry_date' | 'zairyu_exp' | 'cert_end_date'>('entry_date')
    const [sortDir, setSortDir] = useState<'desc' | 'asc'>('asc')
    const [currentPage, setCurrentPage] = useState(1)
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
    const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false)
    const [batchForm, setBatchForm] = useState({
        worker_status: '',
        system_type: '',
        industry_field: '',
        japanese_level: '',
        sending_org: '',
        nationality: '',
        entry_batch: '',
        entry_date: '',
        visa_status: '',
        zairyu_exp: '',
        cert_start_date: '',
        cert_end_date: '',
        passport_exp: '',
        insurance_exp: '',
    })

    // Derived filter lists
    const uniqueCompanies = React.useMemo(() => {
        const map = new Map<string, string>();
        workers.forEach(w => {
            if (w.company_id && w.companies?.name_jp) {
                map.set(w.company_id, w.companies.name_jp);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name_jp: name })).sort((a, b) => a.name_jp.localeCompare(b.name_jp, 'ja'));
    }, [workers]);

    // Build batch list with counts (based on all workers, filtered by tab status)
    const batchItems = React.useMemo(() => {
        const map = new Map<string, { count: number; date: string }>();
        workers.forEach(w => {
            const batch = (w as any).entry_batch || '未設定';
            const date = (w as any).entry_date || '';
            const existing = map.get(batch);
            if (!existing) {
                map.set(batch, { count: 1, date });
            } else {
                existing.count++;
                if (date && (!existing.date || date < existing.date)) existing.date = date;
            }
        });
        return Array.from(map.entries())
            .map(([label, { count, date }]) => ({ label, count, date }))
            .sort((a, b) => {
                const na = parseInt(a.label.match(/(\d+)/)?.[1] ?? '0', 10);
                const nb = parseInt(b.label.match(/(\d+)/)?.[1] ?? '0', 10);
                if (na === 0 && nb === 0) return a.label.localeCompare(b.label, 'ja');
                if (na === 0) return 1; if (nb === 0) return -1;
                return nb - na;
            });
    }, [workers]);

    // Companies filtered by selected batch (for drill-down)
    const filteredCompanies = React.useMemo(() => {
        if (!selectedBatch) return uniqueCompanies;
        const ids = new Set(
            workers
                .filter(w => (w as any).entry_batch === selectedBatch && w.company_id)
                .map(w => w.company_id)
        );
        return uniqueCompanies.filter(c => ids.has(c.id));
    }, [uniqueCompanies, workers, selectedBatch]);

    const companiesList = uniqueCompanies.map(c => c.name_jp);
    const industryList = Array.from(new Set(workers.map(w => (w as any).industry_field).filter(Boolean))) as string[]
    const visaStatusList = Array.from(new Set(workers.map(w => (w as any).visa_status).filter(Boolean))) as string[]
    const nationalityList = Array.from(new Set(workers.map(w => (w as any).nationality).filter(Boolean))) as string[]
    const entryBatchList = Array.from(new Set(workers.map(w => (w as any).entry_batch).filter(Boolean))) as string[]
    const entryYearList = Array.from(new Set(
        workers
            .map(w => (w as any).entry_date)
            .filter(Boolean)
            .map((d: string) => d.substring(0, 4))
    )).sort().reverse() as string[]

    useEffect(() => { setWorkers(initialWorkers); }, [initialWorkers])

    useEffect(() => {
        let result = workers
        // Drill-down: batch first
        if (selectedBatch) {
            result = result.filter(w => (w as any).entry_batch === selectedBatch);
        }
        // Then company
        if (selectedCompanyId) {
            result = result.filter(w => w.company_id === selectedCompanyId);
        }
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

        if (filterEntryYear !== 'all') {
            result = result.filter(w => ((w as any).entry_date || '').startsWith(filterEntryYear))
        }

        // Group by entry_batch → sort groups by latest entry_date DESC → within group: company A→Z
        const batchMap = new Map<string, any[]>()
        result.forEach(w => {
            const batch = (w as any).entry_batch || '未設定'
            if (!batchMap.has(batch)) batchMap.set(batch, [])
            batchMap.get(batch)!.push(w)
        })
        batchMap.forEach(arr => arr.sort((a, b) => {
            // 入国日 降順 (新しい順)
            const ed = ((b as any).entry_date || '0000-00-00').localeCompare((a as any).entry_date || '0000-00-00')
            if (ed !== 0) return ed
            // 同日の場合: 企業名 昇順
            return ((a as any).companies?.name_jp || '').localeCompare((b as any).companies?.name_jp || '', 'ja')
        }))
        const sortedBatches = Array.from(batchMap.entries()).sort(([keyA], [keyB]) => {
            const numA = parseInt(keyA.match(/(\d+)/)?.[1] ?? '0', 10)
            const numB = parseInt(keyB.match(/(\d+)/)?.[1] ?? '0', 10)
            // Groups with no numeric value (e.g. "未設定") go to the bottom
            if (numA === 0 && numB === 0) return keyA.localeCompare(keyB, 'ja')
            if (numA === 0) return 1
            if (numB === 0) return -1
            return numB - numA // Descending: larger number first
        })
        result = sortedBatches.flatMap(([, workers]) => workers)

        setFiltered(result)
        setSelectedIds([])
        setCurrentPage(1)
    }, [searchTerm, filterCompany, filterIndustry, filterVisaStatus, filterNationality, filterEntryBatch, filterEntryYear, sortKey, sortDir, activeTab, workers, selectedBatch, selectedCompanyId])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    // Compute timeline groups from current page
    const paginatedGroups = (() => {
        const groups: { label: string; date: string; workers: any[] }[] = []
        paginated.forEach(w => {
            const batch = (w as any).entry_batch || '未設定'
            const last = groups[groups.length - 1]
            if (!last || last.label !== batch) {
                groups.push({ label: batch, date: (w as any).entry_date || '', workers: [w] })
            } else {
                last.workers.push(w)
            }
        })
        return groups
    })()

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

    const applyBatch = async () => {
        const ids = selectedIds;
        for (const id of ids) {
            const updates: Promise<unknown>[] = [];
            if (batchForm.worker_status) updates.push(updateWorkerStatus(id, 'status', batchForm.worker_status));
            if (batchForm.system_type) updates.push(updateWorkerStatus(id, 'system_type', batchForm.system_type));
            if (batchForm.industry_field) updates.push(updateWorkerStatus(id, 'industry_field', batchForm.industry_field));
            if (batchForm.japanese_level) updates.push(updateWorkerStatus(id, 'japanese_level', batchForm.japanese_level));
            if (batchForm.sending_org) updates.push(updateWorkerStatus(id, 'sending_org', batchForm.sending_org));
            if (batchForm.nationality) updates.push(updateWorkerStatus(id, 'nationality', batchForm.nationality));
            if (batchForm.entry_batch) updates.push(updateWorkerStatus(id, 'entry_batch', batchForm.entry_batch));
            if (batchForm.entry_date) updates.push(updateWorkerStatus(id, 'entry_date', batchForm.entry_date));
            if (batchForm.visa_status) updates.push(updateWorkerStatus(id, 'visa_status', batchForm.visa_status));
            if (batchForm.zairyu_exp) updates.push(updateWorkerStatus(id, 'zairyu_exp', batchForm.zairyu_exp));
            if (batchForm.cert_start_date) updates.push(updateWorkerStatus(id, 'cert_start_date', batchForm.cert_start_date));
            if (batchForm.cert_end_date) updates.push(updateWorkerStatus(id, 'cert_end_date', batchForm.cert_end_date));
            if (batchForm.passport_exp) updates.push(updateWorkerStatus(id, 'passport_exp', batchForm.passport_exp));
            if (batchForm.insurance_exp) updates.push(updateWorkerStatus(id, 'insurance_exp', batchForm.insurance_exp));
            if (updates.length > 0) {
                setWorkers(prev => prev.map(w => w.id === id ? {
                    ...w,
                    ...(batchForm.worker_status ? { status: batchForm.worker_status } : {}),
                    ...(batchForm.system_type ? { system_type: batchForm.system_type } : {}),
                    ...(batchForm.industry_field ? { industry_field: batchForm.industry_field } : {}),
                    ...(batchForm.japanese_level ? { japanese_level: batchForm.japanese_level } : {}),
                    ...(batchForm.sending_org ? { sending_org: batchForm.sending_org } : {}),
                    ...(batchForm.nationality ? { nationality: batchForm.nationality } : {}),
                    ...(batchForm.entry_batch ? { entry_batch: batchForm.entry_batch } : {}),
                    ...(batchForm.entry_date ? { entry_date: batchForm.entry_date } : {}),
                    ...(batchForm.visa_status ? { visa_status: batchForm.visa_status } : {}),
                    ...(batchForm.zairyu_exp ? { zairyu_exp: batchForm.zairyu_exp } : {}),
                    ...(batchForm.cert_start_date ? { cert_start_date: batchForm.cert_start_date } : {}),
                    ...(batchForm.cert_end_date ? { cert_end_date: batchForm.cert_end_date } : {}),
                    ...(batchForm.passport_exp ? { passport_exp: batchForm.passport_exp } : {}),
                    ...(batchForm.insurance_exp ? { insurance_exp: batchForm.insurance_exp } : {}),
                } : w));
                try { await Promise.all(updates); } catch { alert('一括更新エラー'); }
            }
        }
        setSelectedIds([]);
        setBatchForm({ worker_status: '', system_type: '', industry_field: '', japanese_level: '', sending_org: '', nationality: '', entry_batch: '', entry_date: '', visa_status: '', zairyu_exp: '', cert_start_date: '', cert_end_date: '', passport_exp: '', insurance_exp: '' });
    };

    const handleSelectBatch = (batch: string | null) => {
        setSelectedBatch(batch);
        setSelectedCompanyId(null);
        setSelectedIds([]);
        setLastSelectedId(null);
        setViewState('companies');
    };

    const handleSelectCompany = (id: string | null) => {
        setSelectedCompanyId(id);
        setSelectedIds([]);
        setLastSelectedId(null);
        setViewState('workers');
    };

    const handleSelectWorker = (id: string, event?: React.MouseEvent) => {
        if (!event || (!event.ctrlKey && !event.metaKey && !event.shiftKey)) {
            setSelectedIds([id]);
            setLastSelectedId(id);
        } else if (event.shiftKey && lastSelectedId) {
            const currentIndex = filtered.findIndex(w => w.id === id);
            const lastIndex = filtered.findIndex(w => w.id === lastSelectedId);
            const start = Math.min(currentIndex, lastIndex);
            const end = Math.max(currentIndex, lastIndex);
            const rangeIds = filtered.slice(start, end + 1).map(w => w.id);
            setSelectedIds(Array.from(new Set([...selectedIds, ...rangeIds])));
        } else {
            setSelectedIds(prev =>
                prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
            );
            setLastSelectedId(id);
        }
        setViewState('profile');
    };

    const countByTab = (key: string) => {
        const statuses = key === 'active' ? ['working', 'standby'] : (key === 'waiting' ? ['waiting'] : ['missing', 'returned', 'transferred'])
        return workers.filter(w => statuses.includes(w.status || '')).length
    }

    const Pagination = () => totalPages > 1 ? (
        <div className="max-w-[1440px] mx-auto w-full flex justify-center items-center gap-2 mt-8 pb-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:border-[#0067b8] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    const isSelected = currentPage === page
                    return (
                        <button key={page} onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                            {page}
                        </button>
                    )
                })}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:border-[#0067b8] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight size={14} />
            </button>
            <span className="text-[11px] font-bold text-gray-400 ml-3 uppercase tracking-wider">
                {filtered.length}名中 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}表示
            </span>
        </div>
    ) : null


    const selectedWorkers = workers.filter(w => selectedIds.includes(w.id));

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden text-gray-900 antialiased">
            {/* 1. Header */}
            <header className="h-[42px] bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <h2 className="text-[14px] font-black tracking-tight text-gray-950 border-r border-gray-200 pr-4 shrink-0">
                        人材<span className="text-blue-700">管理</span>
                    </h2>

                    {/* Global Search */}
                    <div className="relative flex-1 max-w-sm group">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="名前、企業名で検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            suppressHydrationWarning
                            className="w-full h-7 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-bold text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Filters */}
                    <div className="hidden xl:flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-[6px] border border-gray-200">
                            <select value={filterEntryYear} onChange={e => setFilterEntryYear(e.target.value)}
                                suppressHydrationWarning
                                className="bg-transparent text-[11px] font-black uppercase text-gray-600 outline-none pr-4 cursor-pointer">
                                <option value="all">すべての入国年</option>
                                {entryYearList.map(y => <option key={y} value={y}>{y}年</option>)}
                            </select>
                            <div className="w-px h-3 bg-gray-300" />
                            <select value={filterEntryBatch} onChange={e => setFilterEntryBatch(e.target.value)}
                                suppressHydrationWarning
                                className="bg-transparent text-[11px] font-black uppercase text-gray-600 outline-none pr-2 cursor-pointer">
                                <option value="all">すべての期生</option>
                                {entryBatchList.sort().map(b => <option key={b} value={b}>{b}期生</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => setIsBulkEditModalOpen(true)}
                            className="h-7 px-3 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-[6px] flex items-center gap-1.5 text-[12px] font-black transition-all active:scale-95 shadow-sm"
                        >
                            <SlidersHorizontal size={13} />
                            一括編集
                        </button>
                    )}
                    <button
                        onClick={() => setIsBulkImportModalOpen(true)}
                        className="h-7 px-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-[6px] flex items-center gap-1.5 text-[12px] font-black transition-all active:scale-95 shadow-sm"
                    >
                        <List size={13} />
                        一括入力
                    </button>
                    <button onClick={() => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 800); }} className={`p-1.5 rounded-[6px] bg-gray-50 text-gray-400 border border-gray-200 transition-all active:scale-95 ${isRefreshing ? 'animate-spin text-blue-600' : 'hover:bg-white hover:text-blue-600'}`}>
                        <RefreshCw size={14} />
                    </button>
                    <Link href="/workers/new"
                        className="h-7 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-[6px] flex items-center gap-1.5 text-[12px] font-black transition-all active:scale-95 shadow-sm">
                        <Plus size={13} />
                        新規登録
                    </Link>
                </div>
            </header>

            {/* 2. Desktop: 4-Column Layout */}
            <div className="hidden lg:flex flex-1 overflow-x-auto thin-scrollbar bg-white">
                <div className="flex w-full min-w-max h-full border-t border-gray-200 overflow-hidden bg-white">

                    {/* Column 0: Entry Batch */}
                    <div className="w-[240px] flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200">
                        <div className="h-[48px] px-4 border-b border-gray-200 bg-white/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">入国期生</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <EntryBatchColumn
                                batches={batchItems}
                                selectedBatch={selectedBatch}
                                onSelect={handleSelectBatch}
                            />
                        </div>
                    </div>

                    {/* Column 1: Companies */}
                    <div className="w-[320px] flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200">
                        <div className="h-[48px] px-4 border-b border-gray-200 bg-blue-50/20 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Building2 size={14} className="text-blue-400" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-blue-700">企業リスト</span>
                            </div>
                            {selectedBatch && (
                                <span className="text-[11px] font-bold bg-white text-blue-700 px-1.5 py-0.5 rounded-[6px] border border-blue-200 shadow-sm">{filteredCompanies.length}</span>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <CompanyColumn
                                companies={filteredCompanies}
                                selectedId={selectedCompanyId}
                                onSelect={handleSelectCompany}
                            />
                        </div>
                    </div>

                    {/* Column 2: Workers */}
                    <div className="w-[320px] flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200">
                        <div className="h-[48px] px-4 border-b border-gray-200 bg-white/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Users size={14} className="text-gray-400" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">人材リスト</span>
                            </div>
                            <span className="text-[11px] font-bold bg-white text-gray-900 px-1.5 py-0.5 rounded-[6px] border border-gray-200 shadow-sm">{filtered.length}</span>
                        </div>
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 bg-white shrink-0">
                            {TAB_KEYS.map((key) => {
                                const isActive = activeTab === key
                                const cfg = TAB_CONFIG[key]
                                return (
                                    <button key={key} onClick={() => setActiveTab(key)}
                                        className={`flex-1 h-[48px] flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all border-b-2
                                        ${isActive ? cfg.activeBg : cfg.inactiveText + ' border-transparent'}`}>
                                        {cfg.label}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <WorkerListColumn
                                workers={filtered}
                                selectedIds={selectedIds}
                                onSelect={handleSelectWorker}
                            />
                        </div>
                    </div>

                    {/* Column 3: Profile Detail */}
                    <div className="w-[640px] flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200">
                        <div className="h-[48px] px-4 border-b border-gray-200 bg-white/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <User size={14} className="text-gray-400" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">人材詳細</span>
                            </div>
                            {selectedIds.length > 1 && (
                                <span className="text-[11px] font-black bg-blue-50 text-blue-700 px-2.5 py-1 rounded-[6px] border border-blue-200 shadow-sm">{selectedIds.length}名一括選択中</span>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ProfileDetailColumn
                                workers={selectedWorkers}
                                batchForm={batchForm}
                                setBatchForm={setBatchForm}
                                onUpdate={handleChange}
                                onBulkUpdate={applyBatch}
                            />
                        </div>
                    </div>

                    {/* Column 4: Documents */}
                    <div className="flex-1 min-w-[320px] flex-shrink-0 flex flex-col overflow-hidden">
                        <div className="h-[48px] px-4 border-b border-gray-200 bg-white/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-slate-800">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">関連書類</span>
                            </div>
                            {selectedIds.length === 1 && (
                                <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[6px] border border-blue-100 shadow-sm">1名選択</span>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <DocumentsColumn
                                workerId={selectedIds.length === 1 ? selectedIds[0] : null}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Mobile: Drill-down (4 steps) */}
            <div className="flex lg:hidden flex-1 flex-col overflow-hidden bg-[#F5F5F7]">
                <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
                    {viewState !== 'batches' && (
                        <button
                            onClick={() => {
                                if (viewState === 'profile') setViewState('workers');
                                else if (viewState === 'workers') setViewState('companies');
                                else setViewState('batches');
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600"
                        >
                            <ArrowLeft size={16} />
                        </button>
                    )}
                    <h1 className="text-[15px] font-black tracking-tight">
                        {viewState === 'batches' ? '入国期生' : viewState === 'companies' ? '企業選択' : viewState === 'workers' ? '人材選択' : '詳細情報'}
                    </h1>
                    {selectedBatch && viewState !== 'batches' && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded ml-auto">{selectedBatch}</span>
                    )}
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {viewState === 'batches' && (
                        <div className="absolute inset-0 bg-white">
                            <EntryBatchColumn
                                batches={batchItems}
                                selectedBatch={selectedBatch}
                                onSelect={handleSelectBatch}
                            />
                        </div>
                    )}
                    {viewState === 'companies' && (
                        <div className="absolute inset-0 bg-white">
                            <CompanyColumn
                                companies={filteredCompanies}
                                selectedId={selectedCompanyId}
                                onSelect={handleSelectCompany}
                            />
                        </div>
                    )}
                    {viewState === 'workers' && (
                        <div className="absolute inset-0 flex flex-col bg-white">
                            <div className="flex border-b border-gray-100 shrink-0">
                                {TAB_KEYS.map((key) => {
                                    const cfg = TAB_CONFIG[key]
                                    const isActive = activeTab === key
                                    return (
                                        <button key={key} onClick={() => setActiveTab(key)}
                                            className={`flex-1 h-[52px] flex items-center justify-center text-[10px] font-black uppercase tracking-widest border-b-2 transition-all
                                            ${isActive ? cfg.activeBg : cfg.inactiveText + ' border-transparent'}`}>
                                            {cfg.label}
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <WorkerListColumn
                                    workers={filtered}
                                    selectedIds={selectedIds}
                                    onSelect={handleSelectWorker}
                                />
                            </div>
                        </div>
                    )}
                    {viewState === 'profile' && (
                        <div className="absolute inset-0">
                            <ProfileDetailColumn
                                workers={selectedWorkers}
                                batchForm={batchForm}
                                setBatchForm={setBatchForm}
                                onUpdate={handleChange}
                                onBulkUpdate={applyBatch}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isBulkEditModalOpen && (
                <BulkEditModal
                    selectedIds={selectedIds}
                    onClose={() => setIsBulkEditModalOpen(false)}
                    onSuccess={() => { setIsBulkEditModalOpen(false); setSelectedIds([]) }}
                    companies={uniqueCompanies}
                />
            )}
            {isBulkImportModalOpen && (
                <BulkImportModal
                    onClose={() => setIsBulkImportModalOpen(false)}
                    onSuccess={() => setIsBulkImportModalOpen(false)}
                />
            )}
        </div>
    );
}
