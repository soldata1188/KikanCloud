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

    const fmtInJapanDuration = (dateStr?: string) => {
        if (!dateStr || dateStr === '---') return '---';
        const entry = new Date(dateStr);
        const today = new Date();
        if (entry > today) return '---';

        let years = today.getFullYear() - entry.getFullYear();
        let months = today.getMonth() - entry.getMonth();
        if (months < 0) {
            years--;
            months += 12;
        }

        if (years === 0) return `${months}ヶ月`;
        if (months === 0) return `${years}年`;
        return `${years}年${months}ヶ月`;
    };

    return (
        <div className="w-full h-full flex flex-col bg-white lg:bg-transparent overflow-hidden">
            <div className="flex-1 overflow-y-auto thin-scrollbar lg:bg-white p-2 lg:p-0 space-y-2 lg:space-y-0">
                {(workers || []).map(worker => {
                    const daysLeft = getDaysLeft(worker.zairyu_exp);
                    const passportDays = getDaysLeft(worker.passport_exp || '');
                    const isSelected = selectedIds.includes(worker.id);
                    const isVizaWarn = daysLeft !== null && daysLeft <= 90;
                    const isVizaAlert = daysLeft !== null && daysLeft <= 30;
                    const isPassportWarn = passportDays !== null && passportDays <= 180;

                    return (
                        <div key={worker.id} className="relative group">
                            {/* Desktop List Layout (Hidden on Mobile) */}
                            <button
                                onClick={(e) => onSelect(worker.id, e)}
                                className={`hidden lg:flex w-full text-left px-4 py-3 border-b border-gray-100 transition-all duration-150 items-center gap-4
                                    ${isSelected
                                        ? 'bg-emerald-50/60 border-l-[4px] border-emerald-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
                                        : 'hover:bg-slate-50 border-l-[4px] border-transparent'}`}
                            >
                                {/* セクション 1: アバター & 氏名 (180px) */}
                                <div className="w-[180px] shrink-0 flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-medium shadow-sm
                                        ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                        {worker.avatar_url
                                            ? <img src={worker.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                            : (worker.full_name_romaji || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0 justify-center">
                                        <div className="h-5 flex items-center">
                                            <span className={`text-[13px] font-bold truncate uppercase tracking-tight leading-none
                                                ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                                                {worker.full_name_romaji || '---'}
                                            </span>
                                        </div>
                                        <div className="h-4 flex items-center">
                                            <span className={`text-[9px] font-normal truncate tracking-tight leading-none
                                                ${isSelected ? 'text-emerald-600/70' : 'text-slate-400'}`}>
                                                {worker.full_name_kana || '---'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* セクション 2: 受入企業 (140px) */}
                                <div className="w-[140px] shrink-0 flex flex-col justify-center overflow-hidden pr-2">
                                    <div className="h-5 flex items-center">
                                        <span className={`text-[11px] font-normal truncate block leading-none
                                            ${isSelected ? 'text-emerald-700' : 'text-slate-600'}`}>
                                            {worker.companies?.name_jp ? worker.companies.name_jp.replace(/株式会社|有限会社|（株）|\(株\)/g, '').trim() : '---'}
                                        </span>
                                    </div>
                                    <div className="h-4" />
                                </div>

                                {/* セクション 3: 入国日 & 在日期間 (120px) */}
                                <div className="w-[120px] shrink-0 flex flex-col justify-center gap-0.5">
                                    <div className="h-5 flex items-center gap-1.5 overflow-hidden">
                                        <span className="text-[7px] font-black text-slate-300 uppercase shrink-0">ENT</span>
                                        <span className={`text-[10px] font-mono tracking-tighter leading-none
                                            ${isSelected ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                                            {fmtDate(worker.entry_date)}
                                        </span>
                                    </div>
                                    <div className="h-4 flex items-center gap-1.5 overflow-hidden">
                                        <span className="text-[7px] font-black text-rose-300/70 uppercase shrink-0">STAY</span>
                                        <span className={`text-[10px] font-medium leading-none tracking-tight
                                            ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                                            {fmtInJapanDuration(worker.entry_date)}
                                        </span>
                                    </div>
                                </div>

                                {/* セクション 4: 在留資格 (80px) */}
                                <div className="w-[80px] shrink-0 flex flex-col justify-center overflow-hidden text-center px-1">
                                    <div className="h-5 flex items-center justify-center">
                                        {worker.visa_status && (
                                            <span className={`inline-block w-full py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-tighter
                                                ${isSelected
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-emerald-50 text-emerald-600/70 border border-emerald-100/50'}`}>
                                                {(worker.visa_status === 'ikusei_shuro' ? '育成就労' : worker.visa_status === 'ginou_jisshu' ? '技能実習' : worker.visa_status === 'tokuteigino' ? '特定技能' : worker.visa_status).substring(0, 4)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-4" />
                                </div>

                                {/* セクション 5: アラート (50px) */}
                                <div className="flex-1 flex items-center gap-1.5 justify-end pl-2">
                                    {isPassportWarn && (
                                        <span title="パスポート期限" className={`${isSelected ? 'text-rose-400' : 'text-rose-500'} shrink-0`}>
                                            <ShieldCheck size={14} />
                                        </span>
                                    )}
                                    {isVizaWarn && (
                                        <span className={`text-[9px] font-mono font-bold px-1.5 py-1 rounded-[4px] leading-none shrink-0 shadow-sm
                                            ${isSelected
                                                ? 'bg-emerald-500 text-white'
                                                : isVizaAlert
                                                    ? 'bg-rose-500 text-white animate-pulse'
                                                    : 'bg-amber-100 text-amber-700'}`}>
                                            {daysLeft}d
                                        </span>
                                    )}
                                </div>
                            </button>

                            {/* Mobile Card Layout (Visible only on Mobile) */}
                            <button
                                onClick={(e) => onSelect(worker.id, e)}
                                className={`lg:hidden w-full flex flex-col bg-white rounded-lg border p-4 transition-all
                                    ${isSelected ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/30' : 'border-gray-200 shadow-sm'}`}
                            >
                                <div className="flex gap-4 mb-3 w-full">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-bold
                                        ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {worker.avatar_url
                                            ? <img src={worker.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                            : (worker.full_name_romaji || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[14px] font-black text-slate-900 uppercase truncate pr-2">
                                                {worker.full_name_romaji || '---'}
                                            </span>
                                            {isVizaWarn && (
                                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded leading-none shrink-0
                                                    ${isVizaAlert ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                                    {daysLeft}d
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mb-1">{worker.full_name_kana}</div>
                                        <div className="text-[11px] font-bold text-blue-600 truncate">
                                            {worker.companies?.name_jp || '---'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-2 border-t border-gray-100 pt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">VISA / 育成・実習</span>
                                        <span className="text-[11px] font-bold text-gray-700">
                                            {worker.visa_status === 'ikusei_shuro' ? '育成就労' : worker.visa_status === 'ginou_jisshu' ? '技能実習' : worker.visa_status === 'tokuteigino' ? '特定技能' : worker.visa_status || '---'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest text-right">在日期間 / 入国日</span>
                                        <span className="text-[11px] font-bold text-gray-700 text-right">
                                            {fmtInJapanDuration(worker.entry_date)} ({fmtDate(worker.entry_date)})
                                        </span>
                                    </div>
                                    {isPassportWarn && (
                                        <div className="col-span-2 mt-1 flex items-center gap-1.5 text-rose-500 bg-rose-50 rounded px-2 py-1">
                                            <ShieldCheck size={12} />
                                            <span className="text-[10px] font-bold">パスポート更新要確認</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>
                    );
                })}

                {workers.length === 0 && (
                    <div className="py-20 text-center bg-white lg:bg-transparent rounded-lg">
                        <User size={32} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-[13px] font-normal text-gray-300">該当する人材はいません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
