'use client'
import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { DataTableToolbar } from '@/components/DataTableToolbar'
import { UserCircle2, Search, CheckSquare, Square, Loader2, Trash2, Edit3, Users, Clock, Briefcase, AlertTriangle, Plane, ChevronLeft, ChevronRight } from 'lucide-react'
import { bulkUpdateWorkerStatus, bulkDeleteWorkers } from '@/app/actions/operations'
import { ImportModal } from './ImportModal'
import { BulkEditModal } from './BulkEditModal'
import { Worker } from '@/types/schema'

function calculateAge(dob: string | null | undefined): number | null {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Badge config for displaying status badge inside table rows
const STATUS_BADGE: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    waiting: { label: '未入国', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
    standby: { label: '対応中', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
    working: { label: '就業中', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    missing: { label: '失踪', bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-500' },
    returned: { label: '帰国', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
    transferred: { label: '転籍済', bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
}

// 3 tab groups
type TabKey = 'waiting' | 'active' | 'closed'
const TAB_GROUPS: { key: TabKey; label: string; sub: string; statuses: string[]; icon: React.ReactNode }[] = [
    {
        key: 'waiting',
        label: '未入国',
        sub: 'Pre-Entry',
        statuses: ['waiting'],
        icon: <Clock size={14} />,
    },
    {
        key: 'active',
        label: '就業中・対応中',
        sub: 'Working / Standby',
        statuses: ['working', 'standby'],
        icon: <Briefcase size={14} />,
    },
    {
        key: 'closed',
        label: '失踪・帰国・転籍済',
        sub: 'Closed Cases',
        statuses: ['missing', 'returned', 'transferred'],
        icon: <AlertTriangle size={14} />,
    },
]

export default function WorkersListClient({ initialWorkers, role, next90DaysStr }: { initialWorkers: Worker[], role: string, next90DaysStr: string }) {
    const [filtered, setFiltered] = useState(initialWorkers)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isPending, startTransition] = useTransition()
    const [layout, setLayout] = useState<'list' | 'grid'>('list')
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 20

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [companyFilter, setCompanyFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [entryBatchFilter, setEntryBatchFilter] = useState('all')
    const [nationalityFilter, setNationalityFilter] = useState('all')
    const [sortOrder, setSortOrder] = useState('氏名順')

    // Tab group: 'waiting' | 'active' | 'closed'
    const [activeTab, setActiveTab] = useState<TabKey>('active')

    // Extract dynamic options for filters
    const companies = Array.from(new Set(initialWorkers.map(w => w.companies?.name_jp).filter(Boolean))) as string[]
    const companyOptions = Array.from(
        new Map(initialWorkers.filter(w => w.company_id && w.companies?.name_jp).map(w => [w.company_id!, { id: w.company_id!, name_jp: w.companies!.name_jp }])).values()
    )
    const entryBatchesStr = Array.from(new Set(initialWorkers.map(w => {
        if (!w.entry_date) return null;
        const d = new Date(w.entry_date);
        return isNaN(d.getTime()) ? null : `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
    }).filter(Boolean))) as string[]
    const entryBatches = entryBatchesStr.sort((a: string, b: string) => b.localeCompare(a))
    const nationalities = Array.from(new Set(initialWorkers.map(w => w.nationality).filter(Boolean))) as string[]

    // Count per tab group
    const countByTab = (tab: TabKey) => {
        const group = TAB_GROUPS.find(g => g.key === tab)!
        return initialWorkers.filter(w => group.statuses.includes(w.status || '')).length
    }

    // Combined filter logic
    useEffect(() => {
        let result = initialWorkers

        // Filter by tab group (status group)
        const group = TAB_GROUPS.find(g => g.key === activeTab)!
        result = result.filter(w => group.statuses.includes(w.status || ''))

        if (searchTerm) {
            const lower = searchTerm.toLowerCase()
            result = result.filter(w => w.full_name_romaji?.toLowerCase().includes(lower) || w.companies?.name_jp?.toLowerCase().includes(lower))
        }

        if (companyFilter !== 'all') {
            result = result.filter(w => w.companies?.name_jp === companyFilter)
        }

        if (categoryFilter !== 'all') {
            result = result.filter(w => w.system_type === categoryFilter)
        }

        if (entryBatchFilter !== 'all') {
            result = result.filter(w => {
                if (!w.entry_date) return false;
                const d = new Date(w.entry_date);
                if (isNaN(d.getTime())) return false;
                const batchStr = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
                return batchStr === entryBatchFilter;
            })
        }

        if (nationalityFilter !== 'all') {
            result = result.filter(w => w.nationality === nationalityFilter)
        }

        // Apply sorting
        result = [...result].sort((a, b) => {
            if (sortOrder === '氏名順') {
                return (a.full_name_romaji || '').localeCompare(b.full_name_romaji || '')
            } else if (sortOrder === '入国日が新しい順') {
                if (!a.entry_date) return 1; if (!b.entry_date) return -1;
                return b.entry_date.localeCompare(a.entry_date)
            } else if (sortOrder === '入国日が古い順') {
                if (!a.entry_date) return 1; if (!b.entry_date) return -1;
                return a.entry_date.localeCompare(b.entry_date)
            } else if (sortOrder === '在留期限が近い順') {
                if (!a.zairyu_exp) return 1; if (!b.zairyu_exp) return -1;
                return a.zairyu_exp.localeCompare(b.zairyu_exp)
            }
            return 0
        })

        setFiltered(result)
        setSelectedIds([])
        setCurrentPage(1)
    }, [searchTerm, companyFilter, activeTab, categoryFilter, entryBatchFilter, nationalityFilter, sortOrder, initialWorkers])

    const totalPages = Math.ceil(filtered.length / pageSize)
    const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const handleSearch = (term: string) => {
        setSearchTerm(term)
    }

    const toggleSelectAll = () => { if (selectedIds.length === filtered.length) setSelectedIds([]); else setSelectedIds(filtered.map(w => w.id)) }
    const toggleSelect = (id: string) => { if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id)); else setSelectedIds([...selectedIds, id]) }

    const handleBulkStatus = (status: string) => {
        startTransition(async () => { await bulkUpdateWorkerStatus(selectedIds, status); setSelectedIds([]); alert('ステータスを一括更新しました。') })
    }

    const handleBulkEditSuccess = () => {
        setIsBulkEditModalOpen(false)
        setSelectedIds([])
    }

    const handleBulkDelete = () => {
        if (!confirm(`${selectedIds.length}件のデータを一括削除しますか？`)) return
        startTransition(async () => { await bulkDeleteWorkers(selectedIds); setSelectedIds([]); alert('一括削除しました。') })
    }

    const getStatusBadge = (status: string | null | undefined) => {
        const cfg = STATUS_BADGE[status || '']
        if (!cfg) return <span className="text-xs text-slate-400">{status}</span>
        return (
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
            </span>
        )
    }

    const advancedFilters = (
        <>
            <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="h-[32px] w-[115px] bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-1.5 text-[11px] outline-none focus:border-[#24b47e] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">企業名 (すべて)</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
                value={nationalityFilter}
                onChange={(e) => setNationalityFilter(e.target.value)}
                className="h-[32px] w-[110px] bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-1.5 text-[11px] outline-none focus:border-[#24b47e] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">国籍 (すべて)</option>
                {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
            </select>

            <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-[32px] w-[100px] bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-1.5 text-[11px] outline-none focus:border-[#24b47e] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">区分 (すべて)</option>
                <option value="tokuteigino">特定技能</option>
                <option value="ginoshisshu">技能実習</option>
            </select>

            <select
                value={entryBatchFilter}
                onChange={(e) => setEntryBatchFilter(e.target.value)}
                className="h-[32px] w-[115px] bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-1.5 text-[11px] outline-none focus:border-[#24b47e] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">入国期生 (すべて)</option>
                {entryBatches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {(companyFilter !== 'all' || categoryFilter !== 'all' || entryBatchFilter !== 'all' || nationalityFilter !== 'all') && (
                <button
                    onClick={() => {
                        setCompanyFilter('all')
                        setNationalityFilter('all')
                        setCategoryFilter('all')
                        setEntryBatchFilter('all')
                    }}
                    className="text-[11px] text-[#24b47e] hover:text-[#1e9a6a] transition-colors ml-1 font-bold select-none"
                >
                    クリア
                </button>
            )}

            <div className="w-px h-[20px] bg-slate-200 mx-1"></div>

            <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-[32px] w-[125px] bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-1.5 text-[11px] outline-none focus:border-[#24b47e] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="氏名順">並び順: 氏名順</option>
                <option value="入国日が新しい順">入国日が新しい順</option>
                <option value="入国日が古い順">入国日が古い順</option>
                <option value="在留期限が近い順">在留期限が近い</option>
            </select>
        </>
    )

    return (
        <div className="bg-transparent">

            {/* ── Tab Header (styled like 総括一覧) ── */}
            <div className="flex px-6 pt-4 space-x-1 border-b border-slate-200 overflow-x-auto no-scrollbar bg-[#f1f5f9]/30">
                {TAB_GROUPS.map((tab) => {
                    const isActive = activeTab === tab.key
                    const count = countByTab(tab.key)
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-t-[12px] transition-all whitespace-nowrap border-t border-l border-r ${isActive
                                ? 'bg-white text-[#24b47e] border-slate-200 border-b-white relative top-[1px] shadow-sm'
                                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <span className={isActive ? 'text-[#24b47e]' : 'text-slate-400'}>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span className={`text-[10px] font-bold min-w-[20px] h-5 inline-flex items-center justify-center px-1.5 rounded-full ${isActive ? 'bg-[#24b47e]/10 text-[#24b47e]' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* ── Content ── */}
            <div className="flex flex-col gap-5 p-6">

                <DataTableToolbar data={filtered} filename="外国人材リスト" searchPlaceholder="氏名、企業名で検索..." onSearch={handleSearch} type="workers" role={role} addLink="/workers/new" importNode={<ImportModal />} filterNode={advancedFilters} layout={layout} onLayoutChange={setLayout} />

                {
                    selectedIds.length > 0 && (
                        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-[16px] p-4 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2">
                            <span className="text-sm font-bold text-[#198f63] shrink-0">
                                {selectedIds.length} 名を選択中
                            </span>

                            <div className="flex items-center gap-3 border-l border-emerald-200 pl-4 flex-wrap flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 font-bold whitespace-nowrap">ステータス変更:</span>
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) handleBulkStatus(e.target.value);
                                            e.target.value = "";
                                        }}
                                        className="text-xs p-1.5 border border-slate-200 rounded-md outline-none focus:border-[#24b47e] cursor-pointer text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                                        defaultValue=""
                                        disabled={isPending}
                                    >
                                        <option value="" disabled>選択...</option>
                                        <option value="working">就業中</option>
                                        <option value="standby">対応中</option>
                                        <option value="returned">帰国</option>
                                        <option value="waiting">入国待ち</option>
                                        <option value="missing">失踪</option>
                                    </select>
                                </div>

                                <div className="w-px h-4 bg-emerald-200"></div>

                                <button onClick={() => setIsBulkEditModalOpen(true)} className="text-xs font-bold text-[#24b47e] hover:text-[#1e9a6a] flex items-center gap-1 bg-white border border-[#24b47e]/20 px-3 py-1.5 rounded-[10px] transition-all shadow-sm hover:shadow-md active:scale-95">
                                    <Edit3 size={14} /> その他の一括変更
                                </button>


                                {(role === 'admin' || role === 'super_admin') && (
                                    <button onClick={handleBulkDelete} disabled={isPending} className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 bg-white border border-red-200 px-3 py-1.5 rounded-[10px] transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50">
                                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 削除
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                }

                {
                    layout === 'grid' ? (
                        <div className="flex flex-col gap-6 pb-16">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {paginatedData.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-[24px]"><Search size={32} className="mx-auto mb-2 opacity-30" />データがありません。</div>}
                                {paginatedData.map((w) => {
                                    const isChecked = selectedIds.includes(w.id);
                                    return (
                                        <div key={w.id} className={`group relative bg-white border rounded-[24px] p-5 transition-all duration-300 ${isChecked ? 'border-[#24b47e] ring-1 ring-[#24b47e] shadow-sm' : 'border-slate-200 hover:border-[#24b47e] hover:-translate-y-1'}`}>
                                            <button className="absolute top-4 right-4 text-slate-300 hover:text-[#24b47e] transition-colors z-10" onClick={() => toggleSelect(w.id)}>
                                                {isChecked ? <CheckSquare className="text-[#24b47e]" size={20} /> : <Square size={20} />}
                                            </button>
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-[12px] bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 overflow-hidden">
                                                    {w.avatar_url ? <img src={w.avatar_url} className="w-full h-full object-cover" /> : <UserCircle2 size={24} className="text-[#24b47e]" />}
                                                </div>
                                                <div className="pr-6">
                                                    <Link href={`/workers/${w.id}`} className="font-bold text-slate-800 hover:text-[#24b47e] transition-colors line-clamp-1">{w.full_name_romaji}</Link>
                                                    <div className="text-xs text-slate-400 mt-1 line-clamp-1 font-medium">{w.companies?.name_jp || '未配属'}</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider">在留資格</span>
                                                    <span className="font-bold text-slate-700 truncate max-w-[150px]" title={w.visa_status || ''}>{w.visa_status || '-'}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider">受入職種</span>
                                                    <span className="font-bold text-slate-700 truncate max-w-[150px]" title={w.industry_field || ''}>{w.industry_field || '-'}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider">入国日</span>
                                                    <span className="font-mono font-bold text-slate-700">{w.entry_date ? w.entry_date.replace(/-/g, '/') : '-'}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider">在留期限</span>
                                                    <span className={`font-mono font-bold ${w.zairyu_exp && w.zairyu_exp <= next90DaysStr ? 'text-red-500' : 'text-slate-700'}`}>{w.zairyu_exp ? w.zairyu_exp.replace(/-/g, '/') : '-'}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] pt-1">
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider">ステータス</span>
                                                    {getStatusBadge(w.status)}
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <Link href={`/workers/${w.id}`} className="text-xs font-bold text-slate-400 hover:text-[#24b47e] transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-emerald-50">詳細を見る</Link>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            {totalPages > 1 && (
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
                                    <span className="text-[11px] text-slate-400 ml-2">
                                        {filtered.length} 名中 {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} 名
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto pb-16">
                            <table className="w-[1120px] table-fixed border-collapse text-sm text-left">
                                <thead>
                                    <tr className="bg-slate-800">
                                        <th className="px-4 py-3.5 text-center w-[50px]">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === filtered.length && filtered.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 text-[#24b47e] rounded border-slate-300 cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-4 py-3.5 font-bold text-[11px] uppercase tracking-wider w-[260px] text-slate-200">氏名(フリガナ)</th>
                                        <th className="px-4 py-3.5 font-bold text-[11px] uppercase tracking-wider w-[110px] text-slate-200">生年月日/国籍</th>
                                        <th className="px-4 py-3.5 font-bold text-[11px] uppercase tracking-wider w-[270px] text-slate-200">受入企業 / 社宅住所</th>
                                        <th className="px-4 py-3.5 font-bold text-[11px] uppercase tracking-wider w-[100px] text-slate-200">状態/期生</th>
                                        <th className="px-4 py-3.5 font-bold text-[11px] uppercase tracking-wider w-[165px] text-slate-200">在留資格 / 職種</th>
                                        <th className="px-4 py-3.5 font-bold text-[11px] uppercase tracking-wider w-[145px] text-slate-200">入国日 / 在留期限</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-300">
                                    {paginatedData.length === 0 && <tr><td colSpan={7} className="px-5 py-16 text-center text-slate-400 font-medium"><Search size={32} className="mx-auto mb-2 opacity-30" />データがありません。</td></tr>}
                                    {paginatedData.map((w, idx) => {
                                        const isChecked = selectedIds.includes(w.id);
                                        return (
                                            <tr
                                                key={w.id}
                                                className={`
                                                    transition-all duration-150
                                                    ${isChecked
                                                        ? 'bg-emerald-50 border-l-2 border-l-[#24b47e]'
                                                        : idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-slate-50/80'
                                                    }
                                                `}
                                            >
                                                <td className="px-4 py-3.5 text-center align-middle">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleSelect(w.id)}
                                                        className="w-4 h-4 text-[#24b47e] rounded border-slate-300 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-3.5 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold flex items-center justify-center text-sm overflow-hidden shadow-sm">
                                                            {w.avatar_url ? <img src={w.avatar_url} className="w-full h-full object-cover" /> : (w.full_name_romaji || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <Link href={`/workers/${w.id}`} className="block font-bold text-slate-800 hover:text-[#24b47e] transition-colors leading-snug truncate" title={w.full_name_romaji || ''}>{w.full_name_romaji}</Link>
                                                            {w.full_name_kana && <div className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug truncate">{w.full_name_kana}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 align-middle">
                                                    <div className="font-mono text-[13px] text-slate-800 font-bold whitespace-nowrap">{w.dob ? w.dob.replace(/-/g, '/') : '-'}</div>
                                                    <div className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap font-bold uppercase tracking-wider">{w.nationality || '-'}</div>
                                                </td>
                                                <td className="px-4 py-3.5 align-middle">
                                                    <div className="font-bold text-slate-800 text-[13px] leading-snug truncate" title={w.companies?.name_jp || '未配属'}>{w.companies?.name_jp || '未配属'}</div>
                                                    <div className="text-[11px] text-slate-400 font-medium leading-snug truncate mt-0.5" title={w.address ? `社宅：${w.address}` : ''}>{w.address ? `社宅：${w.address}` : '-'}</div>
                                                </td>
                                                <td className="px-4 py-3.5 align-middle">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        {getStatusBadge(w.status)}
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-0.5">{w.entry_batch ? `${w.entry_batch}期生` : '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 align-middle">
                                                    <div className="text-[13px] font-bold text-slate-800 truncate" title={w.visa_status || ''}>{w.visa_status || '-'}</div>
                                                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider truncate mt-0.5" title={w.industry_field || ''}>{w.industry_field || '-'}</div>
                                                </td>
                                                <td className="px-4 py-3.5 align-middle">
                                                    <div className="font-mono text-[12px] text-slate-800 font-bold whitespace-nowrap">入: {w.entry_date ? w.entry_date.replace(/-/g, '/') : '-'}</div>
                                                    <div className={`font-mono text-[12px] mt-0.5 whitespace-nowrap font-bold ${w.zairyu_exp && w.zairyu_exp <= next90DaysStr ? 'text-red-500' : 'text-slate-400'}`}>期: {w.zairyu_exp ? w.zairyu_exp.replace(/-/g, '/') : '-'}</div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {totalPages > 1 && (
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
                                    <span className="text-[11px] text-slate-400 ml-2">
                                        {filtered.length} 名中 {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} 名
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                }
            </div>

            {isBulkEditModalOpen && (
                <BulkEditModal
                    selectedIds={selectedIds}
                    onClose={() => setIsBulkEditModalOpen(false)}
                    onSuccess={handleBulkEditSuccess}
                    companies={companyOptions}
                />
            )}
        </div>
    )
}
