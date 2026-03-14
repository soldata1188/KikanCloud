'use client'

import React, { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
    Search, Clock, Briefcase, AlertTriangle, ChevronLeft, ChevronRight,
    Building2, Landmark, Calendar, ExternalLink, User, Users,
    CheckCircle2, Circle, Plus, X, LayoutGrid, List, Trash2, RefreshCw, ArrowLeft
} from 'lucide-react'
import { bulkDeleteWorkers } from '@/app/actions/operations'
import { updateWorkerStatus } from '@/app/operations/actions'
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
    all: {
        label: '全員',
        icon: <Users size={16} />,
        activeBg: 'bg-slate-900 text-white border-slate-900',
        inactiveText: 'text-gray-400 hover:text-gray-600'
    },
    active: {
        label: '稼働中',
        icon: <CheckCircle2 size={16} />,
        activeBg: 'bg-emerald-600 text-white border-emerald-600',
        inactiveText: 'text-gray-400 hover:text-emerald-600'
    },
    waiting: {
        label: '未入国',
        icon: <Clock size={16} />,
        activeBg: 'bg-blue-600 text-white border-blue-600',
        inactiveText: 'text-gray-400 hover:text-blue-600'
    },
    closed: {
        label: '失踪・帰国済',
        icon: <AlertTriangle size={16} />,
        activeBg: 'bg-rose-600 text-white border-rose-600',
        inactiveText: 'text-gray-400 hover:text-rose-600'
    },
}
const TAB_KEYS = ['all', 'active', 'waiting', 'closed']

const reverseStatusMap: Record<string, string> = {
    'waiting': '未入国', 'standby': '対応中', 'working': '就業中', 'missing': '失踪', 'returned': '帰国', 'transferred': '転籍済'
}

// ステータス別 テキストカラー
const statusSelectCls = (s: string): string => {
    if (s === 'working') return 'text-emerald-700 font-normal'
    if (s === 'standby') return 'text-blue-600 font-normal'
    if (s === 'missing') return 'text-rose-600 font-normal'
    if (s === 'transferred') return 'text-purple-600 font-normal'
    return 'text-gray-500 font-normal' // waiting, returned
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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // モバイルレイアウトの最適化: 小画面ではデフォルトで「グリッド」表示
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setLayout('grid');
            }
        };
        handleResize(); // マウント時にチェック
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
    const [filterEntryDate, setFilterEntryDate] = useState('all')
    const [filterSendingOrg, setFilterSendingOrg] = useState('all')
    const [sortKey, setSortKey] = useState<'entry_date' | 'zairyu_exp' | 'cert_end_date'>('entry_date')
    const [sortDir, setSortDir] = useState<'desc' | 'asc'>('asc')
    const [currentPage, setCurrentPage] = useState(1)
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

    // Column widths (resizable) - Balanced for Option B
    const [batchWidth, setBatchWidth] = useState(165);
    const [companyWidth, setCompanyWidth] = useState(240);
    const [workerWidth, setWorkerWidth] = useState(510);
    const [profileWidth, setProfileWidth] = useState(480);
    const isResizing = useRef(false);

    const startResize = useCallback((col: 'batch' | 'company' | 'worker' | 'profile', startX: number) => {
        isResizing.current = true;
        const startWidth = col === 'batch' ? batchWidth : col === 'company' ? companyWidth : col === 'worker' ? workerWidth : profileWidth;
        const setter = col === 'batch' ? setBatchWidth : col === 'company' ? setCompanyWidth : col === 'worker' ? setWorkerWidth : setProfileWidth;
        const min = col === 'batch' ? 100 : col === 'company' ? 150 : col === 'worker' ? 300 : 300;
        const max = col === 'batch' ? 300 : col === 'company' ? 500 : col === 'worker' ? 1000 : 800;

        const onMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const delta = e.clientX - startX;
            setter(Math.min(max, Math.max(min, startWidth + delta)));
        };
        const onMouseUp = () => {
            isResizing.current = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [batchWidth, companyWidth, workerWidth, profileWidth]);

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const res = await bulkDeleteWorkers(selectedIds);
        if (res.success) {
            setWorkers(prev => prev.filter(w => !selectedIds.includes(w.id)));
            setSelectedIds([]);
            setIsDeleteDialogOpen(false);
        } else {
            alert(res.error || '削除に失敗しました。');
        }
    };

    // 企業名をクリーンアップするヘルパー関数
    const cleanName = (name: string) => {
        return name.replace(/株式会社|有限会社|合同会社|（株）|\(株\)|（有）|\(有\)|（同）|\(同\)/g, '').trim();
    };

    // Derived filter lists
    const uniqueCompanies = React.useMemo(() => {
        const map = new Map<string, string>();
        workers.forEach(w => {
            if (w.company_id && w.companies?.name_jp) {
                map.set(w.company_id, w.companies.name_jp);
            }
        });

        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name_jp: name }))
            .sort((a, b) => {
                const nameA = cleanName(a.name_jp);
                const nameB = cleanName(b.name_jp);
                return nameA.localeCompare(nameB, 'ja');
            });
    }, [workers]);

    // 全てのワーカーをタブのステータスでフィルタリングし、期生リストとカウントを作成
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

    // 選択された期生でフィルタリングされた企業 (ドリルダウン用)
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
    const entryDateList = Array.from(new Set(workers.map(w => (w as any).entry_date).filter(Boolean))).sort().reverse() as string[]
    const sendingOrgList = Array.from(new Set(workers.map(w => (w as any).sending_org).filter(Boolean))) as string[]

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
        const statuses = activeTab === 'all'
            ? ['working', 'standby', 'waiting', 'missing', 'returned', 'transferred']
            : (activeTab === 'active' ? ['working', 'standby'] : (activeTab === 'waiting' ? ['waiting'] : ['missing', 'returned', 'transferred']))
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

        if (filterEntryDate !== 'all') {
            result = result.filter(w => (w as any).entry_date === filterEntryDate)
        }

        if (filterSendingOrg !== 'all') {
            result = result.filter(w => (w as any).sending_org === filterSendingOrg)
        }

        // Global Sort: 1. Entry Date (Desc) -> 2. Company Name (Asc)
        result = [...result].sort((a, b) => {
            const dateA = (a as any).entry_date || '0000-00-00'
            const dateB = (b as any).entry_date || '0000-00-00'

            if (dateB !== dateA) {
                return dateB.localeCompare(dateA) // Latest date first
            }

            // Secondary sort: Company name (cleaned)
            const cleanNameA = cleanName((a as any).companies?.name_jp || '')
            const cleanNameB = cleanName((b as any).companies?.name_jp || '')
            return cleanNameA.localeCompare(cleanNameB, 'ja')
        })

        setFiltered(result)
        setSelectedIds([])
        setCurrentPage(1)
    }, [searchTerm, filterCompany, filterIndustry, filterVisaStatus, filterNationality, filterEntryBatch, filterEntryYear, filterEntryDate, filterSendingOrg, sortKey, sortDir, activeTab, workers, selectedBatch, selectedCompanyId])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    // 現在のページからタイムライングループを計算
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

    const handleSelectBatch = useCallback((batch: string | null) => {
        setSelectedBatch(batch);
        setSelectedCompanyId(null);
        setSelectedIds([]);
        setLastSelectedId(null);
        setViewState('companies');
    }, []);

    const handleSelectCompany = useCallback((id: string | null) => {
        setSelectedCompanyId(id);
        setSelectedIds([]);
        setLastSelectedId(null);
        setViewState('workers');
    }, []);

    const handleSelectWorker = useCallback((id: string, event?: React.MouseEvent) => {
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
    }, [filtered, lastSelectedId, selectedIds, setSelectedIds, setLastSelectedId, setViewState]);

    const countByTab = useCallback((key: string) => {
        const statuses = key === 'active' ? ['working', 'standby'] : (key === 'waiting' ? ['waiting'] : ['missing', 'returned', 'transferred'])
        return workers.filter(w => statuses.includes(w.status || '')).length
    }, [workers]);

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
                            className={`w-9 h-9 rounded-lg text-sm font-normal transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                            {page}
                        </button>
                    )
                })}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:border-[#0067b8] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight size={14} />
            </button>
            <span className="text-xs font-normal text-gray-400 ml-3 uppercase tracking-wider">
                {filtered.length}名中 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}表示
            </span>
        </div>
    ) : null


    const selectedWorkers = workers.filter(w => selectedIds.includes(w.id));

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden text-gray-900 antialiased">
            {/* 1. Header */}
            <header className="h-[44px] bg-white border-b border-gray-300 flex items-center justify-between px-4 z-40 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <h2 className="text-base font-bold tracking-tight text-gray-950 border-r border-gray-300 pr-4 shrink-0">
                        人材<span className="text-blue-700">管理</span>
                    </h2>

                    {/* Global Search */}
                    <div className="relative flex-1 max-w-sm group">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="名前、企業名で検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            suppressHydrationWarning
                            className="w-full h-8 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-[6px] text-sm font-normal text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                        />
                    </div>

                    {/* Filters */}
                    <div className="hidden xl:flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded-[6px] border border-gray-200">
                            {/* Entry Date Filter */}
                            <select value={filterEntryDate} onChange={e => setFilterEntryDate(e.target.value)}
                                suppressHydrationWarning
                                className="bg-transparent text-xs font-normal uppercase text-gray-600 outline-none pr-4 cursor-pointer max-w-[120px]">
                                <option value="all">入国年月日</option>
                                {entryDateList.map(d => <option key={d} value={d}>{d.replace(/-/g, '/')}</option>)}
                            </select>
                            <div className="w-px h-3.5 bg-gray-300" />

                            {/* Visa Status Filter */}
                            <select value={filterVisaStatus} onChange={e => setFilterVisaStatus(e.target.value)}
                                suppressHydrationWarning
                                className="bg-transparent text-xs font-normal uppercase text-gray-600 outline-none pr-4 cursor-pointer max-w-[100px]">
                                <option value="all">在留資格</option>
                                {visaStatusList.map(v => (
                                    <option key={v} value={v}>
                                        {v === 'ikusei_shuro' ? '育成就労' : v === 'ginou_jisshu' ? '技能実習' : v === 'tokuteigino' ? '特定技能' : v}
                                    </option>
                                ))}
                            </select>
                            <div className="w-px h-3.5 bg-gray-300" />

                            {/* Nationality Filter */}
                            <select value={filterNationality} onChange={e => setFilterNationality(e.target.value)}
                                suppressHydrationWarning
                                className="bg-transparent text-xs font-normal uppercase text-gray-600 outline-none pr-4 cursor-pointer max-w-[90px]">
                                <option value="all">国籍</option>
                                {nationalityList.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <div className="w-px h-3.5 bg-gray-300" />

                            {/* Sending Org Filter */}
                            <select value={filterSendingOrg} onChange={e => setFilterSendingOrg(e.target.value)}
                                suppressHydrationWarning
                                className="bg-transparent text-xs font-normal uppercase text-gray-600 outline-none pr-2 cursor-pointer max-w-[130px]">
                                <option value="all">送出機関</option>
                                {sendingOrgList.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <>
                            <button
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="h-8 px-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-[6px] flex items-center gap-2 text-sm font-medium transition-all active:scale-95 shadow-sm"
                            >
                                <Trash2 size={14} />
                                削除
                            </button>
                        </>
                    )}
                    <button onClick={() => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 800); }} className={`p-1.5 rounded-[6px] bg-gray-50 text-gray-400 border border-gray-200 transition-all active:scale-95 ${isRefreshing ? 'animate-spin text-blue-600' : 'hover:bg-white hover:text-blue-600'}`}>
                        <RefreshCw size={14} />
                    </button>
                    {(role === 'admin' || role === 'staff') && (
                        <Link 
                            href="/workers/new" 
                            className="h-8 px-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-[6px] text-sm font-bold flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-blue-100 shrink-0"
                        >
                            <Plus size={16} />
                            <span>新規登録</span>
                        </Link>
                    )}
                </div>
            </header>

            {/* 2. Desktop: 4-Column Layout */}
            <div className="hidden lg:flex flex-1 overflow-x-auto thin-scrollbar bg-white">
                <div className="flex w-full min-w-max h-full border-t border-gray-300 overflow-hidden bg-white">

                    {/* Column 0: Entry Batch */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-300" style={{ width: batchWidth }}>
                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-gray-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-gray-900">入国期生</span>
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

                    {/* Resize Handle: Batch | Company */}
                    <div
                        className="relative flex-shrink-0 w-[1px] bg-gray-200 group/resize hover:bg-blue-300 transition-colors cursor-col-resize z-10"
                        onMouseDown={(e) => startResize('batch', e.clientX)}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity pointer-events-none">
                            <div className="flex flex-col gap-[3px] py-2 px-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 1: Companies */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-300" style={{ width: companyWidth }}>
                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Building2 size={18} className="text-blue-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-blue-700">企業リスト</span>
                            </div>
                            {selectedBatch && (
                                <span className="text-xs font-bold bg-white text-blue-700 px-1.5 py-0.5 rounded-[6px] border border-blue-200 shadow-sm">{filteredCompanies.length}</span>
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

                    {/* Resize Handle: Company | Worker */}
                    <div
                        className="relative flex-shrink-0 w-[1px] bg-gray-200 group/resize hover:bg-blue-300 transition-colors cursor-col-resize z-10"
                        onMouseDown={(e) => startResize('company', e.clientX)}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity pointer-events-none">
                            <div className="flex flex-col gap-[3px] py-2 px-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Workers */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-300" style={{ width: workerWidth }}>

                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-gray-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-gray-900">人材リスト</span>
                            </div>
                            <span className="text-xs font-bold bg-gray-50 text-gray-900 px-1.5 py-0.5 rounded-[6px] border border-gray-200 shadow-sm">{filtered.length}</span>
                        </div>
                        {/* Tabs */}
                        <div className="flex border-b border-gray-300 bg-white shrink-0">
                            {TAB_KEYS.map((key) => {
                                const isActive = activeTab === key
                                const cfg = TAB_CONFIG[key]
                                return (
                                    <button key={key} onClick={() => setActiveTab(key)}
                                        className={`flex-1 h-[44px] flex items-center justify-center text-xs font-bold uppercase tracking-widest transition-all border-b-2
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

                    {/* Resize Handle: Worker | Profile Detail */}
                    <div
                        className="relative flex-shrink-0 w-[1px] bg-gray-200 group/resize hover:bg-blue-300 transition-colors cursor-col-resize z-10"
                        onMouseDown={(e) => startResize('worker', e.clientX)}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity pointer-events-none">
                            <div className="flex flex-col gap-[3px] py-2 px-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Profile Detail */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-300" style={{ width: profileWidth }}>
                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <User size={18} className="text-gray-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-gray-900">人材詳細</span>
                            </div>
                            {selectedIds.length > 1 && (
                                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-[6px] border border-blue-200 shadow-sm">{selectedIds.length}名一括選択中</span>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ProfileDetailColumn
                                workers={selectedWorkers}
                                batchForm={batchForm}
                                setBatchForm={setBatchForm}
                                onUpdate={handleChange}
                                onBulkUpdate={applyBatch}
                                companies={uniqueCompanies}
                            />
                        </div>
                    </div>

                    {/* Resize Handle: Profile | Documents */}
                    <div
                        className="relative flex-shrink-0 w-[1px] bg-gray-200 group/resize hover:bg-blue-300 transition-colors cursor-col-resize z-10"
                        onMouseDown={(e) => startResize('profile', e.clientX)}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity pointer-events-none">
                            <div className="flex flex-col gap-[3px] py-2 px-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 4: Documents */}
                    <div className="flex-1 min-w-[320px] flex flex-col overflow-hidden">

                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center justify-center gap-3 shrink-0 relative">
                            <div className="flex items-center gap-2 text-slate-800">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
                                <span className="text-sm font-bold uppercase tracking-widest text-gray-900">関連書類</span>
                            </div>
                            {selectedIds.length === 1 && (
                                <span className="absolute right-4 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[6px] border border-blue-100 shadow-sm">1名選択</span>
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
                    <h1 className="text-base font-bold tracking-tight">
                        {viewState === 'batches' ? '入国期生' : viewState === 'companies' ? '企業' : viewState === 'workers' ? '人材' : '詳細'}
                    </h1>
                    {selectedBatch && viewState !== 'batches' && (
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded ml-auto">{selectedBatch}</span>
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
                                            className={`flex-1 h-[52px] flex items-center justify-center text-xs font-bold uppercase tracking-widest border-b-2 transition-all
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
                                companies={uniqueCompanies}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* モーダル */}
            {isBulkImportModalOpen && (
                <BulkImportModal
                    onClose={() => setIsBulkImportModalOpen(false)}
                    onSuccess={() => setIsBulkImportModalOpen(false)}
                />
            )}

            {/* 削除確認モーダル */}
            {isDeleteDialogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 slide-in-from-bottom-4 animate-in duration-300">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4 mx-auto">
                                <AlertTriangle className="text-rose-500" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">一括削除の確認</h3>
                            <p className="text-sm text-slate-500 text-center mb-6">
                                選択された <span className="font-bold text-rose-600">{selectedIds.length}名</span> のデータを削除しますか？<br />
                                この操作は取り消せません。
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                    className="flex-1 h-10 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex-1 h-10 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 shadow-md shadow-rose-200 transition-all active:scale-95"
                                >
                                    削除する
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
