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
            <div className="flex items-center gap-2 w-full xl:w-auto flex-wrap px-4 xl:px-8">
                <div className="relative w-full sm:w-[280px] shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" value={searchTerm} onChange={handleSearch} placeholder={searchPlaceholder} className="w-full h-[36px] bg-white border border-gray-200 rounded-md pl-9 pr-4 text-[12px] outline-none focus:border-blue-600 transition-colors text-gray-800 placeholder:text-gray-400 shadow-sm" />
                </div>
                {filterNode}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar justify-end px-4 xl:px-8">
                {layout && onLayoutChange ? (
                    <div className="flex items-center bg-white border border-gray-200 rounded-md p-1 shadow-sm">
                        <button onClick={() => onLayoutChange('grid')} className={`p-1 rounded-md transition-all ${layout === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}><Grid size={15} /></button>
                        <button onClick={() => onLayoutChange('list')} className={`p-1 rounded-md transition-all ${layout === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}><List size={15} /></button>
                    </div>
                ) : null}
                {importNode}
                {addLink && (role === 'admin' || role === 'staff') && (
                    <Link href={addLink} className="group relative h-[36px] px-4 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all shadow-sm active:scale-95 shrink-0 gap-2 font-bold text-[12px]">
                        <Plus size={16} />
                        <span>新規登録</span>
                    </Link>
                )}
            </div>
        </div>
    )
}
