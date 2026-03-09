'use client';

import React from 'react';
import {
    Building2, MapPin, Users, PieChart,
    ExternalLink, FileDown, Printer, ShieldCheck,
    Activity, Clock, Briefcase, UserCircle
} from 'lucide-react';
import Link from 'next/link';

interface AuditDetailColumnProps {
    row: any | null;
    onOpenPdfModal: () => void;
}

const VISA_ORDER = ['実習生１号', '実習生２号', '実習生３号', '技能実習1号', '技能実習2号', '技能実習3号'];

export default function AuditDetailColumn({ row, onOpenPdfModal }: AuditDetailColumnProps) {
    if (!row) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center text-gray-400 bg-gray-50/10">
                <Users size={48} className="opacity-10 mb-4" />
                <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-widest leading-loose">
                    詳細情報を表示<br />するには会社を<br />選択してください
                </h3>
            </div>
        );
    }

    const { company, workerCounts, lastAudits } = row;
    const rawVisa = Object.entries(workerCounts?.visaGroups || {}) as [string, number][];
    const visaEntries = rawVisa.sort(([a], [b]) => {
        const ai = VISA_ORDER.findIndex(v => a.includes(v) || v.includes(a));
        const bi = VISA_ORDER.findIndex(v => b.includes(v) || v.includes(b));
        const ai2 = ai === -1 ? 99 : ai;
        const bi2 = bi === -1 ? 99 : bi;
        return ai2 !== bi2 ? ai2 - bi2 : a.localeCompare(b, 'ja');
    });

    return (
        <div className="flex flex-col h-full bg-slate-50 thin-scrollbar overflow-y-auto">
            {/* Header: Quick Actions */}
            <div className="px-6 py-6 bg-white border-b border-gray-100 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity size={16} className="text-blue-700" />
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-gray-900">企業プロファイル</h3>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onOpenPdfModal}
                        className="bg-gray-900 border border-gray-900 text-white rounded-xl px-4 py-3 flex flex-col items-center gap-2 hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95 group"
                    >
                        <FileDown size={18} className="group-hover:animate-bounce" />
                        <span className="text-[12px] font-black uppercase tracking-widest">Generate PDF</span>
                    </button>

                    <Link
                        href={`/companies/${company.id}`}
                        target="_blank"
                        className="bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 flex flex-col items-center gap-2 hover:border-blue-500 hover:text-blue-700 transition-all shadow-sm active:scale-95 group"
                    >
                        <ExternalLink size={18} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[12px] font-black uppercase tracking-widest">Detail View</span>
                    </Link>
                </div>
            </div>

            <div className="p-6 flex flex-col gap-6">
                {/* Basic Info */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <MapPin size={20} className="text-slate-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Address Information</h4>
                            <p className="text-[13px] font-black text-gray-900 leading-relaxed">
                                {company.address || '住所情報が未設定です'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <ShieldCheck size={20} className="text-slate-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Compliance Status</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase ${row.kansaStatus === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {row.kansaStatus === 'overdue' ? 'Risk Detected' : 'Clearance Ok'}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Worker Stats */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={15} className="text-blue-700" />
                            <h3 className="text-[12px] font-black uppercase tracking-widest text-gray-900">外国人材 在籍状況</h3>
                        </div>
                        <div className="text-[15px] font-black text-blue-700 bg-blue-50 px-3 py-0.5 rounded-full shadow-sm border border-blue-200">
                            {workerCounts?.total || 0} <span className="text-[11px] font-bold ml-1">名</span>
                        </div>
                    </div>

                    <div className="p-4 space-y-2">
                        {visaEntries.length > 0 ? (
                            visaEntries.map(([visa, count]) => (
                                <div key={visa} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm" />
                                        <span className="text-[13px] font-black text-gray-900 truncate">{visa}</span>
                                    </div>
                                    <span className="text-[15px] font-black text-gray-900 tabular-nums">{count}</span>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-slate-300 italic text-[11px] font-bold">
                                在籍中の人材はいません。
                            </div>
                        )}
                    </div>
                </section>

                {/* System Info */}
                <section className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl shadow-xl p-5 text-white/90">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Clock size={16} />
                        </div>
                        <h3 className="text-[11px] font-black tracking-[.2em] uppercase text-white/40">Audit Logic</h3>
                    </div>
                    <p className="text-[12px] font-medium leading-relaxed mb-4">
                        監査訪問は<span className="font-black text-blue-400 mx-1">3ヶ月に1回</span>以上の実施が義務付けられています。次回の期限を遵守してください。
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Monitoring Active</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
