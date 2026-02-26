'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Search, CheckCircle2, Circle, X, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { DataTableToolbar } from '@/components/DataTableToolbar'
import { ImportModal } from './ImportModal'

// ─────────────────────────────────────────────────────────────
// Tab config
// ─────────────────────────────────────────────────────────────
const TAB_CONFIG: Record<string, {
    label: string; icon: React.ReactNode
    tabActiveBg: string; tabActiveText: string; tabActiveBorder: string
    tabBg: string; tabText: string; tabBorder: string
    badgeBg: string; badgeText: string
}> = {
    all: { label: '全企業', icon: <Building2 size={13} />, tabActiveBg: 'bg-slate-800', tabActiveText: 'text-white', tabActiveBorder: 'border-slate-800', tabBg: 'bg-white', tabText: 'text-slate-500', tabBorder: 'border-slate-200', badgeBg: 'bg-slate-100', badgeText: 'text-slate-500' },
    active: { label: '受入中', icon: <CheckCircle2 size={13} />, tabActiveBg: 'bg-emerald-500', tabActiveText: 'text-white', tabActiveBorder: 'border-emerald-500', tabBg: 'bg-white', tabText: 'text-emerald-600', tabBorder: 'border-emerald-200', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600' },
    inactive: { label: '未受入', icon: <Circle size={13} />, tabActiveBg: 'bg-slate-500', tabActiveText: 'text-white', tabActiveBorder: 'border-slate-500', tabBg: 'bg-white', tabText: 'text-slate-400', tabBorder: 'border-slate-200', badgeBg: 'bg-slate-100', badgeText: 'text-slate-400' },
}
const TAB_KEYS = ['all', 'active', 'inactive']

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getWorkerCounts(c: any) {
    const allWorkers = c.workers?.filter((w: any) => w.is_deleted === false) || []
    const activeWorkersList = allWorkers.filter((w: any) => w.status === 'working')
    const visaGroups: Record<string, number> = {}
    allWorkers.forEach((w: any) => {
        const visa = w.visa_status || 'その他'
        visaGroups[visa] = (visaGroups[visa] || 0) + 1
    })
    return { total: allWorkers.length, active: activeWorkersList.length, visaGroups }
}

const PAGE_SIZE = 25

// Main component
// ─────────────────────────────────────────────────────────────
export function CompaniesClient({ companies, userRole }: { companies: any[], userRole?: string }) {
    const [filtered, setFiltered] = useState(companies)
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
    const [filterOccupation, setFilterOccupation] = useState('all')
    const [activeTab, setActiveTab] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)

    const occupations = Array.from(new Set(companies.map(c => c.accepted_occupations).filter(Boolean))) as string[]

    const countByTab = (key: string) => {
        if (key === 'all') return companies.length
        if (key === 'active') return companies.filter(c => getWorkerCounts(c).total > 0).length
        return companies.filter(c => getWorkerCounts(c).total === 0).length
    }

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
        if (filterOccupation !== 'all') result = result.filter(c => c.accepted_occupations === filterOccupation)
        if (activeTab === 'active') result = result.filter(c => getWorkerCounts(c).total > 0)
        else if (activeTab === 'inactive') result = result.filter(c => getWorkerCounts(c).total === 0)
        setFiltered(result)
        setCurrentPage(1)
    }, [searchTerm, filterOccupation, activeTab, companies])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    const advancedFilters = (
        <>
            <select
                value={filterOccupation}
                onChange={(e) => setFilterOccupation(e.target.value)}
                className="h-[32px] w-[140px] bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-2 text-[11px] outline-none focus:border-[#24b47e] transition-colors text-[#1f1f1f] cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
                <option value="all">受入職種 (すべて)</option>
                {occupations.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {filterOccupation !== 'all' && (
                <button onClick={() => setFilterOccupation('all')} className="text-[11px] text-[#24b47e] hover:text-[#1e9a6a] transition-colors ml-1 font-bold select-none">クリア</button>
            )}
        </>
    )

    const Pagination = () => totalPages > 1 ? (
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
                {filtered.length} 社中 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} 社
            </span>
        </div>
    ) : null

    return (
        <div className="flex flex-col gap-5">

            {/* Tab Bar */}
            <div className="flex flex-wrap items-center gap-2">
                {TAB_KEYS.map(key => {
                    const cfg = TAB_CONFIG[key]
                    const count = countByTab(key)
                    const isActive = activeTab === key
                    return (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] font-bold transition-all duration-200 select-none
                                ${isActive ? `${cfg.tabActiveBg} ${cfg.tabActiveText} ${cfg.tabActiveBorder} shadow-md -translate-y-0.5` : `${cfg.tabBg} ${cfg.tabText} ${cfg.tabBorder} hover:bg-slate-50 hover:-translate-y-0.5`}`}
                        >
                            <span className="flex items-center gap-1.5">{cfg.icon}{cfg.label}</span>
                            <span className={`text-[10px] font-bold min-w-[20px] h-5 inline-flex items-center justify-center px-1.5 rounded-full ${isActive ? 'bg-white/20 text-white' : `${cfg.badgeBg} ${cfg.badgeText}`}`}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            <DataTableToolbar
                data={filtered} filename="受入企業リスト" searchPlaceholder="企業名、法人番号で検索..."
                onSearch={(term) => setSearchTerm(term)} type="companies" role={userRole || 'admin'}
                addLink="/companies/new"
                importNode={(userRole === 'admin' || userRole === 'staff') && (
                    <div className="flex items-center gap-2">
                        <ImportModal />
                    </div>
                )}
                filterNode={advancedFilters} layout={layout} onLayoutChange={setLayout}
            />

            {layout === 'grid' ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginated.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-[24px]">
                                <Search size={32} className="mx-auto mb-2 opacity-30" />データがありません。
                            </div>
                        )}
                        {paginated.map((c, index) => {
                            const { total: activeWorkers } = getWorkerCounts(c)
                            const absIndex = (currentPage - 1) * PAGE_SIZE + index
                            return (
                                <div key={c.id} className="group relative bg-white border border-slate-200 hover:border-[#24b47e] rounded-[24px] p-5 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md">
                                    <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-300">#{absIndex + 1}</div>
                                    <div className="flex items-start mb-4">
                                        <div className="pr-6 min-w-0">
                                            <Link href={`/companies/${c.id}`} target="_blank" className="font-bold text-slate-800 hover:text-[#24b47e] transition-colors line-clamp-1 block">{c.name_jp}</Link>
                                            <div className="text-[10px] text-slate-400 truncate uppercase tracking-widest mt-0.5">{c.name_romaji || '---'}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 mb-3 text-[11px]">
                                        <div className="flex justify-between"><span className="text-slate-400 font-bold">業種</span><span className="font-medium text-slate-700 truncate max-w-[140px]">{c.industry || '---'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400 font-bold">担当</span><span className="font-medium text-slate-700 truncate max-w-[140px]">{c.pic_name || '---'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400 font-bold">TEL</span><span className="font-mono font-medium text-slate-700">{c.phone || '---'}</span></div>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <span className={`text-[12px] font-bold ${activeWorkers > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>在籍: {activeWorkers}名</span>
                                        <Link href={`/companies/${c.id}`} className="text-xs font-bold text-slate-400 hover:text-[#24b47e] transition-colors px-2 py-1 rounded-md hover:bg-emerald-50">詳細を見る</Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <Pagination />
                </>
            ) : (
                <>
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full border-collapse text-sm text-left">
                            <thead>
                                <tr className="bg-slate-800">
                                    <th className="px-4 py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-200 w-[40px] text-center">No.</th>
                                    <th className="px-4 py-3.5 font-bold text-[11px] uppercase tracking-wider text-slate-200 w-[240px]">企業名</th>
                                    <th className="px-4 py-3.5 font-bold text-[13px] uppercase tracking-wider text-slate-200">所在地 / 連絡先</th>
                                    <th className="px-4 py-3.5 font-bold text-[13px] uppercase tracking-wider text-slate-200 min-w-[170px]">代表者 / 責任者</th>
                                    <th className="px-4 py-3.5 font-bold text-[13px] uppercase tracking-wider text-slate-200 min-w-[155px]">受入状況</th>
                                    <th className="px-4 py-3.5 font-bold text-[13px] uppercase tracking-wider text-slate-200 min-w-[180px]">指導員等</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300">
                                {paginated.length === 0 && (
                                    <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-400 font-medium">
                                        <Search size={32} className="mx-auto mb-2 opacity-30" />該当する企業がありません。
                                    </td></tr>
                                )}
                                {paginated.map((c, index) => {
                                    const { total, visaGroups } = getWorkerCounts(c)
                                    const sortedVisa = Object.entries(visaGroups).sort((a, b) => b[1] - a[1])
                                    const absIndex = (currentPage - 1) * PAGE_SIZE + index
                                    return (
                                        <tr key={c.id} className={`transition-all duration-150 ${absIndex % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-slate-50/80'}`}>
                                            {/* No. */}
                                            <td className="px-4 py-3.5 text-center align-middle font-mono text-slate-400 text-sm font-bold">{absIndex + 1}</td>

                                            {/* 企業名 */}
                                            <td className="px-4 py-3.5 align-middle">
                                                <div className="flex items-center">
                                                    <div className="min-w-0">
                                                        <Link href={`/companies/${c.id}`} target="_blank" className="font-bold text-[17px] text-slate-800 hover:text-[#24b47e] transition-colors truncate block" title={c.name_jp}>{c.name_jp}</Link>
                                                        {c.name_romaji && <div className="text-[12px] text-slate-400 uppercase tracking-widest truncate mt-0.5">{c.name_romaji}</div>}
                                                        <div className="text-[13px] text-slate-500 mt-0.5 truncate">
                                                            <span className="text-slate-400">業種:</span> <span className="font-medium">{c.industry || '---'}</span>
                                                            {c.accepted_occupations && <span className="ml-2"><span className="text-slate-400">受入:</span> <span className="font-medium">{c.accepted_occupations}</span></span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 所在地/連絡先 */}
                                            <td className="px-4 py-3.5 align-middle">
                                                <div className="flex flex-col gap-1 text-[13px]">
                                                    <div className="text-slate-800 font-medium leading-snug line-clamp-2" title={c.address || ''}>
                                                        {c.postal_code ? `〒${c.postal_code} ` : ''}{c.address || '---'}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-slate-500 mt-0.5">
                                                        {c.phone && <span className="font-mono text-[12px]">{c.phone}</span>}
                                                        {c.email && <span className="font-mono text-[12px] text-slate-400 truncate max-w-[180px]" title={c.email}>{c.email}</span>}
                                                    </div>
                                                    {c.pic_name && (
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider shrink-0">担当者名</span>
                                                            <span className="font-bold text-[13px] text-slate-700">{c.pic_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 代表者/責任者 */}
                                            <td className="px-4 py-3.5 align-middle">
                                                <div className="flex flex-col gap-1.5 text-[13px]">
                                                    <div>
                                                        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">代表</div>
                                                        <div className="font-bold text-slate-800 leading-snug">{c.representative || '---'}</div>
                                                    </div>
                                                    <div className="h-px bg-slate-100" />
                                                    <div>
                                                        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                                            責任者 {c.training_date && <span className="text-slate-300 normal-case">(講習: {c.training_date.replace(/-/g, '/')})</span>}
                                                        </div>
                                                        <div className="font-medium text-slate-700 leading-snug">{c.manager_name || '---'}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 受入状況 */}
                                            <td className="px-4 py-3.5 align-middle">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className={`inline-flex items-center gap-1.5 text-[13px] font-bold px-2.5 py-1 rounded-full w-fit ${total > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${total > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                        {total > 0 ? `在籍 ${total} 名` : '未受入'}
                                                    </span>
                                                    {sortedVisa.length > 0 && (
                                                        <div className="flex flex-col gap-1 pl-0.5">
                                                            {sortedVisa.map(([visa, cnt]) => (
                                                                <div key={visa} className="flex items-center justify-between gap-2 text-[12px]">
                                                                    <span className="text-slate-400 truncate max-w-[100px]" title={visa}>{visa}</span>
                                                                    <span className="font-bold text-slate-700 shrink-0">{cnt}名</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 指導員等 */}
                                            <td className="px-4 py-3.5 align-middle">
                                                <div className="flex flex-col gap-1.5 text-[13px]">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-400 font-bold text-[11px] w-14 shrink-0 uppercase tracking-wider">従業員</span>
                                                        <span className="font-bold text-slate-700">{c.employee_count ? `${c.employee_count} 名` : '---'}</span>
                                                    </div>
                                                    <div className="h-px bg-slate-100" />
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-slate-400 font-bold text-[11px] w-14 shrink-0 uppercase tracking-wider">生活指</span>
                                                            <span className="font-medium text-slate-700">{c.life_advisor || '---'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-slate-400 font-bold text-[11px] w-14 shrink-0 uppercase tracking-wider">技能指</span>
                                                            <span className="font-medium text-slate-700">{c.tech_advisor || '---'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination />
                </>
            )}
        </div>
    )
}
