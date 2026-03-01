'use client'

import React, { useState, useTransition, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
    Search, Clock, Briefcase, AlertTriangle, ChevronLeft, ChevronRight,
    Sparkles, Building2, Landmark, Calendar, ExternalLink, User,
    CheckCircle2, Circle, Plus, X, SlidersHorizontal, LayoutGrid, List
} from 'lucide-react'
import { bulkDeleteWorkers } from '@/app/actions/operations'
import { updateWorkerStatus } from '@/app/operations/actions'

import { BulkEditModal } from './BulkEditModal'


// ── Tab Config — Matching Companies Style ────────────────────────────
const TAB_CONFIG: Record<string, {
    label: string; icon: React.ReactNode
    tabActiveBg: string; tabActiveText: string; tabActiveBorder: string
    tabBg: string; tabText: string; tabBorder: string
    badgeBg: string; badgeText: string
}> = {
    active: {
        label: '在籍中・対応中',
        icon: <CheckCircle2 size={13} />,
        tabActiveBg: 'bg-white', tabActiveText: 'text-gray-900', tabActiveBorder: 'border-[#0067b8]',
        tabBg: 'bg-white', tabText: 'text-gray-500', tabBorder: 'border-transparent',
        badgeBg: 'bg-blue-50', badgeText: 'text-[#0067b8]'
    },
    waiting: {
        label: '未入国',
        icon: <Clock size={13} />,
        tabActiveBg: 'bg-white', tabActiveText: 'text-gray-900', tabActiveBorder: 'border-[#0067b8]',
        tabBg: 'bg-white', tabText: 'text-gray-500', tabBorder: 'border-transparent',
        badgeBg: 'bg-gray-100', badgeText: 'text-gray-600'
    },
    closed: {
        label: '失踪・帰国・転籍済',
        icon: <AlertTriangle size={13} />,
        tabActiveBg: 'bg-white', tabActiveText: 'text-gray-900', tabActiveBorder: 'border-[#0067b8]',
        tabBg: 'bg-white', tabText: 'text-gray-500', tabBorder: 'border-transparent',
        badgeBg: 'bg-rose-50', badgeText: 'text-rose-600'
    },
}
const TAB_KEYS = ['active', 'waiting', 'closed']

const reverseStatusMap: Record<string, string> = {
    'waiting': '未入国', 'standby': '対応中', 'working': '在籍中', 'missing': '失踪', 'returned': '帰国'
}

const PAGE_SIZE = 50

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
    const [filterEntryYear, setFilterEntryYear] = useState('all')
    const [sortKey, setSortKey] = useState<'entry_date' | 'zairyu_exp' | 'cert_end_date'>('entry_date')
    const [sortDir, setSortDir] = useState<'desc' | 'asc'>('asc')
    const [currentPage, setCurrentPage] = useState(1)
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
    const [batchForm, setBatchForm] = useState({
        worker_status: '',
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
    const companiesList = Array.from(new Set(workers.map(w => w.companies?.name_jp).filter(Boolean))) as string[]
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

        // Sort: 企業名 昇順 (主), 選択フィールド (副)
        const SORT_FIELD_MAP = {
            entry_date: 'entry_date',
            zairyu_exp: 'zairyu_exp',
            cert_end_date: 'cert_end_date',
        } as const
        const field = SORT_FIELD_MAP[sortKey]
        result.sort((a, b) => {
            // 主キー: 入国日 降順 (新しい順)
            const ea = ((a as any).entry_date || '0000-00-00')
            const eb = ((b as any).entry_date || '0000-00-00')
            const entryCmp = eb.localeCompare(ea)
            if (entryCmp !== 0) return entryCmp
            // 副キー: 企業名 昇順
            return ((a as any).companies?.name_jp || '').localeCompare(
                (b as any).companies?.name_jp || '', 'ja'
            )
        })

        setFiltered(result)
        setSelectedIds([])
        setCurrentPage(1)
    }, [searchTerm, filterCompany, filterIndustry, filterVisaStatus, filterNationality, filterEntryBatch, filterEntryYear, sortKey, sortDir, activeTab, workers])

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

    const applyBatch = async () => {
        const ids = selectedIds;
        for (const id of ids) {
            const updates: Promise<unknown>[] = [];
            if (batchForm.worker_status) updates.push(updateWorkerStatus(id, 'status', batchForm.worker_status));
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
        setBatchForm({ worker_status: '', sending_org: '', nationality: '', entry_batch: '', entry_date: '', visa_status: '', zairyu_exp: '', cert_start_date: '', cert_end_date: '', passport_exp: '', insurance_exp: '' });
    };

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
                            className={`w-8 h-8 rounded-md text-[12px] font-bold transition-all ${isSelected ? 'bg-[#0067b8] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}`}>
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


    return (
        <div className="flex flex-col min-h-screen">
            {/* ══ STICKY HEADER: Mobile-first responsive ══ */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/70 shadow-sm">

                {/* Row 1: Tabs + Layout Toggle + New Button */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 overflow-x-auto no-scrollbar">
                    {TAB_KEYS.map((key) => {
                        const cfg = TAB_CONFIG[key]
                        const count = countByTab(key)
                        const isActive = activeTab === key
                        return (
                            <button key={key} onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap shrink-0
                                    ${isActive ? 'bg-blue-50 text-[#0067b8]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                <span className={isActive ? 'text-[#0067b8]' : 'text-gray-400'}>{cfg.icon}</span>
                                <span className="hidden sm:inline">{cfg.label}</span>
                                <span className="sm:hidden">{key === 'active' ? '在籍' : key === 'waiting' ? '未入国' : '終了'}</span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[#0067b8] text-white' : 'bg-gray-100 text-gray-400'}`}>{count}</span>
                            </button>
                        )
                    })}

                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                        {/* Layout toggle — hidden on mobile (always grid) */}
                        <div className="hidden md:flex items-center bg-gray-100 p-0.5 rounded-md border border-gray-200">
                            <button onClick={() => setLayout('list')} className={`p-1 rounded ${layout === 'list' ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="リスト表示">
                                <List size={13} />
                            </button>
                            <button onClick={() => setLayout('grid')} className={`p-1 rounded ${layout === 'grid' ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="グリッド表示">
                                <LayoutGrid size={13} />
                            </button>
                        </div>
                        {role !== 'client' && (
                            <>

                                <Link href="/workers/new"
                                    className="hidden sm:inline-flex bg-[#0067b8] hover:bg-blue-700 text-white text-[11px] px-3 py-1.5 rounded-md font-bold transition-all items-center gap-1 h-8 shrink-0">
                                    <Plus size={13} /> 新規登録
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Row 2: Search + Filters */}
                <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
                    {/* Search — grows on mobile */}
                    <div className="relative flex-1 min-w-[120px] max-w-[280px]">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="名前・企業..."
                            className="pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[12px] w-full focus:bg-white focus:border-[#0067b8] outline-none transition-all h-8" />
                    </div>
                    {/* Filters: scroll horizontally on mobile */}
                    <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
                        className="text-[11px] border border-gray-200 rounded-md px-2 py-1.5 bg-gray-50 outline-none focus:border-[#0067b8] cursor-pointer font-bold text-gray-600 h-8 shrink-0 max-w-[110px] truncate">
                        <option value="all">企業: 全て</option>
                        {companiesList.sort().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={filterVisaStatus} onChange={e => setFilterVisaStatus(e.target.value)}
                        className="text-[11px] border border-gray-200 rounded-md px-2 py-1.5 bg-gray-50 outline-none focus:border-[#0067b8] cursor-pointer font-bold text-gray-600 h-8 shrink-0 max-w-[100px] truncate hidden sm:block">
                        <option value="all">資格: 全て</option>
                        {visaStatusList.sort().map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <select value={filterNationality} onChange={e => setFilterNationality(e.target.value)}
                        className="text-[11px] border border-gray-200 rounded-md px-2 py-1.5 bg-gray-50 outline-none focus:border-[#0067b8] cursor-pointer font-bold text-gray-600 h-8 shrink-0 hidden sm:block">
                        <option value="all">国籍: 全て</option>
                        {nationalityList.sort().map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    {/* 入国日フィルター */}
                    <select value={filterEntryYear} onChange={e => setFilterEntryYear(e.target.value)}
                        className="text-[11px] border border-gray-200 rounded-md px-2 py-1.5 bg-gray-50 outline-none focus:border-[#0067b8] cursor-pointer font-bold text-gray-600 h-8 shrink-0 max-w-[110px]">
                        <option value="all">入国日: 全て</option>
                        {entryYearList.map(y => <option key={y} value={y}>{y}年入国</option>)}
                    </select>
                    {/* 入国期生フィルター */}
                    <select value={filterEntryBatch} onChange={e => setFilterEntryBatch(e.target.value)}
                        className="text-[11px] border border-gray-200 rounded-md px-2 py-1.5 bg-gray-50 outline-none focus:border-[#0067b8] cursor-pointer font-bold text-gray-600 h-8 shrink-0 max-w-[110px]">
                        <option value="all">期生: 全て</option>
                        {entryBatchList.sort().map(b => <option key={b} value={b}>{b}期生</option>)}
                    </select>
                    {/* 並び替え */}
                    <div className="flex items-center gap-1 ml-auto shrink-0">
                        <select
                            value={sortKey}
                            onChange={e => setSortKey(e.target.value as typeof sortKey)}
                            className="text-[11px] border border-gray-200 rounded-md px-2 py-1.5 bg-gray-50 outline-none focus:border-[#0067b8] cursor-pointer font-bold text-gray-600 h-8 max-w-[110px]">
                            <option value="entry_date">入国日順</option>
                            <option value="zairyu_exp">在留期限順</option>
                            <option value="cert_end_date">認修了日順</option>
                        </select>
                        <button
                            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                            className="h-8 w-8 flex items-center justify-center border border-gray-200 rounded-md bg-gray-50 hover:bg-white hover:border-[#0067b8] transition-all text-gray-500 shrink-0"
                            title={sortDir === 'desc' ? '降順(新しい順)' : '昇順(古い順)'}
                        >
                            {sortDir === 'desc'
                                ? <span className="text-[13px] font-black leading-none">↓</span>
                                : <span className="text-[13px] font-black leading-none">↑</span>
                            }
                        </button>
                    </div>
                </div>
            </div>


            {/* ════ 一括操作 RIGHT SIDEBAR (Fixed) ════ */}
            <div className={`fixed top-[104px] md:top-[106px] right-0 h-[calc(100vh-104px)] md:h-[calc(100vh-106px)] z-[200] transition-transform duration-300 ease-in-out ${selectedIds.length > 0 ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ width: 'min(300px, 90vw)' }}>
                <div className="h-full bg-white/90 backdrop-blur-md border-l border-gray-200 flex flex-col shadow-2xl">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-transparent flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0067b8] flex items-center justify-center text-[15px] font-black text-white">{selectedIds.length}</div>
                            <div>
                                <div className="text-[15px] font-black text-gray-900 leading-none">一括操作</div>
                                <div className="text-[11px] text-gray-400 mt-0.5">空欄はスキップされます</div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedIds([])}
                            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Fields */}
                    <div className="flex-1 px-4 py-4 overflow-y-auto">
                        <div className="space-y-3">
                            {[
                                { label: '状態', el: <select value={batchForm.worker_status} onChange={e => setBatchForm(p => ({ ...p, worker_status: e.target.value }))} className="w-full text-[13px] rounded-md bg-white text-gray-800 border border-gray-200 py-1.5 px-2.5 outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8]/20 transition-colors"><option value="">---</option>{['waiting', 'standby', 'working', 'missing', 'returned'].map(s => (<option key={s} value={s}>{reverseStatusMap[s]}</option>))}</select> },
                                { label: '送出機関', el: <input type="text" placeholder="送出機関名" value={batchForm.sending_org} onChange={e => setBatchForm(p => ({ ...p, sending_org: e.target.value }))} className="w-full text-[13px] rounded-md bg-white text-gray-800 placeholder-gray-300 border border-gray-200 py-1.5 px-2.5 outline-none focus:border-[#0067b8] transition-colors" /> },
                                { label: '国籍', el: <input type="text" placeholder="例: ベトナム" value={batchForm.nationality} onChange={e => setBatchForm(p => ({ ...p, nationality: e.target.value }))} className="w-full text-[13px] rounded-md bg-white text-gray-800 placeholder-gray-300 border border-gray-200 py-1.5 px-2.5 outline-none focus:border-[#0067b8] transition-colors" /> },
                                { label: '入国期生', el: <input type="text" placeholder="例: 第10期生" value={batchForm.entry_batch} onChange={e => setBatchForm(p => ({ ...p, entry_batch: e.target.value }))} className="w-full text-[13px] rounded-md bg-white text-gray-800 placeholder-gray-300 border border-gray-200 py-1.5 px-2.5 outline-none focus:border-[#0067b8] transition-colors" /> },
                                { label: '入国日', el: <input type="date" value={batchForm.entry_date} onChange={e => setBatchForm(p => ({ ...p, entry_date: e.target.value }))} className="w-full text-[13px] rounded-md bg-white text-gray-800 border border-gray-200 py-1.5 px-2.5 outline-none focus:border-[#0067b8] transition-colors" /> },
                                { label: '在留資格', el: <input type="text" placeholder="例: 技能実習1年" value={batchForm.visa_status} onChange={e => setBatchForm(p => ({ ...p, visa_status: e.target.value }))} className="w-full text-[13px] rounded-md bg-white text-gray-800 placeholder-gray-300 border border-gray-200 py-1.5 px-2.5 outline-none focus:border-[#0067b8] transition-colors" /> },
                                { label: '在留期限', el: <input type="date" value={batchForm.zairyu_exp} onChange={e => setBatchForm(p => ({ ...p, zairyu_exp: e.target.value }))} className="w-full text-[13px] rounded-md bg-white text-gray-800 border border-gray-200 py-1.5 px-2.5 outline-none focus:border-[#0067b8] transition-colors" /> },
                                { label: '認定開始日', el: <input type="date" value={batchForm.cert_start_date} onChange={e => setBatchForm(p => ({ ...p, cert_start_date: e.target.value }))} className="w-full text-[13px] rounded-md bg-white text-gray-800 border border-gray-200 py-1.5 px-2.5 outline-none focus:border-[#0067b8] transition-colors" /> },
                                { label: '修了日', el: <input type="date" value={batchForm.cert_end_date} onChange={e => setBatchForm(p => ({ ...p, cert_end_date: e.target.value }))} className="w-full text-[13px] rounded-md bg-white text-gray-800 border border-gray-200 py-1.5 px-2.5 outline-none focus:border-[#0067b8] transition-colors" /> },
                                { label: '旅券期限', el: <input type="date" value={batchForm.passport_exp} onChange={e => setBatchForm(p => ({ ...p, passport_exp: e.target.value }))} className="w-full text-[13px] rounded-md bg-white text-gray-800 border border-gray-200 py-1.5 px-2.5 outline-none focus:border-[#0067b8] transition-colors" /> },
                                { label: '保険期限', el: <input type="date" value={batchForm.insurance_exp} onChange={e => setBatchForm(p => ({ ...p, insurance_exp: e.target.value }))} className="w-full text-[13px] rounded-md bg-white text-gray-800 border border-gray-200 py-1.5 px-2.5 outline-none focus:border-[#0067b8] transition-colors" /> },
                            ].map(({ label, el }) => (
                                <div key={label}>
                                    <div className="text-[11px] text-gray-400 font-bold mb-1 uppercase tracking-wider">{label}</div>
                                    {el}
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Apply button */}
                    <div className="px-4 py-4 border-t border-gray-100 bg-transparent shrink-0">
                        <button onClick={applyBatch}
                            className="w-full bg-[#0067b8] text-white py-3 rounded-md text-[14px] font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm">
                            <CheckCircle2 size={16} />
                            {selectedIds.length}名に一括適用
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto w-full pb-24 pt-4 md:pt-8">
                {/* ── Results Info ── */}
                <div className="flex justify-between items-center px-4 mb-4 text-[12px] text-gray-500 font-medium tracking-tight">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox"
                                checked={paginated.length > 0 && paginated.every(w => selectedIds.includes(w.id))}
                                onChange={toggleSelectAll}
                                className="rounded border-gray-300 text-[#0067b8] focus:ring-[#0067b8]" />
                            すべて選択
                        </label>
                    </div>
                    <span>{filtered.length} 名中 {Math.min(filtered.length, (currentPage - 1) * PAGE_SIZE + 1)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}を表示</span>
                </div>
                {layout === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-3 pb-4">
                        {paginated.map((worker, index) => {
                            const absIndex = (currentPage - 1) * PAGE_SIZE + index
                            return (
                                <div key={worker.id} className="group relative bg-white border border-gray-200 hover:border-blue-400 rounded-md p-4 transition-all duration-200 shadow-sm active:scale-[0.99]">
                                    <div className="absolute top-4 right-4 text-[9px] font-mono text-gray-300">#{absIndex + 1}</div>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-14 h-14 rounded-full border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                                            {worker.avatar_url ? (
                                                <img src={worker.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={28} className="text-gray-300" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <Link href={`/workers/${worker.id}`} className="font-bold text-gray-900 hover:text-blue-600 transition-colors truncate block text-sm">{worker.full_name_romaji}</Link>
                                            <div className="text-[10px] text-blue-600 font-bold truncate mt-0.5">{worker.companies?.name_jp || '未所属'}</div>
                                            <div className="text-[9px] text-gray-400 truncate uppercase tracking-tight">{worker.nationality || '---'}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 mb-4 text-[11px]">
                                        <div className="flex justify-between border-b border-gray-50 pb-1"><span className="text-gray-400 font-bold uppercase tracking-wider">在留資格</span><span className="font-bold text-gray-700 truncate max-w-[120px]">{worker.visa_status || '---'}</span></div>
                                        <div className="flex justify-between border-b border-gray-50 pb-1"><span className="text-gray-400 font-bold uppercase tracking-wider">職種区分</span><span className="font-bold text-gray-700 truncate">{worker.industry_field || '---'}</span></div>
                                        <div className="flex justify-between border-b border-gray-50 pb-1"><span className="text-gray-400 font-bold uppercase tracking-wider">在留期限</span><span className={`font-bold font-mono truncate max-w-[120px] ${worker.zairyu_exp && worker.zairyu_exp <= next90DaysStr ? 'text-rose-600' : 'text-gray-700'}`}>{worker.zairyu_exp ? worker.zairyu_exp.replace(/-/g, '/') : '---'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-400 font-bold uppercase tracking-wider">認修了日</span><span className="font-mono font-bold text-gray-700">{worker.cert_end_date ? worker.cert_end_date.replace(/-/g, '/') : '---'}</span></div>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <select
                                            value={worker.status}
                                            onChange={e => handleChange(worker.id, 'status', e.target.value)}
                                            className="text-[10px] font-bold px-2 py-1 rounded-md border border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors outline-none cursor-pointer">
                                            {Object.entries(reverseStatusMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                        <Link href={`/workers/${worker.id}`} className="text-xs font-bold text-blue-600 hover:underline transition-colors px-2 py-1 rounded hover:bg-blue-50">詳細</Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="mx-4 overflow-hidden border border-gray-300 rounded-md bg-transparent mb-4">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1200px] border-collapse text-left">
                                <thead className="bg-[#0067b8] border-b border-white/20 text-white">
                                    <tr>
                                        <th className="px-4 py-3 w-[40px] border-r border-white/10 text-center">
                                            <input type="checkbox" checked={selectedIds.length === paginated.length && paginated.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-white/30 bg-transparent accent-[#24b47e]" />
                                        </th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[40px] border-r border-white/10 text-white/90">No.</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[240px] border-r border-white/10 text-white/90">人材名 (氏名/カナ)</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[180px] border-r border-white/10 text-white/90">受入企業 / 職種</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[180px] border-r border-white/10 text-white/90">送出機関 / 国籍</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[140px] border-r border-white/10 text-white/90">入国期生 / 入国日</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[140px] border-r border-white/10 text-white/90">在留資格</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[140px] border-r border-white/10 text-white/90">期限 / 修了日</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[130px] border-r border-white/10 text-white/90">旅券 / 保険</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[100px] border-r border-white/10 text-white/90">状態</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-300">
                                    {paginated.length === 0 && (
                                        <tr><td colSpan={10} className="px-5 py-20 text-center text-gray-400 font-medium bg-transparent">データがありません。</td></tr>
                                    )}
                                    {paginated.map((worker, index) => {
                                        const absIndex = (currentPage - 1) * PAGE_SIZE + index + 1
                                        return (
                                            <tr key={worker.id} className={`transition-all duration-150 ${index % 2 === 0 ? 'bg-white hover:bg-blue-50/40' : 'bg-white hover:bg-blue-50/40'}`}>
                                                <td className="px-4 py-3 text-center border-r border-gray-300">
                                                    <input type="checkbox" checked={selectedIds.includes(worker.id)} onChange={() => toggleSelect(worker.id)} className="w-4 h-4 rounded border-gray-300 accent-[#0067b8]" />
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[#0067b8] text-[11px] font-bold border-r border-gray-300 text-center">{absIndex}</td>
                                                <td className="px-4 py-3 border-r border-gray-300">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 shrink-0 rounded-full border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
                                                            {worker.avatar_url ? <img src={worker.avatar_url} className="w-full h-full object-cover" /> : <User size={20} className="text-gray-300" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <Link href={`/workers/${worker.id}`} className="font-bold text-[14px] text-gray-900 hover:text-[#0067b8] transition-colors block truncate">{worker.full_name_romaji}</Link>
                                                            <div className="text-[10px] text-gray-400 uppercase tracking-tight mt-0.5 truncate">{worker.full_name_kana || '---'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border-r border-gray-300">
                                                    <div className="text-[12px] font-bold text-[#0067b8] truncate">{worker.companies?.name_jp || '---'}</div>
                                                    <div className="text-[10px] text-gray-500 font-bold mt-0.5 truncate">{worker.industry_field || '---'}</div>
                                                </td>
                                                <td className="px-4 py-3 border-r border-gray-300">
                                                    <div className="text-[11px] font-bold text-gray-700">{worker.nationality || '---'}</div>
                                                    <div className="text-[10px] text-gray-500 font-bold mt-0.5 truncate" title={worker.sending_org || ''}>{worker.sending_org || '---'}</div>
                                                </td>
                                                <td className="px-4 py-3 border-r border-gray-300">
                                                    <div className="text-[11px] font-bold text-gray-700">{worker.entry_batch || '---'}</div>
                                                    <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{worker.entry_date ? worker.entry_date.replace(/-/g, '/') : '---'}</div>
                                                </td>
                                                <td className="px-4 py-3 border-r border-gray-300">
                                                    <div className="text-[11px] font-bold text-gray-700 truncate" title={worker.visa_status || ''}>{worker.visa_status || '---'}</div>
                                                </td>
                                                <td className="px-4 py-3 border-r border-gray-300">
                                                    <div className="flex flex-col">
                                                        <span className={`text-[11px] font-bold font-mono leading-tight ${worker.zairyu_exp && worker.zairyu_exp <= next90DaysStr ? 'text-rose-600' : 'text-gray-700'}`}>
                                                            {worker.zairyu_exp ? worker.zairyu_exp.replace(/-/g, '/') : '---'}
                                                        </span>
                                                        <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                            <span className="font-mono">{worker.cert_end_date ? worker.cert_end_date.replace(/-/g, '/') : '---'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border-r border-gray-300">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-gray-700 font-mono leading-tight">{worker.passport_exp ? worker.passport_exp.replace(/-/g, '/') : '---'}</span>
                                                        <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                            <span className="font-mono">{worker.insurance_exp ? worker.insurance_exp.replace(/-/g, '/') : '---'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border-r border-gray-300">
                                                    <select
                                                        value={worker.status}
                                                        onChange={e => handleChange(worker.id, 'status', e.target.value)}
                                                        className="appearance-none text-[10px] px-2 py-1 rounded-md font-bold bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100 transition-colors w-full text-center cursor-pointer outline-none">
                                                        {Object.entries(reverseStatusMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
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
