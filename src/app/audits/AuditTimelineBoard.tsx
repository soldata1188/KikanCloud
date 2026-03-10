'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { ClipboardList, Building2, Calendar, CheckCircle2, MapPin, UserCircle, X, Save, Clock, CalendarCheck } from 'lucide-react';
import { upsertAuditSchedule } from './actions';
import { useRouter } from 'next/navigation';

interface AuditTimelineBoardProps {
    allCompletedAudits: any[];
    companies: { id: string, name_jp: string }[];
    filterMonth: string; // YYYY-MM
    onSelectCompany: (id: string) => void;
    staffList?: { id: string; name: string }[];
}

const TYPE_CONFIG: Record<string, { label: string, color: string, bg: string }> = {
    homon: { label: '訪問', color: 'text-blue-600', bg: 'bg-blue-50' },
    kansa: { label: '監査', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    rinji: { label: '臨時', color: 'text-amber-600', bg: 'bg-amber-50' },
};

export default function AuditTimelineBoard({ allCompletedAudits, companies, filterMonth, onSelectCompany, staffList = [] }: AuditTimelineBoardProps) {
    const router = useRouter();
    const [editingAudit, setEditingAudit] = useState<any | null>(null);
    const [isSaving, startSave] = useTransition();

    const handleQuickSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            companyId: editingAudit.company_id,
            auditType: formData.get('audit_type') as string,
            month: editingAudit.actual_date?.slice(0, 7) || editingAudit.scheduled_date?.slice(0, 7),
            scheduledDate: formData.get('scheduled_date') as string,
            picName: formData.get('pic_name') as string,
            markCompleted: true,
            existingId: editingAudit.id
        };

        startSave(async () => {
            await upsertAuditSchedule(data);
            setEditingAudit(null);
            router.refresh();
        });
    };
    // Generate 6 months list (Oldest to Newest)
    const months = useMemo(() => {
        const result = [];
        const base = new Date(filterMonth + '-01');
        for (let i = 5; i >= 0; i--) {
            const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
            result.push(d.toISOString().slice(0, 7));
        }
        return result;
    }, [filterMonth]);

    const companyMap = useMemo(() => {
        const map: Record<string, string> = {};
        companies.forEach(c => map[c.id] = c.name_jp);
        return map;
    }, [companies]);

    // Group audits by month
    const grouped = useMemo(() => {
        const g: Record<string, any[]> = {};
        months.forEach(m => g[m] = []);

        allCompletedAudits.forEach(a => {
            const dateStr = a.actual_date || a.scheduled_date;
            if (!dateStr) return;
            const m = dateStr.slice(0, 7);
            if (g[m]) {
                g[m].push(a);
            }
        });

        // Sort each month's audits by date
        months.forEach(m => {
            g[m].sort((a, b) => {
                const da = a.actual_date || a.scheduled_date;
                const db = b.actual_date || b.scheduled_date;
                return da.localeCompare(db);
            });
        });

        return g;
    }, [allCompletedAudits, months]);

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Header: Integrated Title Block */}
            <div className="h-[48px] bg-white border-b border-gray-200 px-4 flex items-center shrink-0">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-[4px]">
                            <ClipboardList size={14} className="text-blue-700" />
                            <h2 className="text-[14px] font-normal text-gray-900 tracking-tight">監査・訪問スケジュールボード</h2>
                        </div>
                        <div className="h-4 border-l border-gray-300" />
                        <p className="text-[11px] font-normal text-gray-900 uppercase tracking-widest">6ヶ月モニタリング概要</p>
                    </div>
                </div>
            </div>

            {/* Board Content: Seamless Grid */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden thin-scrollbar p-0 flex">
                <div className="flex h-full w-full min-w-[1000px] border-t border-gray-200 overflow-hidden">
                    {months.map((month) => {
                        const audits = grouped[month];
                        const displayMonth = month.replace('-', '/');
                        const isCurrent = month === filterMonth;

                        return (
                            <div key={month} className={`flex-1 flex flex-col h-full min-w-[160px] border-r border-gray-200 last:border-r-0 ${isCurrent ? 'bg-blue-50/5' : ''}`}>
                                {/* Month Header */}
                                <div className={`flex items-center justify-between px-4 py-3 transition-all ${isCurrent
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-50 text-slate-600 border-b border-gray-200'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className={isCurrent ? 'text-blue-100' : 'text-blue-700'} />
                                        <span className="text-[16px] font-normal tabular-nums">{displayMonth}</span>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-full text-[11px] font-normal ${isCurrent ? 'bg-white/20 text-white' : 'bg-white border border-slate-300 text-gray-900'
                                        }`}>
                                        {audits.length}
                                    </div>
                                </div>

                                {/* Column Body */}
                                <div className={`flex-1 overflow-y-auto thin-scrollbar transition-colors divide-y divide-gray-200 ${isCurrent ? 'bg-blue-50/10' : 'bg-white'
                                    }`}>
                                    {audits.length > 0 ? (
                                        audits.map((a) => {
                                            const cfg = TYPE_CONFIG[a.audit_type] || TYPE_CONFIG.homon;
                                            const compName = companyMap[a.company_id] || '不明な企業';
                                            const day = (a.actual_date || a.scheduled_date)?.split('-')[2];

                                            return (
                                                <button
                                                    key={a.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingAudit(a);
                                                    }}
                                                    className="w-full text-left bg-white px-3 py-1.5 hover:bg-blue-50/40 transition-all group relative active:bg-blue-100/30 flex flex-col gap-0.5"
                                                >
                                                    <div className="flex items-center justify-between gap-1.5">
                                                        <h4 className="text-[12px] font-normal text-gray-900 truncate flex-1 group-hover:text-blue-800">
                                                            {compName}
                                                        </h4>
                                                        <span className="text-[11px] font-normal text-gray-900 tabular-nums shrink-0">
                                                            {day}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className={`shrink-0 px-1 py-0 rounded-[2px] text-[8px] font-normal uppercase tracking-tighter border ${cfg.bg} ${cfg.color} border-current/10`}>
                                                                {cfg.label}
                                                            </span>
                                                            <span className="text-[11px] font-normal text-gray-900 truncate">{a.pic_name || '—'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 text-emerald-500 shrink-0">
                                                            <CheckCircle2 size={9} />
                                                            <span className="text-[8px] font-normal uppercase tracking-tighter">完了</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center opacity-20 grayscale">
                                            <Calendar size={32} className="mb-2" />
                                            <p className="text-[10px] font-normal uppercase tracking-widest leading-loose">
                                                監査記録なし
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Quick Edit Modal */}
            {editingAudit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-[6px] border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-[6px] text-white">
                                    <ClipboardList size={18} />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-normal text-gray-900 tracking-tight">スケジュールの編集</h3>
                                    <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">{companyMap[editingAudit.company_id]}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingAudit(null)} className="p-2 hover:bg-gray-200 rounded-[6px] text-gray-400 transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleQuickSave} className="p-6 space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2 pl-1">種別</label>
                                    <select name="audit_type" required defaultValue={editingAudit.audit_type} className="w-full bg-gray-50 border border-gray-200 rounded-[6px] px-4 py-2.5 outline-none text-[13px] font-normal focus:border-blue-600 appearance-none">
                                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                                            <option key={key} value={key}>{cfg.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2 pl-1">担当者</label>
                                    <select name="pic_name" defaultValue={editingAudit.pic_name} className="w-full bg-gray-50 border border-gray-200 rounded-[6px] px-4 py-2.5 outline-none text-[13px] font-normal focus:border-blue-600 appearance-none">
                                        <option value="">— 担当を選択 —</option>
                                        {staffList.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2 pl-1">実施日</label>
                                    <input name="scheduled_date" type="date" required defaultValue={editingAudit.actual_date || editingAudit.scheduled_date} className="w-full bg-gray-50 border border-gray-200 rounded-[6px] px-4 py-2.5 outline-none text-[13px] font-normal focus:border-blue-600" />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setEditingAudit(null)} className="flex-1 py-3 text-[13px] font-normal text-gray-500 hover:bg-gray-50 rounded-[6px] transition-colors">キャンセル</button>
                                <button type="submit" disabled={isSaving} className="flex-[2] py-3 bg-blue-600 text-white rounded-[6px] text-[13px] font-normal flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 uppercase tracking-widest">
                                    {isSaving ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
                                    {isSaving ? '保存中...' : '変更を保存'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
