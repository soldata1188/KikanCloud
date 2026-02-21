'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Search, Edit2, Calendar, Building2, FileText, Filter, AlertCircle, RefreshCw, FileSearch } from 'lucide-react'
import { Worker } from '@/types/schema'

export function WorkersClient({ workers, userRole }: { workers: Worker[], userRole?: string }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [companyFilter, setCompanyFilter] = useState('all')
    const [systemTypeFilter, setSystemTypeFilter] = useState('all')
    const [batchFilter, setBatchFilter] = useState('all')

    const uniqueCompanies = useMemo(() => {
        const comps = new Set<string>()
        workers.forEach(w => w.companies?.name_jp && comps.add(w.companies.name_jp))
        return Array.from(comps).sort()
    }, [workers])

    const uniqueBatches = useMemo(() => {
        const batches = new Set<string>()
        workers.forEach(w => w.entry_batch && batches.add(w.entry_batch))
        return Array.from(batches).sort()
    }, [workers])

    const filteredWorkers = useMemo(() => {
        return workers.filter(w => {
            const matchSearch = searchTerm === '' ||
                w.full_name_romaji?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                w.full_name_kana?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                w.zairyu_no?.toLowerCase().includes(searchTerm.toLowerCase())

            const matchStatus = statusFilter === 'all' || w.status === statusFilter
            const matchCompany = companyFilter === 'all' || w.companies?.name_jp === companyFilter
            const matchSystemType = systemTypeFilter === 'all' || w.system_type === systemTypeFilter
            const matchBatch = batchFilter === 'all' || w.entry_batch === batchFilter

            return matchSearch && matchStatus && matchCompany && matchSystemType && matchBatch
        })
    }, [workers, searchTerm, statusFilter, companyFilter, systemTypeFilter, batchFilter])

    const isExpiringSoon = (dateStr: string) => {
        if (!dateStr) return false
        const expDate = new Date(dateStr)
        const ninetyDaysFromNow = new Date()
        ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
        return expDate <= ninetyDaysFromNow && expDate > new Date()
    }

    const isExpired = (dateStr: string) => {
        if (!dateStr) return false
        const expDate = new Date(dateStr)
        return expDate < new Date()
    }

    return (
        <div className="flex-1 flex flex-col w-full max-w-[1200px] mx-auto mt-4 md:mt-8">
            <div className="bg-white rounded-md p-4 mb-6 space-y-4">
                <div className="min-h-[48px] px-4 py-2 flex items-center gap-3 bg-[#fbfcfd] rounded-md -transparent focus-within:bg-white focus-within: transition-colors">
                    <Search size={20} className="text-[#1f1f1f]" strokeWidth={1.5} />
                    <input
                        type="text"
                        placeholder="例：NGUYEN VAN A、または在留カード番号を入力..."
                        className="w-full bg-transparent outline-none text-[16px] text-[#1f1f1f] placeholder:text-[#1f1f1f]/70"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 px-1">
                    <div className="flex items-center gap-2 text-sm text-[#1f1f1f] font-medium mr-2">
                        <Filter size={16} /> 絞り込み:
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white text-[#1f1f1f] text-sm rounded-md px-4 py-2 hover:bg-[#fbfcfd] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 transition-all font-medium appearance-none min-w-[140px] cursor-pointer"
                    >
                        <option value="all">すべてのステータス</option>
                        <option value="working">就業中</option>
                        <option value="standby">待機中</option>
                        <option value="waiting">入国待ち</option>
                        <option value="missing">失踪</option>
                        <option value="returned">帰国</option>
                    </select>

                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className="bg-white text-[#1f1f1f] text-sm rounded-md px-4 py-2 hover:bg-[#fbfcfd] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 transition-all font-medium appearance-none min-w-[160px] cursor-pointer"
                    >
                        <option value="all">すべての受入企業</option>
                        {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={systemTypeFilter}
                        onChange={(e) => setSystemTypeFilter(e.target.value)}
                        className="bg-white text-[#1f1f1f] text-sm rounded-md px-4 py-2 hover:bg-[#fbfcfd] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 transition-all font-medium appearance-none min-w-[140px] cursor-pointer"
                    >
                        <option value="all">すべての制度</option>
                        <option value="ikusei_shuro">育成就労</option>
                        <option value="tokuteigino">特定技能</option>
                        <option value="ginou_jisshu">技能実習</option>
                    </select>

                    <select
                        value={batchFilter}
                        onChange={(e) => setBatchFilter(e.target.value)}
                        className="bg-white text-[#1f1f1f] text-sm rounded-md px-4 py-2 hover:bg-[#fbfcfd] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 transition-all font-medium appearance-none min-w-[140px] cursor-pointer"
                    >
                        <option value="all">すべての入国期生</option>
                        {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    {(searchTerm || statusFilter !== 'all' || companyFilter !== 'all' || systemTypeFilter !== 'all' || batchFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                setStatusFilter('all')
                                setCompanyFilter('all')
                                setSystemTypeFilter('all')
                                setBatchFilter('all')
                            }}
                            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#878787] hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors"
                        >
                            <RefreshCw size={12} /> リセット
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white/80 rounded-md overflow-hidden p-2">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[#1f1f1f]">
                        <thead className="bg-transparent text-[12px] font-semibold text-[#1f1f1f]/60 border-b border-[#ededed]/50 uppercase tracking-widest whitespace-nowrap">
                            <tr>
                                <th className="px-4 py-2 font-medium">氏名 / 基本情報</th>
                                <th className="px-4 py-2 font-medium">受入企業 / 期生</th>
                                <th className="px-4 py-2 font-medium">制度区分 / ステータス</th>
                                <th className="px-4 py-2 font-medium">入国日 / 在留期限</th>
                                <th className="px-4 py-2 font-medium text-right w-[120px]">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50">
                            {filteredWorkers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-[#1f1f1f]/60 font-medium">
                                        <div className="flex flex-col items-center gap-3">
                                            <Search size={32} className="text-gray-300" />
                                            条件に一致する人材が見つかりません。
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filteredWorkers.map((w) => {
                                const expSoon = isExpiringSoon(w.cert_end_date || '')
                                const expPass = isExpired(w.cert_end_date || '')

                                return (
                                    <tr key={w.id} className="hover:bg-white transition-colors group">
                                        {/* 1. Name & Info */}
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-11 h-11 rounded-md bg-[#fbfcfd] overflow-hidden flex items-center justify-center shrink-0">
                                                    {w.avatar_url ? <img src={w.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-[#1f1f1f] font-medium text-sm">{w.full_name_romaji.charAt(0)}</span>}
                                                </div>
                                                <div>
                                                    <Link href={`/workers/${w.id}/edit`} className="block group-hover:text-[#24b47e] transition-colors" title="クリックして編集">
                                                        <div className="font-semibold text-[#1f1f1f] text-[15px] group-hover:text-[#24b47e] flex items-center gap-2 leading-tight mb-1">
                                                            {w.full_name_romaji}
                                                            {w.nationality && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-[#878787] rounded border border-[#ededed] uppercase tracking-wide">{w.nationality}</span>}
                                                        </div>
                                                        <div className="text-[13px] text-[#878787] flex items-center gap-2">
                                                            <span>{w.full_name_kana || 'カナ未設定'}</span>
                                                            <span className="text-gray-300">|</span>
                                                            <span className="font-mono text-xs tracking-wider flex items-center gap-1"><FileText size={12} className="text-[#878787]" /> {w.zairyu_no || 'カード未設定'}</span>
                                                        </div>
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 2. Company & Batch */}
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="font-medium text-[#1f1f1f] flex items-center gap-1.5">
                                                    <Building2 size={14} className="text-[#24b47e]" />
                                                    {w.companies?.name_jp || <span className="text-[#878787] italic">未割当</span>}
                                                </div>
                                                {w.entry_batch && (
                                                    <div className="text-[12px] text-[#878787] font-medium inline-flex items-center gap-1">
                                                        <span className="px-2 py-0.5 bg-[#fbfcfd] rounded-md border border-[#ededed] block w-fit">📍 {w.entry_batch}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* 3. System & Status */}
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col items-start gap-2">
                                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${w.system_type === 'ikusei_shuro' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' : w.system_type === 'tokuteigino' ? 'bg-[#fbfcfd] text-blue-700 border-blue-100/50' : 'bg-red-50 text-red-700 border-red-100/50'}`}>
                                                    {w.system_type === 'ikusei_shuro' ? '育成就労' : w.system_type === 'tokuteigino' ? '特定技能' : '技能実習'}
                                                </span>

                                                <div className={`text-[12px] font-medium flex items-center gap-1.5 ${w.status === 'working' ? 'text-green-600' : w.status === 'missing' ? 'text-red-500' : w.status === 'returned' ? 'text-[#878787]' : 'text-orange-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-md shadow-sm ${w.status === 'working' ? 'bg-green-500' : w.status === 'missing' ? 'bg-red-500' : w.status === 'returned' ? 'bg-gray-400' : 'bg-orange-500'}`}></span>
                                                    {w.status === 'working' ? '就業中' : w.status === 'standby' ? '待機中' : w.status === 'missing' ? '失踪' : w.status === 'returned' ? '帰国' : '入国待ち'}
                                                </div>
                                            </div>
                                        </td>

                                        {/* 4. Dates */}
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col gap-1.5 text-[13px]">
                                                <div className="flex items-center gap-1.5 text-[#878787]">
                                                    <Calendar size={13} className="text-[#878787]" />
                                                    <span className="w-10 text-[11px] text-[#878787]">入国:</span>
                                                    <span className="font-medium text-[#1f1f1f]">{w.entry_date ? w.entry_date.replace(/-/g, '/') : '未定'}</span>
                                                </div>
                                                <div className={`flex items-center gap-1.5 ${expPass ? 'text-red-600 font-semibold' : expSoon ? 'text-orange-600 font-semibold' : 'text-[#878787]'}`}>
                                                    {expPass || expSoon ? <AlertCircle size={13} strokeWidth={2.5} /> : <Calendar size={13} className="text-[#878787]" />}
                                                    <span className={`w-10 text-[11px] ${expPass || expSoon ? 'text-current' : 'text-[#878787]'}`}>在留:</span>
                                                    <span className={`font-medium ${expPass || expSoon ? 'text-current' : 'text-[#1f1f1f]'}`}>
                                                        {w.cert_end_date ? w.cert_end_date.replace(/-/g, '/') : '未定'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 5. Actions */}
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <Link href={`/workers/${w.id}`} className="px-3 py-1.5 flex items-center gap-1.5 rounded-md text-xs font-medium text-[#1f1f1f] hover:text-white hover:bg-[#24b47e] transition-colors border border-transparent hover:border-[#24b47e]" title="詳細">
                                                    <FileSearch size={14} strokeWidth={2} /> 詳細
                                                </Link>
                                                <Link href={`/workers/${w.id}/edit`} className="px-3 py-1.5 flex items-center gap-1.5 rounded-md text-xs font-medium text-[#1f1f1f] hover:text-[#24b47e] hover:bg-[#fbfcfd] transition-colors border border-transparent" title="編集">
                                                    <Edit2 size={14} strokeWidth={2} /> 編集
                                                </Link>
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
                全 <span className="text-[#1f1f1f]">{filteredWorkers.length}</span> 件を表示
            </div>
        </div>
    )
}
