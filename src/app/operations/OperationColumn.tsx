'use client'

import React, { useState, useEffect } from 'react';
import {
    Calendar, MapPin, Building2, Building, User,
    ClipboardList, FileText, ShieldCheck, GraduationCap,
    CheckCircle2, Plane, Briefcase, Activity, MessageSquare,
    Loader2, ChevronDown, ClipboardCheck, PlaneLanding,
    StickyNote, Plus, Trash2
} from 'lucide-react';

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

const InlineField = ({ label, value, type = "text", options = [], onChange }: any) => (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-200 last:border-0 hover:bg-slate-50/50 transition-all group">
        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-widest w-[80px] shrink-0">{label}</label>
        <div className="flex-1 min-w-0">
            {type === "select" ? (
                <div className="relative">
                    <select
                        value={value || '---'}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full appearance-none bg-transparent text-[12px] font-normal text-slate-700 outline-none cursor-pointer pr-5"
                    >
                        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-blue-500 transition-colors" />
                </div>
            ) : (
                <input
                    type={type}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent text-[12px] font-normal text-slate-700 outline-none border-b border-transparent focus:border-blue-500 placeholder:text-slate-200"
                    placeholder="---"
                />
            )}
        </div>
    </div>
);

const StatusSelect = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    const colorClass = value === '完了'
        ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
        : value === '進行中'
            ? 'text-blue-600 bg-blue-50 border-blue-100'
            : 'text-gray-400 bg-gray-100 border-gray-200';

    return (
        <div className="relative group/status flex-shrink-0">
            <div className={`flex items-center px-2 py-1 rounded-[4px] border transition-all ${colorClass}`}>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="appearance-none bg-transparent text-[10px] font-normal outline-none cursor-pointer pr-4 color-inherit"
                >
                    {PROGRESS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-white text-slate-700">{opt}</option>)}
                </select>
                <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
            </div>
        </div>
    );
};

export default function OperationColumn({ workers, staff, onUpdate, onBulkUpdate }: OperationColumnProps) {
    const [memoLines, setMemoLines] = useState<string[]>([]);
    const [draftChanges, setDraftChanges] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const isBulkMode = workers.length > 1;
    const worker = workers[0];

    useEffect(() => {
        if (!isBulkMode && worker?.id) {
            const lines = worker.remarks ? worker.remarks.split('\n') : [''];
            setMemoLines(lines);
        }
        setDraftChanges({});
    }, [workers.length, worker?.id, worker?.remarks, isBulkMode]);

    const handleFieldChange = (field: string, subField: string, value: string) => {
        if (isBulkMode) {
            setDraftChanges(prev => ({
                ...prev,
                [`${field}.${subField}`]: value
            }));
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

    const addMemoLine = () => {
        const newLines = [...memoLines, ''];
        setMemoLines(newLines);
        onUpdate('direct', 'remarks', newLines.join('\n'));
    };

    const removeMemoLine = (index: number) => {
        if (memoLines.length <= 1) {
            handleUpdateMemo(0, '');
            return;
        }
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
                <h3 className="text-[13px] font-normal text-slate-400 uppercase tracking-widest leading-loose">
                    対象を<br />選択してください
                </h3>
            </div>
        );
    }

    const getCommonValue = (field: string, subField?: string) => {
        const key = subField ? `${field}.${subField}` : `direct.${field}`;
        if (isBulkMode && draftChanges[key] !== undefined) {
            return draftChanges[key];
        }
        const values = workers.map(w => {
            if (field === 'direct') return w[subField!];
            return subField ? w[field]?.[subField] : w[field];
        });
        const uniqueValues = Array.from(new Set(values));
        if (uniqueValues.length === 1) return uniqueValues[0];
        return isBulkMode ? '--- (複数)' : uniqueValues[0];
    };

    const STAFF_OPTIONS = ['---', ...staff.map(s => s.full_name)];

    return (
        <div className="flex-1 bg-slate-50 h-full overflow-y-auto thin-scrollbar">
            <div className="max-w-[1000px] mx-auto w-full px-6 py-6 flex flex-col gap-6">

                {/* 1. Header Information Panel */}
                <div className="bg-white border border-slate-300 rounded-lg p-6 flex items-start justify-between">
                    <div className="flex gap-5">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-normal shrink-0 ${isBulkMode ? 'bg-slate-800' : 'bg-slate-700'}`}>
                            {isBulkMode ? workers.length : worker.avatar}
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-normal text-slate-800 tracking-tighter">
                                    {isBulkMode ? `${workers.length} 名の労働者を選択中` : worker.name}
                                </h1>
                                {!isBulkMode && (
                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-normal uppercase tracking-widest border border-blue-100">
                                        {worker.systemType === 'ginou_jisshu' ? '技能実習' : worker.systemType === 'ikusei_shuro' ? '育成就労' : '特定技能'}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-5 text-[11px] font-normal text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <Building2 size={13} className="text-slate-300" />
                                    <span>{isBulkMode ? '一괄編集モード' : worker.company}</span>
                                </div>
                                {!isBulkMode && (
                                    <>
                                        <div className="flex items-center gap-1.5">
                                            <Briefcase size={13} className="text-slate-300" />
                                            <span>{worker.occupation}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={13} className="text-slate-300" />
                                            <span className="max-w-[200px] truncate">{worker.address}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-l border-slate-100 pl-6 shrink-0">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-normal text-slate-400 tracking-widest uppercase">有効期限 (在留)</span>
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-[4px] border border-slate-100">
                                <Calendar size={12} className="text-slate-400" />
                                <span className={`text-[12px] font-normal ${worker.visaExpiry.includes('あと') ? 'text-rose-600' : 'text-slate-600'}`}>{worker.visaExpiry}</span>
                            </div>
                        </div>
                        {isBulkMode && Object.keys(draftChanges).length > 0 && (
                            <button
                                onClick={handleBulkSave}
                                disabled={isSaving}
                                className="h-full px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-normal text-[13px] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                <span>一括保存</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Unified Seamless Block */}
                <div className="bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col divide-y divide-slate-300">

                    {/* Top Section: Basic Cert Dates */}
                    <div className="flex divide-x divide-slate-300">
                        <div className="flex-1 flex items-center gap-5 px-6 py-4 hover:bg-slate-50/30 transition-all">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-normal text-slate-400 uppercase tracking-widest">認定開始日</span>
                                <input
                                    type="date"
                                    value={getCommonValue('direct', 'cert_start_date') || ''}
                                    onChange={(e) => handleFieldChange('direct', 'cert_start_date', e.target.value)}
                                    className="bg-transparent text-[13px] font-normal text-slate-700 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-normal text-slate-400 uppercase tracking-widest">認定終了日</span>
                                <input
                                    type="date"
                                    value={getCommonValue('direct', 'cert_end_date') || ''}
                                    onChange={(e) => handleFieldChange('direct', 'cert_end_date', e.target.value)}
                                    className="bg-transparent text-[13px] font-normal text-slate-700 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-50/20 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Activity size={16} className="text-slate-400" />
                                <span className="text-[11px] font-normal text-slate-700 uppercase tracking-widest">進捗管理概要</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-normal text-slate-400 uppercase">総合進捗</span>
                                    <span className="text-[12px] font-normal text-slate-800">75%</span>
                                </div>
                                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[75%]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Procedures Grid */}
                    <div className="grid grid-cols-2 divide-x divide-slate-300">

                        {/* Cell: Kikou */}
                        <div className="flex flex-col group">
                            <div className="px-5 py-3 flex items-center justify-between border-b border-gray-300 bg-white transition-all">
                                <div className="flex items-center gap-2.5 text-slate-900">
                                    <ClipboardList size={15} className="text-slate-400" />
                                    <span className="text-[12px] font-normal uppercase tracking-widest">機構業務</span>
                                </div>
                                <StatusSelect value={getCommonValue('kikou_status', 'progress')} onChange={(v) => handleFieldChange('kikou_status', 'progress', v)} />
                            </div>
                            <div className="p-2 grid grid-cols-2">
                                <InlineField label="申請内容" value={getCommonValue('kikou_status', 'type')} type="select" options={KIKOU_OPTIONS} onChange={(v: any) => handleFieldChange('kikou_status', 'type', v)} />
                                <InlineField label="申請日" value={getCommonValue('kikou_status', 'application_date')} type="date" onChange={(v: any) => handleFieldChange('kikou_status', 'application_date', v)} />
                                <div className="col-span-2">
                                    <InlineField label="業務担当者" value={getCommonValue('kikou_status', 'assignee')} type="select" options={STAFF_OPTIONS} onChange={(v: any) => handleFieldChange('kikou_status', 'assignee', v)} />
                                </div>
                            </div>
                        </div>

                        {/* Cell: Nyukan */}
                        <div className="flex flex-col group">
                            <div className="px-5 py-3 flex items-center justify-between border-b border-gray-300 bg-white transition-all">
                                <div className="flex items-center gap-2.5 text-slate-900">
                                    <FileText size={15} className="text-slate-400" />
                                    <span className="text-[12px] font-normal uppercase tracking-widest">入管業務</span>
                                </div>
                                <StatusSelect value={getCommonValue('nyukan_status', 'progress')} onChange={(v) => handleFieldChange('nyukan_status', 'progress', v)} />
                            </div>
                            <div className="p-2 grid grid-cols-2">
                                <div className="col-span-2">
                                    <InlineField label="申請内容" value={getCommonValue('nyukan_status', 'type')} type="select" options={NYUKAN_OPTIONS} onChange={(v: any) => handleFieldChange('nyukan_status', 'type', v)} />
                                </div>
                                <InlineField label="申請日" value={getCommonValue('nyukan_status', 'application_date')} type="date" onChange={(v: any) => handleFieldChange('nyukan_status', 'application_date', v)} />
                                <InlineField label="受理番号" value={getCommonValue('nyukan_status', 'receipt_number')} onChange={(v: any) => handleFieldChange('nyukan_status', 'receipt_number', v)} />
                                <InlineField label="申請窓口" value={getCommonValue('nyukan_status', 'application_window')} type="select" options={WINDOW_OPTIONS} onChange={(v: any) => handleFieldChange('nyukan_status', 'application_window', v)} />
                                <InlineField label="取次者" value={getCommonValue('nyukan_status', 'agent')} type="select" options={STAFF_OPTIONS} onChange={(v: any) => handleFieldChange('nyukan_status', 'agent', v)} />
                                <div className="col-span-2">
                                    <InlineField label="業務担当者" value={getCommonValue('nyukan_status', 'assignee')} type="select" options={STAFF_OPTIONS} onChange={(v: any) => handleFieldChange('nyukan_status', 'assignee', v)} />
                                </div>
                            </div>
                        </div>

                        {/* Cell: Kentei */}
                        <div className="flex flex-col group">
                            <div className="px-5 py-3 flex items-center justify-between border-b border-gray-300 bg-white transition-all">
                                <div className="flex items-center gap-2.5 text-slate-900">
                                    <ShieldCheck size={15} className="text-slate-400" />
                                    <span className="text-[12px] font-normal uppercase tracking-widest">検定業務</span>
                                </div>
                                <StatusSelect value={getCommonValue('kentei_status', 'progress')} onChange={(v) => handleFieldChange('kentei_status', 'progress', v)} />
                            </div>
                            <div className="p-2 grid grid-cols-2">
                                <div className="col-span-2">
                                    <InlineField label="検定機関" value={getCommonValue('kentei_status', 'institution')} onChange={(v: any) => handleFieldChange('kentei_status', 'institution', v)} />
                                </div>
                                <div className="col-span-2">
                                    <InlineField label="検定場所" value={getCommonValue('kentei_status', 'location')} onChange={(v: any) => handleFieldChange('kentei_status', 'location', v)} />
                                </div>
                                <InlineField label="検定内容" value={getCommonValue('kentei_status', 'type')} type="select" options={KENTEI_OPTIONS} onChange={(v: any) => handleFieldChange('kentei_status', 'type', v)} />
                                <div />
                                <InlineField label="学科日程" value={getCommonValue('kentei_status', 'exam_date_written')} type="date" onChange={(v: any) => handleFieldChange('kentei_status', 'exam_date_written', v)} />
                                <InlineField label="実技日程" value={getCommonValue('kentei_status', 'exam_date_practical')} type="date" onChange={(v: any) => handleFieldChange('kentei_status', 'exam_date_practical', v)} />
                                <div className="col-span-2">
                                    <InlineField label="業務担当者" value={getCommonValue('kentei_status', 'assignee')} type="select" options={STAFF_OPTIONS} onChange={(v: any) => handleFieldChange('kentei_status', 'assignee', v)} />
                                </div>
                            </div>
                        </div>

                        {/* Cell: System */}
                        <div className="flex flex-col group">
                            <div className="px-5 py-3 flex items-center justify-between border-b border-gray-300 bg-white transition-all">
                                <div className="flex items-center gap-2.5 text-slate-900">
                                    <Building size={15} className="text-slate-400" />
                                    <span className="text-[12px] font-normal uppercase tracking-widest">既存システム</span>
                                </div>
                                <StatusSelect value={getCommonValue('system_status', 'progress') || '未着手'} onChange={(v) => handleFieldChange('system_status', 'progress', v)} />
                            </div>
                            <div className="p-2 grid grid-cols-2">
                                <div className="col-span-2">
                                    <InlineField label="内容" value={getCommonValue('direct', 'system_type_content')} type="select" options={SYSTEM_OPTIONS} onChange={(v: any) => handleFieldChange('direct', 'system_type_content', v)} />
                                </div>
                                <InlineField label="申請日" value={getCommonValue('system_status', 'application_date')} type="date" onChange={(v: any) => handleFieldChange('system_status', 'application_date', v)} />
                                <InlineField label="担当者" value={getCommonValue('system_status', 'assignee')} type="select" options={STAFF_OPTIONS} onChange={(v: any) => handleFieldChange('system_status', 'assignee', v)} />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Full Row: Airport Support */}
                    <div className="flex group border-t border-slate-300">
                        <div className="w-[180px] p-6 flex flex-col items-center justify-center border-r border-gray-300 bg-white shrink-0 transition-all">
                            <PlaneLanding size={24} className="text-slate-400 mb-3" />
                            <span className="text-[12px] font-normal text-slate-900 uppercase tracking-widest text-center">送迎・帰国支援</span>
                            <div className="mt-4 w-full">
                                <StatusSelect value={getCommonValue('airport_status', 'progress') || '未着手'} onChange={(v) => handleFieldChange('airport_status', 'progress', v)} />
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 p-4">
                            <InlineField label="帰国日" value={getCommonValue('airport_status', 'return_date')} type="date" onChange={(v: any) => handleFieldChange('airport_status', 'return_date', v)} />
                            <InlineField label="再入国日" value={getCommonValue('airport_status', 'reentry_date')} type="date" onChange={(v: any) => handleFieldChange('airport_status', 'reentry_date', v)} />
                            <InlineField label="業務担当者" value={getCommonValue('airport_status', 'assignee')} type="select" options={STAFF_OPTIONS} onChange={(v: any) => handleFieldChange('airport_status', 'assignee', v)} />
                        </div>
                    </div>

                    {/* Memo Section */}
                    <div className="flex flex-col border-t border-slate-300">
                        <div className="px-6 py-4 bg-slate-50/20 border-b border-slate-300 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <StickyNote size={15} className="text-slate-400" />
                                <span className="text-[12px] font-normal text-slate-800 uppercase tracking-widest">備考・特記事項</span>
                            </div>
                            <button
                                onClick={addMemoLine}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-800 hover:text-white transition-all active:scale-90"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="p-6">
                            {isBulkMode ? (
                                <textarea
                                    value={getCommonValue('direct', 'remarks') || ''}
                                    onChange={(e) => handleFieldChange('direct', 'remarks', e.target.value)}
                                    className="w-full bg-slate-50/50 p-4 rounded-lg border border-slate-100 text-[13px] font-normal text-slate-700 outline-none focus:border-slate-300 min-h-[100px]"
                                    placeholder="一括上書きメモを入力..."
                                />
                            ) : (
                                <div className="space-y-2">
                                    {memoLines.map((line, index) => (
                                        <div key={index} className="flex items-center gap-4 group/memo border-b border-slate-200 last:border-0 py-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                            <input
                                                type="text"
                                                value={line}
                                                onChange={(e) => handleUpdateMemo(index, e.target.value)}
                                                className="flex-1 bg-transparent text-[13px] font-normal text-slate-700 outline-none placeholder:text-slate-200"
                                                placeholder="メモを入力..."
                                            />
                                            <button
                                                onClick={() => removeMemoLine(index)}
                                                className="opacity-0 group-hover/memo:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
            <div className="h-20 shrink-0" />
        </div>
    );
}
