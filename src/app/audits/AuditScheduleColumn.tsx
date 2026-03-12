'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
    CalendarCheck, Clock, CheckCircle2, Save, Check, Pencil,
    Plus, History, ClipboardList, Building2, UserCircle, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { MonthFilter } from './MonthFilter';
import { createAuditInline, upsertAuditSchedule } from './actions';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface AuditScheduleColumnProps {
    row: any | null; // Selected company row data from matrixData
    filterMonth: string;
    staffList: { id: string; name: string }[];
    onSaved: () => void;
    onOpenAddModal: (companyId: string, auditType: string) => void;
}

const AUDIT_TYPES = [
    { key: 'homon', label: '社宅訪問', badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
    { key: 'kansa', label: '監査訪問', badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
] as const;

/* ─────────────────────────────────────────────────────────────
   INLINE EDITOR COMPONENT
───────────────────────────────────────────────────────────── */
function InlineEditor({
    auditType, typeLabel, typeBadge,
    companyId, filterMonth, existingAudit, onSaved, staffList = [],
}: {
    auditType: string; typeLabel: string; typeBadge: string
    companyId: string; filterMonth: string
    existingAudit?: any; onSaved: () => void
    staffList?: { id: string; name: string }[]
}) {
    const [date, setDate] = useState(existingAudit?.scheduled_date || '');
    const [person, setPerson] = useState(existingAudit?.pic_name || '');
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, startSave] = useTransition();
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setDate(existingAudit?.scheduled_date || '');
        setPerson(existingAudit?.pic_name || '');
        setIsDirty(false);
        setSaved(false);
    }, [existingAudit?.id, existingAudit?.scheduled_date, existingAudit?.pic_name]);

    const handleSave = () => {
        if (!date) return;
        startSave(async () => {
            const result = await upsertAuditSchedule({
                companyId, auditType, month: filterMonth,
                scheduledDate: date, picName: person,
                markCompleted: existingAudit?.status === 'completed',
                existingId: existingAudit?.id,
            });
            if (!result?.error) { setIsDirty(false); setSaved(true); onSaved(); }
        });
    };

    const isDone = existingAudit?.status === 'completed';

    return (
        <div className="flex flex-col gap-1 p-3 bg-white rounded-[6px] border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all group">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-[6px] ${typeBadge} bg-white shadow-sm border border-transparent group-hover:border-emerald-200`}>
                        <ClipboardList size={14} className="text-emerald-600" />
                    </div>
                    <span className="text-[14px] font-normal text-gray-900 tracking-tight">{typeLabel}</span>
                </div>
                {isDone ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 italic">
                        <CheckCircle2 size={12} />
                        <span className="text-[11px] font-normal uppercase tracking-widest text-emerald-700">完了</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 italic">
                        <Clock size={12} />
                        <span className="text-[11px] font-normal uppercase tracking-widest text-blue-700">実施予定</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-normal uppercase tracking-widest text-gray-900 ml-1 flex items-center gap-1.5">
                        <CalendarCheck size={11} className="text-emerald-500" />
                        実施予定日
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={e => { setDate(e.target.value); setIsDirty(true); setSaved(false); }}
                        readOnly={isDone}
                        className={`h-8 px-3 text-[12px] font-normal rounded-[6px] border outline-none transition-all w-full
                            ${isDone ? 'bg-gray-50 border-gray-200 text-gray-500 opacity-80 cursor-not-allowed' : 'bg-white border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-gray-900'}`}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-normal uppercase tracking-widest text-[#94A3B8] ml-1 flex items-center gap-1.5">
                        <UserCircle size={11} className="text-emerald-400" />
                        担当スタッフ
                    </label>
                    <select
                        value={person}
                        disabled={isDone}
                        onChange={e => { setPerson(e.target.value); setIsDirty(true); setSaved(false); }}
                        className={`h-8 px-1 text-[12px] font-normal rounded-[6px] border outline-none transition-all w-full appearance-none cursor-pointer
                            ${isDone ? 'bg-gray-50 border-gray-100 text-gray-400 opacity-80 cursor-not-allowed' : 'bg-white border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-gray-800'}`}
                    >
                        <option value="">— 担当 —</option>
                        {staffList.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                    {existingAudit?.id && (
                        <Link
                            href={`/audits/${existingAudit.id}/edit`}
                            className="text-[11px] font-normal text-gray-400 hover:text-emerald-600 transition-colors flex items-center gap-1 bg-gray-50 hover:bg-emerald-50 px-3 py-1.5 rounded-[6px] border border-transparent hover:border-emerald-100 shadow-sm"
                        >
                            <Pencil size={12} />
                            レポートを編集
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isDirty && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-[6px] text-[11px] font-normal flex items-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-all"
                        >
                            {isSaving ? <Clock size={12} className="animate-spin" /> : <Save size={12} />}
                            変更を保存
                        </button>
                    )}
                    {saved && (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-normal text-[11px]">
                            <Check size={14} strokeWidth={3} />
                            保存済み
                        </div>
                    )}
                    {!isDone && existingAudit?.id && !isDirty && (
                        <button
                            onClick={async () => {
                                if (!confirm('このスケジュールを完了にしますか？')) return;
                                startSave(async () => {
                                    await upsertAuditSchedule({
                                        companyId, auditType, month: filterMonth,
                                        scheduledDate: date, picName: person,
                                        markCompleted: true, existingId: existingAudit.id,
                                    });
                                    onSaved();
                                });
                            }}
                            className="bg-gray-900 hover:bg-black text-white px-4 py-1.5 rounded-[6px] text-[11px] font-normal flex items-center gap-2 shadow-lg shadow-gray-200 active:scale-95 transition-all"
                        >
                            <CheckCircle2 size={12} />
                            完了にする
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function AuditScheduleColumn({ row, filterMonth, staffList, onSaved, onOpenAddModal }: AuditScheduleColumnProps) {
    const router = useRouter();
    const [editingAudit, setEditingAudit] = useState<any | null>(null);
    const [isSavingHistory, startSaveHistory] = useTransition();

    if (!row) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center text-gray-400 bg-slate-50">
                <div className="w-20 h-20 rounded-full bg-white border border-dashed border-gray-200 flex items-center justify-center mb-6 opacity-60">
                    <History size={32} />
                </div>
                <h3 className="text-[14px] font-normal uppercase tracking-widest text-slate-400 mb-2">会社を選択してください</h3>
                <p className="text-[11px] font-medium text-slate-400/60 max-w-[200px]">詳細情報を表示するには、左のリストから会社を選択してください。</p>
            </div>
        );
    }

    const handleQuickSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            companyId: editingAudit.company_id,
            auditType: formData.get('audit_type') as string,
            month: (editingAudit.actual_date || editingAudit.scheduled_date)?.slice(0, 7),
            scheduledDate: formData.get('scheduled_date') as string,
            picName: formData.get('pic_name') as string,
            markCompleted: true,
            existingId: editingAudit.id
        };

        startSaveHistory(async () => {
            await upsertAuditSchedule(data);
            setEditingAudit(null);
            onSaved();
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 thin-scrollbar overflow-y-auto">
            <div className="w-[600px] mx-auto bg-white min-h-full flex flex-col border-x border-gray-200">
                {/* Header: Company Name & Month Filter (Option 3c) */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-gray-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-12 h-12 rounded-[6px] bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Building2 size={24} />
                            </div>
                            <div className="overflow-hidden">
                                <h2 className="text-[17px] font-normal text-gray-900 truncate leading-snug" title={row.company.name_jp}>
                                    {row.company.name_jp}
                                </h2>
                                <p className="text-[11px] font-normal uppercase tracking-widest text-[#B4C0D1] flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    モニタリングスケジュール
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => onOpenAddModal(row.company.id, 'homon')}
                            className="w-10 h-10 rounded-[6px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Option 3c: Month Filter here */}
                    <div className="bg-gray-50 p-1.5 rounded-[6px] border border-gray-200 transform transition-all">
                        <MonthFilter defaultValue={filterMonth} />
                    </div>
                </div>

                {/* Current Month Schedules */}
                <div className="p-6 flex flex-col gap-6">
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarCheck size={14} className="text-emerald-600" />
                            <h3 className="text-[12px] font-normal uppercase tracking-widest text-gray-900">
                                今月の予定 / 記録 ({filterMonth.replace('-', '/')})
                            </h3>
                        </div>

                        <div className="flex flex-col gap-4">
                            {AUDIT_TYPES.map(({ key, label, badge }) => (
                                <InlineEditor
                                    key={key}
                                    auditType={key}
                                    typeLabel={label}
                                    typeBadge={badge}
                                    companyId={row.company.id}
                                    filterMonth={filterMonth}
                                    existingAudit={row.auditsByType?.[key]}
                                    onSaved={onSaved}
                                    staffList={staffList}
                                />
                            ))}
                        </div>
                    </section>

                    {/* History Section */}
                    <section className="mt-4 pt-8 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-6">
                            <History size={14} className="text-gray-400" />
                            <h3 className="text-[12px] font-normal uppercase tracking-widest text-gray-900">
                                全履歴 (監査・訪問)
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {row.lastAudits?.length > 0 ? (
                                row.lastAudits.map((audit: any, idx: number) => (
                                    <div key={audit.id} className="pb-3 last:pb-0">
                                        <div className="bg-white rounded-[6px] p-3 border border-gray-200 hover:border-blue-100 transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-1.5 py-0.5 rounded-[4px] text-xs font-bold uppercase tracking-widest border ${audit.audit_type === 'kansa' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-emerald-50/50 text-emerald-500 border-emerald-100'}`}>
                                                            {audit.audit_type === 'kansa' ? '監査' : '訪問'}
                                                        </span>
                                                        <span className="text-[13px] font-normal text-gray-900">
                                                            {(audit.actual_date || audit.scheduled_date)?.replace(/-/g, '/')}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingAudit(audit)}
                                                        className="p-1 hover:bg-gray-100 rounded-[4px] text-gray-300 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Pencil size={10} />
                                                    </button>
                                                </div>
                                                {idx === 0 && (
                                                    <span className="text-xs font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-[4px] uppercase shadow-blue-100">最新</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-900 ml-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] font-normal">{audit.pic_name || '未設定'}</span>
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-gray-400" />
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] font-normal uppercase tracking-tighter">完了済み</span>
                                                </div>
                                            </div>
                                            {audit.notes && (
                                                <p className="mt-2 pl-2 text-[12px] text-gray-900 leading-relaxed font-normal border-l border-blue-200 ml-1.5">
                                                    {audit.notes}
                                                </p>
                                           )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 bg-white rounded-[6px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-6 mx-2">
                                    <History size={24} className="text-gray-200 mb-2" />
                                    <p className="text-[11px] font-normal text-gray-300 uppercase tracking-widest leading-loose">
                                        過去の監査記録は<br />ありません
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Quick Edit Modal */}
            {editingAudit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-[6px] border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-[6px] text-white">
                                    <ClipboardList size={18} />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-normal text-gray-900 tracking-tight">履歴レコードの編集</h3>
                                    <p className="text-[11px] font-normal text-gray-700 uppercase tracking-widest">{row.company.name_jp}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingAudit(null)} className="p-2 hover:bg-gray-200 rounded-[6px] text-gray-400 transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleQuickSave} className="p-6 space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2 pl-1">Type</label>
                                    <select name="audit_type" required defaultValue={editingAudit.audit_type} className="w-full bg-gray-50 border border-gray-200 rounded-[6px] px-4 py-2.5 outline-none text-[13px] font-normal focus:border-blue-600 appearance-none">
                                        <option value="homon">訪問</option>
                                        <option value="kansa">監査</option>
                                        <option value="rinji">臨時</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2 pl-1">In Charge</label>
                                    <select name="pic_name" defaultValue={editingAudit.pic_name} className="w-full bg-gray-50 border border-gray-200 rounded-[6px] px-4 py-2.5 outline-none text-[13px] font-normal focus:border-blue-600 appearance-none">
                                        <option value="">— 担当を選択 —</option>
                                        {staffList.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2 pl-1">Actual Date</label>
                                    <input name="scheduled_date" type="date" required defaultValue={editingAudit.actual_date || editingAudit.scheduled_date} className="w-full bg-gray-50 border border-gray-200 rounded-[6px] px-4 py-2.5 outline-none text-[13px] font-normal focus:border-blue-600" />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setEditingAudit(null)} className="flex-1 py-3 text-[13px] font-normal text-gray-500 hover:bg-gray-50 rounded-[6px] transition-colors">キャンセル</button>
                                <button type="submit" disabled={isSavingHistory} className="flex-[2] py-3 bg-blue-600 text-white rounded-[6px] text-[13px] font-normal flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 uppercase tracking-widest">
                                    {isSavingHistory ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
                                    {isSavingHistory ? '保存中...' : '変更を保存'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
