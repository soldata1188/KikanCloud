'use client'
import { useState } from 'react'
import { Search, Grid, List, Plus, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

interface DataTableToolbarProps<T> {
 data: T[];
 filename: string;
 searchPlaceholder: string;
 onSearch: (term: string) => void;
 type: 'workers' | 'companies';
 role: string;
 addLink?: string;
 importNode?: React.ReactNode;
 filterNode?: React.ReactNode;
 layout?: 'list' | 'grid';
 onLayoutChange?: (layout: 'list' | 'grid') => void;
}

export function DataTableToolbar<T>({ data, filename, searchPlaceholder, onSearch, type, role, addLink, importNode, filterNode, layout, onLayoutChange }: DataTableToolbarProps<T>) {
 const [searchTerm, setSearchTerm] = useState('')
 const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { const term = e.target.value; setSearchTerm(term); onSearch(term); }
 const handleExport = () => { try { let exportData = data.map((d, i) => ({ 'No': i + 1, 'Data': JSON.stringify(d) })); const ws = XLSX.utils.json_to_sheet(exportData); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws,"Data"); XLSX.writeFile(wb,`${filename}.xlsx`); } catch (e) { } }

 return (
 <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-4 gap-4 w-full">
 <div className="flex items-center gap-2 w-full xl:w-auto flex-wrap">
 <div className="relative w-full sm:w-[240px] shrink-0">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#878787]"size={14} />
 <input type="text"value={searchTerm} onChange={handleSearch} placeholder={searchPlaceholder} className="w-full h-[32px] bg-white border border-gray-350 rounded-md pl-8 pr-3 text-[13px] outline-none focus:border-[#878787] transition-colors text-[#1f1f1f] placeholder:text-[#878787]"/>
 </div>
 {filterNode}
 </div>

 <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
 {layout && onLayoutChange ? (
 <div className="flex items-center bg-white border border-gray-350 rounded-md p-0.5">
 <button onClick={() => onLayoutChange('grid')} className={`p-1 rounded ${layout === 'grid' ? 'bg-white text-[#1f1f1f] border border-gray-350' : 'text-[#878787] hover:text-[#1f1f1f] hover:bg-[#ededed]'}`}><Grid size={14} /></button>
 <button onClick={() => onLayoutChange('list')} className={`p-1 rounded ${layout === 'list' ? 'bg-white text-[#1f1f1f] border border-gray-350' : 'text-[#878787] hover:text-[#1f1f1f] hover:bg-[#ededed]'}`}><List size={14} /></button>
 </div>
 ) : (
 <div className="flex items-center bg-white border border-gray-350 rounded-md p-0.5">
 <button className="p-1 rounded text-[#878787] hover:text-[#1f1f1f] hover:bg-[#ededed]"><Grid size={14} /></button>
 <button className="p-1 rounded bg-white text-[#1f1f1f] border border-gray-350"><List size={14} /></button>
 </div>
 )}
 {role === 'admin' && (
 <button onClick={handleExport} className="group relative h-[32px] w-[32px] flex items-center justify-center bg-white border border-gray-350 hover:bg-gray-50 text-[#1f1f1f] rounded-md transition-colors shrink-0">
 <FileSpreadsheet size={16} />
 <div className="absolute top-full mt-2 px-2 py-1 bg-[#1f1f1f] text-white text-[11px] font-medium rounded-sm opacity-0 invisible translate-y-[-5px] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 whitespace-nowrap z-[60] pointer-events-none">
 Excel出力
 </div>
 </button>
 )}
 {importNode}
 {addLink && (role === 'admin' || role === 'staff') && (
 <Link href={addLink} className="group relative h-[32px] w-[32px] flex items-center justify-center bg-[#24b47e] hover:bg-[#1e9a6a] text-white rounded-md transition-colors shrink-0">
 <Plus size={16} />
 <div className="absolute top-full mt-2 px-2 py-1 bg-[#1f1f1f] text-white text-[11px] font-medium rounded-sm opacity-0 invisible translate-y-[-5px] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 whitespace-nowrap z-[60] pointer-events-none">
 新規登録
 </div>
 </Link>
 )}
 </div>
 </div>
 )
}
