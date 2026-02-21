'use client'
import { useState } from 'react'
import { Search, Grid, List, Plus, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

export function DataTableToolbar({ data, filename, searchPlaceholder, onSearch, type, role, addLink }: { data: any[], filename: string, searchPlaceholder: string, onSearch: (term: string) => void, type: 'workers' | 'companies', role: string, addLink?: string }) {
    const [searchTerm, setSearchTerm] = useState('')
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { const term = e.target.value; setSearchTerm(term); onSearch(term); }
    const handleExport = () => { try { let exportData = data.map((d, i) => ({ 'No': i + 1, 'Data': JSON.stringify(d) })); const ws = XLSX.utils.json_to_sheet(exportData); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data"); XLSX.writeFile(wb, `${filename}.xlsx`); } catch (e) { } }

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 w-full">
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-[260px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#878787]" size={14} />
                    <input type="text" value={searchTerm} onChange={handleSearch} placeholder={searchPlaceholder} className="w-full h-[32px] bg-white border border-[#ededed] rounded-md pl-8 pr-3 text-[13px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] placeholder:text-[#878787]" />
                </div>
                <button className="h-[32px] px-3 bg-white border border-[#ededed] rounded-md text-[13px] text-[#1f1f1f] flex items-center gap-2 hover:bg-[#fbfcfd]">
                    ステータス <span className="text-[10px] text-[#878787]">▼</span>
                </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <div className="flex items-center bg-[#fbfcfd] border border-[#ededed] rounded-md p-0.5">
                    <button className="p-1 rounded text-[#878787] hover:text-[#1f1f1f] hover:bg-[#ededed]"><Grid size={14} /></button>
                    <button className="p-1 rounded bg-white text-[#1f1f1f] shadow-sm border border-[#ededed]"><List size={14} /></button>
                </div>
                {role === 'admin' && (
                    <button onClick={handleExport} className="h-[32px] px-3 bg-white border border-[#ededed] hover:bg-[#fbfcfd] text-[#1f1f1f] rounded-md text-[13px] font-medium transition-colors flex items-center gap-2">
                        <FileSpreadsheet size={14} /> Excel出力
                    </button>
                )}
                {addLink && role !== 'staff' && role !== 'company_user' && (
                    <Link href={addLink} className="h-[32px] px-3 bg-[#24b47e] hover:bg-[#1e9a6a] text-white rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors">
                        <Plus size={14} /> 新規登録
                    </Link>
                )}
            </div>
        </div>
    )
}
