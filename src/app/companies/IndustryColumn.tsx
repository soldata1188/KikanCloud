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
}

export default function IndustryColumn({ industries, selectedIndustry, onSelect }: IndustryColumnProps) {
    const total = industries.reduce((sum, b) => sum + b.count, 0);

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto thin-scrollbar">
                {/* ALL button */}
                <button
                    onClick={() => onSelect(null)}
                    className={`w-full h-[52px] flex items-center justify-between px-4 border-b border-gray-100 transition-all group
                        ${selectedIndustry === null
                            ? 'bg-blue-50 text-blue-900 border-l-[3px] border-blue-500'
                            : 'hover:bg-blue-50/40 text-slate-600 border-l-[3px] border-transparent'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105
                            ${selectedIndustry === null ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Briefcase size={15} />
                        </div>
                        <span className="text-[12px] font-black uppercase tracking-tight">すべて (ALL)</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                        ${selectedIndustry === null ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {total}
                    </span>
                </button>

                {/* Industry items */}
                <div className="mt-0">
                    {industries.map(item => {
                        const isSelected = selectedIndustry === item.label;
                        return (
                            <button
                                key={item.label}
                                onClick={() => onSelect(item.label)}
                                className={`w-full h-[52px] flex items-center justify-between px-4 border-b border-gray-100 transition-all group
                                    ${isSelected
                                        ? 'bg-blue-50 text-blue-900 border-l-[3px] border-blue-500'
                                        : 'hover:bg-blue-50/40 text-slate-600 border-l-[3px] border-transparent'}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105
                                        ${isSelected ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-400'}`}>
                                        <Briefcase size={15} />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className={`text-[12px] font-bold truncate text-left
                                            ${isSelected ? 'text-blue-900 font-black' : 'text-slate-700'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                                        ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {item.count}
                                    </span>
                                    <ChevronRight size={13} className={`transition-transform group-hover:translate-x-0.5
                                        ${isSelected ? 'text-blue-500' : 'text-slate-300'}`} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {industries.length === 0 && (
                    <div className="py-12 text-center">
                        <Briefcase size={32} className="mx-auto text-gray-100 mb-3" />
                        <p className="text-[11px] font-bold text-gray-300">データがありません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
