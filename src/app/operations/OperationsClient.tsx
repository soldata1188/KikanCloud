'use client'

import React, { useState } from 'react'
import { Clock, Briefcase, AlertTriangle, MapPin } from 'lucide-react'
import Link from 'next/link'

import { updateWorkerStatus, updateOperationData } from './actions'
import ExamTab from '@/components/operations/ExamTab'

export interface OperationData {
    type: string;
    progress: string;
    assignee: string;
    note?: string;
    exam_date_written?: string;
    exam_date_practical?: string;
    exam_location?: string;
    application_date?: string;
    receipt_number?: string;
    agent?: string;
    construction_type?: string;
    construction_assignee?: string;
    witness?: string;
    exam_result_written?: string;
    exam_result_practical?: string;
}

const PROGRESS_OPTIONS = ['未着手', '進行中', '完了'];
const KENTEI_OPTIONS = ['---', '初級', '基礎級', '専門級', '随時3級', '上級', '随時2級'];
const KIKOU_OPTIONS = ['---', '認定申請1号', '認定申請2号', '転籍申請', '軽微変更', '困難届出'];
const CONSTRUCTION_OPTIONS = ['---', 'オンライン申請', '変更届出等'];
const NYUKAN_OPTIONS = ['---', '資格認定', '資格変更', '期間更新', '特定活動', '特定変更', '特定更新', '変更届出'];


type WorkerField = 'status' | 'kentei_status' | 'kikou_status' | 'nyukan_status';

// ── Unified design tokens — soft accent system ─────────────────
const C = {
    zairyu: {
        accent: '#3b82f6',        // blue-500
        light: 'bg-blue-50',
        border: 'border-l-[3px] border-l-blue-400',
        divider: 'border-blue-100',
        chip: 'bg-blue-100 text-blue-700',
        label: 'text-blue-500',
        subchip: 'bg-blue-100 text-blue-600',
    },
    kentei: {
        accent: '#f59e0b',        // amber-500
        light: 'bg-amber-50',
        border: 'border-l-[3px] border-l-amber-400',
        divider: 'border-amber-100',
        chip: 'bg-amber-100 text-amber-700',
        label: 'text-amber-600',
        subchip: 'bg-amber-100 text-amber-600',
    },
    kikou: {
        accent: '#4f46e5',        // indigo-600
        light: 'bg-indigo-50',
        border: 'border-l-[3px] border-l-indigo-500',
        divider: 'border-indigo-100',
        chip: 'bg-indigo-100 text-indigo-700',
        label: 'text-indigo-600',
        subchip: 'bg-indigo-100 text-indigo-600',
    },
    nyukan: {
        accent: '#2563eb',        // blue-600
        light: 'bg-blue-50',
        border: 'border-l-[3px] border-l-blue-500',
        divider: 'border-blue-100',
        chip: 'bg-blue-100 text-blue-700',
        label: 'text-blue-600',
        subchip: 'bg-blue-100 text-blue-600',
    },
}

const progressCls = (p: string, col: keyof typeof C) => {
    if (p === '完了') return 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-black'
    if (p === '進行中') {
        const map: Record<string, string> = {
            zairyu: 'bg-blue-100 text-blue-800 border border-blue-200',
            kentei: 'bg-amber-100 text-amber-800 border border-amber-200',
            kikou: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
            nyukan: 'bg-blue-600 text-white border-blue-700',
        }
        return (map[col] || '') + ' font-black'
    }
    return 'bg-slate-100 text-slate-500 border border-slate-200 font-semibold'
}

// Shared compact select style
const SEL = "text-[11px] py-0.5 px-1.5 outline-none rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold cursor-pointer focus:ring-1 focus:ring-inset transition-all"

const cycleProgress = (current: string) => {
    const idx = PROGRESS_OPTIONS.indexOf(current);
    return PROGRESS_OPTIONS[(idx + 1) % PROGRESS_OPTIONS.length];
};

const cycleStatus = (current: string) => {
    const statuses = ['未入国', '対応中', '就業中', '失踪', '帰国', '転籍済'];
    const idx = statuses.indexOf(current);
    if (idx === -1) return statuses[0];
    return statuses[(idx + 1) % statuses.length];
};

export default function OperationsClient({
    initialWorkers = [],
    staff = [],
}: {
    initialWorkers?: any[],
    companies?: any[],
    initialVisas?: any[],
    initialExams?: any[],
    initialTransfers?: any[],
    staff?: { id: string, full_name: string }[]
}) {
    const STAFF_OPTIONS = ['---', ...staff.map(s => s.full_name)];

    const mappedWorkers = initialWorkers.map(w => {
        const reverseStatusMap: Record<string, string> = {
            'waiting': '未入国', 'standby': '対応中', 'working': '就業中', 'missing': '失踪', 'returned': '帰国'
        };
        return {
            id: w.id,
            name: w.full_name_romaji || '名前なし',
            furigana: w.full_name_kana || '---',
            avatar: (w.full_name_romaji || '?').charAt(0).toUpperCase(),
            photoUrl: w.avatar_url || null,
            company: w.companies?.name_jp || '未所属',
            systemCategory: w.system_type === 'tokuteigino' ? '特定技能' : (w.system_type === 'ginou_jisshu' ? '技能実習' : '育成就労'),
            occupation: w.industry_field || '---',
            visaStatus: w.visa_status || '---',
            visaExpiry: w.visas?.[0]?.expiration_date || '---',
            entryDate: w.entry_date || '',
            entryBatch: w.entry_batch || '---',
            certStartDate: w.cert_start_date || '---',
            certEndDate: w.cert_end_date || '---',
            remarks: w.remarks || '',
            address: w.address || '',
            status: reverseStatusMap[w.status] || '未入国',
            kenteiStatus: (typeof w.kentei_status === 'object' && w.kentei_status ? w.kentei_status : { type: '---', progress: '未着手', assignee: '---', witness: '---', exam_location: '', exam_date_written: '', exam_date_practical: '', exam_result_written: '---', exam_result_practical: '---' }) as OperationData,
            kikouStatus: (typeof w.kikou_status === 'object' && w.kikou_status ? w.kikou_status : { type: '---', progress: '未着手', assignee: '---', construction_type: '---', construction_assignee: '---' }) as OperationData,
            nyukanStatus: (typeof w.nyukan_status === 'object' && w.nyukan_status ? w.nyukan_status : { type: '---', progress: '未着手', assignee: '---', application_date: '', agent: '' }) as OperationData
        };
    });

    const [workers, setWorkers] = useState(mappedWorkers);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    type StatusTabKey = 'waiting' | 'active' | 'closed'
    const STATUS_TAB_GROUPS: { key: StatusTabKey; label: string; statuses: string[]; icon: React.ReactNode; color: string }[] = [
        { key: 'waiting', label: '未入国', statuses: ['未入国'], icon: <Clock size={13} />, color: 'amber' },
        { key: 'active', label: '就業中・対応中', statuses: ['就業中', '対応中'], icon: <Briefcase size={13} />, color: 'emerald' },
        { key: 'closed', label: '失踪・帰国・転籍済', statuses: ['失踪', '帰国', '転籍済'], icon: <AlertTriangle size={13} />, color: 'rose' },
    ];
    const [activeStatusTab, setActiveStatusTab] = useState<StatusTabKey>('active');

    const countByStatusTab = (key: StatusTabKey) => {
        const group = STATUS_TAB_GROUPS.find(g => g.key === key)!;
        return workers.filter(w => group.statuses.includes(w.status)).length;
    };

    const [filterSystem, setFilterSystem] = useState('すべて');
    const [filterCompany, setFilterCompany] = useState('すべて');
    const [filterOccupation, setFilterOccupation] = useState('すべて');
    const [filterBatch, setFilterBatch] = useState('すべて');
    const [filterVisaStatus, setFilterVisaStatus] = useState('すべて');
    const [sortOrder, setSortOrder] = useState('在留期限(近い順)');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    React.useEffect(() => { setCurrentPage(1); }, [activeStatusTab, filterSystem, filterCompany, filterOccupation, filterBatch, filterVisaStatus, sortOrder]);

    const STATUS_CARDS = ['すべて', '未入国', '対応中', '就業中', '失踪', '帰国', '転籍済'];
    const systemOptions = ['すべて', '育成就労', '技能実習', '特定技能'];
    const companyOptions = ['すべて', ...Array.from(new Set(workers.map(w => w.company)))].filter(Boolean);
    const occupationOptions = ['すべて', ...Array.from(new Set(workers.map(w => w.occupation)))].filter(Boolean);
    const getBatchString = (entryDate: string) => {
        if (!entryDate) return '不明';
        const d = new Date(entryDate);
        return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月生`;
    };
    const batchOptions = ['すべて', ...Array.from(new Set(workers.map(w => getBatchString(w.entryDate))))].filter(Boolean);
    const visaOptions = ['すべて', ...Array.from(new Set(workers.map(w => w.visaStatus)))].filter(Boolean);
    const sortOptions = ['在留期限(近い順)', '認定終了日(近い順)', '入国期生(近い順)'];

    const processedWorkers = workers
        .filter(w => { const g = STATUS_TAB_GROUPS.find(g => g.key === activeStatusTab)!; return g.statuses.includes(w.status); })
        .filter(w => filterSystem === 'すべて' || w.systemCategory === filterSystem)
        .filter(w => filterCompany === 'すべて' || w.company === filterCompany)
        .filter(w => filterOccupation === 'すべて' || w.occupation === filterOccupation)
        .filter(w => filterBatch === 'すべて' || getBatchString(w.entryDate) === filterBatch)
        .filter(w => filterVisaStatus === 'すべて' || w.visaStatus === filterVisaStatus)
        .sort((a, b) => {
            if (sortOrder === '認定終了日(近い順)') {
                const cA = a.certEndDate && a.certEndDate !== '---' ? new Date(a.certEndDate).getTime() : Infinity;
                const cB = b.certEndDate && b.certEndDate !== '---' ? new Date(b.certEndDate).getTime() : Infinity;
                return cA - cB;
            }
            if (sortOrder === '入国期生(近い順)') {
                return (b.entryDate ? new Date(b.entryDate).getTime() : 0) - (a.entryDate ? new Date(a.entryDate).getTime() : 0);
            }
            const expA = a.visaExpiry && a.visaExpiry !== '---' ? new Date(a.visaExpiry).getTime() : Infinity;
            const expB = b.visaExpiry && b.visaExpiry !== '---' ? new Date(b.visaExpiry).getTime() : Infinity;
            return expA - expB;
        });

    const totalPages = Math.ceil(processedWorkers.length / itemsPerPage);
    const paginatedWorkers = processedWorkers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleChange = async (id: string, field: WorkerField, value: string) => {
        setWorkers(workers.map(w => w.id === id ? { ...w, [field]: value } : w));
        try { await updateWorkerStatus(id, field, value); } catch { alert("更新エラーが発生しました"); }
    };
    const handleOperationChange = async (id: string, field: 'kentei_status' | 'kikou_status' | 'nyukan_status', subField: keyof OperationData, value: string) => {
        const workerIndex = workers.findIndex(w => w.id === id);
        if (workerIndex === -1) return;
        const worker = workers[workerIndex];
        const stateField = field === 'kentei_status' ? 'kenteiStatus' : field === 'kikou_status' ? 'kikouStatus' : 'nyukanStatus';
        const newOpData = { ...worker[stateField], [subField]: value };
        setWorkers(prev => prev.map(w => w.id === id ? { ...w, [stateField]: newOpData } : w));
        try { await updateOperationData(id, field, newOpData); } catch { alert("更新エラーが発生しました"); }
    };
    const handleRemarksBlur = async (id: string) => {
        const worker = workers.find(w => w.id === id);
        if (!worker) return;
        try { await updateWorkerStatus(id, 'remarks', worker.remarks); } catch { alert("備考の更新に失敗しました"); }
    };
    const handleBulkChange = async (field: WorkerField | 'remarks', value: string) => {
        setWorkers(workers.map(w => selectedIds.includes(w.id) ? { ...w, [field]: value } : w));
        try { for (const id of selectedIds) { await updateWorkerStatus(id, field, value); } }
        catch { alert("一部の更新に失敗しました。ページをリロードしてください。"); }
    };
    const handleBulkOperationChange = async (field: 'kentei_status' | 'kikou_status' | 'nyukan_status', subField: keyof OperationData, value: string) => {
        const stateField = field === 'kentei_status' ? 'kenteiStatus' : field === 'kikou_status' ? 'kikouStatus' : 'nyukanStatus';
        setWorkers(prev => prev.map(w => selectedIds.includes(w.id) ? { ...w, [stateField]: { ...w[stateField], [subField]: value } } : w));
        try {
            for (const id of selectedIds) {
                const worker = workers.find(w => w.id === id);
                if (worker) { await updateOperationData(id, field, { ...worker[stateField], [subField]: value }); }
            }
        } catch { alert("一部の更新に失敗しました。ページをリロードしてください。"); }
    };
    const toggleSelectAll = () => { selectedIds.length === workers.length ? setSelectedIds([]) : setSelectedIds(workers.map(w => w.id)); };
    const toggleSelect = (id: string) => { selectedIds.includes(id) ? setSelectedIds(selectedIds.filter(s => s !== id)) : setSelectedIds([...selectedIds, id]); };

    const [activeTab, setActiveTab] = useState<'overview' | 'exam'>('overview');

    // ── Status badge ──────────────────────────────────────────
    const statusBadgeCls = (s: string) => {
        if (s === '就業中') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
        if (s === '対応中') return 'bg-amber-100 text-amber-800 border-amber-200'
        if (s === '失踪') return 'bg-rose-100 text-rose-800 border-rose-200'
        if (s === '帰国') return 'bg-slate-100 text-slate-700 border-slate-200'
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }

    return (
        <div className="bg-slate-50 min-h-full">

            {/* ════════════════════════════════════════════════════
                MAIN TAB BAR
            ════════════════════════════════════════════════════ */}
            <div className="flex px-6 pt-0 space-x-0 border-b border-slate-200 bg-white">
                {(['overview', 'exam'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 -mb-[1px] ${activeTab === tab
                            ? 'text-slate-800 border-slate-800'
                            : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                        {tab === 'overview' ? '総括一覧 (Overview)' : '検定・試験 (Exams)'}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="w-full min-[720px]:w-[1500px] mx-auto">

                    {/* ── Status Sub-Tabs ── */}
                    <div className="flex px-6 pt-0 border-b border-slate-200 overflow-x-auto no-scrollbar bg-white">
                        {STATUS_TAB_GROUPS.map((tab) => {
                            const isActive = activeStatusTab === tab.key;
                            const count = countByStatusTab(tab.key);
                            const colorMap: Record<string, string> = {
                                waiting: 'border-amber-500 text-amber-700',
                                active: 'border-emerald-500 text-emerald-700',
                                closed: 'border-rose-500 text-rose-700',
                            };
                            const countMap: Record<string, string> = {
                                waiting: 'bg-amber-100 text-amber-700',
                                active: 'bg-emerald-100 text-emerald-700',
                                closed: 'bg-rose-100 text-rose-700',
                            };
                            return (
                                <button key={tab.key} onClick={() => setActiveStatusTab(tab.key)}
                                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 -mb-[1px]
                                        ${isActive ? colorMap[tab.key] : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                    <span className={`text-[10px] font-black min-w-[20px] h-[18px] inline-flex items-center justify-center px-1.5 rounded-full
                                        ${isActive ? countMap[tab.key] : 'bg-slate-100 text-slate-400'}`}>{count}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Filter Bar ── */}
                    <div className="px-4 md:px-6 py-3 bg-white border-b border-slate-200">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mr-1">絞り込み</span>
                                {[
                                    { v: filterSystem, s: setFilterSystem, opts: systemOptions, placeholder: 'すべて (区分)' },
                                    { v: filterCompany, s: setFilterCompany, opts: companyOptions, placeholder: 'すべて (企業)' },
                                    { v: filterOccupation, s: setFilterOccupation, opts: occupationOptions, placeholder: 'すべて (職種)' },
                                    { v: filterBatch, s: setFilterBatch, opts: batchOptions, placeholder: 'すべて (期生)' },
                                    { v: filterVisaStatus, s: setFilterVisaStatus, opts: visaOptions, placeholder: 'すべて (資格)' },
                                ].map(({ v, s, opts, placeholder }, i) => (
                                    <select key={i} value={v} onChange={e => s(e.target.value)}
                                        className="text-xs py-1.5 px-2.5 border border-slate-200 rounded-lg outline-none focus:border-slate-400 bg-white cursor-pointer text-slate-700 font-medium transition-colors hover:border-slate-300">
                                        <option value="すべて" disabled>{placeholder}</option>
                                        {opts.map(o => <option key={o} value={o}>{o === 'すべて' ? placeholder : o}</option>)}
                                    </select>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">並び順</span>
                                <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                                    className="text-xs py-1.5 px-2.5 border border-slate-200 rounded-lg outline-none focus:border-slate-400 bg-white cursor-pointer text-slate-700 font-medium">
                                    {sortOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Bulk Edit Bar ── */}
                    {selectedIds.length > 0 && (
                        <div className="mx-4 md:mx-6 mt-4 bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
                            <div className="text-sm font-black text-slate-700 flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black">🛠 {selectedIds.length} 件選択中</span>
                                <span className="text-[11px] text-slate-400 font-normal">一括変更 — 変更後に選択中すべての行に即時反映</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {/* Basic */}
                                <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                                    <span className="text-[10px] text-slate-500 font-black w-[45px] shrink-0">基本管理</span>
                                    <select onChange={e => handleBulkChange('status', e.target.value)} className={SEL + ' w-[90px]'} defaultValue=""><option value="" disabled>ステータス</option>{STATUS_CARDS.filter(s => s !== 'すべて').map(s => <option key={s} value={s}>{s}</option>)}</select>
                                    <input type="text" placeholder="備考一括上書き..." onBlur={e => handleBulkChange('remarks', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleBulkChange('remarks', e.currentTarget.value) }} className="text-xs py-0.5 px-1.5 border border-slate-200 rounded-lg outline-none text-slate-700 bg-white w-[120px] focus:border-slate-400" />
                                </div>
                                {/* Kentei */}
                                <div className="flex flex-wrap items-center gap-1.5 bg-amber-50 rounded-xl px-3 py-2 border border-amber-200">
                                    <span className="text-[10px] text-amber-600 font-black w-[45px] shrink-0">検定業務</span>
                                    <select onChange={e => handleBulkOperationChange('kentei_status', 'type', e.target.value)} className={SEL + ' w-[80px] focus:ring-amber-300'} defaultValue=""><option value="" disabled>業務</option>{KENTEI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                    <select onChange={e => handleBulkOperationChange('kentei_status', 'assignee', e.target.value)} className={SEL + ' w-[80px] focus:ring-amber-300'} defaultValue=""><option value="" disabled>担当</option>{STAFF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                    <input type="date" onChange={e => handleBulkOperationChange('kentei_status', 'exam_date_written', e.target.value)} className="text-xs py-0.5 px-1.5 border border-slate-200 rounded-lg outline-none text-slate-700 bg-white w-[105px]" />
                                    <input type="date" onChange={e => handleBulkOperationChange('kentei_status', 'exam_date_practical', e.target.value)} className="text-xs py-0.5 px-1.5 border border-slate-200 rounded-lg outline-none text-slate-700 bg-white w-[105px]" />
                                    <select onChange={e => handleBulkOperationChange('kentei_status', 'progress', e.target.value)} className={SEL + ' w-[80px] focus:ring-amber-300'} defaultValue=""><option value="" disabled>進捗</option>{PROGRESS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                </div>
                                {/* Kikou */}
                                <div className="flex flex-wrap items-center gap-1.5 bg-indigo-50 rounded-xl px-3 py-2 border border-indigo-200">
                                    <span className="text-[10px] text-indigo-600 font-black shrink-0 w-[45px] leading-[1.2]">機構 / 建設</span>
                                    <select onChange={e => handleBulkOperationChange('kikou_status', 'type', e.target.value)} className={SEL + ' w-[80px] focus:ring-indigo-300'} defaultValue=""><option value="" disabled>機構業務</option>{KIKOU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                    <select onChange={e => handleBulkOperationChange('kikou_status', 'assignee', e.target.value)} className={SEL + ' w-[80px] focus:ring-indigo-300'} defaultValue=""><option value="" disabled>機構担当</option>{STAFF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                    <select onChange={e => handleBulkOperationChange('kikou_status', 'construction_type', e.target.value)} className={SEL + ' w-[80px] focus:ring-indigo-300'} defaultValue=""><option value="" disabled>建設業務</option>{CONSTRUCTION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                    <select onChange={e => handleBulkOperationChange('kikou_status', 'construction_assignee', e.target.value)} className={SEL + ' w-[80px] focus:ring-indigo-300'} defaultValue=""><option value="" disabled>建担当</option>{STAFF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                    <select onChange={e => handleBulkOperationChange('kikou_status', 'progress', e.target.value)} className={SEL + ' w-[80px] focus:ring-indigo-300'} defaultValue=""><option value="" disabled>進捗</option>{PROGRESS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                </div>
                                {/* Nyukan */}
                                <div className="flex flex-wrap items-center gap-1.5 bg-blue-50 rounded-xl px-3 py-2 border border-blue-200">
                                    <span className="text-[10px] text-blue-600 font-black shrink-0 w-[45px]">入管業務</span>
                                    <select onChange={e => handleBulkOperationChange('nyukan_status', 'type', e.target.value)} className={SEL + ' w-[80px] focus:ring-blue-300'} defaultValue=""><option value="" disabled>業務</option>{NYUKAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                    <select onChange={e => handleBulkOperationChange('nyukan_status', 'assignee', e.target.value)} className={SEL + ' w-[80px] focus:ring-blue-300'} defaultValue=""><option value="" disabled>担当</option>{STAFF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                    <input type="date" onChange={e => handleBulkOperationChange('nyukan_status', 'application_date', e.target.value)} className="text-xs py-0.5 px-1.5 border border-slate-200 rounded-lg outline-none text-slate-700 bg-white w-[110px]" />
                                    <input type="text" placeholder="取次者..." onBlur={e => handleBulkOperationChange('nyukan_status', 'agent', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleBulkOperationChange('nyukan_status', 'agent', e.currentTarget.value) }} className="text-xs py-0.5 px-1.5 border border-slate-200 rounded-lg outline-none text-slate-700 bg-white w-[90px] focus:border-blue-400" />
                                    <input type="text" placeholder="受理番号..." onBlur={e => handleBulkOperationChange('nyukan_status', 'receipt_number', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleBulkOperationChange('nyukan_status', 'receipt_number', e.currentTarget.value) }} className="text-xs py-0.5 px-1.5 border border-slate-200 rounded-lg outline-none text-slate-700 bg-white w-[100px] focus:border-blue-400" />
                                    <select onChange={e => handleBulkOperationChange('nyukan_status', 'progress', e.target.value)} className={SEL + ' w-[80px] focus:ring-blue-300'} defaultValue=""><option value="" disabled>進捗</option>{PROGRESS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════════
                        WORKER LIST
                    ════════════════════════════════════════════════════ */}
                    <div className="flex flex-col gap-6 p-4 md:p-6 pb-10">
                        {paginatedWorkers.length > 0 && (
                            <div className="flex items-center gap-2 px-1">
                                <input type="checkbox" checked={selectedIds.length === workers.length && workers.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-slate-700" />
                                <span className="text-xs font-bold text-slate-500">すべて選択 (Select All)</span>
                            </div>
                        )}

                        {Object.entries(
                            paginatedWorkers.reduce((acc, worker) => {
                                const key = `${worker.company}:::${worker.entryDate || '未定'}`;
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(worker);
                                return acc;
                            }, {} as Record<string, typeof paginatedWorkers>)
                        ).map(([groupKey, group]) => (
                            <div key={groupKey} className="flex flex-col gap-2">

                                {/* ── Group Header ── */}
                                <div className="flex items-center gap-3 px-1 mb-1">
                                    <div className="flex items-center gap-2 border-l-4 border-slate-700 pl-3">
                                        <span className="font-black text-[14px] text-slate-800">{group[0].company}</span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-semibold">
                                        入国日: <span className="text-slate-600 font-bold">{group[0].entryDate || '未定'}</span>
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-semibold ml-auto">
                                        <span className="text-slate-700 font-black">{group.length}</span>名
                                    </span>
                                </div>

                                {/* ── Worker Cards ── */}
                                {group.map((worker) => (
                                    <div key={worker.id}
                                        className={`flex flex-col min-[720px]:flex-row overflow-hidden rounded-2xl shadow-sm transition-all duration-200 border bg-white
                                            ${selectedIds.includes(worker.id)
                                                ? 'border-slate-400 shadow-md ring-1 ring-slate-300'
                                                : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>

                                        {/* Mobile header */}
                                        <div className="flex items-center justify-between min-[720px]:hidden font-bold text-sm text-slate-700 border-b border-slate-100 px-4 py-2 bg-slate-50">
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" checked={selectedIds.includes(worker.id)} onChange={() => toggleSelect(worker.id)} className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-slate-700" />
                                                <span className="text-xs text-slate-500">選択</span>
                                            </div>
                                        </div>


                                        {/* ══════════════════════════════════════════════
                                            AVATAR COLUMN — portrait rectangle, far left
                                        ══════════════════════════════════════════════ */}
                                        <div className="hidden min-[720px]:block w-[96px] shrink-0 self-stretch relative overflow-hidden">
                                            {worker.photoUrl ? (
                                                <img
                                                    src={worker.photoUrl}
                                                    alt={worker.name}
                                                    className="absolute inset-0 w-full h-full object-cover object-top"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 select-none gap-1">
                                                    <span className="text-white font-black text-3xl leading-none tracking-tight">{worker.avatar}</span>
                                                    <span className="text-slate-500 text-[7px] font-black tracking-[0.2em] uppercase">PHOTO</span>
                                                </div>
                                            )}
                                            {/* bottom fade */}
                                            <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
                                        </div>

                                        {/* ──────────────────────────────────────────────
                                            COL 1 — Worker Info (no accent color)
                                        ────────────────────────────────────────────── */}
                                        <div className="flex-[1.3] flex flex-col p-4 min-w-0 bg-white">
                                            {/* ─ Name row ─ */}
                                            <div className="flex items-start gap-2.5">
                                                {/* Avatar circle/image — mobile only */}
                                                <div className="min-[720px]:hidden w-9 h-9 shrink-0 rounded-xl bg-slate-700 border border-slate-600 overflow-hidden flex items-center justify-center shadow-sm">
                                                    {worker.photoUrl ? (
                                                        <img src={worker.photoUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-white font-black text-[13px]">{worker.avatar}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0 min-w-0 flex-1">
                                                    <div className="flex items-baseline gap-2 min-w-0">
                                                        <input type="checkbox" checked={selectedIds.includes(worker.id)} onChange={() => toggleSelect(worker.id)} className="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer accent-slate-700 hidden min-[720px]:block shrink-0" />
                                                        <Link href={`/workers/${worker.id}`} target="_blank" rel="noopener noreferrer"
                                                            className="font-black text-slate-900 hover:text-slate-600 hover:underline truncate text-[14px] leading-tight shrink-0">
                                                            {worker.name}
                                                        </Link>
                                                        {worker.furigana && (
                                                            <span className="text-[10px] text-slate-400 truncate font-medium min-w-0">{worker.furigana}</span>
                                                        )}
                                                    </div>
                                                    {/* ─ Address ─ */}
                                                    {worker.address ? (
                                                        <div className="flex items-start gap-1 mt-1.5 min-w-0">
                                                            <MapPin size={10} className="text-slate-300 shrink-0 mt-[1px]" />
                                                            <span className="text-[10px] text-slate-400 font-medium leading-snug line-clamp-2">{worker.address}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 mt-1.5">
                                                            <MapPin size={10} className="text-slate-200 shrink-0" />
                                                            <span className="text-[10px] text-slate-300 font-medium">社宅未登録</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ─ Memo — pushed to bottom ─ */}
                                            <textarea
                                                className="mt-auto pt-3 w-full text-[11px] border-t border-slate-100 rounded-none outline-none focus:border-t-slate-200 resize-none h-14 bg-transparent placeholder-slate-300 text-slate-500 font-medium transition-all"
                                                placeholder="メモ・備考..."
                                                value={worker.remarks || ''}
                                                onChange={(e) => setWorkers(workers.map(w => w.id === worker.id ? { ...w, remarks: e.target.value } : w))}
                                                onBlur={() => handleRemarksBlur(worker.id)}
                                            />
                                        </div>

                                        {/* ──────────────────────────────────────────────
                                            COL 2 — 在留情報 (blue accent)
                                        ────────────────────────────────────────────── */}
                                        <div className={`flex-1 min-[720px]:flex-none min-[720px]:w-[190px] flex flex-col min-w-0 border-t min-[720px]:border-t-0 min-[720px]:border-l border-slate-100 ${C.zairyu.border}`}>
                                            <div className={`px-3 py-1.5 flex items-center justify-between gap-1.5 border-b ${C.zairyu.divider} bg-slate-50/50`}>
                                                <span className={`text-[11px] font-black uppercase tracking-wider ${C.zairyu.label}`}>在留情報</span>
                                                <select value={worker.status} onChange={e => handleChange(worker.id, 'status', e.target.value)}
                                                    className={`appearance-none text-[10px] px-2 py-0.5 rounded-full font-black outline-none cursor-pointer border ${statusBadgeCls(worker.status)}`}
                                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5'%3E%3Cpath d='M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '0.75em' }}>
                                                    {STATUS_CARDS.filter(s => s !== 'すべて').map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-1 p-3">
                                                {[
                                                    { label: '資格', value: worker.visaStatus },
                                                    { label: '期限', value: worker.visaExpiry },
                                                    { label: '認定', value: `${worker.certStartDate !== '---' ? worker.certStartDate : '---'} 〜 ${worker.certEndDate !== '---' ? worker.certEndDate : '---'}` },
                                                    { label: '職種', value: worker.occupation || '---' },
                                                ].map(({ label, value }) => (
                                                    <div key={label} className="text-[11px] flex justify-between items-start gap-1">
                                                        <span className={`shrink-0 font-bold ${C.zairyu.label}`}>{label}:</span>
                                                        <span className="text-slate-700 font-semibold text-right line-clamp-2 leading-[1.3]">{value}</span>
                                                    </div>
                                                ))}


                                            </div>
                                        </div>

                                        {/* ──────────────────────────────────────────────
                                            COL 3 — 検定業務 (amber accent)
                                        ────────────────────────────────────────────── */}
                                        <div className={`flex-1 flex flex-col min-w-0 border-t min-[720px]:border-t-0 min-[720px]:border-l border-slate-100 ${C.kentei.border}`}>
                                            <div className={`px-3 py-1.5 flex items-center justify-between gap-1.5 border-b ${C.kentei.divider} bg-slate-50/50`}>
                                                <span className={`text-[11px] font-black uppercase tracking-wider ${C.kentei.label}`}>検定業務</span>
                                                <div
                                                    onClick={() => handleOperationChange(worker.id, 'kentei_status', 'progress', cycleProgress(worker.kenteiStatus.progress))}
                                                    className={`text-[9px] px-2 py-0.5 rounded-full font-black cursor-pointer select-none transition-all active:scale-95 ${progressCls(worker.kenteiStatus.progress, 'kentei')}`}>
                                                    {worker.kenteiStatus.progress}
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-2 p-3">
                                                <div className="flex gap-1.5">
                                                    <select value={worker.kenteiStatus.type} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'type', e.target.value)} className={SEL + ' flex-1'}>
                                                        {KENTEI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                    <select value={worker.kenteiStatus.assignee} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'assignee', e.target.value)} className={SEL + ' flex-1'}>
                                                        {STAFF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-1 rounded-lg bg-amber-50/60 border border-amber-100 p-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[9px] font-black rounded px-1 py-px shrink-0 ${C.kentei.subchip}`}>学科</span>
                                                        <input type="date" value={worker.kenteiStatus.exam_date_written || ''} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'exam_date_written', e.target.value)} className="text-[11px] flex-1 bg-transparent outline-none text-slate-700 cursor-pointer font-medium" />
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[9px] font-black rounded px-1 py-px shrink-0 ${C.kentei.subchip}`}>実技</span>
                                                        <input type="date" value={worker.kenteiStatus.exam_date_practical || ''} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'exam_date_practical', e.target.value)} className="text-[11px] flex-1 bg-transparent outline-none text-slate-700 cursor-pointer font-medium" />
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                        {/* ──────────────────────────────────────────────
                                            COL 4 — 機構業務 (violet accent)
                                        ────────────────────────────────────────────── */}
                                        <div className={`flex-1 flex flex-col min-w-0 border-t min-[720px]:border-t-0 min-[720px]:border-l border-slate-100 ${C.kikou.border}`}>
                                            <div className={`px-3 py-1.5 flex items-center justify-between gap-1.5 border-b ${C.kikou.divider} bg-slate-50/50`}>
                                                <span className={`text-[11px] font-black uppercase tracking-wider ${C.kikou.label}`}>機構 / 建設</span>
                                                <div
                                                    onClick={() => handleOperationChange(worker.id, 'kikou_status', 'progress', cycleProgress(worker.kikouStatus.progress))}
                                                    className={`text-[9px] px-2 py-0.5 rounded-full font-black cursor-pointer select-none transition-all active:scale-95 ${progressCls(worker.kikouStatus.progress, 'kikou')}`}>
                                                    {worker.kikouStatus.progress}
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-2 p-3">
                                                <div className="flex gap-1.5">
                                                    <select value={worker.kikouStatus.type} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'type', e.target.value)} className={SEL + ' flex-1'}>
                                                        {KIKOU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                    <select value={worker.kikouStatus.assignee} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'assignee', e.target.value)} className={SEL + ' flex-1'}>
                                                        {STAFF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-1 rounded-lg bg-violet-50/60 border border-violet-100 p-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[9px] font-black rounded px-1 py-px shrink-0 ${C.kikou.subchip}`}>業務</span>
                                                        <select value={worker.kikouStatus.construction_type || '---'} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'construction_type', e.target.value)} className="text-[11px] flex-1 bg-transparent outline-none text-slate-700 cursor-pointer font-medium">
                                                            {CONSTRUCTION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[9px] font-black rounded px-1 py-px shrink-0 ${C.kikou.subchip}`}>担当</span>
                                                        <select value={worker.kikouStatus.construction_assignee || '---'} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'construction_assignee', e.target.value)} className="text-[11px] flex-1 bg-transparent outline-none text-slate-700 cursor-pointer font-medium">
                                                            {STAFF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                        {/* ──────────────────────────────────────────────
                                            COL 5 — 入管業務 (teal accent)
                                        ────────────────────────────────────────────── */}
                                        <div className={`flex-1 flex flex-col min-w-0 border-t min-[720px]:border-t-0 min-[720px]:border-l border-slate-100 ${C.nyukan.border}`}>
                                            <div className={`px-3 py-1.5 flex items-center justify-between gap-1.5 border-b ${C.nyukan.divider} bg-slate-50/50`}>
                                                <span className={`text-[11px] font-black uppercase tracking-wider ${C.nyukan.label}`}>入管業務</span>
                                                <div
                                                    onClick={() => handleOperationChange(worker.id, 'nyukan_status', 'progress', cycleProgress(worker.nyukanStatus.progress))}
                                                    className={`text-[9px] px-2 py-0.5 rounded-full font-black cursor-pointer select-none transition-all active:scale-95 ${progressCls(worker.nyukanStatus.progress, 'nyukan')}`}>
                                                    {worker.nyukanStatus.progress}
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-2 p-3">
                                                <div className="flex gap-1.5">
                                                    <select value={worker.nyukanStatus.type} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'type', e.target.value)} className={SEL + ' flex-1'}>
                                                        {NYUKAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                    <select value={worker.nyukanStatus.assignee} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'assignee', e.target.value)} className={SEL + ' flex-1'}>
                                                        {STAFF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-1.5 rounded-lg bg-blue-50/60 border border-blue-100 p-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[9px] font-black rounded px-1 py-px shrink-0 ${C.nyukan.subchip}`}>申請</span>
                                                        <input type="date" value={worker.nyukanStatus.application_date || ''} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'application_date', e.target.value)} className="text-[11px] flex-1 bg-transparent outline-none text-slate-700 cursor-pointer font-medium" />
                                                        <span className={`text-[9px] font-black rounded px-1 py-px shrink-0 ${C.nyukan.subchip}`}>取次者</span>
                                                        <input type="text" placeholder="---" value={worker.nyukanStatus.agent || ''} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'agent', e.target.value)} className="text-[11px] w-[80px] bg-transparent outline-none text-slate-600 placeholder-slate-300 font-medium" />
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[9px] font-black rounded px-1 py-px shrink-0 ${C.nyukan.subchip}`}>受理番号</span>
                                                        <input type="text" placeholder="---" value={worker.nyukanStatus.receipt_number || ''} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'receipt_number', e.target.value)} className="text-[11px] flex-1 bg-transparent outline-none text-slate-600 placeholder-slate-300 font-medium" />
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        ))}

                        {processedWorkers.length === 0 && (
                            <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
                                データがありません。
                            </div>
                        )}

                        {/* ── Pagination ── */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <div className="text-sm text-slate-400">
                                    全 <span className="font-black text-slate-700">{processedWorkers.length}</span> 件中&nbsp;
                                    <span className="font-black text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> -&nbsp;
                                    <span className="font-black text-slate-700">{Math.min(currentPage * itemsPerPage, processedWorkers.length)}</span> 件を表示
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-slate-50 text-slate-600 bg-white">最初へ</button>
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-slate-50 text-slate-600 bg-white">&lsaquo;</button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                                        .map((p, i, arr) => (
                                            <React.Fragment key={p}>
                                                {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 py-1 flex items-center text-slate-300">...</span>}
                                                <button onClick={() => setCurrentPage(p)}
                                                    className={`px-3 py-1.5 border rounded-lg text-xs font-bold min-w-[32px] transition-all ${currentPage === p ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'}`}>
                                                    {p}
                                                </button>
                                            </React.Fragment>
                                        ))}
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-slate-50 text-slate-600 bg-white">&rsaquo;</button>
                                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-slate-50 text-slate-600 bg-white">最後へ</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'exam' && (
                <div className="w-full min-[720px]:w-[1500px] mx-auto p-6 print-target print:w-full print:mx-0 print:p-0">
                    <ExamTab workers={workers} onUpdate={handleOperationChange} staff={staff} />
                </div>
            )}
        </div>
    )
}
