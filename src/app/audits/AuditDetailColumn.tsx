'use client';

import React from 'react';
import { MapPin, Users,
    ExternalLink, FileDown, ShieldCheck,
    Activity, Clock
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
                        className="bg-[var(--color-text-primary)] border border-[var(--color-text-primary)] text-white rounded-[var(--radius-button)] px-4 py-3 flex flex-col items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95 group"
                    >
                        <FileDown size={18} className="group-hover:animate-bounce" />
                        <span className="text-[12px] font-semibold">Generate PDF</span>
                    </button>

                    <Link
                        href={`/companies/${company.id}`}
                        target="_blank"
                        className="bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-[var(--radius-button)] px-4 py-3 flex flex-col items-center gap-2 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-all shadow-sm active:scale-95 group"
                    >
                        <ExternalLink size={18} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[12px] font-semibold">Detail View</span>
                    </Link>
                </div>
            </div>

            <div className="p-6 flex flex-col gap-6">
                {/* Basic Info */}
                <section className="bg-[var(--color-bg-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-lg bg-[var(--color-bg-page)] flex items-center justify-center shrink-0">
                            <MapPin size={18} className="text-[var(--color-text-muted)]" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">所在地</h4>
                            <p className="text-[13px] font-medium text-[var(--color-text-primary)] leading-relaxed">
                                {company.address || '住所情報が未設定です'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-lg bg-[var(--color-bg-page)] flex items-center justify-center shrink-0">
                            <ShieldCheck size={18} className="text-[var(--color-text-muted)]" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">コンプライアンス状況</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={row.kansaStatus === 'overdue' ? 'badge badge-danger' : 'badge badge-success'}>
                                    {row.kansaStatus === 'overdue' ? 'リスクあり' : '問題なし'}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Worker Stats */}
                <section className="bg-[var(--color-bg-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
                    <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={14} className="text-[var(--brand-primary)]" />
                            <h3 className="text-[12px] font-semibold text-[var(--color-text-primary)]">外国人材 在籍状況</h3>
                        </div>
                        <div className="badge badge-primary">
                            {workerCounts?.total || 0} 名
                        </div>
                    </div>

                    <div className="p-4 space-y-1.5">
                        {visaEntries.length > 0 ? (
                            visaEntries.map(([visa, count]) => (
                                <div key={visa} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-bg-page)] hover:bg-[#f1f5f9] transition-colors">
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />
                                        <span className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{visa}</span>
                                    </div>
                                    <span className="text-[14px] font-semibold text-[var(--color-text-primary)] tabular-nums">{count}</span>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-[var(--color-text-muted)] text-[12px]">
                                就業中の人材はいません。
                            </div>
                        )}
                    </div>
                </section>

                {/* Audit Info */}
                <section className="bg-[var(--brand-primary)] rounded-[var(--radius-card)] p-5 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-1.5 bg-white/15 rounded-lg">
                            <Clock size={15} />
                        </div>
                        <h3 className="text-[11px] font-semibold tracking-wider uppercase text-white/70">監査ルール</h3>
                    </div>
                    <p className="text-[12px] leading-relaxed text-white/90">
                        監査訪問は<span className="font-bold text-white mx-1">3ヶ月に1回</span>以上の実施が義務付けられています。次回の期限を遵守してください。
                    </p>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                        <span className="text-[10px] font-medium uppercase tracking-widest text-white/50">Monitoring Active</span>
                    </div>
                </section>
            </div>
        </div>
    );
}
