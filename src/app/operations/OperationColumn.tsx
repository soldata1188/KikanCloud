'use client'

import React, { useState, useEffect } from 'react';
import {
    MapPin, Building2, Building,
    ClipboardList, FileText, ShieldCheck,
    CheckCircle2, Briefcase,
    Loader2, ChevronDown, ClipboardCheck, PlaneLanding,
    StickyNote, Plus, Trash2, Clock, MessageSquare, Phone, Monitor, Users
} from 'lucide-react';
import { getWorkerTasksAndLogs } from './actions';

interface OperationColumnProps {
    workers: any[];
    staff: { id: string, full_name: string }[];
    onUpdate: (field: string, subField: string, value: string) => void;
    onBulkUpdate?: (updates: { field: string, subField: string, value: string }[]) => Promise<void>;
}

const PROGRESS_OPTIONS = ['未着手', '進行中', '完了'];
const KIKOU_OPTIONS = ['---', '新規認定', '２号認定', '転籍認定', '軽微変更', '困難届出'];
const NYUKAN_OPTIONS = ['---', '新規認定', '資格変更', '期間更新', '特定活動', '特定変更', '特定更新', '変更届出'];
const WINDOW_OPTIONS = ['---', '窓口', 'ONLINE'];
const KENTEI_OPTIONS = ['---', '初級', '基礎級', '専門級', '随時３級'];
const SYSTEM_OPTIONS = ['---', '就労認可', '変更届出'];

const PRIORITY_COLOR: Record<string, string> = {
    urgent: 'bg-red-50 text-red-600 border-red-200',
    high: 'bg-amber-50 text-amber-600 border-amber-200',
    medium: 'bg-blue-50 text-blue-600 border-blue-100',
    low: 'bg-gray-50 text-gray-500 border-gray-100',
};
const TASK_STATUS_COLOR: Record<string, string> = {
    done: 'text-emerald-500',
    in_progress: 'text-blue-500',
    todo: 'text-gray-300',
};
const LOG_ICON: Record<string, React.ElementType> = {
    visit: Users, phone: Phone, online: Monitor, other: MessageSquare,
};
const LOG_LABEL: Record<string, string> = {
    visit: '訪問', phone: '電話', online: 'オンライン', other: 'その他',
};

function getVisaBadge(visaExpiry: string) {
    if (!visaExpiry || visaExpiry === '---') return null;
    const days = Math.ceil((new Date(visaExpiry).getTime() - Date.now()) / 86400000);
    if (days < 0) return { label: '期限切れ', cls: 'bg-red-600 text-white' };
    if (days <= 30) return { label: `残${days}日`, cls: 'bg-red-500 text-white' };
    if (days <= 90) return { label: `残${days}日`, cls: 'bg-orange-400 text-white' };
    if (days <= 180) return { label: `残${days}日`, cls: 'bg-yellow-400 text-gray-800' };
    return { label: `残${days}日`, cls: 'bg-gray-100 text-gray-600' };
}

const InlineField = ({ label, value, type = 'text', options = [], onChange }: any) => (
    <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-all group">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter w-[100px] shrink-0">{label}</label>
        <div className="flex-1 min-w-0">
            {type === 'select' ? (
                <div className="relative">
                    <select
                        value={value || '---'}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-8 appearance-none bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer pr-5"
                    >
                        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-blue-500 transition-colors" />
                </div>
            ) : (
                <input
                    type={type}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-8 bg-transparent text-sm font-medium text-slate-700 outline-none border-b border-transparent focus:border-blue-400 placeholder:text-slate-200 transition-colors"
                    placeholder="---"
                />
            )}
        </div>
    </div>
);

const StatusBadge = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const cls = value === '完了'
        ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
        : value === '進行中'
            ? 'text-blue-600 bg-blue-50 border-blue-200'
            : 'text-gray-400 bg-gray-50 border-gray-200';
    return (
        <div className={`relative flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cls}`}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-transparent outline-none cursor-pointer pr-4"
            >
                {PROGRESS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-white text-slate-700">{opt}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
        </div>
    );
};

const SectionBlock = ({ icon: Icon, title, status, onStatusChange, children }: {
    icon: React.ElementType;
    title: string;
    status: string;
    onStatusChange: (v: string) => void;
    children: React.ReactNode;
}) => (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/40">
            <div className="flex items-center gap-2.5">
                <Icon size={15} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{title}</span>
            </div>
            <StatusBadge value={status} onChange={onStatusChange} />
        </div>
        <div>{children}</div>
    </div>
);

export default function OperationColumn({ workers, staff, onUpdate, onBulkUpdate }: OperationColumnProps) {
    const [memoLines, setMemoLines] = useState<string[]>(['']);
    const [draftChanges, setDraftChanges] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]);
    const [shienLogs, setShienLogs] = useState<any[]>([]);
    const [isLoadingActivity, setIsLoadingActivity] = useState(false);

    const isBulkMode = workers.length > 1;
    const worker = workers[0];

    // Load tasks/logs for single worker
    useEffect(() => {
        if (isBulkMode || !worker?.id) {
            setTasks([]);
            setShienLogs([]);
            return;
        }
        setIsLoadingActivity(true);
        getWorkerTasksAndLogs(worker.id)
            .then(({ tasks: t, logs: l }) => { setTasks(t); setShienLogs(l); })
            .catch(() => { })
            .finally(() => setIsLoadingActivity(false));
    }, [worker?.id, isBulkMode]);

    useEffect(() => {
        if (!isBulkMode && worker?.id) {
            setMemoLines(worker.remarks ? worker.remarks.split('\n') : ['']);
        }
        setDraftChanges({});
    }, [workers.length, worker?.id, worker?.remarks, isBulkMode]);

    const handleFieldChange = (field: string, subField: string, value: string) => {
        if (isBulkMode) {
            setDraftChanges(prev => ({ ...prev, [`${field}.${subField}`]: value }));
        } else {
            onUpdate(field, subField, value);
        }
    };

    const handleBulkSave = async () => {
        if (!onBulkUpdate || Object.keys(draftChanges).length === 0) return;
        setIsSaving(true);
        try {
            const updates = Object.entries(draftChanges).map(([key, value]) => {
                const [field, subField] = key.split('.');
                return { field, subField, value };
            });
            await onBulkUpdate(updates);
            setDraftChanges({});
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateMemo = (index: number, value: string) => {
        const newLines = [...memoLines];
        newLines[index] = value;
        setMemoLines(newLines);
        onUpdate('direct', 'remarks', newLines.join('\n'));
    };

    const addMemoLine = () => setMemoLines(prev => [...prev, '']);

    const removeMemoLine = (index: number) => {
        if (memoLines.length <= 1) { handleUpdateMemo(0, ''); return; }
        const newLines = memoLines.filter((_, i) => i !== index);
        setMemoLines(newLines);
        onUpdate('direct', 'remarks', newLines.join('\n'));
    };

    if (workers.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-6 opacity-40">
                    <ClipboardCheck size={32} className="text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-loose">
                    対象を<br />選択してください
                </h3>
            </div>
        );
    }

    const getV = (field: string, subField?: string) => {
        const key = subField ? `${field}.${subField}` : `direct.${field}`;
        if (isBulkMode && draftChanges[key] !== undefined) return draftChanges[key];
        const values = workers.map(w => {
            if (field === 'direct') return w[subField!];
            return subField ? w[field]?.[subField] : w[field];
        });
        const unique = Array.from(new Set(values));
        if (unique.length === 1) return unique[0];
        return isBulkMode ? '--- (複数)' : unique[0];
    };

    const STAFF_OPTIONS = ['---', ...staff.map(s => s.full_name)];

    // Real progress from actual status values
    const progressStatuses = [
        getV('kikou_status', 'progress'),
        getV('nyukan_status', 'progress'),
        getV('kentei_status', 'progress'),
        getV('system_status', 'progress'),
        getV('airport_status', 'progress'),
    ].map(s => s || '未着手');
    const completedCount = progressStatuses.filter(s => s === '完了').length;
    const progressPct = Math.round((completedCount / progressStatuses.length) * 100);

    // Visa expiry badge (single mode only)
    const visaBadge = !isBulkMode && worker?.visaExpiry ? getVisaBadge(worker.visaExpiry) : null;

    return (
        <div className="flex-1 bg-slate-50 h-full overflow-y-auto thin-scrollbar">
            <div className="max-w-[660px] mx-auto w-full px-5 py-5 flex flex-col gap-4">

                {/* Header */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-start justify-between gap-4">
                    <div className="flex gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0 ${isBulkMode ? 'bg-slate-700' : 'bg-blue-600'}`}>
                            {isBulkMode ? workers.length : worker.avatar}
                        </div>
                        <div className="flex flex-col gap-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-base font-bold text-slate-800 tracking-tight">
                                    {isBulkMode ? `${workers.length}名を一括編集中` : worker.name}
                                </h1>
                                {!isBulkMode && (
                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest border border-blue-100 shrink-0">
                                        {worker.systemType === 'ginou_jisshu' ? '技能実習' : worker.systemType === 'ikusei_shuro' ? '育成就労' : '特定技能'}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <Building2 size={11} className="text-slate-300" />
                                    <span>{isBulkMode ? '複数企業' : worker.company}</span>
                                </div>
                                {!isBulkMode && (
                                    <>
                                        <div className="flex items-center gap-1.5">
                                            <Briefcase size={11} className="text-slate-300" />
                                            <span>{worker.occupation}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={11} className="text-slate-300" />
                                            <span className="max-w-[200px] truncate">{worker.address}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        {!isBulkMode && worker?.visaExpiry && worker.visaExpiry !== '---' && (
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">在留期限</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-600">{worker.visaExpiry}</span>
                                    {visaBadge && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${visaBadge.cls}`}>
                                            {visaBadge.label}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                        {isBulkMode && Object.keys(draftChanges).length > 0 && (
                            <button
                                onClick={handleBulkSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                一括保存
                            </button>
                        )}
                    </div>
                </div>

                {/* Cert dates + real progress */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex divide-x divide-slate-100">
                    <div className="flex-1 px-5 py-4 flex gap-8">
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">認定開始日</span>
                            <input
                                type="date"
                                value={getV('direct', 'cert_start_date') || ''}
                                onChange={(e) => handleFieldChange('direct', 'cert_start_date', e.target.value)}
                                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">認定終了日</span>
                            <input
                                type="date"
                                value={getV('direct', 'cert_end_date') || ''}
                                onChange={(e) => handleFieldChange('direct', 'cert_end_date', e.target.value)}
                                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
                            />
                        </div>
                    </div>
                    <div className="px-5 py-4 flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">総合進捗</span>
                            <span className="text-2xl font-bold text-slate-800 leading-none">{progressPct}%</span>
                            <span className="text-[9px] text-slate-400">{completedCount}/{progressStatuses.length} 完了</span>
                        </div>
                        <div className="w-2 h-16 bg-slate-100 rounded-full overflow-hidden flex flex-col-reverse">
                            <div
                                className="w-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ height: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* 1. 機構業務 */}
                <SectionBlock
                    icon={ClipboardList} title="機構業務"
                    status={getV('kikou_status', 'progress') || '未着手'}
                    onStatusChange={(v) => handleFieldChange('kikou_status', 'progress', v)}
                >
                    <InlineField label="申請内容" value={getV('kikou_status', 'type')} type="select" options={KIKOU_OPTIONS} onChange={(v: any) => handleFieldChange('kikou_status', 'type', v)} />
                    <InlineField label="申請日" value={getV('kikou_status', 'application_date')} type="date" onChange={(v: any) => handleFieldChange('kikou_status', 'application_date', v)} />
                    <InlineField label="業務担当者" value={getV('kikou_status', 'assignee')} type="select" options={STAFF_OPTIONS} onChange={(v: any) => handleFieldChange('kikou_status', 'assignee', v)} />
                </SectionBlock>

                {/* 2. 入管業務 */}
                <SectionBlock
                    icon={FileText} title="入管業務"
                    status={getV('nyukan_status', 'progress') || '未着手'}
                    onStatusChange={(v) => handleFieldChange('nyukan_status', 'progress', v)}
                >
                    <InlineField label="申請内容" value={getV('nyukan_status', 'type')} type="select" options={NYUKAN_OPTIONS} onChange={(v: any) => handleFieldChange('nyukan_status', 'type', v)} />
                    <InlineField label="申請日" value={getV('nyukan_status', 'application_date')} type="date" onChange={(v: any) => handleFieldChange('nyukan_status', 'application_date', v)} />
                    <InlineField label="受理番号" value={getV('nyukan_status', 'receipt_number')} onChange={(v: any) => handleFieldChange('nyukan_status', 'receipt_number', v)} />
                    <InlineField label="申請窓口" value={getV('nyukan_status', 'application_window')} type="select" options={WINDOW_OPTIONS} onChange={(v: any) => handleFieldChange('nyukan_status', 'application_window', v)} />
                    <InlineField label="取次者" value={getV('nyukan_status', 'agent')} type="select" options={STAFF_OPTIONS} onChange={(v: any) => handleFieldChange('nyukan_status', 'agent', v)} />
                    <InlineField label="業務担当者" value={getV('nyukan_status', 'assignee')} type="select" options={STAFF_OPTIONS} onChange={(v: any) => handleFieldChange('nyukan_status', 'assignee', v)} />
                </SectionBlock>

                {/* 3. 検定業務 */}
                <SectionBlock
                    icon={ShieldCheck} title="検定業務"
                    status={getV('kentei_status', 'progress') || '未着手'}
                    onStatusChange={(v) => handleFieldChange('kentei_status', 'progress', v)}
                >
                    <InlineField label="検定機関" value={getV('kentei_status', 'institution')} onChange={(v: any) => handleFieldChange('kentei_status', 'institution', v)} />
                    <InlineField label="検定場所" value={getV('kentei_status', 'location')} onChange={(v: any) => handleFieldChange('kentei_status', 'location', v)} />
                    <InlineField label="検定内容" value={getV('kentei_status', 'type')} type="select" options={KENTEI_OPTIONS} onChange={(v: any) => handleFieldChange('kentei_status', 'type', v)} />
                    <InlineField label="学科日程" value={getV('kentei_status', 'exam_date_written')} type="date" onChange={(v: any) => handleFieldChange('kentei_status', 'exam_date_written', v)} />
                    <InlineField label="実技日程" value={getV('kentei_status', 'exam_date_practical')} type="date" onChange={(v: any) => handleFieldChange('kentei_status', 'exam_date_practical', v)} />
                    <InlineField label="業務担当者" value={getV('kentei_status', 'assignee')} type="select" options={STAFF_OPTIONS} onChange={(v: any) => handleFieldChange('kentei_status', 'assignee', v)} />
                </SectionBlock>

                {/* 4. 就労システム */}
                <SectionBlock
                    icon={Building} title="就労システム"
                    status={getV('system_status', 'progress') || '未着手'}
                    onStatusChange={(v) => handleFieldChange('system_status', 'progress', v)}
                >
                    <InlineField label="内容" value={getV('direct', 'system_type_content')} type="select" options={SYSTEM_OPTIONS} onChange={(v: any) => handleFieldChange('direct', 'system_type_content', v)} />
                    <InlineField label="申請日" value={getV('system_status', 'application_date')} type="date" onChange={(v: any) => handleFieldChange('system_status', 'application_date', v)} />
                    <InlineField label="担当者" value={getV('system_status', 'assignee')} type="select" options={STAFF_OPTIONS} onChange={(v: any) => handleFieldChange('system_status', 'assignee', v)} />
                </SectionBlock>

                {/* 5. 送迎・帰国支援 */}
                <SectionBlock
                    icon={PlaneLanding} title="送迎・帰国支援"
                    status={getV('airport_status', 'progress') || '未着手'}
                    onStatusChange={(v) => handleFieldChange('airport_status', 'progress', v)}
                >
                    <InlineField label="帰国日" value={getV('airport_status', 'return_date')} type="date" onChange={(v: any) => handleFieldChange('airport_status', 'return_date', v)} />
                    <InlineField label="再入国日" value={getV('airport_status', 'reentry_date')} type="date" onChange={(v: any) => handleFieldChange('airport_status', 'reentry_date', v)} />
                    <InlineField label="業務担当者" value={getV('airport_status', 'assignee')} type="select" options={STAFF_OPTIONS} onChange={(v: any) => handleFieldChange('airport_status', 'assignee', v)} />
                </SectionBlock>

                {/* 6. 備考・特記事項 */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/40">
                        <div className="flex items-center gap-2.5">
                            <StickyNote size={15} className="text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">備考・特記事項</span>
                        </div>
                        {!isBulkMode && (
                            <button
                                onClick={addMemoLine}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-700 hover:text-white transition-all active:scale-90"
                            >
                                <Plus size={13} />
                            </button>
                        )}
                    </div>
                    <div className="p-5">
                        {isBulkMode ? (
                            <textarea
                                value={getV('direct', 'remarks') || ''}
                                onChange={(e) => handleFieldChange('direct', 'remarks', e.target.value)}
                                className="w-full bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm font-medium text-slate-700 outline-none focus:border-slate-300 min-h-[100px] resize-none"
                                placeholder="一括上書きメモを入力..."
                            />
                        ) : (
                            <div className="space-y-1">
                                {memoLines.map((line, i) => (
                                    <div key={i} className="flex items-center gap-3 group/memo py-1.5 border-b border-slate-100 last:border-0">
                                        <div className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                        <input
                                            type="text"
                                            value={line}
                                            onChange={(e) => handleUpdateMemo(i, e.target.value)}
                                            className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-200"
                                            placeholder="メモを入力..."
                                        />
                                        <button
                                            onClick={() => removeMemoLine(i)}
                                            className="opacity-0 group-hover/memo:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 7. タスク・支援記録 (single worker only) */}
                {!isBulkMode && (
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/40 flex items-center gap-2.5">
                            <CheckCircle2 size={15} className="text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">タスク・支援記録</span>
                            {isLoadingActivity && <Loader2 size={11} className="animate-spin text-slate-300 ml-1" />}
                        </div>

                        {isLoadingActivity ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={18} className="animate-spin text-slate-300" />
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {/* Tasks */}
                                {tasks.length > 0 ? tasks.map(task => (
                                    <div key={task.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                                        <CheckCircle2 size={13} className={`mt-0.5 shrink-0 ${TASK_STATUS_COLOR[task.status] || 'text-gray-300'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">{task.title}</p>
                                            {task.due_date && (
                                                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Clock size={9} />期日: {task.due_date}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY_COLOR[task.priority] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                            {task.priority?.toUpperCase()}
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-[11px] text-slate-300 text-center py-5 italic">タスクなし</p>
                                )}

                                {/* ShienLogs (latest 3) */}
                                {shienLogs.length > 0 && shienLogs.slice(0, 3).map(log => {
                                    const Icon = LOG_ICON[log.support_type] || MessageSquare;
                                    return (
                                        <div key={log.id} className="flex items-start gap-3 px-5 py-3 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                                            <Icon size={13} className="text-slate-400 shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{LOG_LABEL[log.support_type]}</span>
                                                    <span className="text-[10px] text-slate-400">{log.support_date}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{log.content}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div className="h-8 shrink-0" />
            </div>
        </div>
    );
}
