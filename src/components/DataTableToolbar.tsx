'use client'
import { useState } from 'react'
import { Search, Grid, List, Plus } from 'lucide-react'
import Link from 'next/link'

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

    return (
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-4 gap-4 w-full">
            <div className="flex items-center gap-2 w-full xl:w-auto flex-wrap">
                <div className="relative w-full sm:w-[280px] shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#878787]" size={16} />
                    <input type="text" value={searchTerm} onChange={handleSearch} placeholder={searchPlaceholder} className="w-full h-[40px] bg-white border border-slate-200 rounded-[32px] pl-10 pr-4 text-[13px] outline-none focus:border-[#24b47e] transition-colors text-[#1f1f1f] placeholder:text-[#878787] shadow-sm" />
                </div>
                {filterNode}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar justify-end">
                {layout && onLayoutChange ? (
                    <div className="flex items-center bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                        <button onClick={() => onLayoutChange('grid')} className={`p-1.5 rounded-full transition-all ${layout === 'grid' ? 'bg-slate-800 text-white shadow-sm' : 'text-[#878787] hover:text-[#1f1f1f] hover:bg-slate-50'}`}><Grid size={16} /></button>
                        <button onClick={() => onLayoutChange('list')} className={`p-1.5 rounded-full transition-all ${layout === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-[#878787] hover:text-[#1f1f1f] hover:bg-slate-50'}`}><List size={16} /></button>
                    </div>
                ) : null}
                {importNode}
                {addLink && (role === 'admin' || role === 'staff') && (
                    <Link href={addLink} className="group relative h-[40px] w-[40px] flex items-center justify-center bg-[#24b47e] hover:bg-[#1e9a6a] text-white rounded-full transition-all shadow-md shadow-[#24b47e]/20 active:scale-95 shrink-0">
                        <Plus size={20} />
                        <div className="absolute top-full mt-2 px-2 py-1 bg-[#1f1f1f] text-white text-[11px] font-medium rounded-lg opacity-0 invisible translate-y-[-5px] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 whitespace-nowrap z-[60] pointer-events-none">
                            新規登録
                        </div>
                    </Link>
                )}
            </div>
        </div>
    )
}
