'use client'

import React from 'react';
import { Building2, CheckCircle2, Circle } from 'lucide-react';

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
        <div className="w-full h-full flex flex-col bg-white overflow-hidden p-[1px]">
            <div className="flex-1 overflow-y-auto thin-scrollbar">
                {companies.map(company => {
                    const isSelected = selectedIds.includes(company.id);
                    return (
                        <div
                            key={company.id}
                            onClick={(e) => onSelect(company.id, e)}
                            className={`group relative text-left px-3 py-2.5 border-b border-gray-100 cursor-pointer transition-colors duration-150 flex items-center gap-2.5
                                ${isSelected ? 'bg-emerald-50 border-l-[3px] border-emerald-500' : 'bg-white hover:bg-emerald-50/40 border-l-[3px] border-transparent'}`}
                        >




                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex items-center justify-between gap-2 w-full">
                                    <p className={`text-[13px] font-normal truncate uppercase tracking-wide leading-none
                                        ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                                        {company.name_jp}
                                    </p>
                                    <span className={`text-[9px] font-normal font-mono px-1 py-0.5 rounded flex-shrink-0 whitespace-nowrap
                                        ${isSelected ? 'bg-emerald-500 text-white' : (company.active_worker_count! > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}`}>
                                        {company.active_worker_count || 0}
                                    </span>
                                </div>

                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
