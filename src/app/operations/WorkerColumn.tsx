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
    nyukanStatus?: { progress: string };
    kikouStatus?: { progress: string };
    kenteiStatus?: { progress: string };
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

// Progress: count workers where at least 2 of 3 procedures = 完了
function calcProgress(workers: Worker[]) {
    const done = workers.filter(w => {
        const count = [w.kikouStatus?.progress, w.nyukanStatus?.progress, w.kenteiStatus?.progress]
            .filter(p => p === '完了').length;
        return count >= 2;
    }).length;
    return workers.length > 0 ? Math.round((done / workers.length) * 100) : 0;
}

const StatusTag = ({ label, status, isSelected }: { label: string; status?: string; isSelected: boolean }) => {
    const cls = status === '完了'
        ? (isSelected ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
        : status === '進行中'
            ? (isSelected ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-blue-50 text-blue-600 border-blue-100')
            : (isSelected ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-gray-100 text-gray-400 border-gray-200');
    return (
        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border tracking-tighter ${cls}`}>
            {label}
        </span>
    );
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

                    return (
                        <button
                            key={worker.id}
                            onClick={(e) => onSelect(worker.id, e)}
                            className={`w-full h-[52px] text-left px-4 border-b border-gray-100 transition-all duration-150 group flex items-center gap-3
                                ${isSelected
                                    ? 'bg-blue-50 text-blue-900 border-l-[3px] border-blue-500'
                                    : 'bg-white hover:bg-gray-50 border-l-[3px] border-l-transparent'}`}
                        >
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shrink-0 text-[12px] font-black
                                ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {worker.photoUrl
                                    ? <img src={worker.photoUrl} alt="" className="w-full h-full object-cover" />
                                    : worker.avatar}
                            </div>

                            {/* Info block */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-[2px]">
                                {/* Row 1: Name + Expiry */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[12px] font-black truncate uppercase tracking-tight leading-none">
                                        {worker.name}
                                    </span>
                                    {daysLeft !== null && (
                                        <span className={`text-[10px] font-mono font-black shrink-0 leading-none
                                            ${isSelected
                                                ? 'text-blue-600'
                                                : daysLeft <= 30
                                                    ? 'text-red-500'
                                                    : daysLeft <= 90
                                                        ? 'text-amber-600'
                                                        : 'text-gray-400'}`}>
                                            {daysLeft <= 0 ? '期限切れ' : `あと${daysLeft}日`}
                                        </span>
                                    )}
                                </div>

                                {/* Row 2: Company + Status Tags + Visa Badge */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`text-[10px] font-semibold truncate leading-none
                                        ${isSelected ? 'text-blue-400' : 'text-gray-400'}`}>
                                        {worker.company}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <StatusTag label="機構" status={worker.kikouStatus?.progress} isSelected={isSelected} />
                                        <StatusTag label="入管" status={worker.nyukanStatus?.progress} isSelected={isSelected} />
                                        <StatusTag label="検定" status={worker.kenteiStatus?.progress} isSelected={isSelected} />
                                        <span className={`text-[8px] font-black px-1.5 py-[2px] rounded border ml-1
                                            ${isSelected
                                                ? 'text-blue-600 bg-blue-100 border-blue-200'
                                                : worker.systemType === 'ikusei_shuro'
                                                    ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                                                    : worker.systemType === 'tokuteigino'
                                                        ? 'text-blue-600 bg-blue-50 border-blue-100'
                                                        : 'text-gray-400 bg-gray-50 border-gray-100'}`}>
                                            {SYSTEM_LABEL[worker.systemType || '']?.charAt(0) || '---'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}

                {(workers?.length === 0) && (
                    <div className="py-16 text-center">
                        <User size={32} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-[12px] font-bold text-gray-300">該当する労働者はいません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
