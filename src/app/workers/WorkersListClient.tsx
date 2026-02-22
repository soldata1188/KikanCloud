'use client'
import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { DataTableToolbar } from '@/components/DataTableToolbar'
import { UserCircle2, AlertCircle, Search, CheckSquare, Square, Loader2, Play, Trash2, FileText } from 'lucide-react'
import { DeleteButton } from '@/components/SubmitButtons'
import { deleteWorker } from './actions'
import { bulkUpdateWorkerStatus, bulkDeleteWorkers } from '@/app/actions/operations'
import * as XLSX from 'xlsx'
import { ImportModal } from './ImportModal'
import { Worker } from '@/types/schema'

export default function WorkersListClient({ initialWorkers, role, next90DaysStr }: { initialWorkers: Worker[], role: string, next90DaysStr: string }) {
    const [filtered, setFiltered] = useState(initialWorkers)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isPending, startTransition] = useTransition()
    const [layout, setLayout] = useState<'list' | 'grid'>('list')

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [companyFilter, setCompanyFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [entryBatchFilter, setEntryBatchFilter] = useState('all')

    // Extract dynamic options for filters
    const companies = Array.from(new Set(initialWorkers.map(w => w.companies?.name_jp).filter(Boolean))) as string[]
    const entryBatchesStr = Array.from(new Set(initialWorkers.map(w => {
        if (!w.entry_date) return null;
        const d = new Date(w.entry_date);
        return isNaN(d.getTime()) ? null : `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
    }).filter(Boolean))) as string[]
    const entryBatches = entryBatchesStr.sort((a: string, b: string) => b.localeCompare(a))

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

        if (statusFilter !== 'all') {
            result = result.filter(w => w.status === statusFilter)
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

        setFiltered(result)
        setSelectedIds([]) // Reset selection on filter change
    }, [searchTerm, companyFilter, statusFilter, categoryFilter, entryBatchFilter, initialWorkers])

    const handleSearch = (term: string) => {
        setSearchTerm(term)
    }

    const toggleSelectAll = () => { if (selectedIds.length === filtered.length) setSelectedIds([]); else setSelectedIds(filtered.map(w => w.id)) }
    const toggleSelect = (id: string) => { if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id)); else setSelectedIds([...selectedIds, id]) }

    const handleBulkStatus = (status: string) => {
        startTransition(async () => { await bulkUpdateWorkerStatus(selectedIds, status); setSelectedIds([]); alert('ステータスを一括更新しました。') })
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
            '実習実施者名': w.companies?.name_jp || '', '状況': w.status === 'working' ? '就業中' : w.status === 'standby' ? '待機中' : 'その他'
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
                className="h-[32px] w-[140px] bg-white border border-gray-200 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">企業名 (すべて)</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-gray-200 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">ステータス (すべて)</option>
                <option value="working">就業中</option>
                <option value="standby">待機中</option>
                <option value="returned">帰国</option>
                <option value="waiting">入国待ち</option>
                <option value="missing">失踪</option>
            </select>

            <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-gray-200 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">区分 (すべて)</option>
                <option value="tokuteigino">特定技能</option>
                <option value="ginoshisshu">技能実習</option>
            </select>

            <select
                value={entryBatchFilter}
                onChange={(e) => setEntryBatchFilter(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-gray-200 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">入国期生 (すべて)</option>
                {entryBatches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {(companyFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' || entryBatchFilter !== 'all') && (
                <button
                    onClick={() => {
                        setCompanyFilter('all')
                        setStatusFilter('all')
                        setCategoryFilter('all')
                        setEntryBatchFilter('all')
                    }}
                    className="text-[12px] text-[#24b47e] hover:text-[#1e9a6a] transition-colors ml-1 font-medium select-none"
                >
                    クリア
                </button>
            )}
        </>
    )

    return (
        <>
            <DataTableToolbar data={filtered} filename="外国人材リスト" searchPlaceholder="氏名、企業名で検索..." onSearch={handleSearch} type="workers" role={role} addLink="/workers/new" importNode={<ImportModal />} filterNode={advancedFilters} layout={layout} onLayoutChange={setLayout} />

            {layout === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">
                    {filtered.length === 0 && <div className="col-span-full py-12 text-center text-[#878787] bg-white border border-gray-300 rounded-xl"><Search size={32} className="mx-auto mb-2 opacity-30" />データがありません。</div>}
                    {filtered.map((w) => {
                        const isExpiring = (w.passport_exp && w.passport_exp <= next90DaysStr) || (w.cert_end_date && w.cert_end_date <= next90DaysStr);
                        const isChecked = selectedIds.includes(w.id);
                        return (
                            <div key={w.id} className={`group relative bg-white border rounded-xl p-5 transition-colors duration-200 ${isChecked ? 'border-[#24b47e] ring-1 ring-[#24b47e]' : 'border-gray-300 hover:border-[#24b47e]'}`}>
                                <button className="absolute top-4 right-4 text-gray-300 hover:text-[#24b47e] transition-colors z-10" onClick={() => toggleSelect(w.id)}>
                                    {isChecked ? <CheckSquare className="text-[#24b47e]" size={20} /> : <Square size={20} />}
                                </button>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-300 overflow-hidden">
                                        {w.avatar_url ? <img src={w.avatar_url} className="w-full h-full object-cover" /> : <UserCircle2 size={24} className="text-[#878787]" />}
                                    </div>
                                    <div className="pr-6">
                                        <Link href={`/workers/${w.id}/edit`} className="font-bold text-[#1f1f1f] hover:text-[#24b47e] transition-colors line-clamp-1">{w.full_name_romaji}</Link>
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
                                        <span className="text-[#878787]">認定修了日</span>
                                        <span className={`font-mono font-medium ${w.cert_end_date && w.cert_end_date <= next90DaysStr ? 'text-red-600' : 'text-[#1f1f1f]'}`}>{w.cert_end_date ? w.cert_end_date.replace(/-/g, '/') : '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[#878787]">ステータス</span>
                                        <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-widest bg-transparent ${w.status === 'working' ? 'border-[#24b47e] text-[#24b47e]' : 'border-gray-300 text-[#878787]'}`}>
                                            {w.status === 'working' ? '就業中' : w.status === 'standby' ? '待機中' : w.status === 'returned' ? '帰国' : w.status === 'waiting' ? '入国待ち' : w.status === 'missing' ? '失踪' : w.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-300 flex items-center justify-between">
                                    <Link href={`/workers/${w.id}/edit`} className="text-xs font-medium text-[#878787] hover:text-[#24b47e] transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-[#24b47e]/5">詳細を見る</Link>
                                    {role === 'admin' && (
                                        <form action={deleteWorker}>
                                            <input type="hidden" name="id" value={w.id} />
                                            <DeleteButton />
                                        </form>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-white border border-gray-300 rounded-xl overflow-hidden relative pb-16">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px] text-[#1f1f1f] whitespace-nowrap">
                            <thead className="bg-white border-b border-gray-300 text-[11px] font-medium text-[#878787] uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3 font-medium w-10 cursor-pointer" onClick={toggleSelectAll}>{selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="text-[#24b47e]" size={16} /> : <Square className="text-gray-300" size={16} />}</th>
                                    <th className="px-5 py-3 font-medium">氏名 / 企業名</th><th className="px-5 py-3 font-medium">在留資格 / 職種</th><th className="px-5 py-3 font-medium">入国日 / 在留期限</th><th className="px-5 py-3 font-medium">認定修了日</th><th className="px-5 py-3 font-medium">ステータス</th><th className="px-5 py-3 font-medium text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#ededed]">
                                {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#878787]"><Search size={32} className="mx-auto mb-2 opacity-30" />データがありません。</td></tr>}
                                {filtered.map((w) => {
                                    const isExpiring = (w.passport_exp && w.passport_exp <= next90DaysStr) || (w.cert_end_date && w.cert_end_date <= next90DaysStr);
                                    const isChecked = selectedIds.includes(w.id);
                                    return (
                                        <tr key={w.id} className={`transition-colors group ${isChecked ? 'bg-[#24b47e]/5' : 'hover:bg-gray-50'}`}>
                                            <td className="px-5 py-3.5 cursor-pointer" onClick={() => toggleSelect(w.id)}>{isChecked ? <CheckSquare className="text-[#24b47e]" size={16} /> : <Square className="text-gray-300" size={16} />}</td>
                                            <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-300 overflow-hidden">{w.avatar_url ? <img src={w.avatar_url} className="w-full h-full object-cover" /> : <UserCircle2 size={16} className="text-[#878787]" />}</div><div><Link href={`/workers/${w.id}/edit`} className="font-medium text-[#1f1f1f] hover:text-[#24b47e] transition-colors">{w.full_name_romaji}</Link><div className="text-[11px] text-[#878787] mt-0.5">{w.companies?.name_jp || '未配属'}</div></div></div></td>
                                            <td className="px-5 py-3.5">
                                                <div className="text-xs text-[#1f1f1f] whitespace-nowrap">{w.visa_status || '-'}</div>
                                                <div className="text-[11px] text-[#878787] mt-0.5 truncate max-w-[150px]" title={w.industry_field || ''}>{w.industry_field || '-'}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="font-mono text-xs text-[#1f1f1f] whitespace-nowrap">{w.entry_date ? w.entry_date.replace(/-/g, '/') : '-'}</div>
                                                <div className={`font-mono text-[11px] mt-0.5 whitespace-nowrap ${w.zairyu_exp && w.zairyu_exp <= next90DaysStr ? 'text-red-600 font-medium' : 'text-[#878787]'}`}>{w.zairyu_exp ? w.zairyu_exp.replace(/-/g, '/') : '-'}</div>
                                            </td>
                                            <td className="px-5 py-3.5"><span className="font-mono text-xs text-[#1f1f1f] whitespace-nowrap">{w.cert_end_date ? w.cert_end_date.replace(/-/g, '/') : '-'}</span></td>
                                            <td className="px-5 py-3.5"><span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-widest bg-transparent ${w.status === 'working' ? 'border-[#24b47e] text-[#24b47e]' : 'border-gray-300 text-[#878787]'}`}>{w.status === 'working' ? '就業中' : w.status === 'standby' ? '待機中' : w.status === 'returned' ? '帰国' : w.status === 'waiting' ? '入国待ち' : w.status === 'missing' ? '失踪' : w.status}</span></td>
                                            <td className="px-5 py-3.5 text-right"><div className="flex items-center justify-end gap-2"><Link href={`/workers/${w.id}/edit`} className="px-2 py-1 flex items-center gap-1 rounded-md text-[12px] font-medium text-[#878787] hover:text-[#24b47e] hover:bg-gray-50 transition-colors mr-1">詳細</Link>{role === 'admin' && (<form action={deleteWorker} className="inline-block"><input type="hidden" name="id" value={w.id} /><DeleteButton /></form>)}</div></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white shadow-sm rounded-full px-6 py-3 border border-gray-700 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="flex items-center gap-2 font-bold text-sm bg-white/10 px-3 py-1.5 rounded-full"><CheckSquare size={16} className="text-[#24b47e]" /> {selectedIds.length}名を選択中</div>
                    <div className="w-px h-6 bg-gray-700"></div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => handleBulkStatus('working')} disabled={isPending} className="text-sm font-bold text-green-400 hover:text-green-300 flex items-center gap-1 disabled:opacity-50"><Play size={16} /> 就業中へ</button>
                        <button onClick={() => handleBulkStatus('standby')} disabled={isPending} className="text-sm font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 disabled:opacity-50"><Play size={16} /> 待機中へ</button>
                        <button onClick={() => handleBulkStatus('returned')} disabled={isPending} className="text-sm font-bold text-[#878787] hover:text-white flex items-center gap-1 disabled:opacity-50"><Play size={16} /> 帰国へ</button>
                        <div className="w-px h-6 bg-gray-700 mx-1"></div>
                        <button onClick={generateLegalRoster} className="text-sm font-bold text-[#24b47e] hover:text-[#1e9a6a] flex items-center gap-1"><FileText size={16} /> 名簿出力</button>
                        {(role === 'admin' || role === 'super_admin') && (
                            <>
                                <div className="w-px h-6 bg-gray-700 mx-1"></div>
                                <button onClick={handleBulkDelete} disabled={isPending} className="text-sm font-bold text-red-400 hover:text-red-300 flex items-center gap-1 disabled:opacity-50">{isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 削除</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
