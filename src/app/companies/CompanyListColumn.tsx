'use client'

import React from 'react';
import { Building2, CheckCircle2, Circle } from 'lucide-react';

interface Company {
    id: string;
    name_jp: string;
    name_romaji?: string;
    representative?: string;
    status?: string | null;
    worker_count?: number;
    active_worker_count?: number;
}

interface CompanyListColumnProps {
    companies: Company[];
    selectedIds: string[];
    onSelect: (id: string, event?: React.MouseEvent) => void;
}

export default function CompanyListColumn({ companies, selectedIds, onSelect }: CompanyListColumnProps) {
    if (!companies.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white h-full">
                <Building2 size={28} className="text-gray-200 mb-2" />
                <p className="text-[11px] font-normal text-gray-300">該当する企業がありません</p>
                <p className="text-[10px] text-gray-200 mt-1 uppercase tracking-widest">条件を変更してください</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-white lg:bg-transparent overflow-hidden">
            <div className="flex-1 overflow-y-auto thin-scrollbar lg:bg-white p-2 lg:p-0 space-y-2 lg:space-y-0">
                {companies.map(company => {
                    const isSelected = selectedIds.includes(company.id);
                    return (
                        <div key={company.id} className="relative group">
                            {/* Desktop List Layout (Hidden on Mobile) */}
                            <button
                                onClick={(e) => onSelect(company.id, e)}
                                className={`hidden lg:flex w-full text-left px-4 py-3 border-b border-gray-100 transition-all duration-150 items-center gap-4
                                    ${isSelected
                                        ? 'bg-emerald-50/60 border-l-[4px] border-emerald-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
                                        : 'hover:bg-slate-50 border-l-[4px] border-transparent'}`}
                            >
                                {/* Section 1: Icon & Name (Flex-1) */}
                                <div className="flex-1 shrink-0 flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-normal shadow-sm
                                        ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                        <Building2 size={14} />
                                    </div>
                                     <div className="flex flex-col min-w-0 justify-center">
                                         <div className="min-h-5 flex items-center">
                                             <span className={`text-base font-medium truncate uppercase tracking-tight leading-none
                                                 ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                                                 {company.name_jp || '---'}
                                             </span>
                                         </div>
                                         <div className="min-h-4 flex items-center mt-0.5">
                                             <span className={`text-xs font-normal truncate tracking-tight leading-none
                                                 ${isSelected ? 'text-emerald-600/70' : 'text-slate-400'}`}>
                                                 {company.representative ? `代表: ${company.representative}` : '---'}
                                             </span>
                                         </div>
                                     </div>
                                </div>

                                {/* Section 2: Worker Count (80px) */}
                                 <div className="w-[100px] shrink-0 flex flex-col items-end justify-center">
                                     <div className="flex items-center gap-1.5">
                                         <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded-[4px] shadow-sm
                                             ${isSelected
                                                 ? 'bg-emerald-500 text-white'
                                                 : company.active_worker_count! > 0
                                                     ? 'bg-emerald-50 text-emerald-600'
                                                     : 'bg-slate-100 text-slate-400'}`}>
                                             {company.active_worker_count || 0}
                                         </span>
                                     </div>
                                     <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter mt-1">Workers</span>
                                 </div>
                            </button>

                            {/* Mobile Card Layout (Visible only on Mobile) */}
                            <button
                                onClick={(e) => onSelect(company.id, e)}
                                className={`lg:hidden w-full flex flex-col bg-white rounded-lg border p-4 transition-all
                                    ${isSelected ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/30' : 'border-gray-200 shadow-sm'}`}
                            >
                                <div className="flex gap-4 mb-3 w-full">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md
                                        ${isSelected ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                                        <Building2 size={24} />
                                    </div>
                                     <div className="flex-1 min-w-0">
                                         <div className="flex justify-between items-start">
                                             <span className="text-base font-medium text-slate-900 uppercase truncate pr-2">
                                                 {company.name_jp || '---'}
                                             </span>
                                             <div className="flex flex-col items-end">
                                                 <span className={`text-sm font-mono font-bold text-blue-600`}>
                                                     {company.active_worker_count || 0}
                                                 </span>
                                                 <span className="text-xs text-gray-400 font-bold tracking-tighter uppercase">人材数</span>
                                             </div>
                                         </div>
                                         <div className="text-xs text-slate-400 mb-1">
                                             {company.name_romaji || '---'}
                                         </div>
                                     </div>
                                </div>

                                 <div className="grid grid-cols-2 gap-y-3 border-t border-gray-100 pt-4">
                                     <div className="flex flex-col gap-1">
                                         <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">代表者</span>
                                         <span className="text-sm font-medium text-gray-700">
                                             {company.representative || '---'}
                                         </span>
                                     </div>
                                     <div className="flex flex-col items-end gap-1">
                                         <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">ステータス</span>
                                         <span className={`text-xs font-medium px-2 py-0.5 rounded
                                             ${company.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                             {company.status === 'active' ? '受入中' : '停止中'}
                                         </span>
                                     </div>
                                 </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
