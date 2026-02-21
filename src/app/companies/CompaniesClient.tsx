'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Edit2, Trash2, Building2, MapPin, Search } from 'lucide-react'
import { DataTableToolbar } from '@/components/DataTableToolbar'
import { deleteCompany } from './actions'
import { ImportModal } from './ImportModal'

export function CompaniesClient({ companies, userRole }: { companies: any[], userRole?: string }) {
    const [filtered, setFiltered] = useState(companies)

    const handleSearch = (term: string) => {
        const lower = term.toLowerCase()
        setFiltered(companies.filter(c =>
            c.name_jp?.toLowerCase().includes(lower) ||
            c.name_romaji?.toLowerCase().includes(lower) ||
            c.corporate_number?.includes(term)
        ))
    }

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <DataTableToolbar
                    data={filtered}
                    filename="企業リスト"
                    searchPlaceholder="企業名で検索..."
                    onSearch={handleSearch}
                    type="companies"
                    role={userRole || 'staff'}
                    addLink="/companies/new"
                />
                <ImportModal />
            </div>

            <div className="bg-white border border-[#ededed] rounded-lg shadow-sm overflow-hidden relative pb-16">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px] text-[#1f1f1f] whitespace-nowrap">
                        <thead className="bg-[#fbfcfd] border-b border-[#ededed] text-[11px] font-medium text-[#878787] uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3 font-medium">企業名 / 基本情報</th>
                                <th className="px-5 py-3 font-medium">所在地 / 代表者</th>
                                <th className="px-5 py-3 font-medium">受入情報 / 担当者</th>
                                <th className="px-5 py-3 font-medium text-right w-[120px]">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ededed]">
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center text-[#878787]">
                                        <div className="flex flex-col items-center gap-3">
                                            <Search size={32} className="opacity-30" />
                                            データがありません。
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filtered.map((c) => {
                                const activeWorkers = c.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false).length || 0;
                                return (
                                    <tr key={c.id} className="hover:bg-[#fbfcfd] transition-colors group">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-md bg-[#fbfcfd] border border-[#ededed] flex items-center justify-center shrink-0 text-[#878787]">
                                                    <Building2 size={16} />
                                                </div>
                                                <div>
                                                    <Link href={`/companies/${c.id}/edit`} className="font-medium text-[#1f1f1f] hover:text-[#24b47e] transition-colors flex items-center gap-2">
                                                        {c.name_jp}
                                                        {c.name_romaji && <span className="text-[10px] px-1.5 py-0.5 bg-[#fbfcfd] text-[#878787] rounded-[4px] border border-[#ededed] uppercase tracking-wide">{c.name_romaji}</span>}
                                                    </Link>
                                                    <div className="text-[11px] text-[#878787] font-mono mt-0.5">
                                                        法人番号: {c.corporate_number || '未設定'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col gap-1">
                                                <div className="font-medium text-[#1f1f1f] flex items-center gap-1.5 text-[12px]">
                                                    <MapPin size={12} className="text-[#878787] shrink-0" />
                                                    <span className="truncate max-w-[200px]">{c.address || <span className="text-[#878787] italic">住所未登録</span>}</span>
                                                </div>
                                                <div className="text-[11px] text-[#878787] font-medium flex items-center gap-1">
                                                    代表: {c.representative || '未設定'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col items-start gap-1.5">
                                                <span className="px-2 py-0.5 border border-[#ededed] text-[#878787] rounded-[4px] text-[10px] font-mono uppercase tracking-wider bg-[#fbfcfd]">
                                                    在籍: {activeWorkers}名
                                                </span>
                                                <div className="text-[11px] font-medium flex items-center gap-1.5 text-[#878787]">
                                                    担当: {c.pic_name || '未設定'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <Link href={`/companies/${c.id}/edit`} className="px-2 py-1 flex items-center gap-1 rounded-md text-[12px] font-medium text-[#878787] hover:text-[#24b47e] hover:bg-[#fbfcfd] transition-colors">
                                                    詳細
                                                </Link>
                                                {userRole === 'admin' && (
                                                    <form action={deleteCompany} className="inline-block">
                                                        <input type="hidden" name="id" value={c.id} />
                                                        <button type="submit" className="px-2 py-1 flex items-center gap-1 rounded-md text-[12px] font-medium text-[#878787] hover:text-red-600 hover:bg-red-50 transition-colors" onClick={(e) => { if (!confirm('この受入企業を削除してもよろしいですか？\n※所属している外国人材のデータは削除されません。')) e.preventDefault() }}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="mt-4 text-right text-xs text-[#878787] font-medium px-2">
                全 <span className="text-[#1f1f1f]">{filtered.length}</span> 件を表示
            </div>
        </>
    )
}
