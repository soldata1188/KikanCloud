'use client'

import React from 'react';
import { Building2 } from 'lucide-react';

interface Company {
    id: string;
    name_jp: string;
    name_romaji?: string;
    representative?: string;
    status?: string | null;
    worker_count?: number;
    active_worker_count?: number;
}

interface CompanyListColumnProps {
    companies: Company[];
    selectedIds: string[];
    onSelect: (id: string, event?: React.MouseEvent) => void;
}

export default function CompanyListColumn({ companies, selectedIds, onSelect }: CompanyListColumnProps) {
    if (!companies.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white h-full">
                <Building2 size={28} className="text-gray-200 mb-2" />
                <p className="text-[11px] font-normal text-gray-300">該当する企業がありません</p>
                <p className="text-[10px] text-gray-200 mt-1 uppercase tracking-widest">条件を変更してください</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto thin-scrollbar">
                {companies.map((company) => {
                    const isSelected = selectedIds.includes(company.id);
                    const initial = (company.name_jp || '?').charAt(0);
                    const hasWorkers = (company.active_worker_count || 0) > 0;

                    return (
                        <button
                            key={company.id}
                            onClick={(e) => onSelect(company.id, e)}
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
                                    {company.name_jp || '---'}
                                </div>
                                <div className={`text-[11px] font-normal truncate leading-none mt-0.5
                                    ${isSelected ? 'text-emerald-600/70' : 'text-gray-400'}`}>
                                    {company.representative ? `代表: ${company.representative}` : (company.name_romaji || '---')}
                                </div>
                            </div>

                            {/* Worker count */}
                            <div className="shrink-0 flex flex-col items-center">
                                <span className={`text-[15px] font-bold font-mono leading-none
                                    ${isSelected ? 'text-emerald-600' : hasWorkers ? 'text-emerald-500' : 'text-gray-200'}`}>
                                    {company.active_worker_count || 0}
                                </span>
                                <span className="text-[9px] text-gray-300 uppercase tracking-widest mt-0.5">名</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
