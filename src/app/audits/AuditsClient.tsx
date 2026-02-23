'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Search, Calendar, AlertCircle, CheckCircle2, CalendarCheck, Edit2, Play, Grid, List, Plus, Printer, FileSpreadsheet } from 'lucide-react'
import { DataTableToolbar } from '@/components/DataTableToolbar'
import { SmartActionCell } from './SmartActionCell'
import { MonthFilter } from './MonthFilter'
import { ExportExcelButton } from './ExportExcelButton'

export function AuditsClient({ matrixData, filterMonth, userRole }: { matrixData: any[], filterMonth: string, userRole?: string }) {
    const [filtered, setFiltered] = useState(matrixData)
    const [layout, setLayout] = useState<'list' | 'grid'>('list')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        let result = matrixData

        if (searchTerm) {
            const lower = searchTerm.toLowerCase()
            result = result.filter(row =>
                row.company.name_jp?.toLowerCase().includes(lower) ||
                row.currentAudit?.pic_name?.toLowerCase().includes(lower)
            )
        }

        setFiltered(result)
    }, [searchTerm, matrixData])

    const handleSearch = (term: string) => {
        setSearchTerm(term)
    }

    const advancedFilters = (
        <div className="flex items-center gap-2 flex-wrap">
            <MonthFilter defaultValue={filterMonth} />
            <Link href={`/audits/print?month=${filterMonth}`} target="_blank" className="h-[32px] px-3 bg-white border border-gray-350 hover:bg-[#f4f5f7] text-[#1f1f1f] rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors shrink-0">
                <Printer size={14} /> <span className="hidden sm:inline">PDF</span>
            </Link>
            {userRole === 'admin' && <ExportExcelButton data={matrixData} month={filterMonth} />}
        </div>
    )

    return (
        <div className="flex flex-col gap-6">
            <DataTableToolbar
                data={filtered}
                filename={`監査訪問指導_${filterMonth}`}
                searchPlaceholder="企業名、担当者で検索..."
                onSearch={handleSearch}
                type="companies"
                // DataTableToolbar already includes Excel export if userRole === 'admin' and not using custom importNode, but ExportExcelButton handles specific formatting so we pass it in filterNode
                // We'll hide the default Toolbar exporter by passing a non-admin role, or just let it exist since ExportExcelButton might be specialized (we passed it above). Actually we'll pass role="staff" to hide default export.
                role={userRole === 'admin' ? 'admin_no_export' : (userRole || 'admin')}
                addLink="/audits/new"
                filterNode={advancedFilters}
                layout={layout}
                onLayoutChange={setLayout}
            />

            {layout === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">
                    {filtered.length === 0 && <div className="col-span-full py-12 text-center text-[#878787] bg-white border border-gray-350 rounded-md"><Search size={32} className="mx-auto mb-2 opacity-30" />データがありません。</div>}
                    {filtered.map((row, index) => (
                        <div key={row.company.id} className="group relative bg-white border border-gray-350 hover:border-[#24b47e] rounded-md p-5 transition-colors duration-200 flex flex-col">
                            <div className="absolute top-4 right-4 text-xs font-mono text-gray-400">
                                #{index + 1}
                            </div>
                            <div className="flex items-start gap-3 mb-4 pr-6">
                                <div className="w-10 h-10 rounded border border-gray-300 bg-gray-50 flex items-center justify-center shrink-0">
                                    <Building2 size={20} className="text-[#878787]" />
                                </div>
                                <div>
                                    <Link href={`/companies/${row.company.id}`} target="_blank" className="font-bold text-[#1f1f1f] hover:text-[#24b47e] transition-colors line-clamp-1 text-sm leading-tight leading-snug">{row.company.name_jp}</Link>
                                    <div className="flex items-center gap-1 mt-1 text-[11px]">
                                        <span className="text-[#1f1f1f] font-bold">計 {row.workerCounts.total} 名</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border inline-flex items-center gap-1 ${row.statusLabel.bg} ${row.statusLabel.border}`}>
                                    {row.priority === 1 || row.priority === 2 ? <AlertCircle size={10} /> : row.priority === 5 ? <CheckCircle2 size={10} /> : <CalendarCheck size={10} />}
                                    {row.statusLabel.text}
                                </span>
                            </div>

                            <div className="flex-1 flex flex-col gap-2 text-[11px] text-gray-600 bg-gray-50/50 p-2 rounded border border-gray-100 mb-4">
                                {row.currentAudit ? (
                                    <div className="flexitems-center gap-2">
                                        <span className="text-[10px] text-gray-400">予定:</span>
                                        <span className="text-[#1f1f1f] font-mono font-bold">{row.currentAudit.scheduled_date.replace(/-/g, '/')}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400">予定未設定</span>
                                )}

                                {row.currentAudit?.pic_name ? (
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-[10px] text-gray-400">担当:</span>
                                        <div className="flex items-center gap-1">
                                            <div className="w-4 h-4 rounded-sm bg-white border border-gray-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                                                {row.currentAudit.pic_name.charAt(0)}
                                            </div>
                                            <span className="font-medium text-[#1f1f1f]">{row.currentAudit.pic_name}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-[10px] text-gray-400">担当:</span>
                                        <span className="text-gray-400">---</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                                <SmartActionCell
                                    auditId={row.currentAudit?.id || null}
                                    status={row.currentAudit?.status || null}
                                    companyId={row.company.id}
                                    filterMonth={filterMonth}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto pb-16">
                    <table className="w-full border-collapse text-sm text-left whitespace-nowrap bg-white">
                        <thead className="bg-gray-50 text-gray-800 border-b border-gray-350">
                            <tr>
                                <th className="border border-gray-350 px-4 py-3 text-center w-[40px] shrink-0 font-semibold text-[11px]">No.</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[200px] w-auto">受入企業</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold w-[160px] text-center">ステータス</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold w-[220px]">予定日 / 完了履歴</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold w-[120px]">担当</th>
                                <th className="border border-gray-350 px-4 py-3 font-semibold text-center w-[120px]">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && <tr><td colSpan={6} className="border border-gray-350 px-5 py-12 text-center text-[#878787]"><Search size={32} className="mx-auto mb-2 opacity-30" />該当する企業がありません。</td></tr>}
                            {filtered.map((row, index) => (
                                <tr key={row.company.id} className="transition-colors hover:bg-gray-50 group">
                                    <td className="border border-gray-350 px-4 py-3 text-center align-top pt-5 font-mono text-gray-400 text-xs">
                                        {index + 1}
                                    </td>

                                    <td className="border border-gray-350 px-4 py-3 align-top">
                                        <div className="flex gap-3 mt-1.5">
                                            <div className="w-8 h-8 rounded border border-gray-350 bg-gray-50 flex items-center justify-center shrink-0 text-[#878787]">
                                                <Building2 size={16} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <Link href={`/companies/${row.company.id}`} target="_blank" className="font-semibold text-[#1f1f1f] group-hover:text-[#24b47e] transition-colors inline-block truncate leading-tight mb-1" title={row.company.name_jp}>
                                                    {row.company.name_jp}
                                                </Link>
                                                <div className="flex flex-col gap-0.5 mt-0.5">
                                                    <span className="text-[11px] text-[#878787] font-medium whitespace-nowrap">計 <span className="text-[#1f1f1f] font-bold">{row.workerCounts.total}</span> 名</span>
                                                    {(row.workerCounts.ikusei > 0 || row.workerCounts.tokutei > 0 || row.workerCounts.ginou > 0) && (
                                                        <div className="flex flex-wrap text-[10px] text-gray-500 gap-2 mt-1">
                                                            {row.workerCounts.ikusei > 0 && <span className="flex items-center gap-1">育成 <span className="text-gray-900 font-medium">{row.workerCounts.ikusei}</span></span>}
                                                            {row.workerCounts.tokutei > 0 && <span className="flex items-center gap-1">特定 <span className="text-gray-900 font-medium">{row.workerCounts.tokutei}</span></span>}
                                                            {row.workerCounts.ginou > 0 && <span className="flex items-center gap-1">技能 <span className="text-gray-900 font-medium">{row.workerCounts.ginou}</span></span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="border border-gray-350 px-4 py-3 align-top text-center pt-5">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border inline-flex items-center gap-1 ${row.statusLabel.bg} ${row.statusLabel.border}`}>
                                            {row.priority === 1 || row.priority === 2 ? <AlertCircle size={10} /> : row.priority === 5 ? <CheckCircle2 size={10} /> : <CalendarCheck size={10} />}
                                            {row.statusLabel.text}
                                        </span>
                                    </td>

                                    <td className="border border-gray-350 px-4 py-3 align-top min-w-[200px]">
                                        <div className="flex flex-col gap-2">
                                            {/* Current Month */}
                                            {row.currentAudit ? (
                                                <div className="flex items-center gap-2 pt-1 border-b border-gray-100 pb-2">
                                                    <span className="text-[9px] px-1 bg-white text-[#878787] rounded border border-gray-350 tracking-wider">予定</span>
                                                    <span className="text-[13px] text-[#1f1f1f] font-mono font-medium">{row.currentAudit.scheduled_date.replace(/-/g, '/')}</span>
                                                </div>
                                            ) : <div className="h-[28px] flex items-center pt-1 border-b border-gray-100 pb-2"><span className="text-gray-300 font-medium text-xs">予定未設定</span></div>}

                                            {/* History */}
                                            <div className="flex flex-col gap-1">
                                                <div className="text-[10px] text-gray-400 font-medium uppercase mt-1 mb-0.5 tracking-widest">最近の完了履歴</div>
                                                {row.lastTwoAudits.length > 0 ? (
                                                    row.lastTwoAudits.map((pa: any, i: number) => (
                                                        <div key={pa.id} className="text-[11px] text-gray-500 flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                                <span className="font-mono">{pa.actual_date?.replace(/-/g, '/')}</span>
                                                                <span className="px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-[9px]">
                                                                    {pa.audit_type === 'kansa' ? '監査' : pa.audit_type === 'homon' ? '訪問' : '臨時'}
                                                                </span>
                                                            </div>
                                                            <Link href={`/audits/${pa.id}/edit`} className="text-gray-400 hover:text-[#24b47e] transition-colors p-0.5 rounded hover:bg-[#ededed] opacity-0 group-hover:opacity-100" title="編集">
                                                                <Edit2 size={12} />
                                                            </Link>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-[11px] text-gray-300 font-medium flex items-center h-[20px]">-</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="border border-gray-350 px-4 py-3 align-top">
                                        <div className="pt-1.5 flex flex-col">
                                            {row.currentAudit?.pic_name ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-[4px] bg-gray-50 text-gray-600 flex items-center justify-center text-[10px] font-bold shrink-0 border border-gray-300">
                                                        {row.currentAudit.pic_name.charAt(0)}
                                                    </div>
                                                    <span className="text-[12px] font-medium text-[#1f1f1f]">{row.currentAudit.pic_name}</span>
                                                </div>
                                            ) : <span className="text-gray-300 font-medium text-xs">---</span>}
                                        </div>
                                    </td>

                                    <td className="border border-gray-350 px-4 py-3 align-top">
                                        <div className="h-full flex items-start justify-center pt-1.5">
                                            <SmartActionCell
                                                auditId={row.currentAudit?.id || null}
                                                status={row.currentAudit?.status || null}
                                                companyId={row.company.id}
                                                filterMonth={filterMonth}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
