'use client';

import React from 'react';
import { Users2, User } from 'lucide-react';

interface AuditWorkerListColumnProps {
    workers: any[];
}

export default function AuditWorkerListColumn({ workers }: AuditWorkerListColumnProps) {
    return (
        <div className="flex flex-col h-full border-r border-gray-200 min-w-[260px] w-[260px] shrink-0 overflow-hidden bg-white">
            <div className="h-[48px] px-4 border-b border-gray-200 bg-emerald-50/20 flex items-center shrink-0">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Users2 size={14} className="text-emerald-600" />
                        <span className="text-[12px] font-black text-emerald-700 uppercase tracking-widest">在籍労働者</span>
                    </div>
                    <span className="text-[10px] font-bold bg-white text-emerald-600 px-1.5 py-0.5 rounded-[4px] shadow-sm border border-emerald-100">
                        {workers.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-gray-200">
                {workers.length > 0 ? (
                    workers.map((w: any) => (
                        <div key={w.id} className="px-4 py-3 hover:bg-gray-50/50 transition-colors flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-[6px] bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                <User size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-black text-gray-900 truncate">{w.full_name || '名前なし'}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="px-1 py-0 rounded-[2px] bg-gray-50 text-gray-900 text-[11px] font-black border border-gray-200 group-hover:border-emerald-200 group-hover:text-emerald-700 group-hover:bg-emerald-50 transition-colors">
                                        {w.visa_status || '---'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 grayscale">
                        <Users2 size={32} className="mb-2 text-gray-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-loose text-gray-400">
                            対象者は<br />いません
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
