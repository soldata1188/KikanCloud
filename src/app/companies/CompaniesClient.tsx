'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Search, CheckCircle2, Circle, X, Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { ImportModal } from './ImportModal'

// ─────────────────────────────────────────────────────────────
// Tab config
// ─────────────────────────────────────────────────────────────
const TAB_CONFIG: Record<string, {
    label: string
    tabActiveBg: string; tabActiveText: string; tabActiveBorder: string
    tabBg: string; tabText: string; tabBorder: string
    badgeBg: string; badgeText: string
}> = {
    all: { label: '全企業', tabActiveBg: 'bg-white', tabActiveText: 'text-gray-900', tabActiveBorder: 'border-blue-600', tabBg: 'bg-white', tabText: 'text-gray-500', tabBorder: 'border-transparent', badgeBg: 'bg-gray-100', badgeText: 'text-gray-500' },
    active: { label: '受入中', tabActiveBg: 'bg-white', tabActiveText: 'text-gray-900', tabActiveBorder: 'border-blue-600', tabBg: 'bg-white', tabText: 'text-gray-500', tabBorder: 'border-transparent', badgeBg: 'bg-blue-50', badgeText: 'text-blue-600' },
    inactive: { label: '未受入', tabActiveBg: 'bg-white', tabActiveText: 'text-gray-900', tabActiveBorder: 'border-blue-600', tabBg: 'bg-white', tabText: 'text-gray-500', tabBorder: 'border-transparent', badgeBg: 'bg-gray-100', badgeText: 'text-gray-400' },
}
const TAB_KEYS = ['all', 'active', 'inactive']

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getWorkerCounts(c: any) {
    const allWorkers = c.workers?.filter((w: any) => w.is_deleted === false) || []
    const activeWorkersList = allWorkers.filter((w: any) => w.status === 'working' || w.status === 'processing')
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
    const [searchTerm, setSearchTerm] = useState('')
    const [filterOccupation, setFilterOccupation] = useState('all')
    const [activeTab, setActiveTab] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)

    // Mobile layout optimization: Default to 'grid' on small screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setLayout('grid')
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

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

    const Pagination = () => totalPages > 1 ? (
        <div className="flex justify-center items-center gap-2 mt-8 pb-4">
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
                {filtered.length}企業中 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}表示
            </span>
        </div>
    ) : null

    /* --- RENDER ────────────────────────────────────── */
    return (
        <div className="flex flex-col min-h-screen">

            {/* ══ STICKY HEADER: Responsive wrapping bar ══ */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm px-6 min-h-[52px] py-2 flex flex-wrap items-center gap-x-6 gap-y-3">

                {/* Left: Status Tabs */}
                <div className="flex items-center gap-1 shrink-0">
                    {TAB_KEYS.map((key) => {
                        const cfg = TAB_CONFIG[key]
                        const count = countByTab(key)
                        const isActive = activeTab === key
                        return (
                            <button key={key} onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all whitespace-nowrap
                                    ${isActive ? 'bg-blue-50 text-[#0067b8]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                {cfg.label}
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[#0067b8] text-white' : 'bg-gray-100 text-gray-400'}`}>{count}</span>
                            </button>
                        )
                    })}
                </div>

                <div className="w-px h-5 bg-gray-200 shrink-0" />

                {/* Center: Filters + Layout toggle + Search */}
                <div className="flex flex-wrap items-center gap-2 gap-y-2">
                    <select value={filterOccupation} onChange={e => setFilterOccupation(e.target.value)}
                        className="text-[11px] border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 outline-none focus:border-[#0067b8] cursor-pointer transition-colors font-bold text-gray-600 h-8 shrink-0 hover:bg-white">
                        <option value="all">職種: すべて</option>
                        {occupations.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {filterOccupation !== 'all' && (
                        <button onClick={() => setFilterOccupation('all')} className="text-[11px] font-bold text-[#0067b8] hover:text-blue-700 shrink-0">解除</button>
                    )}

                    <div className="w-px h-5 bg-gray-200 shrink-0" />

                    {/* Layout toggle */}
                    <div className="flex items-center bg-gray-100 p-0.5 rounded-md border border-gray-200 shrink-0">
                        <button onClick={() => setLayout('list')} className={`p-1 rounded ${layout === 'list' ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="リスト表示"><div className="w-3.5 h-3.5 border-2 border-current rounded-sm opacity-60" /></button>
                        <button onClick={() => setLayout('grid')} className={`p-1 rounded ${layout === 'grid' ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="グリッド表示"><div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5"><div className="bg-current rounded-sm opacity-40" /><div className="bg-current rounded-sm opacity-40" /><div className="bg-current rounded-sm opacity-40" /><div className="bg-current rounded-sm opacity-40" /></div></button>
                    </div>

                    <div className="w-px h-5 bg-gray-200 shrink-0" />

                    {/* Search box moved here */}
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="企業名・法人番号で検索..."
                            className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[12px] w-[200px] focus:bg-white focus:border-[#0067b8] outline-none transition-all h-8" />
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {(userRole === 'admin' || userRole === 'staff') && <ImportModal />}
                    {(userRole === 'admin' || userRole === 'staff') && (
                        <Link href="/companies/new"
                            className="bg-[#0067b8] hover:bg-blue-700 text-white text-[11px] px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 h-8 shrink-0">
                            <Plus size={13} /> 新規登録
                        </Link>
                    )}
                </div>
            </div>


            <div className="max-w-[1440px] mx-auto w-full pb-20 mt-4">
                {layout === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 pb-4">
                        {paginated.length === 0 && (
                            <div className="col-span-full py-16 text-center text-gray-400 bg-white border border-gray-200 rounded-md">
                                <Search size={24} className="mx-auto mb-2 opacity-30" />データがありません。
                            </div>
                        )}
                        {paginated.map((c, index) => {
                            const { total: activeWorkers } = getWorkerCounts(c)
                            const absIndex = (currentPage - 1) * PAGE_SIZE + index
                            return (
                                <div key={c.id} className="group relative bg-white border border-gray-200 hover:border-blue-600 rounded-md p-5 transition-all duration-200">
                                    <div className="absolute top-4 right-4 text-[9px] font-mono text-gray-300">#{absIndex + 1}</div>
                                    <div className="flex items-start mb-3">
                                        <div className="pr-10 min-w-0">
                                            <Link href={`/companies/${c.id}`} className="font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 block text-sm">{c.name_jp}</Link>
                                            <div className="text-[10px] text-gray-400 truncate uppercase tracking-tight mt-0.5">{c.name_romaji || '---'}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 mb-4 text-[11px]">
                                        <div className="flex justify-between border-b border-gray-50 pb-1"><span className="text-gray-400 font-bold uppercase tracking-wider">業種</span><span className="font-bold text-gray-700 truncate max-w-[140px]">{c.industry || '---'}</span></div>
                                        <div className="flex justify-between border-b border-gray-50 pb-1"><span className="text-gray-400 font-bold uppercase tracking-wider">担当</span><span className="font-bold text-gray-700 truncate max-w-[140px]">{c.pic_name || '---'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-400 font-bold uppercase tracking-wider">TEL</span><span className="font-mono font-bold text-gray-700">{c.phone || '---'}</span></div>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className={`text-[12px] font-bold ${activeWorkers > 0 ? 'text-blue-600' : 'text-gray-400'}`}>在籍: {activeWorkers}名</span>
                                        <Link href={`/companies/${c.id}`} className="text-xs font-bold text-blue-600 hover:underline transition-colors px-2 py-1 rounded hover:bg-blue-50">詳細</Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="mx-0 overflow-hidden border border-gray-200 rounded-md bg-white mb-4">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] border-collapse text-left">
                                <thead className="bg-[#0067b8] border-b border-white/20 text-white">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[40px] border-r border-white/10 text-white/90">No.</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[155px] border-r border-white/10 text-white/90">受入状況</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[240px] border-r border-white/10 text-white/90">企業名</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider border-r border-white/10 text-white/90">所在地 / 連絡先</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[240px] border-r border-white/10 text-white/90">業種 / 受入内容</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[170px] border-r border-white/10 text-white/90">代表 / 責任者</th>
                                        <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-[220px] text-white/90">従業員等</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/50">
                                    {paginated.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-16 text-center text-gray-400 font-medium bg-white">
                                                <Search size={24} className="mx-auto mb-2 opacity-30" />
                                                該当する企業がありません。
                                            </td>
                                        </tr>
                                    )}
                                    {paginated.map((c, index) => {
                                        const { total, visaGroups } = getWorkerCounts(c)
                                        const sortedVisa = Object.entries(visaGroups).sort((a, b) => b[1] - a[1])
                                        const absIndex = (currentPage - 1) * PAGE_SIZE + index
                                        return (
                                            <tr key={c.id} className={`transition-all duration-150 border-b border-gray-100 last:border-0 ${absIndex % 2 === 0 ? 'bg-white hover:bg-blue-50/20' : 'bg-gray-50/30 hover:bg-blue-50/20'}`}>
                                                <td className="px-4 py-3 align-middle font-mono text-[#0067b8] text-[12px] font-bold border-r border-gray-100/50">{absIndex + 1}</td>
                                                {/* 受入状況 */}
                                                <td className="px-4 py-3 align-middle border-r border-gray-100/50">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className={`text-[13px] font-bold ${total > 0 ? 'text-[#0067b8]' : 'text-gray-400'}`}>
                                                            {total > 0 ? (
                                                                <>在籍 <span className="text-[14px]">{total}</span> 名</>
                                                            ) : '未受入'}
                                                        </div>
                                                        {sortedVisa.length > 0 && (
                                                            <div className="flex flex-col gap-0.5 pl-0.5">
                                                                {sortedVisa.slice(0, 2).map(([visa, cnt]) => (
                                                                    <div key={visa} className="flex items-center justify-between gap-2 text-[10px]">
                                                                        <span className="text-gray-400 truncate max-w-[90px]" title={visa}>{visa}</span>
                                                                        <span className="font-bold text-[#0067b8] shrink-0">{cnt}名</span>
                                                                    </div>
                                                                ))}
                                                                {sortedVisa.length > 2 && <div className="text-[9px] text-gray-300 text-right">...他</div>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* 企業名 */}
                                                <td className="px-4 py-3 align-middle border-r border-gray-100/50">
                                                    <div className="flex items-center">
                                                        <div className="min-w-0">
                                                            <Link href={`/companies/${c.id}`} target="_blank" className="font-bold text-[14px] text-gray-900 hover:text-blue-600 transition-colors truncate block" title={c.name_jp}>{c.name_jp}</Link>
                                                            {c.name_romaji && <div className="text-[10px] text-gray-400 uppercase tracking-tight truncate mt-0.5">{c.name_romaji}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* 所在地/連絡先 */}
                                                <td className="px-4 py-3 align-middle border-r border-gray-100/50">
                                                    <div className="flex flex-col gap-1 text-[11px]">
                                                        <div className="text-gray-600 font-medium leading-normal line-clamp-1 mb-1" title={c.address || ''}>
                                                            {c.address || '---'}
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider w-8">TEL</span>
                                                                <span className="font-mono text-[10px] font-bold text-gray-700">{c.phone || '---'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider w-8">MAIL</span>
                                                                <span className="font-mono text-[10px] font-bold text-gray-700 truncate max-w-[140px]" title={c.email || ''}>{c.email || '---'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>


                                                {/* 業種 / 受入内容 */}
                                                <td className="px-4 py-3 align-middle border-r border-gray-100/50">
                                                    <div className="flex flex-col gap-1.5 text-[11px]">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider w-8">業種</span>
                                                            <span className="font-bold text-gray-700 truncate">{c.industry || '---'}</span>
                                                        </div>
                                                        <div className="h-[1px] bg-gray-50/50" />
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider w-8 mt-0.5">受入</span>
                                                            <span className="font-bold text-gray-700 leading-tight">{c.accepted_occupations || '---'}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 代表 / 責任者 */}
                                                <td className="px-4 py-3 align-middle border-r border-gray-100/50">
                                                    <div className="flex flex-col gap-1.5 text-[11px]">
                                                        <div>
                                                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">代表者</div>
                                                            <div className="font-bold text-gray-700 leading-tight">{c.representative || '---'}</div>
                                                        </div>
                                                        <div className="h-[1px] bg-gray-50" />
                                                        <div>
                                                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">責任者</div>
                                                            <div className="font-bold text-gray-700 leading-tight truncate">{c.manager_name || '---'}</div>
                                                            <div className="text-[9px] text-gray-300">講習: {c.training_date ? c.training_date.replace(/-/g, '/') : '---'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 align-middle">
                                                    <div className="flex flex-col gap-1.5 text-[11px]">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-gray-400 font-bold text-[9px] w-12 shrink-0 uppercase tracking-wider">従業員</span>
                                                            <span className="font-bold text-[#0067b8]">{c.employee_count ? `${c.employee_count} 名` : '---'}</span>
                                                        </div>
                                                        <div className="h-[1px] bg-gray-50" />
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-gray-400 font-bold text-[9px] w-12 shrink-0 uppercase tracking-wider">生活指</span>
                                                                <span className="font-bold text-gray-600 truncate">{c.life_advisor || '---'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-gray-400 font-bold text-[9px] w-12 shrink-0 uppercase tracking-wider">技能指</span>
                                                                <span className="font-bold text-gray-600 truncate">{c.tech_advisor || '---'}</span>
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
                    </div>
                )}
                <Pagination />
            </div>
        </div>
    )
}
