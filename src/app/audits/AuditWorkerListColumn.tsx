'use client';

import React from 'react';
import { Users2, User } from 'lucide-react';

interface AuditWorkerListColumnProps {
    workers: any[];
}

export default function AuditWorkerListColumn({ workers }: AuditWorkerListColumnProps) {
    return (
        <div className="flex flex-col h-full border-r border-gray-300 min-w-[260px] w-[260px] shrink-0 overflow-hidden bg-white">
            <div className="h-[48px] px-4 border-b border-gray-300 bg-white flex items-center shrink-0">
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
                    workers.map((w: any) => (
                        <div key={w.id} className="px-3 py-2.5 border-b border-gray-100 transition-colors duration-150 flex items-center gap-2.5 group hover:bg-emerald-50/40">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-emerald-200/50 group-hover:text-emerald-700 transition-colors">
                                <User size={14} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className={`text-[13px] font-normal truncate uppercase tracking-wide leading-none text-slate-900 group-hover:text-emerald-900 transition-colors`}>{w.full_name || '名前なし'}</p>
                                <div className="flex items-center gap-1.5 mt-1 border-0">
                                    <span className="text-[10px] font-normal truncate text-slate-500 group-hover:text-emerald-700 transition-colors">
                                        {w.visa_status || '---'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
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
