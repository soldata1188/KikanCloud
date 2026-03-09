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
                <Building2 size={36} className="text-gray-200 mb-3" />
                <p className="text-[12px] font-bold text-gray-400">該当する企業がありません</p>
                <p className="text-[10px] text-gray-300 mt-1">条件を変更してください</p>
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
                            className={`group relative h-[52px] flex items-center gap-3 px-3 border-b border-gray-100 cursor-pointer transition-all hover:bg-blue-50/30
                                ${isSelected ? 'bg-blue-50/50' : 'bg-white'}`}
                        >
                            {/* Selection style edge line */}
                            {isSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500" />
                            )}



                            <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                                <div className="flex items-center justify-between gap-2 w-full">
                                    <p className={`text-[13px] leading-tight truncate
                                        ${isSelected ? 'text-blue-900 font-black' : 'text-gray-800 font-bold'}`}>
                                        {company.name_jp}
                                    </p>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap
                                        ${company.active_worker_count! > 0 ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                                        在籍: {company.active_worker_count || 0}
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
