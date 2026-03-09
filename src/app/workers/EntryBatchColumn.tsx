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

export default function EntryBatchColumn({ batches, selectedBatch, onSelect }: EntryBatchColumnProps) {
    const total = batches.reduce((sum, b) => sum + b.count, 0);

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* ALL button */}
                <button
                    onClick={() => onSelect(null)}
                    className={`w-full h-[52px] flex items-center justify-between px-4 border-b border-gray-100 transition-all
                        ${selectedBatch === null
                            ? 'bg-blue-50 text-blue-900 border-l-[3px] border-blue-500'
                            : 'hover:bg-slate-50 text-slate-600 border-l-[3px] border-transparent'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0
                            ${selectedBatch === null ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <CalendarDays size={15} />
                        </div>
                        <span className="text-[12px] font-black uppercase tracking-tight">すべて (ALL)</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                        ${selectedBatch === null ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
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
                                className={`w-full h-[52px] flex items-center justify-between px-4 border-b border-gray-100 transition-all group
                                    ${isSelected
                                        ? 'bg-blue-50 text-blue-900 border-l-[3px] border-blue-500'
                                        : 'hover:bg-slate-50 text-slate-600 border-l-[3px] border-transparent'}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105
                                        ${isSelected ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-400'}`}>
                                        <CalendarDays size={15} />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className={`text-[12px] font-bold truncate text-left
                                            ${isSelected ? 'text-blue-900 font-black' : 'text-slate-700'}`}>
                                            {batch.label}
                                        </span>
                                        {batch.date && batch.date !== '---' && (
                                            <span className={`text-[10px] font-mono tabular-nums leading-none mt-0.5
                                                ${isSelected ? 'text-blue-600/70' : 'text-gray-400'}`}>
                                                {batch.date.replace(/-/g, '.')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                                        ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {batch.count}
                                    </span>
                                    <ChevronRight size={13} className={`transition-transform group-hover:translate-x-0.5
                                        ${isSelected ? 'text-blue-500' : 'text-slate-300'}`} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {batches.length === 0 && (
                    <div className="py-12 text-center">
                        <CalendarDays size={32} className="mx-auto text-gray-100 mb-3" />
                        <p className="text-[11px] font-bold text-gray-300">データがありません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
