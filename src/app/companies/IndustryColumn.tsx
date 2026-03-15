'use client'

import React from 'react';
import { Briefcase, ChevronRight } from 'lucide-react';

interface IndustryItem {
    label: string;
    count: number;
}

interface IndustryColumnProps {
    industries: IndustryItem[];
    selectedIndustry: string | null;
    onSelect: (industry: string | null) => void;
    hideAll?: boolean;
}

export default function IndustryColumn({ industries, selectedIndustry, onSelect, hideAll = false }: IndustryColumnProps) {
    const total = industries.reduce((sum, b) => sum + b.count, 0);

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* ALL button */}
                {!hideAll && (
                <button
                    onClick={() => onSelect(null)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors duration-150 flex items-center justify-between
                        ${selectedIndustry === null ? 'bg-white' : 'hover:bg-gray-50'}`}
                >
                    <span className={`text-[13px] font-bold rounded-full px-2.5 py-1 transition-all
                        ${selectedIndustry === null ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}>
                        すべて
                    </span>
                    <span className={`text-[9px] font-mono font-normal px-1.5 py-0.5 rounded-full leading-none
                        ${selectedIndustry === null ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {total}
                    </span>
                </button>
                )}

                {/* Industry items */}
                <div className="mt-0">
                    {industries.map(item => {
                        const isSelected = selectedIndustry === item.label;
                        return (
                            <button
                                key={item.label}
                                onClick={() => onSelect(item.label)}
                                className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors duration-150 flex items-center justify-between group
                                    ${isSelected
                                        ? 'bg-emerald-50 border-l-[3px] border-emerald-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
                                        : 'hover:bg-emerald-50/40 border-l-[3px] border-transparent'}`}
                            >
                                <div className="flex items-center min-w-0 flex-1">
                                    <span className={`text-[13px] font-normal truncate uppercase text-left tracking-wide
                                        ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                                        {item.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-xs font-mono font-bold px-1 py-0.5 rounded leading-none
                                        ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {item.count}
                                    </span>
                                    <ChevronRight size={13} className={`transition-transform group-hover:translate-x-0.5
                                        ${isSelected ? 'text-emerald-500' : 'text-slate-300'}`} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {industries.length === 0 && (
                    <div className="py-16 text-center">
                        <Briefcase size={28} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-[11px] font-normal text-gray-300">データがありません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
