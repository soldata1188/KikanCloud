'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Edit2, Trash2, Building2, MapPin, Search } from 'lucide-react'
import { DataTableToolbar } from '@/components/DataTableToolbar'
import { deleteCompany } from './actions'
import { ImportModal } from './ImportModal'

export function CompaniesClient({ companies, userRole }: { companies: any[], userRole?: string }) {
    const [filtered, setFiltered] = useState(companies)
    const [layout, setLayout] = useState<'list' | 'grid'>('list')

    const [searchTerm, setSearchTerm] = useState('')
    const [industryFilter, setIndustryFilter] = useState('all')
    const [occupationFilter, setOccupationFilter] = useState('all')

    const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean))) as string[]
    const occupations = Array.from(new Set(companies.map(c => c.accepted_occupations).filter(Boolean))) as string[]

    useEffect(() => {
        let result = companies

        if (searchTerm) {
            const lower = searchTerm.toLowerCase()
            result = result.filter(c =>
                c.name_jp?.toLowerCase().includes(lower) ||
                c.name_romaji?.toLowerCase().includes(lower) ||
                c.corporate_number?.includes(searchTerm)
            )
        }

        if (industryFilter !== 'all') {
            result = result.filter(c => c.industry === industryFilter)
        }

        if (occupationFilter !== 'all') {
            result = result.filter(c => c.accepted_occupations === occupationFilter)
        }

        setFiltered(result)
    }, [searchTerm, industryFilter, occupationFilter, companies])

    const handleSearch = (term: string) => {
        setSearchTerm(term)
    }

    const advancedFilters = (
        <>
            <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-gray-200 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">業種 (すべて)</option>
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>

            <select
                value={occupationFilter}
                onChange={(e) => setOccupationFilter(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-gray-200 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">受入職種 (すべて)</option>
                {occupations.map(o => <option key={o} value={o}>{o}</option>)}
            </select>

            {(industryFilter !== 'all' || occupationFilter !== 'all') && (
                <button
                    onClick={() => {
                        setIndustryFilter('all')
                        setOccupationFilter('all')
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
            <DataTableToolbar
                data={filtered}
                filename="企業リスト"
                searchPlaceholder="企業名で検索..."
                onSearch={handleSearch}
                type="companies"
                role={userRole || 'staff'}
                addLink="/companies/new"
                importNode={<ImportModal />}
                filterNode={advancedFilters}
                layout={layout}
                onLayoutChange={setLayout}
            />

            {layout === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">
                    {filtered.length === 0 && (
                        <div className="col-span-full py-12 text-center text-[#878787] bg-white border border-gray-200 rounded-lg">
                            <Search size={32} className="mx-auto mb-2 opacity-30" />データがありません。
                        </div>
                    )}
                    {filtered.map((c) => {
                        const activeWorkers = c.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false).length || 0;
                        return (
                            <div key={c.id} className="group relative bg-white border border-gray-300 rounded-lg p-5 transition-colors duration-200 hover:border-[#24b47e]">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-200 text-[#878787]">
                                        <Building2 size={24} />
                                    </div>
                                    <div className="pr-2">
                                        <Link href={`/companies/${c.id}/edit`} className="font-bold text-[#1f1f1f] hover:text-[#24b47e] transition-colors line-clamp-1">{c.name_jp}</Link>
                                        <div className="text-[10px] text-[#878787] mt-1 line-clamp-1 uppercase font-mono">{c.name_romaji || '未設定'}</div>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[#878787]">法人番号</span>
                                        <span className="font-mono text-[#1f1f1f]">{c.corporate_number || '未設定'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[#878787]">所在地</span>
                                        <div className="flex items-center gap-1">
                                            <MapPin size={12} className="text-[#878787] shrink-0" />
                                            <span className="truncate max-w-[120px] text-[#1f1f1f] font-medium">{c.address || <span className="text-[#878787] italic">未登録</span>}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[#878787]">代表者</span>
                                        <span className="font-medium text-[#1f1f1f]">{c.representative || '未設定'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[#878787]">担当者</span>
                                        <span className="font-medium text-[#1f1f1f]">{c.pic_name || '未設定'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[#878787]">在籍数</span>
                                        <span className="font-medium text-[#24b47e] bg-[#24b47e]/10 px-2 py-0.5 rounded-full">{activeWorkers}名</span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                                    <Link href={`/companies/${c.id}/edit`} className="text-xs font-medium text-[#878787] hover:text-[#24b47e] transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-[#24b47e]/5">詳細を見る</Link>
                                    {userRole === 'admin' && (
                                        <form action={deleteCompany}>
                                            <input type="hidden" name="id" value={c.id} />
                                            <button type="submit" className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50" onClick={(e) => { if (!confirm('この受入企業を削除してもよろしいですか？')) e.preventDefault() }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-white border border-gray-300 rounded-lg overflow-hidden relative pb-16">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px] text-[#1f1f1f] whitespace-nowrap">
                            <thead className="bg-white border-b border-gray-200 text-[11px] font-medium text-[#878787] uppercase tracking-wider">
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
                                        <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 text-[#878787]">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <div>
                                                        <Link href={`/companies/${c.id}/edit`} className="font-medium text-[#1f1f1f] hover:text-[#24b47e] transition-colors flex items-center gap-2">
                                                            {c.name_jp}
                                                            {c.name_romaji && <span className="text-[10px] px-1.5 py-0.5 bg-white text-[#878787] rounded-[4px] border border-gray-200 uppercase tracking-wide">{c.name_romaji}</span>}
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
                                                    <span className="px-2 py-0.5 border border-gray-200 text-[#878787] rounded-[4px] text-[10px] font-mono uppercase tracking-wider bg-white">
                                                        在籍: {activeWorkers}名
                                                    </span>
                                                    <div className="text-[11px] font-medium flex items-center gap-1.5 text-[#878787]">
                                                        担当: {c.pic_name || '未設定'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/companies/${c.id}/edit`} className="px-2 py-1 flex items-center gap-1 rounded-md text-[12px] font-medium text-[#878787] hover:text-[#24b47e] hover:bg-gray-50 transition-colors">
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
            )}
            <div className="mt-4 text-right text-xs text-[#878787] font-medium px-2">
                全 <span className="text-[#1f1f1f]">{filtered.length}</span> 件を表示
            </div>
        </>
    )
}
