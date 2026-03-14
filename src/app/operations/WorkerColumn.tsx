'use client'

import React, { useMemo } from 'react';
import { User } from 'lucide-react';

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
    visaStatus?: string;
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

    const formatDaysLeft = (days: number): string => {
        if (days <= 0) return '期限切';
        if (days <= 30) return `${days}日`;
        const months = Math.floor(days / 30);
        const remaining = days % 30;
        return remaining > 0 ? `${months}ヶ月${remaining}日` : `${months}ヶ月`;
    };

    const abbreviateCompany = (name: string): string => {
        if (!name) return '---';
        // Remove common legal entity prefixes / suffixes
        let s = name
            .replace(/株式会社/g, '')
            .replace(/有限会社/g, '')
            .replace(/合同会社/g, '')
            .replace(/医療法人/g, '')
            .replace(/社会福祉法人/g, '')
            .replace(/学校法人/g, '')
            .replace(/公益財団法人/g, '')
            .replace(/一般社団法人/g, '')
            .replace(/（株）|（有）|（医）/g, '')
            .trim();
        // Limit length
        return s.length > 14 ? s.slice(0, 13) + '…' : s;
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
                {sortedWorkers.map((worker, idx) => {
                    const daysLeft = getDaysLeft(worker.visaExpiry);
                    const isSelected = selectedIds.includes(worker.id);
                    const status = worker.nyukan_status?.progress;

                    let bgCls = 'bg-white hover:bg-emerald-50/40';
                    let borderLCls = 'border-l-transparent';

                    if (status === '完了') {
                        bgCls = isSelected ? 'bg-emerald-100' : 'bg-emerald-50/50 hover:bg-emerald-100/50';
                        borderLCls = isSelected ? 'border-l-emerald-500' : 'border-l-emerald-200';
                    } else if (status === '進行中') {
                        bgCls = isSelected ? 'bg-blue-100' : 'bg-blue-50/50 hover:bg-blue-100/50';
                        borderLCls = isSelected ? 'border-l-blue-500' : 'border-l-blue-200';
                    } else if (isSelected) {
                        bgCls = 'bg-emerald-50';
                        borderLCls = 'border-l-emerald-500';
                    }

                    return (
                        <button
                            key={worker.id}
                            onClick={(e) => onSelect(worker.id, e)}
                            className={`w-full text-left pl-1.5 pr-3 py-2.5 border-b border-b-gray-200 border-l-[3px] transition-all duration-200 group flex items-center gap-2
                                ${bgCls} ${borderLCls}`}
                        >
                            {/* Row Number */}
                            <span className="text-[10px] font-mono text-gray-300 shrink-0 w-[20px] text-center select-none">{idx + 1}</span>

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
                                            <span className={`text-[10px] font-mono font-bold shrink-0 leading-none px-1 py-0.5 rounded
                                                ${isSelected
                                                    ? 'bg-emerald-500 text-white shadow-sm'
                                                    : daysLeft <= 0
                                                        ? 'bg-red-600 text-white'
                                                        : daysLeft <= 30
                                                            ? 'bg-red-500 text-white'
                                                            : daysLeft <= 90
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-slate-100 text-slate-500'}`}>
                                                {formatDaysLeft(daysLeft)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Company & Full Visa Name */}
                                <div className="flex items-center justify-between gap-2 mt-1.5">
                                    <span className={`text-xs font-normal truncate leading-none
                                        ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        {abbreviateCompany(worker.company)}
                                    </span>
                                    <span className={`text-[10px] font-bold shrink-0 tracking-tight leading-none
                                        ${isSelected ? 'text-emerald-600' : 'text-emerald-600 opacity-90'}`}>
                                        {worker.visaStatus || SYSTEM_LABEL[worker.systemType || ''] || '---'}
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
