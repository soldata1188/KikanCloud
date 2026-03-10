'use client';

import React from 'react';
import { AlertCircle, Circle, CalendarCheck, CheckCircle2, Building2 } from 'lucide-react';

interface AuditStatusColumnProps {
    counts: Record<string, number>;
    activeTab: string;
    onSelect: (tab: string) => void;
}

const STATUS_TABS = [
    { key: 'all', label: '全企業', icon: Building2, color: 'text-gray-900', bg: 'bg-gray-50', border: 'border-gray-200' },
    { key: 'overdue', label: '予定超過', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { key: 'no_data', label: '予定未作', icon: Circle, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
    { key: 'today_due', label: '今月予定', icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { key: 'future', label: '次月以降', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
];

export default function AuditStatusColumn({ counts, activeTab, onSelect }: AuditStatusColumnProps) {
    return (
        <div className="flex flex-col h-full bg-white thin-scrollbar overflow-y-auto">
            <div className="flex-1 py-1">
                {STATUS_TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const Icon = tab.icon;
                    const count = counts[tab.key] || 0;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => onSelect(tab.key)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 transition-colors duration-150 relative group ${isActive ? 'bg-emerald-50 border-l-[3px] border-emerald-500' : 'hover:bg-emerald-50/40 border-l-[3px] border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 border transition-all ${isActive ? 'bg-white border-emerald-200' : `${tab.bg} ${tab.border} border-transparent group-hover:border-gray-300`
                                    }`}>
                                    <Icon size={14} className={isActive ? 'text-emerald-600' : tab.color} />
                                </div>
                                <span className={`text-[13px] truncate font-normal tracking-wide uppercase ${isActive ? 'text-emerald-900' : 'text-slate-900'
                                    }`}>
                                    {tab.label}
                                </span>
                            </div>

                            <div className={`px-1 py-0.5 rounded text-[9px] font-mono font-normal transition-all ${isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
                                }`}>
                                {count}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
