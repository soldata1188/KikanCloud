'use client'

import React from 'react';
import { CalendarDays, ChevronRight } from 'lucide-react';

interface EntryBatchItem {
    label: string;
    count: number;
    date?: string;
}

interface EntryBatchColumnProps {
    batches: EntryBatchItem[];
    selectedBatch: string | null;
    onSelect: (batch: string | null) => void;
}

function EntryBatchColumn({ batches, selectedBatch, onSelect }: EntryBatchColumnProps) {
    const total = React.useMemo(() => batches.reduce((sum, b) => sum + b.count, 0), [batches]);

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto thin-scrollbar">
                {/* ALL button */}
                <button
                    onClick={() => onSelect(null)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors duration-150 flex items-center justify-between
                        ${selectedBatch === null
                            ? 'bg-emerald-50 border-l-[3px] border-emerald-500'
                            : 'hover:bg-emerald-50/40 border-l-[3px] border-transparent'}`}
                >
                    <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0
                            ${selectedBatch === null ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <CalendarDays size={14} />
                        </div>
                        <span className={`text-[13px] font-normal uppercase tracking-wide
                            ${selectedBatch === null ? 'text-emerald-900' : 'text-slate-900'}`}>すべて</span>
                    </div>
                    <span className={`text-[9px] font-mono font-normal px-1 py-0.5 rounded leading-none
                        ${selectedBatch === null ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {total}
                    </span>
                </button>

                {/* Batch items */}
                <div className="mt-0">
                    {batches.map(batch => {
                        const isSelected = selectedBatch === batch.label;
                        return (
                            <button
                                key={batch.label}
                                onClick={() => onSelect(batch.label)}
                                className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors duration-150 flex items-center justify-between group
                                    ${isSelected
                                        ? 'bg-emerald-50 border-l-[3px] border-emerald-500'
                                        : 'hover:bg-emerald-50/40 border-l-[3px] border-transparent'}`}
                            >
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <span className={`text-[13px] font-normal truncate uppercase tracking-wide leading-none
                                        ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                                        {batch.label}
                                    </span>
                                    {batch.date && batch.date !== '---' && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className={`text-[10px] font-normal truncate
                                                ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                {batch.date.replace(/-/g, '.')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-[9px] font-mono font-normal px-1 py-0.5 rounded leading-none
                                        ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {batch.count}
                                    </span>
                                    <ChevronRight size={13} className={`transition-transform group-hover:translate-x-0.5
                                        ${isSelected ? 'text-emerald-500' : 'text-slate-300'}`} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {batches.length === 0 && (
                    <div className="py-12 text-center">
                        <CalendarDays size={32} className="mx-auto text-gray-100 mb-3" />
                        <p className="text-[11px] font-normal text-gray-300">データがありません</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default React.memo(EntryBatchColumn);
