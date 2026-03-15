'use client'

import React from 'react';
import { Building2 } from 'lucide-react';
import { companyInitials } from '@/lib/utils/companyName';

interface Company {
    id: string;
    name_jp: string;
    representative?: string;
    worker_count?: number;
}

interface CompanyColumnProps {
    companies: Company[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    hideAll?: boolean;
}

function CompanyColumn({ companies, selectedId, onSelect, hideAll = false }: CompanyColumnProps) {
    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto thin-scrollbar">
                {!hideAll && (
                    <button
                        onClick={() => onSelect(null)}
                        className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors duration-150 flex items-center justify-between
                            ${selectedId === null ? 'bg-white' : 'hover:bg-gray-50'}`}
                    >
                        <span className={`text-[13px] font-bold rounded-full px-2.5 py-1 transition-all
                            ${selectedId === null ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}>
                            すべて表示
                        </span>
                        <span className={`text-[9px] font-mono font-normal px-1.5 py-0.5 rounded-full leading-none
                            ${selectedId === null ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {companies.length}
                        </span>
                    </button>
                )}

                {companies.map((company) => {
                    const isSelected = selectedId === company.id;
                    const initial = companyInitials(company.name_jp);
                    const hasWorkers = (company.worker_count || 0) > 0;

                    return (
                        <button
                            key={company.id}
                            onClick={() => onSelect(company.id)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 border-l-[3px] transition-all duration-150 flex items-center gap-3
                                ${isSelected
                                    ? 'bg-emerald-50/60 border-l-emerald-500'
                                    : 'hover:bg-slate-50 border-l-transparent'}`}
                        >
                            {/* Avatar */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[14px] font-bold transition-colors
                                ${isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                {initial}
                            </div>

                            {/* Name block */}
                            <div className="flex-1 min-w-0">
                                <div className={`text-[13px] font-semibold truncate leading-snug
                                    ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
                                    {company.name_jp}
                                </div>
                                {company.representative && (
                                    <div className={`text-[11px] font-normal truncate leading-none mt-0.5
                                        ${isSelected ? 'text-emerald-600/70' : 'text-gray-400'}`}>
                                        代表: {company.representative}
                                    </div>
                                )}
                            </div>

                            {/* Worker count */}
                            {company.worker_count !== undefined && (
                                <div className="shrink-0 flex flex-col items-center">
                                    <span className={`text-[15px] font-bold font-mono leading-none
                                        ${isSelected ? 'text-emerald-600' : hasWorkers ? 'text-emerald-500' : 'text-gray-200'}`}>
                                        {company.worker_count}
                                    </span>
                                    <span className="text-[9px] text-gray-300 uppercase tracking-widest mt-0.5">名</span>
                                </div>
                            )}
                        </button>
                    );
                })}

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
