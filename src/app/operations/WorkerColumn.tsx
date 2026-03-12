'use client'

import React, { useState, useMemo } from 'react';
import { User, Calendar, ChevronDown, ChevronRight } from 'lucide-react';

interface Worker {
    id: string;
    name: string;
    furigana: string;
    company: string;
    visaExpiry: string;
    status: string;
    avatar: string;
    photoUrl: string | null;
    systemType?: string;
    entryBatch?: string;
    cert_end_date?: string;
    nyukan_status?: { progress: string };
    kikou_status?: { progress: string };
    kentei_status?: { progress: string };
}

interface WorkerColumnProps {
    workers: Worker[];
    selectedIds: string[];
    onSelect: (id: string, event: React.MouseEvent) => void;
}

const SYSTEM_LABEL: Record<string, string> = {
    ginou_jisshu: '技能実習',
    ikusei_shuro: '育成就労',
    tokuteigino: '特定技能',
};



export default function WorkerColumn({ workers, selectedIds, onSelect }: WorkerColumnProps) {
    const getDaysLeft = (dateStr: string) => {
        if (!dateStr || dateStr === '---') return null;
        return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    };

    const sortedWorkers = useMemo(() => {
        return [...(workers || [])].sort((a, b) => {
            if (!a.visaExpiry || a.visaExpiry === '---') return 1;
            if (!b.visaExpiry || b.visaExpiry === '---') return -1;
            return a.visaExpiry.localeCompare(b.visaExpiry);
        });
    }, [workers]);

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto thin-scrollbar">
                {sortedWorkers.map(worker => {
                    const daysLeft = getDaysLeft(worker.visaExpiry);
                    const isSelected = selectedIds.includes(worker.id);
                    const status = worker.nyukan_status?.progress;

                    let bgCls = 'bg-white hover:bg-emerald-50/40';
                    let borderCls = 'border-transparent';

                    if (status === '完了') {
                        bgCls = isSelected ? 'bg-emerald-100' : 'bg-emerald-50/50 hover:bg-emerald-100/50';
                        borderCls = isSelected ? 'border-emerald-500' : 'border-emerald-200';
                    } else if (status === '進行中') {
                        bgCls = isSelected ? 'bg-blue-100' : 'bg-blue-50/50 hover:bg-blue-100/50';
                        borderCls = isSelected ? 'border-blue-500' : 'border-blue-200';
                    } else if (isSelected) {
                        bgCls = 'bg-emerald-50';
                        borderCls = 'border-emerald-500';
                    }

                    return (
                        <button
                            key={worker.id}
                            onClick={(e) => onSelect(worker.id, e)}
                            className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-all duration-200 group flex items-center gap-2.5 border-l-[3px]
                                ${bgCls} ${borderCls}`}
                        >
                            {/* Avatar */}
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                                ${isSelected ? 'bg-emerald-200/50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                 {worker.photoUrl
                                     ? <img src={worker.photoUrl} alt="" className="w-full h-full object-cover rounded-full" />
                                     : worker.avatar}
                            </div>

                            {/* Info block */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                {/* Row 1: Name (Furigana) & Expiry Info */}
                                <div className="flex items-center justify-between gap-3">
                                     <div className="flex items-baseline gap-1.5 min-w-0">
                                        <span className={`text-sm font-bold truncate uppercase tracking-tight leading-none
                                            ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                                            {worker.name}
                                        </span>
                                        <span className={`text-xs truncate tracking-tight shrink-0
                                            ${isSelected ? 'text-emerald-600/60' : 'text-slate-400'}`}>
                                            {worker.furigana}
                                        </span>
                                    </div>
                                     <div className="flex items-center gap-1.5 shrink-0">
                                        <span className={`text-xs font-mono tracking-tighter opacity-70
                                            ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
                                            {worker.visaExpiry}
                                        </span>
                                        {daysLeft !== null && (
                                            <span className={`text-xs font-mono font-bold shrink-0 leading-none px-1 py-0.5 rounded
                                                ${isSelected
                                                    ? 'bg-emerald-500 text-white shadow-sm'
                                                    : daysLeft <= 30
                                                        ? 'bg-red-500 text-white animate-pulse'
                                                        : daysLeft <= 90
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-slate-100 text-slate-500'}`}>
                                                {daysLeft <= 0 ? 'Exp' : `${daysLeft}d`}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Company & Full Visa Name */}
                                 <div className="flex items-center justify-between gap-2 mt-1.5">
                                    <span className={`text-xs font-normal truncate leading-none
                                        ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        {worker.company}
                                    </span>
                                    <span className={`text-xs font-bold shrink-0 tracking-tight leading-none
                                        ${isSelected ? 'text-emerald-600' : 'text-emerald-600 opacity-90'}`}>
                                        {SYSTEM_LABEL[worker.systemType || ''] || '---'}
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}

                {(workers?.length === 0) && (
                    <div className="py-16 text-center">
                         <User size={32} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-xs font-normal text-gray-300">該当する労働者はいません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
