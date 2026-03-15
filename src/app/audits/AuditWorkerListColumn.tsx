'use client';

import React from 'react';
import { Users2, User, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface AuditWorkerListColumnProps {
    workers: any[];
}

function daysFromNow(dateStr: string | null | undefined): number | null {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function AuditWorkerListColumn({ workers }: AuditWorkerListColumnProps) {
    return (
        <div className="flex flex-col h-full border-r border-gray-300 min-w-[260px] w-[260px] shrink-0 overflow-hidden bg-white">
            <div className="h-[44px] px-4 border-b border-gray-200 bg-white flex items-center shrink-0">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Users2 size={14} className="text-emerald-600" />
                        <span className="text-[12px] font-normal text-emerald-700 uppercase tracking-widest">在籍労働者</span>
                    </div>
                    <span className="text-[10px] font-normal bg-gray-50 text-emerald-600 px-1.5 py-0.5 rounded-[4px] shadow-sm border border-emerald-100">
                        {workers.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-gray-100">
                {workers.length > 0 ? (
                    workers.map((w: any) => {
                        const days = daysFromNow(w.zairyu_exp);
                        const isUrgent = days != null && days <= 30;
                        const isWarn = days != null && days > 30 && days <= 60;
                        return (
                            <Link
                                key={w.id}
                                href={`/workers/${w.id}`}
                                className="px-3 py-2.5 border-b border-gray-100 transition-colors duration-150 flex items-center gap-2.5 group hover:bg-emerald-50/40"
                            >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors
                                    ${isUrgent ? 'bg-red-100 text-red-600' : isWarn ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-200/50 group-hover:text-emerald-700'}`}>
                                    <User size={14} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center gap-1">
                                        <p className="text-[13px] font-normal truncate uppercase tracking-wide leading-none text-slate-900 group-hover:text-emerald-900 transition-colors flex-1">
                                            {w.full_name || '名前なし'}
                                        </p>
                                        <ExternalLink size={10} className="text-gray-300 group-hover:text-emerald-400 shrink-0 transition-colors" />
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-[10px] font-normal truncate text-slate-500 group-hover:text-emerald-700 transition-colors">
                                            {w.visa_status || '---'}
                                        </span>
                                        {isUrgent && days != null && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] font-semibold bg-red-100 text-red-600 whitespace-nowrap shrink-0">
                                                {days}日後期限
                                            </span>
                                        )}
                                        {isWarn && days != null && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] font-semibold bg-amber-100 text-amber-600 whitespace-nowrap shrink-0">
                                                {days}日後期限
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                ) : (
                    <div className="py-16 text-center">
                        <User size={28} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-[11px] font-normal text-gray-300">対象者は<br />いません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
