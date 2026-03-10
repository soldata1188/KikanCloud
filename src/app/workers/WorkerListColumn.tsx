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
    entry_date?: string;
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

    const fmtDate = (d?: string) => {
        if (!d || d === '---') return '---';
        return d.replace(/-/g, '/');
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
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-normal
                                ${isSelected ? 'bg-emerald-200/50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {worker.avatar_url
                                    ? <img src={worker.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                    : (worker.full_name_romaji || 'U').charAt(0).toUpperCase()}
                            </div>

                            {/* Name, Furigana, Company & Expiry */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                                <div className="flex items-baseline gap-1.5">
                                    <span className={`text-[12px] font-normal truncate uppercase tracking-tight leading-none
                                        ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                                        {worker.full_name_romaji || '---'}
                                    </span>
                                    <span className={`text-[8px] font-normal truncate tracking-tighter shrink-0
                                        ${isSelected ? 'text-emerald-600/60' : 'text-slate-400'}`}>
                                        {worker.full_name_kana}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-1 overflow-hidden">
                                    <span className={`text-[10px] font-normal truncate leading-none
                                        ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        {worker.companies?.name_jp || '---'}
                                    </span>
                                    <div className="flex items-center gap-2 ml-2 shrink-0">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[7px] font-black text-gray-300 uppercase scale-90">ENT</span>
                                            <span className={`text-[9px] font-mono tracking-tighter leading-none w-[55px] text-right
                                                ${isSelected ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                                                {fmtDate(worker.entry_date).substring(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visa Status — aligned to right before alerts */}
                            <div className="shrink-0 w-[60px] text-right px-1">
                                {worker.visa_status && (
                                    <span className={`text-[9px] font-black truncate uppercase tracking-tighter leading-none
                                        ${isSelected ? 'text-emerald-600' : 'text-emerald-600/60'}`}>
                                        {(worker.visa_status === 'ikusei_shuro' ? '育成就労' : worker.visa_status === 'ginou_jisshu' ? '技能実習' : worker.visa_status === 'tokuteigino' ? '特定技能' : worker.visa_status).substring(0, 4)}
                                    </span>
                                )}
                            </div>

                            {/* Alerts — far right */}
                            <div className="flex items-center gap-1 shrink-0 w-[38px] justify-end">
                                {isPassportWarn && (
                                    <span title="パスポート期限" className={`${isSelected ? 'text-rose-400' : 'text-rose-500'}`}>
                                        <ShieldCheck size={12} />
                                    </span>
                                )}
                                {isVizaWarn && (
                                    <span className={`text-[9px] font-mono font-normal px-1 py-0.5 rounded leading-none
                                        ${isSelected
                                            ? 'bg-emerald-500 text-white shadow-sm'
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
                        <p className="text-[11px] font-normal text-gray-300">該当する人材はいません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
