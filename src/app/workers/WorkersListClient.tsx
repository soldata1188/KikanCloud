'use client'
import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { DataTableToolbar } from '@/components/DataTableToolbar'
import { UserCircle2, AlertCircle, Search, CheckSquare, Square, Loader2, Play, Trash2, FileText, Eye, Edit3 } from 'lucide-react'
import { DeleteButton } from '@/components/SubmitButtons'
import { deleteWorker } from './actions'
import { bulkUpdateWorkerStatus, bulkDeleteWorkers } from '@/app/actions/operations'
import * as XLSX from 'xlsx'
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

export default function WorkersListClient({ initialWorkers, role, next90DaysStr }: { initialWorkers: Worker[], role: string, next90DaysStr: string }) {
    const [filtered, setFiltered] = useState(initialWorkers)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isPending, startTransition] = useTransition()
    const [layout, setLayout] = useState<'list' | 'grid'>('list')
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [companyFilter, setCompanyFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [entryBatchFilter, setEntryBatchFilter] = useState('all')
    const [nationalityFilter, setNationalityFilter] = useState('all')
    const [sortOrder, setSortOrder] = useState('氏名順')

    const STATUS_MAP: Record<string, string> = {
        'all': '全ステータス',
        'waiting': '入国待ち',
        'standby': '対応中',
        'working': '就業中',
        'missing': '失踪',
        'returned': '帰国',
        'transferred': '転籍済',
    };
    const STATUS_KEYS = ['all', 'waiting', 'standby', 'working', 'missing', 'returned'];
    const DEFAULT_STATUSES = ['waiting', 'standby', 'working'];

    const [activeStatuses, setActiveStatuses] = useState<string[]>(DEFAULT_STATUSES);

    const toggleStatus = (statusKey: string) => {
        if (statusKey === 'all') {
            setActiveStatuses(['all']);
            return;
        }

        let newStatuses = activeStatuses.filter(s => s !== 'all');
        if (newStatuses.includes(statusKey)) {
            newStatuses = newStatuses.filter(s => s !== statusKey);
        } else {
            newStatuses.push(statusKey);
        }

        if (newStatuses.length === 0) {
            setActiveStatuses(DEFAULT_STATUSES);
        } else {
            setActiveStatuses(newStatuses);
        }
    };

    // Extract dynamic options for filters
    const companies = Array.from(new Set(initialWorkers.map(w => w.companies?.name_jp).filter(Boolean))) as string[]
    const entryBatchesStr = Array.from(new Set(initialWorkers.map(w => {
        if (!w.entry_date) return null;
        const d = new Date(w.entry_date);
        return isNaN(d.getTime()) ? null : `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
    }).filter(Boolean))) as string[]
    const entryBatches = entryBatchesStr.sort((a: string, b: string) => b.localeCompare(a))
    const nationalities = Array.from(new Set(initialWorkers.map(w => w.nationality).filter(Boolean))) as string[]

    // Combined filter logic
    useEffect(() => {
        let result = initialWorkers

        if (searchTerm) {
            const lower = searchTerm.toLowerCase()
            result = result.filter(w => w.full_name_romaji?.toLowerCase().includes(lower) || w.companies?.name_jp?.toLowerCase().includes(lower))
        }

        if (companyFilter !== 'all') {
            result = result.filter(w => w.companies?.name_jp === companyFilter)
        }

        if (!activeStatuses.includes('all')) {
            result = result.filter(w => activeStatuses.includes(w.status || ''))
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
        setSelectedIds([]) // Reset selection on filter change
    }, [searchTerm, companyFilter, activeStatuses, categoryFilter, entryBatchFilter, nationalityFilter, sortOrder, initialWorkers])

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

    const generateLegalRoster = () => {
        const selectedData = filtered.filter(w => selectedIds.includes(w.id))
        const exportData = selectedData.map((w, index) => ({
            '整理番号': index + 1, '氏名 (ローマ字)': w.full_name_romaji, '氏名 (カタカナ)': w.full_name_kana || '',
            '生年月日': w.dob?.replace(/-/g, '/') || '', '国籍': w.nationality || '', '性別': w.gender === 'male' ? '男' : w.gender === 'female' ? '女' : '',
            '在留資格区分': w.system_type === 'tokuteigino' ? '特定技能' : w.system_type === 'ikusei_shuro' ? '育成就労' : '技能実習',
            '在留カード番号': w.zairyu_no || '', 'パスポート有効期限': w.passport_exp?.replace(/-/g, '/') || '',
            '実習実施者名': w.companies?.name_jp || '', '状況': w.status === 'working' ? '就業中' : w.status === 'standby' ? '対応中' : 'その他'
        }))
        const ws = XLSX.utils.json_to_sheet(exportData)
        ws['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 10 }]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "技能実習生等名簿")
        XLSX.writeFile(wb, `技能実習生等名簿_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const advancedFilters = (
        <>
            <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-gray-350 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">企業名 (すべて)</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
                value={nationalityFilter}
                onChange={(e) => setNationalityFilter(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-gray-350 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">国籍 (すべて)</option>
                {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
            </select>



            <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-gray-350 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">区分 (すべて)</option>
                <option value="tokuteigino">特定技能</option>
                <option value="ginoshisshu">技能実習</option>
            </select>

            <select
                value={entryBatchFilter}
                onChange={(e) => setEntryBatchFilter(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-gray-350 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">入国期生 (すべて)</option>
                {entryBatches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {(companyFilter !== 'all' || categoryFilter !== 'all' || entryBatchFilter !== 'all' || nationalityFilter !== 'all' || (activeStatuses.length !== DEFAULT_STATUSES.length || !DEFAULT_STATUSES.every(s => activeStatuses.includes(s)))) && (
                <button
                    onClick={() => {
                        setCompanyFilter('all')
                        setNationalityFilter('all')
                        setActiveStatuses(DEFAULT_STATUSES)
                        setCategoryFilter('all')
                        setEntryBatchFilter('all')
                    }}
                    className="text-[12px] text-[#24b47e] hover:text-[#1e9a6a] transition-colors ml-1 font-medium select-none"
                >
                    クリア
                </button>
            )}

            <div className="w-px h-[24px] bg-gray-300 mx-1"></div>

            <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-gray-350 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="氏名順">並び順: 氏名順</option>
                <option value="入国日が新しい順">入国日が新しい順</option>
                <option value="入国日が古い順">入国日が古い順</option>
                <option value="在留期限が近い順">在留期限が近い</option>
            </select>
        </>
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-6 mt-2 ml-2">
                {STATUS_KEYS.map(statusKey => {
                    const count = statusKey === 'all' ? initialWorkers.length : initialWorkers.filter(w => w.status === statusKey).length;
                    const isActive = activeStatuses.includes(statusKey);
                    return (
                        <div
                            key={statusKey}
                            onClick={() => toggleStatus(statusKey)}
                            className="group relative flex flex-col min-w-[120px] pr-4 py-2 cursor-pointer transition-all duration-200 ease-out"
                        >
                            <div className="flex justify-between items-center mb-1.5">
                                <span className={`text-sm font-bold tracking-wide transition-colors ${isActive ? 'text-[#198f63]' : 'text-gray-500 group-hover:text-gray-800'}`}>
                                    {STATUS_MAP[statusKey] || statusKey}
                                </span>
                                <div className={`relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors duration-300 ${isActive ? 'bg-[#24b47e] shadow-inner' : 'bg-gray-200 group-hover:bg-gray-300'}`}>
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${isActive ? 'translate-x-[16px]' : 'translate-x-[3px]'}`} />
                                </div>
                            </div>

                            <div className="flex items-baseline gap-1.5">
                                <span className={`text-3xl font-black font-sans tracking-tight transition-colors ${isActive ? 'text-[#13734e]' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                    {count}
                                </span>
                                <span className={`text-sm font-medium transition-colors ${isActive ? 'text-[#24b47e]' : 'text-gray-400 group-hover:text-gray-500'}`}>名</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <DataTableToolbar data={filtered} filename="外国人材リスト" searchPlaceholder="氏名、企業名で検索..." onSearch={handleSearch} type="workers" role={role} addLink="/workers/new" importNode={<ImportModal />} filterNode={advancedFilters} layout={layout} onLayoutChange={setLayout} />

            {selectedIds.length > 0 && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-semibold text-green-800 shrink-0">
                        {selectedIds.length} 件選択中
                    </span>

                    <div className="flex items-center gap-3 border-l border-green-200 pl-4 flex-wrap flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap">ステータス変更:</span>
                            <select
                                onChange={(e) => {
                                    if (e.target.value) handleBulkStatus(e.target.value);
                                    e.target.value = "";
                                }}
                                className="text-xs p-1.5 border border-gray-300 rounded outline-none focus:border-green-500 cursor-pointer text-gray-700 bg-white"
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

                        <div className="w-px h-4 bg-gray-300"></div>

                        <button onClick={() => setIsBulkEditModalOpen(true)} className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-white border border-primary-200 px-2.5 py-1.5 rounded transition-colors shadow-sm">
                            <Edit3 size={14} /> その他の一括変更
                        </button>

                        <div className="flex-1"></div>

                        <button onClick={generateLegalRoster} className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 bg-white border border-green-200 px-2.5 py-1.5 rounded transition-colors shadow-sm">
                            <FileText size={14} /> 名簿出力
                        </button>

                        {(role === 'admin' || role === 'super_admin') && (
                            <button onClick={handleBulkDelete} disabled={isPending} className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 bg-white border border-red-200 px-2.5 py-1.5 rounded transition-colors shadow-sm disabled:opacity-50">
                                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 削除
                            </button>
                        )}
                    </div>
                </div>
            )}

            {layout === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">
                    {filtered.length === 0 && <div className="col-span-full py-12 text-center text-[#878787] bg-white border border-gray-350 rounded-md"><Search size={32} className="mx-auto mb-2 opacity-30" />データがありません。</div>}
                    {filtered.map((w) => {
                        const isExpiring = (w.passport_exp && w.passport_exp <= next90DaysStr) || (w.cert_end_date && w.cert_end_date <= next90DaysStr);
                        const isChecked = selectedIds.includes(w.id);
                        return (
                            <div key={w.id} className={`group relative bg-white border rounded-md p-5 transition-colors duration-200 ${isChecked ? 'border-[#24b47e] ring-1 ring-[#24b47e]' : 'border-gray-350 hover:border-[#24b47e]'}`}>
                                <button className="absolute top-4 right-4 text-gray-300 hover:text-[#24b47e] transition-colors z-10" onClick={() => toggleSelect(w.id)}>
                                    {isChecked ? <CheckSquare className="text-[#24b47e]" size={20} /> : <Square size={20} />}
                                </button>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-md bg-gray-50 flex items-center justify-center shrink-0 border border-gray-350 overflow-hidden">
                                        {w.avatar_url ? <img src={w.avatar_url} className="w-full h-full object-cover" /> : <UserCircle2 size={24} className="text-[#878787]" />}
                                    </div>
                                    <div className="pr-6">
                                        <Link href={`/workers/${w.id}`} className="font-bold text-[#1f1f1f] hover:text-[#24b47e] transition-colors line-clamp-1">{w.full_name_romaji}</Link>
                                        <div className="text-xs text-[#878787] mt-1 line-clamp-1">{w.companies?.name_jp || '未配属'}</div>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[#878787]">在留資格</span>
                                        <span className="font-medium text-[#1f1f1f] truncate max-w-[150px]" title={w.visa_status || ''}>{w.visa_status || '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs mt-2">
                                        <span className="text-[#878787]">受入職種</span>
                                        <span className="font-medium text-[#1f1f1f] truncate max-w-[150px]" title={w.industry_field || ''}>{w.industry_field || '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs mt-2">
                                        <span className="text-[#878787]">入国日</span>
                                        <span className="font-mono font-medium text-[#1f1f1f]">{w.entry_date ? w.entry_date.replace(/-/g, '/') : '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs mt-2">
                                        <span className="text-[#878787]">在留期限</span>
                                        <span className={`font-mono font-medium ${w.zairyu_exp && w.zairyu_exp <= next90DaysStr ? 'text-red-600' : 'text-[#1f1f1f]'}`}>{w.zairyu_exp ? w.zairyu_exp.replace(/-/g, '/') : '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs mt-2">
                                        <span className="text-[#878787]">生年月日/国籍</span>
                                        <span className="font-mono font-medium text-[#1f1f1f]">
                                            {w.dob ? w.dob.replace(/-/g, '/') : '-'} <span className="font-sans text-gray-500 ml-1">{w.nationality || ''}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[#878787]">ステータス</span>
                                        <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold uppercase tracking-widest bg-transparent ${w.status === 'working' ? 'border-[#24b47e] text-[#24b47e]' : 'border-gray-350 text-[#878787]'}`}>
                                            {w.status === 'working' ? '就業中' : w.status === 'standby' ? '対応中' : w.status === 'returned' ? '帰国' : w.status === 'waiting' ? '入国待ち' : w.status === 'missing' ? '失踪' : w.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-350 flex items-center justify-between">
                                    <Link href={`/workers/${w.id}`} className="text-xs font-medium text-[#878787] hover:text-[#24b47e] transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-[#24b47e]/5">詳細を見る</Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="overflow-x-auto pb-16">
                    <table className="w-full border-collapse text-sm text-left whitespace-nowrap">
                        <thead className="bg-gray-50 text-gray-800">
                            <tr>
                                <th className="border border-gray-350 px-4 py-3 text-center w-[40px] shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === filtered.length && filtered.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 text-primary-600 rounded border-gray-300 cursor-pointer"
                                    />
                                </th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold w-[280px]">氏名(フリガナ)</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold">生年月日/国籍</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold w-[280px]">受入企業 / 社宅住所</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold">ステータス / 期生</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold">在留資格 / 職種</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold">入国日 / 在留期限</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold">送出機関 / 保険期限</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && <tr><td colSpan={8} className="border border-gray-350 px-5 py-12 text-center text-[#878787]"><Search size={32} className="mx-auto mb-2 opacity-30" />データがありません。</td></tr>}
                            {filtered.map((w) => {
                                const isExpiring = (w.passport_exp && w.passport_exp <= next90DaysStr) || (w.cert_end_date && w.cert_end_date <= next90DaysStr);
                                const isChecked = selectedIds.includes(w.id);
                                return (
                                    <tr key={w.id} className={`transition-colors hover:bg-gray-50 ${isChecked ? 'bg-green-50/50' : ''}`}>
                                        <td className="border border-gray-350 px-4 py-3 text-center align-top pt-5">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleSelect(w.id)}
                                                className="w-4 h-4 text-primary-600 rounded border-gray-300 cursor-pointer"
                                            />
                                        </td>
                                        <td className="border border-gray-350 px-4 py-3 align-top">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 shrink-0 rounded-md bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-lg overflow-hidden border border-primary-200">
                                                        {w.avatar_url ? <img src={w.avatar_url} className="w-full h-full object-cover" /> : (w.full_name_romaji || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <Link href={`/workers/${w.id}`} className="group block" title={`${w.full_name_romaji} ${w.full_name_kana ? ` ${w.full_name_kana}` : ''}`}>
                                                            <div className="font-semibold text-gray-900 group-hover:text-[#24b47e] transition-colors truncate">{w.full_name_romaji}</div>
                                                            {w.full_name_kana && <div className="text-[11px] text-gray-400 font-normal mt-0.5 truncate">{w.full_name_kana}</div>}
                                                        </Link>

                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="border border-gray-350 px-4 py-3 align-top">
                                            <div className="font-mono text-[13px] text-gray-900 font-medium whitespace-nowrap">{w.dob ? w.dob.replace(/-/g, '/') : '-'}</div>
                                            <div className="text-xs text-gray-500 mt-1 whitespace-nowrap font-medium">{w.nationality || '-'}</div>
                                        </td>
                                        <td className="border border-gray-350 px-4 py-3 align-top">
                                            <div className="flex flex-col gap-1 items-start w-full">
                                                <div className="font-semibold text-gray-900 text-[13px] truncate" title={w.companies?.name_jp || '未配属'}>
                                                    {w.companies?.name_jp || '未配属'}
                                                </div>
                                                <div className="text-[11px] text-gray-500 truncate w-full" title={w.address ? `社宅：${w.address}` : ''}>
                                                    {w.address ? `社宅：${w.address}` : '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="border border-gray-350 px-4 py-3 align-top">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className={`text-[13px] font-bold ${w.status === 'working' ? 'text-[#24b47e]' : w.status === 'standby' ? 'text-amber-500' : w.status === 'returned' ? 'text-gray-500' : w.status === 'missing' ? 'text-red-500' : 'text-gray-500'}`}>{w.status === 'working' ? '就業中' : w.status === 'standby' ? '対応中' : w.status === 'returned' ? '帰国' : w.status === 'waiting' ? '入国待ち' : w.status === 'missing' ? '失踪' : w.status}</span>
                                                <span className="text-xs text-gray-400 font-medium">{w.entry_batch ? `${w.entry_batch}期生` : '-'}</span>
                                            </div>
                                        </td>
                                        <td className="border border-gray-350 px-4 py-3 align-top">
                                            <div className="flex flex-col gap-1 inline-flex w-full">
                                                <div className="text-[13px] font-medium text-gray-900 truncate">
                                                    {w.visa_status || '-'}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={w.industry_field || ''}>
                                                    {w.industry_field || '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="border border-gray-350 px-4 py-3 align-top">
                                            <div className="font-mono text-xs text-gray-900 font-medium whitespace-nowrap">入: {w.entry_date ? w.entry_date.replace(/-/g, '/') : '-'}</div>
                                            <div className={`font-mono text-xs mt-1 whitespace-nowrap font-medium ${w.zairyu_exp && w.zairyu_exp <= next90DaysStr ? 'text-red-600' : 'text-gray-500'}`}>期: {w.zairyu_exp ? w.zairyu_exp.replace(/-/g, '/') : '-'}</div>
                                        </td>

                                        <td className="border border-gray-350 px-4 py-3 align-top">
                                            <div className="font-semibold text-gray-900 text-[13px] truncate max-w-[150px]" title={w.sending_org || ''}>{w.sending_org || '-'}</div>
                                            <div className={`font-mono text-xs mt-1 whitespace-nowrap font-medium ${w.insurance_exp && w.insurance_exp <= next90DaysStr ? 'text-red-600' : 'text-gray-500'}`}>保: {w.insurance_exp ? w.insurance_exp.replace(/-/g, '/') : '-'}</div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {isBulkEditModalOpen && (
                <BulkEditModal
                    selectedIds={selectedIds}
                    onClose={() => setIsBulkEditModalOpen(false)}
                    onSuccess={handleBulkEditSuccess}
                />
            )}
        </div>
    )
}
