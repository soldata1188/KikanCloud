'use client'

import React from 'react';
import { User, ShieldCheck } from 'lucide-react';

interface Worker {
    id: string;
    full_name_romaji: string;
    full_name_kana: string;
    companies?: { name_jp: string };
    zairyu_exp: string;
    status: string;
    avatar_url: string | null;
    visa_status?: string;
    entry_batch?: string;
    passport_exp?: string;
    insurance_exp?: string;
    nationality?: string;
}

interface WorkerListColumnProps {
    workers: Worker[];
    selectedIds: string[];
    onSelect: (id: string, event: React.MouseEvent) => void;
}

export default function WorkerListColumn({ workers, selectedIds, onSelect }: WorkerListColumnProps) {
    const getDaysLeft = (dateStr: string) => {
        if (!dateStr || dateStr === '---') return null;
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto thin-scrollbar">
                {(workers || []).map(worker => {
                    const daysLeft = getDaysLeft(worker.zairyu_exp);
                    const passportDays = getDaysLeft(worker.passport_exp || '');
                    const isSelected = selectedIds.includes(worker.id);
                    const isVizaWarn = daysLeft !== null && daysLeft <= 90;
                    const isVizaAlert = daysLeft !== null && daysLeft <= 30;
                    const isPassportWarn = passportDays !== null && passportDays <= 180;

                    return (
                        <button
                            key={worker.id}
                            onClick={(e) => onSelect(worker.id, e)}
                            className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors duration-150 flex items-center gap-2.5
                                ${isSelected
                                    ? 'bg-emerald-50 border-l-[3px] border-emerald-500'
                                    : 'hover:bg-emerald-50/40 border-l-[3px] border-transparent'}`}
                        >
                            {/* Mini avatar */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black
                                ${isSelected ? 'bg-emerald-200/50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {worker.avatar_url
                                    ? <img src={worker.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                    : (worker.full_name_romaji || 'U').charAt(0).toUpperCase()}
                            </div>

                            {/* Name on top, Company & Visa on bottom */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                                <span className={`text-[13px] font-black truncate uppercase tracking-tight leading-none
                                    ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                                    {worker.full_name_romaji || '---'}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`text-[10px] font-bold truncate
                                        ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        {worker.companies?.name_jp || '---'}
                                    </span>
                                    {worker.visa_status && (
                                        <>
                                            <span className={`text-[9px] opacity-30 ${isSelected ? 'text-emerald-300' : 'text-slate-300'}`}>|</span>
                                            <span className={`text-[10px] font-bold truncate
                                                ${isSelected ? 'text-emerald-600' : 'text-emerald-600'}`}>
                                                {worker.visa_status}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Alerts — right side */}
                            <div className="flex items-center gap-1 shrink-0">
                                {isPassportWarn && (
                                    <span title="パスポート期限" className={`${isSelected ? 'text-rose-400' : 'text-rose-500'}`}>
                                        <ShieldCheck size={12} />
                                    </span>
                                )}
                                {isVizaWarn && (
                                    <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded leading-none
                                        ${isSelected
                                            ? 'bg-amber-100 text-amber-700'
                                            : isVizaAlert
                                                ? 'bg-red-500 text-white animate-pulse'
                                                : 'bg-amber-100 text-amber-700'}`}>
                                        {daysLeft}d
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}

                {workers.length === 0 && (
                    <div className="py-16 text-center">
                        <User size={28} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-[11px] font-bold text-gray-300">該当する人材はいません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
