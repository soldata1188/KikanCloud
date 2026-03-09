'use client';

import React from 'react';
import { Building2, ChevronRight, AlertCircle, Circle, CalendarCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface AuditCompanyListColumnProps {
    companies: any[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string, icon: any, color: string, bg: string, border: string }> = {
    all: { label: '全企業', icon: Building2, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' },
    overdue: { label: '予定超過', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    no_data: { label: '予定未作', icon: Circle, color: 'text-gray-900', bg: 'bg-slate-50', border: 'border-slate-100' },
    today_due: { label: '今月予定', icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    future: { label: '次月以降', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
};

export default function AuditCompanyListColumn({ companies, selectedId, onSelect }: AuditCompanyListColumnProps) {
    if (companies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
                <Building2 size={32} className="opacity-10 mb-3" />
                <p className="text-[12px] font-bold uppercase tracking-widest opacity-40 leading-relaxed">
                    該当する企業は<br />ありません
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-gray-200">
            {companies.map((row) => {
                const isSelected = selectedId === row.company.id;
                const status = row.kansaStatus || 'no_data';
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.no_data;
                const Icon = config.icon;

                return (
                    <button
                        key={row.company.id}
                        onClick={() => onSelect(row.company.id)}
                        className={`w-full text-left px-4 py-2 transition-all duration-150 group relative ${isSelected ? 'bg-blue-50/80' : 'hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-[13px] font-black truncate leading-tight ${isSelected ? 'text-blue-800' : 'text-gray-900'
                                        }`}>
                                        {row.company.name_jp}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className={`p-0.5 rounded-[4px] ${config.bg} border ${config.border}`}>
                                            <Icon size={9} className={config.color} />
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-tight ${config.color}`}>
                                            {config.label}
                                        </span>
                                        {row.nextKansaDue && (
                                            <span className="text-[11px] text-gray-900 font-mono font-black">
                                                | {row.nextKansaDue.replace(/-/g, '/').substring(5)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={`shrink-0 transition-transform ${isSelected ? 'translate-x-1' : 'opacity-0 translate-x-0 group-hover:opacity-100 translate-x-1'}`}>
                                    <ChevronRight size={13} className={isSelected ? 'text-blue-500' : 'text-gray-300'} />
                                </div>
                            </div>
                        </div>

                        {isSelected && (
                            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-600" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
