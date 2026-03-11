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

function CompanyColumn({ companies, selectedId, onSelect }: CompanyColumnProps) {
    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            {/* List */}
            <div className="flex-1 overflow-y-auto thin-scrollbar">
                <button
                    onClick={() => onSelect(null)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors duration-150 flex items-center justify-between group
                        ${selectedId === null
                            ? 'bg-emerald-50 border-l-[3px] border-emerald-500'
                            : 'hover:bg-emerald-50/40 border-l-[3px] border-transparent'}`}
                >
                    <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0
                            ${selectedId === null ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Building2 size={14} />
                        </div>
                        <span className={`text-[13px] font-normal uppercase tracking-wide
                            ${selectedId === null ? 'text-emerald-900' : 'text-slate-900'}`}>すべて表示</span>
                    </div>
                </button>

                <div className="mt-0">
                    {companies.map(company => (
                        <button
                            key={company.id}
                            onClick={() => onSelect(company.id)}
                            className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors duration-150 flex items-center justify-between group
                                ${selectedId === company.id
                                    ? 'bg-emerald-50 border-l-[3px] border-emerald-500'
                                    : 'hover:bg-emerald-50/40 border-l-[3px] border-transparent'}`}
                        >
                            <div className="flex items-center min-w-0 flex-1">
                                <span className={`text-[13px] font-normal truncate uppercase text-left tracking-wide
                                    ${selectedId === company.id ? 'text-emerald-900' : 'text-slate-900'}`}>
                                    {company.name_jp}
                                </span>
                            </div>
                            <ChevronRight size={13} className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${selectedId === company.id ? 'text-emerald-500' : 'text-slate-300'}`} />
                        </button>
                    ))}
                </div>

                {companies.length === 0 && (
                    <div className="py-16 text-center">
                        <Building2 size={28} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-[11px] font-normal text-gray-300">該当する企業はありません</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default React.memo(CompanyColumn);
