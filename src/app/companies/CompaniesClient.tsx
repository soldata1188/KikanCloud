'use client'

import React, { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { Building2, Search } from 'lucide-react'
import { DataTableToolbar } from '@/components/DataTableToolbar'

export function CompaniesClient({ companies, userRole }: { companies: any[], userRole?: string }) {
    const [filtered, setFiltered] = useState(companies)
    const [isPending, startTransition] = useTransition()
    const [layout, setLayout] = useState<'list' | 'grid'>('list')

    // Filters State
    const [searchTerm, setSearchTerm] = useState('')
    const [filterOccupation, setFilterOccupation] = useState('all')

    const occupations = Array.from(new Set(companies.map(c => c.accepted_occupations).filter(Boolean))) as string[]

    const STATUS_MAP: Record<string, string> = {
        'all': '全企業',
        'active': '受入中',
        'inactive': '未受入',
    };
    const STATUS_KEYS = ['all', 'active', 'inactive'];
    const DEFAULT_STATUSES = ['all'];

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

        if (filterOccupation !== 'all') {
            result = result.filter(c => c.accepted_occupations === filterOccupation)
        }

        if (!activeStatuses.includes('all')) {
            result = result.filter(c => {
                const activeCount = c.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false).length || 0;
                if (activeStatuses.includes('active') && activeCount > 0) return true;
                if (activeStatuses.includes('inactive') && activeCount === 0) return true;
                return false;
            })
        }

        setFiltered(result)
    }, [searchTerm, filterOccupation, activeStatuses, companies])

    const handleSearch = (term: string) => {
        setSearchTerm(term)
    }

    const advancedFilters = (
        <>
            <select
                value={filterOccupation}
                onChange={(e) => setFilterOccupation(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-gray-350 hover:bg-gray-50 rounded-md px-2 text-[12px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">受入職種 (すべて)</option>
                {occupations.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>

            {(filterOccupation !== 'all' || (activeStatuses.length !== DEFAULT_STATUSES.length || !DEFAULT_STATUSES.every(s => activeStatuses.includes(s)))) && (
                <button
                    onClick={() => {
                        setFilterOccupation('all')
                        setActiveStatuses(DEFAULT_STATUSES)
                    }}
                    className="text-[12px] text-[#24b47e] hover:text-[#1e9a6a] transition-colors ml-1 font-medium select-none"
                >
                    クリア
                </button>
            )}
        </>
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-6 mt-2 ml-2">
                {STATUS_KEYS.map(statusKey => {
                    let count = 0;
                    if (statusKey === 'all') count = companies.length;
                    else if (statusKey === 'active') count = companies.filter(c => (c.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false).length || 0) > 0).length;
                    else if (statusKey === 'inactive') count = companies.filter(c => (c.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false).length || 0) === 0).length;

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
                                <span className={`text-sm font-medium transition-colors ${isActive ? 'text-[#24b47e]' : 'text-gray-400 group-hover:text-gray-500'}`}>社</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <DataTableToolbar
                data={filtered}
                filename="受入企業リスト"
                searchPlaceholder="企業名、法人番号で検索..."
                onSearch={handleSearch}
                type="companies"
                role={userRole || 'admin'}
                addLink="/companies/new"
                filterNode={advancedFilters}
                layout={layout}
                onLayoutChange={setLayout}
            />

            {layout === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">
                    {filtered.length === 0 && <div className="col-span-full py-12 text-center text-[#878787] bg-white border border-gray-350 rounded-md"><Search size={32} className="mx-auto mb-2 opacity-30" />データがありません。</div>}
                    {filtered.map((c, index) => {
                        const activeWorkersList = c.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false) || [];
                        const activeWorkers = activeWorkersList.length;
                        const activeGinouCount = activeWorkersList.filter((w: any) => w.system_type === 'ginou_jisshu').length;
                        const activeTokuteiCount = activeWorkersList.filter((w: any) => w.system_type === 'tokuteigino').length;
                        const activeIkuseiCount = activeWorkersList.filter((w: any) => w.system_type === 'ikusei_shuro').length;
                        return (
                            <div key={c.id} className="group relative bg-white border border-gray-350 hover:border-[#24b47e] rounded-md p-5 transition-colors duration-200">
                                <div className="absolute top-4 right-4 text-xs font-mono text-gray-400">
                                    #{index + 1}
                                </div>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-md bg-gray-50 flex items-center justify-center shrink-0 border border-gray-350 overflow-hidden">
                                        <Building2 size={24} className="text-[#878787]" />
                                    </div>
                                    <div className="pr-6">
                                        <Link href={`/companies/${c.id}`} target="_blank" className="font-bold text-[#1f1f1f] hover:text-[#24b47e] transition-colors line-clamp-1">{c.name_jp}</Link>
                                        <div className="text-[10px] text-gray-500 truncate uppercase mt-0.5">{c.name_romaji || '---'}</div>
                                    </div>
                                </div>
                                <div className="space-y-1.5 mb-4 pt-1">
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div><span className="text-[#878787] block text-[10px]">法人番号</span><span className="font-mono font-medium text-[#1f1f1f]">{c.corporate_number || '---'}</span></div>
                                        <div><span className="text-[#878787] block text-[10px]">業種</span><span className="font-medium text-[#1f1f1f] truncate block" title={c.industry || ''}>{c.industry || '---'}</span></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                                        <div className="col-span-2"><span className="text-[#878787] block text-[10px]">所在地</span>
                                            <span className="font-medium text-[#1f1f1f] line-clamp-1 block leading-tight" title={c.address || ''}>{c.address ? `〒${c.postal_code || ''} ${c.address}` : '---'}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                                        <div><span className="text-[#878787] block text-[10px]">TEL</span><span className="font-mono text-[#1f1f1f] truncate block">{c.phone || '---'}</span></div>
                                        <div><span className="text-[#878787] block text-[10px]">担当</span><span className="font-medium text-[#1f1f1f] truncate block" title={c.pic_name || ''}>{c.pic_name || '---'}</span></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                                        <div className="col-span-2"><span className="text-[#878787] block text-[10px]">Email</span><span className="font-mono text-[#1f1f1f] truncate block" title={c.email || ''}>{c.email || '---'}</span></div>
                                    </div>

                                    <div className="h-px w-full bg-gray-100 my-2"></div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div className="col-span-2"><span className="text-[#878787] block text-[10px]">受入職種</span><span className="font-medium text-[#1f1f1f] truncate block" title={c.accepted_occupations || ''}>{c.accepted_occupations || '---'}</span></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                                        <div className="col-span-2"><span className="font-medium text-[#1f1f1f] truncate block" title={c.representative || ''}>{c.representative || '---'}</span></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                                        <div className="col-span-2"><span className="text-[#878787] block text-[10px]">責任者 (講習: {c.training_date ? c.training_date.replace(/-/g, '/') : '未定'})</span><span className="font-medium text-[#1f1f1f] truncate block" title={c.manager_name || ''}>{c.manager_name || '---'}</span></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                                        <div className="col-span-2"><span className="text-[#878787] block text-[10px]">従業員数</span><span className="font-medium text-[#1f1f1f] truncate block">{c.employee_count ? `${c.employee_count} 名` : '---'}</span></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                                        <div><span className="text-[#878787] block text-[10px]">生活指導</span><span className="font-medium text-[#1f1f1f] truncate block" title={c.life_advisor || ''}>{c.life_advisor || '未定'}</span></div>
                                        <div><span className="text-[#878787] block text-[10px]">技能指導</span><span className="font-medium text-[#1f1f1f] truncate block" title={c.tech_advisor || ''}>{c.tech_advisor || '---'}</span></div>
                                    </div>
                                    <div className="flex flex-col gap-1.5 mt-3 pt-2 border-t border-gray-100 text-xs text-[#878787]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#878787]">在籍人数 (合計)</span>
                                            <span className={`text-[12px] font-bold tracking-wide ${activeWorkers > 0 ? 'text-[#24b47e]' : 'text-gray-800'}`}>
                                                {activeWorkers} 名
                                            </span>
                                        </div>
                                        {(activeGinouCount > 0 || activeTokuteiCount > 0 || activeIkuseiCount > 0) && (
                                            <div className="flex justify-end gap-2 text-[10px] text-gray-500">
                                                {activeGinouCount > 0 && <span>技能実習: <span className="text-gray-900 font-medium">{activeGinouCount}</span></span>}
                                                {activeTokuteiCount > 0 && <span>特定技能: <span className="text-gray-900 font-medium">{activeTokuteiCount}</span></span>}
                                                {activeIkuseiCount > 0 && <span>育成就労: <span className="text-gray-900 font-medium">{activeIkuseiCount}</span></span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-350 flex items-center justify-between">
                                    <Link href={`/companies/${c.id}`} className="text-xs font-medium text-[#878787] hover:text-[#24b47e] transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-[#24b47e]/5">詳細を見る</Link>
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
                                <th className="border border-gray-350 px-4 py-3 text-center w-[40px] shrink-0 font-semibold text-[11px]">No.</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold w-[250px]">企業名</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold w-auto">所在地 / 連絡先</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold w-[200px]">代表者 / 責任者</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold w-[160px]">受入状況</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold">指導員等</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && <tr><td colSpan={6} className="border border-gray-350 px-5 py-12 text-center text-[#878787]"><Search size={32} className="mx-auto mb-2 opacity-30" />該当する企業がありません。</td></tr>}
                            {filtered.map((c, index) => {
                                const activeWorkersList = c.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false) || [];
                                const activeWorkers = activeWorkersList.length;
                                const activeGinouCount = activeWorkersList.filter((w: any) => w.system_type === 'ginou_jisshu').length;
                                const activeTokuteiCount = activeWorkersList.filter((w: any) => w.system_type === 'tokuteigino').length;
                                const activeIkuseiCount = activeWorkersList.filter((w: any) => w.system_type === 'ikusei_shuro').length;
                                return (
                                    <tr key={c.id} className="transition-colors hover:bg-gray-50">
                                        <td className="border border-gray-350 px-4 py-3 text-center align-top pt-5 font-mono text-gray-400 text-xs">
                                            {index + 1}
                                        </td>

                                        <td className="border border-gray-350 px-4 py-3 align-top">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex flex-col min-w-0">
                                                    <Link href={`/companies/${c.id}`} target="_blank" className="font-semibold text-gray-900 truncate hover:text-[#24b47e] transition-colors inline-block max-w-[200px]" title={c.name_jp}>
                                                        {c.name_jp}
                                                    </Link>
                                                    {c.name_romaji && <div className="text-[10px] text-gray-500 truncate uppercase tracking-widest leading-tight mt-0.5" title={c.name_romaji}>{c.name_romaji}</div>}
                                                </div>
                                                <div className="text-[11px] text-gray-600 mt-1 flex flex-col gap-0.5">
                                                    <div className="truncate" title={c.industry || ''}>
                                                        業種: <span className="font-medium text-gray-900">{c.industry || '---'}</span>
                                                    </div>
                                                    <div className="truncate" title={c.accepted_occupations || ''}>
                                                        受入職種: <span className="font-medium text-gray-900">{c.accepted_occupations || '---'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="border border-gray-350 px-4 py-3 align-top">
                                            <div className="flex flex-col gap-1.5 text-[11px] text-gray-600">
                                                <div className="flex">
                                                    <span className="w-9 shrink-0 text-gray-400 mt-0.5">〒</span>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-mono">{c.postal_code || '---'}</span>
                                                        <span className="font-medium text-gray-900 line-clamp-2 leading-tight mt-0.5" title={c.address || ''}>{c.address || '---'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-9 shrink-0 text-gray-400">TEL</span>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="font-mono text-gray-900 truncate">{c.phone || '---'}</span>
                                                        <span className="truncate bg-gray-100 px-1.5 py-0.5 rounded text-[10px] ml-1" title={c.pic_name || ''}>担当: <span className="font-medium text-gray-900">{c.pic_name || '---'}</span></span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-9 shrink-0 text-gray-400">Email</span>
                                                    <span className="font-mono text-gray-900 truncate" title={c.email || ''}>{c.email || '---'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="border border-gray-350 px-4 py-3 align-top">
                                            <div className="flex flex-col gap-1.5 text-[11px] text-gray-600">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 leading-tight truncate" title={c.representative || ''}>{c.representative || '---'}</span>
                                                    {c.representative_romaji && <span className="text-[10px] text-gray-500 uppercase tracking-wider truncate" title={c.representative_romaji}>{c.representative_romaji}</span>}
                                                </div>
                                                <div className="h-px w-full bg-gray-100 my-0.5"></div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 text-[10px]">責任者 {c.training_date && <span className="tracking-tight">(講習: {c.training_date.replace(/-/g, '/')})</span>}</span>
                                                    <span className="font-medium text-gray-900 leading-tight truncate" title={c.manager_name || ''}>{c.manager_name || '---'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="border border-gray-350 px-4 py-3 align-top">
                                            <div className="flex flex-col gap-1.5 list-none text-[11px] text-gray-600">
                                                <div className="flex items-center gap-2 mb-0.5 ml-1">
                                                    <span className={`text-[12px] font-bold tracking-wide ${activeWorkers > 0 ? 'text-[#24b47e]' : 'text-gray-800'}`}>
                                                        合計 在籍: {activeWorkers} 名
                                                    </span>
                                                </div>
                                                {(activeGinouCount > 0 || activeTokuteiCount > 0 || activeIkuseiCount > 0) ? (
                                                    <div className="flex flex-col gap-0.5 text-[10px] text-gray-500 ml-1">
                                                        {activeGinouCount > 0 && <span>技能実習: <span className="text-gray-900 font-medium text-[11px]">{activeGinouCount}</span>名</span>}
                                                        {activeTokuteiCount > 0 && <span>特定技能: <span className="text-gray-900 font-medium text-[11px]">{activeTokuteiCount}</span>名</span>}
                                                        {activeIkuseiCount > 0 && <span>育成就労: <span className="text-gray-900 font-medium text-[11px]">{activeIkuseiCount}</span>名</span>}
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-gray-400 ml-1">受入実績なし</div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="border border-gray-350 px-4 py-3 align-top min-w-[200px] max-w-[300px]">
                                            <div className="flex flex-col gap-1 text-[11px] text-gray-600">
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                                                    <span className="text-gray-400">従業員数:</span>
                                                    <span className="font-medium text-gray-900">{c.employee_count ? `${c.employee_count} 名` : '---'}</span>
                                                </div>
                                                <div className="flex flex-col gap-1 mb-1">
                                                    <span className="truncate" title={c.life_advisor || ''}>生指: <span className="font-medium text-gray-900">{c.life_advisor || '---'}</span></span>
                                                    <span className="truncate" title={c.tech_advisor || ''}>技指: <span className="font-medium text-gray-900">{c.tech_advisor || '---'}</span></span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

