'use client'

import React from 'react';
import { Building2, ChevronRight } from 'lucide-react';

interface Company {
    id: string;
    name_jp: string;
    worker_count?: number;
}

interface CompanyColumnProps {
    companies: Company[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}

export default function CompanyColumn({ companies, selectedId, onSelect }: CompanyColumnProps) {
    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            {/* List */}
            <div className="flex-1 overflow-y-auto thin-scrollbar">
                <button
                    onClick={() => onSelect(null)}
                    className={`w-full h-[52px] flex items-center justify-between px-4 transition-all group ${selectedId === null ? 'bg-blue-50 text-blue-900 border-l-[3px] border-l-blue-500' : 'hover:bg-slate-50 text-slate-600 border-l-[3px] border-l-transparent'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${selectedId === null ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Building2 size={16} />
                        </div>
                        <span className="text-[13px] font-black uppercase tracking-tight">すべて表示 (All)</span>
                    </div>
                </button>

                <div className="mt-0">
                    {companies.map(company => (
                        <button
                            key={company.id}
                            onClick={() => onSelect(company.id)}
                            className={`w-full h-[52px] flex items-center justify-between px-4 transition-all group ${selectedId === company.id ? 'bg-blue-50 text-blue-900 border-l-[3px] border-blue-500' : 'hover:bg-slate-50 text-slate-600 border-l-[3px] border-l-transparent'}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${selectedId === company.id ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-400'}`}>
                                    <Building2 size={16} />
                                </div>
                                <span className={`text-[13px] font-bold truncate text-left ${selectedId === company.id ? 'text-blue-900 font-black' : 'text-slate-700'}`}>{company.name_jp}</span>
                            </div>
                            <ChevronRight size={14} className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${selectedId === company.id ? 'text-blue-500' : 'text-slate-300'}`} />
                        </button>
                    ))}
                </div>

                {companies.length === 0 && (
                    <div className="py-12 text-center">
                        <Building2 size={32} className="mx-auto text-gray-100 mb-3" />
                        <p className="text-[12px] font-bold text-gray-300 px-4">該当する企業はありません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
