'use client'

import React from 'react';
import { User } from 'lucide-react';

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

function WorkerListColumn({ workers, selectedIds, onSelect }: WorkerListColumnProps) {
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
            <div className="flex-1 overflow-y-auto thin-scrollbar lg:bg-white space-y-0">
                {(workers || []).map(worker => {
                    const isSelected = selectedIds.includes(worker.id);

                    return (
                        <div key={worker.id} className="relative group">
                            {/* Desktop List Layout (Hidden on Mobile) */}
                            <button
                                onClick={(e) => onSelect(worker.id, e)}
                                className={`hidden lg:flex w-full text-left pl-4 pr-1.5 py-1.5 border-b border-slate-200 transition-all duration-150 items-center gap-3
                                    ${isSelected
                                        ? 'bg-emerald-50/60 border-l-[4px] border-emerald-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
                                        : 'hover:bg-slate-50 border-l-[4px] border-transparent'}`}
                            >
                                {/* セクション 1: アバター & 氏名 (Flexible) */}
                                <div className="flex-[2] min-w-[170px] flex items-center gap-3.5 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-normal shadow-sm
                                         ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                         {worker.avatar_url
                                             ? <img src={worker.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                             : (worker.full_name_romaji || 'U').charAt(0).toUpperCase()}
                                     </div>
                                     <div className="flex flex-col min-w-0 justify-center">
                                         <div className="min-h-5 flex items-center">
                                             <span className={`text-base font-medium truncate uppercase tracking-tight leading-none
                                                 ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                                                 {worker.full_name_romaji || '---'}
                                             </span>
                                         </div>
                                         <div className="min-h-4.5 flex items-center mt-0.5">
                                             <span className={`text-xs font-normal truncate tracking-tight leading-none
                                                 ${isSelected ? 'text-emerald-600/70' : 'text-slate-400'}`}>
                                                 {worker.full_name_kana || '---'}
                                             </span>
                                         </div>
                                     </div>
                                 </div>

                                {/* セクション 2: 受入企業 (Flexible) */}
                                 <div className="flex-[1.4] min-w-[140px] flex flex-col justify-center overflow-hidden pr-2">
                                     <div className="min-h-5 flex items-center">
                                         <span className={`text-sm font-normal truncate block leading-none
                                             ${isSelected ? 'text-emerald-700' : 'text-slate-600'}`}>
                                             {worker.companies?.name_jp ? worker.companies.name_jp.replace(/株式会社|有限会社|（株）|\(株\)/g, '').trim() : '---'}
                                         </span>
                                     </div>
                                     <div className="min-h-4.5" />
                                 </div>

                                {/* セクション 3: 入国日 & 在日期間 (Flexible) */}
                                 <div className="flex-[1.1] min-w-[120px] flex flex-col justify-center gap-1 items-end pr-4">
                                     <div className="min-h-4 flex items-center overflow-hidden">
                                         <span className={`text-sm font-mono tracking-tighter leading-none text-right
                                             ${isSelected ? 'text-blue-700 font-normal' : 'text-slate-500'}`}>
                                             {fmtDate(worker.entry_date)}
                                         </span>
                                     </div>
                                     <div className="min-h-4 flex items-center overflow-hidden">
                                         <span className={`text-xs font-normal leading-none tracking-tight text-right
                                             ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                                             {fmtInJapanDuration(worker.entry_date)}
                                         </span>
                                     </div>
                                 </div>

                                {/* セクション 4: 在留資格 (Flexible) */}
                                 <div className="flex-[0.8] min-w-[85px] flex flex-col justify-center overflow-hidden text-center mr-2">
                                     <div className="min-h-6 flex items-center justify-center">
                                         {worker.visa_status && (
                                             <span className={`inline-block w-full py-1 rounded-[4px] text-xs font-normal uppercase tracking-tighter
                                                 ${isSelected
                                                     ? 'bg-emerald-100 text-emerald-700'
                                                     : 'bg-emerald-50 text-emerald-600/70 border border-emerald-100/50'}`}>
                                                 {(() => {
                                                     const s = worker.visa_status === 'ikusei_shuro' ? '育成就労'
                                                         : worker.visa_status === 'ginou_jisshu' ? '技能実習'
                                                             : worker.visa_status === 'tokuteigino' ? '特定技能'
                                                                 : String(worker.visa_status);
                                                     return s.length > 4 ? s.substring(0, 4) : s;
                                                 })()}
                                             </span>
                                         )}
                                     </div>
                                     <div className="min-h-4.5" />
                                 </div>

                                {/* セクション 5: アラート/スペーサー */}
                                <div className="flex-[0.2] shrink-0" />
                            </button>

                            {/* Mobile Card Layout (Visible only on Mobile) */}
                            <button
                                onClick={(e) => onSelect(worker.id, e)}
                                className={`lg:hidden w-full flex flex-col bg-white p-3 transition-all border-b border-slate-200
                                    ${isSelected ? 'bg-emerald-50/30' : ''}`}
                            >
                                <div className="flex gap-4 mb-3 w-full">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-normal shadow-sm
                                        ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {worker.avatar_url
                                            ? <img src={worker.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                            : (worker.full_name_romaji || 'U').charAt(0).toUpperCase()}
                                    </div>
                                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                                         <div className="flex justify-between items-start">
                                             <span className="text-base font-medium text-slate-900 uppercase truncate pr-2">
                                                 {worker.full_name_romaji || '---'}
                                             </span>
                                         </div>
                                         <div className="text-xs text-slate-400 mb-1">{worker.full_name_kana}</div>
                                         <div className="text-sm font-medium text-blue-600 truncate">
                                             {worker.companies?.name_jp || '---'}
                                         </div>
                                     </div>
                                </div>

                                 <div className="grid grid-cols-2 gap-y-3 border-t border-slate-50 pt-4">
                                     <div className="flex flex-col gap-1">
                                         <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">VISA / 育成・実習</span>
                                         <span className="text-sm font-medium text-gray-700">
                                             {worker.visa_status === 'ikusei_shuro' ? '育成就労' : worker.visa_status === 'ginou_jisshu' ? '技能実習' : worker.visa_status === 'tokuteigino' ? '特定技能' : worker.visa_status || '---'}
                                         </span>
                                     </div>
                                     <div className="flex flex-col gap-1">
                                         <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest text-right">在日期間 / 入国日</span>
                                         <span className="text-sm font-medium text-gray-700 text-right">
                                             {fmtInJapanDuration(worker.entry_date)} ({fmtDate(worker.entry_date)})
                                         </span>
                                     </div>
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

export default React.memo(WorkerListColumn);
