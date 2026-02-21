'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { DataTableToolbar } from '@/components/DataTableToolbar'
import { UserCircle2, AlertCircle, Search, CheckSquare, Square, Loader2, Play, Trash2, FileText } from 'lucide-react'
import { DeleteButton } from '@/components/SubmitButtons'
import { deleteWorker } from './actions'
import { bulkUpdateWorkerStatus, bulkDeleteWorkers } from '@/app/actions/operations'
import * as XLSX from 'xlsx'

export default function WorkersListClient({ initialWorkers, role, next90DaysStr }: { initialWorkers: any[], role: string, next90DaysStr: string }) {
    const [filtered, setFiltered] = useState(initialWorkers)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isPending, startTransition] = useTransition()

    const handleSearch = (term: string) => {
        const lower = term.toLowerCase()
        setFiltered(initialWorkers.filter(w => w.full_name_romaji?.toLowerCase().includes(lower) || w.companies?.name_jp?.toLowerCase().includes(lower)))
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
            '実習実施者名': w.companies?.name_jp || '', '状況': w.status === 'working' ? '就業中' : 'その他'
        }))
        const ws = XLSX.utils.json_to_sheet(exportData)
        ws['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 10 }]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "技能実習生等名簿")
        XLSX.writeFile(wb, `技能実習生等名簿_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    return (
        <>
            <DataTableToolbar data={filtered} filename="外国人材リスト" searchPlaceholder="氏名、企業名で検索..." onSearch={handleSearch} type="workers" role={role} addLink="/workers/new" />
            <div className="bg-white border border-[#ededed] rounded-lg shadow-sm overflow-hidden relative pb-16">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px] text-[#1f1f1f] whitespace-nowrap">
                        <thead className="bg-[#fbfcfd] border-b border-[#ededed] text-[11px] font-medium text-[#878787] uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3 font-medium w-10 cursor-pointer" onClick={toggleSelectAll}>{selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="text-[#24b47e]" size={16} /> : <Square className="text-gray-300" size={16} />}</th>
                                <th className="px-5 py-3 font-medium">氏名 / 企業名</th><th className="px-5 py-3 font-medium">区分</th><th className="px-5 py-3 font-medium">在留カード</th><th className="px-5 py-3 font-medium">パスポート期限</th><th className="px-5 py-3 font-medium">ステータス</th><th className="px-5 py-3 font-medium text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ededed]">
                            {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#878787]"><Search size={32} className="mx-auto mb-2 opacity-30" />データがありません。</td></tr>}
                            {filtered.map((w) => {
                                const isExpiring = (w.passport_exp && w.passport_exp <= next90DaysStr) || (w.cert_end_date && w.cert_end_date <= next90DaysStr);
                                const isChecked = selectedIds.includes(w.id);
                                return (
                                    <tr key={w.id} className={`transition-colors group ${isChecked ? 'bg-[#24b47e]/5' : 'hover:bg-[#fbfcfd]'}`}>
                                        <td className="px-5 py-3.5 cursor-pointer" onClick={() => toggleSelect(w.id)}>{isChecked ? <CheckSquare className="text-[#24b47e]" size={16} /> : <Square className="text-gray-300" size={16} />}</td>
                                        <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#fbfcfd] flex items-center justify-center shrink-0 border border-[#ededed] overflow-hidden">{w.avatar_url ? <img src={w.avatar_url} className="w-full h-full object-cover" /> : <UserCircle2 size={16} className="text-[#878787]" />}</div><div><Link href={`/workers/${w.id}/edit`} className="font-medium text-[#1f1f1f] hover:text-[#24b47e] transition-colors">{w.full_name_romaji}</Link><div className="text-[11px] text-[#878787] mt-0.5">{w.companies?.name_jp || '未配属'}</div></div></div></td>
                                        <td className="px-5 py-3.5"><span className="px-2 py-0.5 border border-[#ededed] text-[#878787] rounded-[4px] text-[10px] font-mono uppercase tracking-wider bg-[#fbfcfd]">{w.system_type === 'tokuteigino' ? '特定技能' : '技能実習'}</span></td>
                                        <td className="px-5 py-3.5 font-mono text-xs text-[#878787]">{w.zairyu_no || '未登録'}</td>
                                        <td className="px-5 py-3.5 text-xs font-medium text-[#1f1f1f]">{w.passport_exp ? <span className={`flex items-center gap-1 ${isExpiring && w.status === 'working' ? 'text-red-600' : ''}`}>{isExpiring && w.status === 'working' && <AlertCircle size={14} />} {w.passport_exp.replace(/-/g, '/')}</span> : '-'}</td>
                                        <td className="px-5 py-3.5"><span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-widest bg-transparent ${w.status === 'working' ? 'border-[#24b47e] text-[#24b47e]' : 'border-gray-300 text-[#878787]'}`}>{w.status === 'working' ? '就業中' : w.status === 'returned' ? '帰国' : w.status}</span></td>
                                        <td className="px-5 py-3.5 text-right"><div className="flex items-center justify-end gap-2"><Link href={`/workers/${w.id}/edit`} className="text-[12px] font-medium text-[#878787] hover:text-[#24b47e] transition-colors mr-2">詳細</Link>{role === 'admin' && (<form action={deleteWorker}><input type="hidden" name="id" value={w.id} /><DeleteButton /></form>)}</div></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white shadow-sm rounded-full px-6 py-3 border border-gray-700 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="flex items-center gap-2 font-bold text-sm bg-white/10 px-3 py-1.5 rounded-full"><CheckSquare size={16} className="text-[#24b47e]" /> {selectedIds.length}名を選択中</div>
                    <div className="w-px h-6 bg-gray-700"></div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => handleBulkStatus('working')} disabled={isPending} className="text-sm font-bold text-green-400 hover:text-green-300 flex items-center gap-1 disabled:opacity-50"><Play size={16} /> 就業中へ</button>
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
