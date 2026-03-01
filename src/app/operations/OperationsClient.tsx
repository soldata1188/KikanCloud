'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { MapPin, Search, Filter, Pencil, CheckCircle2, Circle, Loader2, Plus, X, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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
const KIKOU_OPTIONS = ['---', '認定申請1号', '認定申請2号', '転籍申請', '軽微変更', '困難届出'];
const CONSTRUCTION_OPTIONS = ['---', 'オンライン申請', '変更届出等'];
const NYUKAN_OPTIONS = ['---', '資格認定', '資格変更', '期間更新', '特定活動', '特定変更', '特定更新', '変更届出'];

type WorkerField = 'status' | 'kentei_status' | 'kikou_status' | 'nyukan_status' | 'remarks' | 'cert_start_date' | 'cert_end_date';

const SYSTEM_TABS = [
    { key: 'ginou_jisshu', label: '技能実習', short: '実習生' },
    { key: 'ikusei', label: '育成就労', short: '育成就労' },
    { key: 'tokuteigino', label: '特定技能', short: '特定技能' },
    { key: 'exam', label: '検定業務', short: '検定業務' },
];

const STATUS_SEG_TABS = [
    { key: 'waiting', label: '未入国', statuses: ['未入国'] },
    { key: 'active', label: '在籍中', statuses: ['対応中', '在籍中'] },
    { key: 'working', label: '処理中', statuses: ['失踪', '帰国', '転籍済'] },
];

const cycleProgress = (current: string) => {
    const idx = PROGRESS_OPTIONS.indexOf(current);
    return PROGRESS_OPTIONS[(idx + 1) % PROGRESS_OPTIONS.length];
};

// ── Badge helpers ────────────────────────────────────────────────
const statusBadgeCls = (s: string) => {
    if (s === '在籍中' || s === '在留中') return 'bg-emerald-50 text-emerald-700 border-emerald-200 uppercase font-bold'
    if (s === '対応中') return 'bg-blue-50 text-[#0067b8] border-blue-200 font-bold'
    if (s === '失踪') return 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
    return 'bg-gray-100 text-gray-500 border-gray-200 font-medium' // 帰国, 転籍済, 未入国
}

// ── Card color by status ──────────────────────────────────────────
const workerCardCls = (s: string) => {
    if (s === '在籍中' || s === '在留中')
        return 'bg-emerald-50/40 border-l-[3px] border-l-emerald-400'
    if (s === '対応中')
        return 'bg-blue-50/40 border-l-[3px] border-l-[#0067b8]'
    if (s === '失踪')
        return 'bg-rose-50/40 border-l-[3px] border-l-rose-400'
    return 'bg-white/20 border-l-[3px] border-l-gray-300' // 帰国, 転籍済, 未入国
}

const progressBadgeCls = (p: string) => {
    if (p === '完了') return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
    if (p === '進行中') return 'bg-blue-50 text-[#0067b8] border-blue-200 font-bold'
    return 'bg-gray-50 text-gray-400 border-gray-200 font-bold'
}

const ProgressIcon = ({ p }: { p: string }) => {
    if (p === '完了') return (
        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 size={12} className="text-white" />
        </div>
    )
    if (p === '進行中') return (
        <div className="w-5 h-5 rounded-full bg-[#0067b8] flex items-center justify-center shrink-0">
            <Loader2 size={12} className="text-white animate-spin" />
        </div>
    )
    return (
        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <Circle size={12} className="text-gray-400" />
        </div>
    )
}

// ── Date helpers ─────────────────────────────────────────────────
const daysUntil = (dateStr: string) => {
    if (!dateStr || dateStr === '---') return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
};

const elapsedTime = (entryDate: string) => {
    if (!entryDate) return null;
    const totalMonths = Math.floor((Date.now() - new Date(entryDate).getTime()) / (30.44 * 86400000));
    const y = Math.floor(totalMonths / 12), m = totalMonths % 12;
    return y > 0 ? `${y}年 ${m}ヶ月` : `${m}ヶ月`;
};

const SEL = "text-[12px] py-1 px-2 outline-none rounded border border-gray-200 text-gray-700 bg-white font-medium cursor-pointer w-full focus:border-[#0067b8] transition-colors"

// ── Pulse Timeline Helper ─────────────────────────────────────────
const PulseMilestone = ({ date, label, color = "bg-[#0067b8]" }: { date: string, label: string, color?: string }) => {
    if (!date || date === '---') return null;
    const now = Date.now();
    const futureLimit = now + (180 * 86400000); // 6 months
    const target = new Date(date).getTime();
    if (target < now || target > futureLimit) return null;

    const percent = ((target - now) / (futureLimit - now)) * 100;
    return (
        <div
            className={`absolute top-0 w-2 h-2 -ml-1 rounded-full border border-white cursor-help hover:scale-125 transition-transform ${color}`}
            style={{ left: `${percent}%` }}
            title={`${label}: ${date}`}
        />
    );
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
            'waiting': '未入国', 'standby': '対応中', 'working': '在籍中', 'missing': '失踪', 'returned': '帰国'
        };
        return {
            id: w.id,
            name: w.full_name_romaji || '名前なし',
            furigana: w.full_name_kana || '---',
            avatar: (w.full_name_romaji || '?').charAt(0).toUpperCase(),
            photoUrl: w.avatar_url || null,
            company: w.companies?.name_jp || '未所属',
            systemType: w.system_type || 'ginou_jisshu',
            occupation: w.industry_field || '---',
            visaStatus: w.visa_status || '---',
            visaExpiry: w.visas?.[0]?.expiration_date || '---',
            entryDate: w.entry_date || '',
            entryBatch: w.entry_batch || '---',
            cert_start_date: w.cert_start_date || '',
            cert_end_date: w.cert_end_date || '',
            remarks: w.remarks || '',
            address: w.address || '',
            status: (reverseStatusMap[w.status] || '未入国'),
            kenteiStatus: (typeof w.kentei_status === 'object' && w.kentei_status
                ? w.kentei_status
                : { type: '---', progress: '未着手', assignee: '---', exam_date_written: '', exam_date_practical: '' }) as OperationData,
            kikouStatus: (typeof w.kikou_status === 'object' && w.kikou_status
                ? w.kikou_status
                : { type: '---', progress: '未着手', assignee: '---', construction_type: '---', construction_assignee: '---', application_date: '' }) as OperationData,
            nyukanStatus: (typeof w.nyukan_status === 'object' && w.nyukan_status
                ? w.nyukan_status
                : { type: '---', progress: '未着手', assignee: '---', application_date: '', agent: '', receipt_number: '' }) as OperationData,
        };
    });

    // ── State ────────────────────────────────────────────────────
    const [workers, setWorkers] = useState(mappedWorkers);
    const [activeSystemTab, setActiveSystemTab] = useState('ginou_jisshu');
    const [activeSubTab, setActiveSubTab] = useState('active');
    const [filterCompany, setFilterCompany] = useState('すべて');
    const [filterOccupation, setFilterOccupation] = useState('すべて');
    const [filterEntryBatch, setFilterEntryBatch] = useState('すべて');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [cmdSearch, setCmdSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<'none' | 'visaExpiry' | 'certEnd' | 'entryDate'>('none');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [batchForm, setBatchForm] = useState<{
        worker_status: string;
        kikou_type: string; kikou_assignee: string; kikou_application_date: string; kikou_progress: string;
        nyukan_type: string; nyukan_assignee: string; nyukan_application_date: string; nyukan_progress: string;
        nyukan_receipt: string; nyukan_agent: string;
        cert_start_date: string; cert_end_date: string;
    }>({
        worker_status: '',
        kikou_type: '', kikou_assignee: '', kikou_application_date: '', kikou_progress: '',
        nyukan_type: '', nyukan_assignee: '', nyukan_application_date: '', nyukan_progress: '',
        nyukan_receipt: '', nyukan_agent: '',
        cert_start_date: '', cert_end_date: '',
    });
    const itemsPerPage = 15;

    const companyOptions = useMemo(() => Array.from(new Set(workers.map(w => w.company))).filter(Boolean), [workers]);
    const occupationOptions = useMemo(() => Array.from(new Set(workers.map(w => w.occupation))).filter(Boolean), [workers]);
    const entryBatchOptions = useMemo(() => Array.from(new Set(workers.map(w => w.entryBatch).filter(Boolean))).sort(), [workers]);

    // ── Filtered workers ─────────────────────────────────────────
    const processedWorkers = useMemo(() => {
        const subTab = STATUS_SEG_TABS.find(t => t.key === activeSubTab)!;
        const sortFn = (a: any, b: any) => {
            if (sortBy === 'none') {
                // デフォルト: 企業名 昇順 → 入国日 昇順
                const companyCmp = (a.company || '').localeCompare(b.company || '', 'ja');
                if (companyCmp !== 0) return companyCmp;
                const ea = a.entryDate || '9999-99-99';
                const eb = b.entryDate || '9999-99-99';
                return ea.localeCompare(eb);
            }
            const key = sortBy === 'visaExpiry' ? 'visaExpiry'
                : sortBy === 'certEnd' ? 'cert_end_date'
                    : 'entryDate';
            const va = a[key] || '9999-99-99';
            const vb = b[key] || '9999-99-99';
            return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        };
        return workers
            .filter(w => {
                if (activeSystemTab === 'exam') return true;
                if (activeSystemTab === 'ginou_jisshu') return !['tokuteigino', 'ikusei'].includes(w.systemType);
                return w.systemType === activeSystemTab;
            })
            .filter(w => subTab.statuses.includes(w.status))
            .filter(w => filterCompany === 'すべて' || w.company === filterCompany)
            .filter(w => filterOccupation === 'すべて' || w.occupation === filterOccupation)
            .filter(w => filterEntryBatch === 'すべて' || w.entryBatch === filterEntryBatch)
            .filter(w => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return w.name.toLowerCase().includes(q) || w.furigana.toLowerCase().includes(q) || w.company.toLowerCase().includes(q);
            })
            .sort(sortFn);
    }, [workers, activeSystemTab, activeSubTab, filterCompany, filterOccupation, filterEntryBatch, searchQuery, sortBy, sortDir]);

    const handleSort = (key: typeof sortBy) => {
        if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(key); setSortDir('asc'); }
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(processedWorkers.length / itemsPerPage);
    const paginatedWorkers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return processedWorkers.slice(start, start + itemsPerPage);
    }, [processedWorkers, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeSystemTab, activeSubTab, filterCompany, filterOccupation, filterEntryBatch, searchQuery, sortBy]);

    // ── Command Palette Listener ─────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsCommandPaletteOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const cmdResults = useMemo(() => {
        if (!cmdSearch) return [];
        const q = cmdSearch.toLowerCase();
        return workers.filter(w =>
            w.name.toLowerCase().includes(q) ||
            w.company.toLowerCase().includes(q) ||
            w.furigana.toLowerCase().includes(q)
        ).slice(0, 8);
    }, [cmdSearch, workers]);

    const countBySubTab = (key: string) => {
        const t = STATUS_SEG_TABS.find(t => t.key === key)!;
        return workers.filter(w => {
            const sys = activeSystemTab === 'exam' ? true :
                activeSystemTab === 'ginou_jisshu' ? !['tokuteigino', 'ikusei'].includes(w.systemType) : w.systemType === activeSystemTab;
            return sys && t.statuses.includes(w.status);
        }).length;
    };

    const countBySystemTab = (key: string) => {
        if (key === 'exam') return workers.length;
        if (key === 'ginou_jisshu') return workers.filter(w => !['tokuteigino', 'ikusei'].includes(w.systemType)).length;
        return workers.filter(w => w.systemType === key).length;
    };

    // ── Handlers ─────────────────────────────────────────────────
    const handleChange = async (id: string, field: WorkerField, value: string) => {
        setWorkers(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
        try { await updateWorkerStatus(id, field, value); } catch { alert('更新エラー'); }
    };

    const handleOperationChange = async (
        id: string,
        field: 'kentei_status' | 'kikou_status' | 'nyukan_status',
        subField: keyof OperationData,
        value: string,
    ) => {
        const worker = workers.find(w => w.id === id);
        if (!worker) return;
        const sf = field === 'kentei_status' ? 'kenteiStatus' : field === 'kikou_status' ? 'kikouStatus' : 'nyukanStatus';
        const newData = { ...worker[sf], [subField]: value };
        setWorkers(prev => prev.map(w => w.id === id ? { ...w, [sf]: newData } : w));
        try { await updateOperationData(id, field, newData); } catch { alert('更新エラー'); }
    };

    const handleRemarksBlur = async (id: string) => {
        const w = workers.find(w => w.id === id);
        if (!w) return;
        try { await updateWorkerStatus(id, 'remarks', w.remarks); } catch { alert('備考の更新に失敗しました'); }
    };

    const toggleSelect = (id: string) =>
        setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const toggleSelectAll = () =>
        setSelectedIds(selectedIds.size === paginatedWorkers.length ? new Set() : new Set(paginatedWorkers.map(w => w.id)));

    const applyBatch = async () => {
        const ids = Array.from(selectedIds);
        for (const id of ids) {
            const worker = workers.find(w => w.id === id);
            if (!worker) continue;
            const updates: Promise<unknown>[] = [];
            // 機構業務
            const newKikou = {
                ...worker.kikouStatus,
                ...(batchForm.kikou_type ? { type: batchForm.kikou_type } : {}),
                ...(batchForm.kikou_assignee ? { assignee: batchForm.kikou_assignee } : {}),
                ...(batchForm.kikou_application_date ? { application_date: batchForm.kikou_application_date } : {}),
                ...(batchForm.kikou_progress ? { progress: batchForm.kikou_progress } : {}),
            };
            // 入管業務
            const newNyukan = {
                ...worker.nyukanStatus,
                ...(batchForm.nyukan_type ? { type: batchForm.nyukan_type } : {}),
                ...(batchForm.nyukan_assignee ? { assignee: batchForm.nyukan_assignee } : {}),
                ...(batchForm.nyukan_application_date ? { application_date: batchForm.nyukan_application_date } : {}),
                ...(batchForm.nyukan_progress ? { progress: batchForm.nyukan_progress } : {}),
                ...(batchForm.nyukan_receipt ? { receipt_number: batchForm.nyukan_receipt } : {}),
                ...(batchForm.nyukan_agent ? { agent: batchForm.nyukan_agent } : {}),
            };
            updates.push(updateOperationData(id, 'kikou_status', newKikou));
            updates.push(updateOperationData(id, 'nyukan_status', newNyukan));
            if (batchForm.cert_start_date) updates.push(updateWorkerStatus(id, 'cert_start_date', batchForm.cert_start_date));
            if (batchForm.cert_end_date) updates.push(updateWorkerStatus(id, 'cert_end_date', batchForm.cert_end_date));
            if (batchForm.worker_status) updates.push(updateWorkerStatus(id, 'status', batchForm.worker_status));
            setWorkers(prev => prev.map(w => w.id === id ? {
                ...w,
                kikouStatus: newKikou,
                nyukanStatus: newNyukan,
                ...(batchForm.cert_start_date ? { cert_start_date: batchForm.cert_start_date } : {}),
                ...(batchForm.cert_end_date ? { cert_end_date: batchForm.cert_end_date } : {}),
                ...(batchForm.worker_status ? { status: batchForm.worker_status } : {}),
            } : w));
            try { await Promise.all(updates); } catch { alert('一括更新エラー'); }
        }
        setSelectedIds(new Set());
        setBatchForm({ worker_status: '', kikou_type: '', kikou_assignee: '', kikou_application_date: '', kikou_progress: '', nyukan_type: '', nyukan_assignee: '', nyukan_application_date: '', nyukan_progress: '', nyukan_receipt: '', nyukan_agent: '', cert_start_date: '', cert_end_date: '' });
    };

    const currentSystemTab = SYSTEM_TABS.find(t => t.key === activeSystemTab);

    // ── Render ───────────────────────────────────────────────────
    return (
        <div className="min-h-full flex flex-col relative">
            {/* ── Micro-Dot Grid overlay ── */}
            <div className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #0067b8 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                    opacity: 0.07,
                }} />
            {/* ══ STICKY HEADER: Responsive wrapping bar ══ */}
            <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-200/70 shadow-sm px-6 min-h-[52px] py-2 flex flex-wrap items-center gap-x-6 gap-y-3">

                {/* Left: System Tabs (pill style) */}
                <div className="flex items-center gap-1 shrink-0">
                    {SYSTEM_TABS.map((tab) => {
                        const isActive = activeSystemTab === tab.key;
                        return (
                            <button key={tab.key}
                                onClick={() => { setActiveSystemTab(tab.key); setActiveSubTab('waiting'); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all whitespace-nowrap
                                    ${isActive ? 'bg-blue-50 text-[#0067b8]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                {tab.label}
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[#0067b8] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {countBySystemTab(tab.key)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="w-px h-5 bg-gray-200 shrink-0" />

                {/* Center: Status sub-tabs + filters + sort + search */}
                <div className="flex flex-wrap items-center gap-3 gap-y-2">
                    {activeSystemTab !== 'exam' && (
                        <div className="flex bg-gray-100 border border-gray-200 rounded-md p-0.5 shrink-0">
                            {STATUS_SEG_TABS.map((tab) => {
                                const isActive = activeSubTab === tab.key;
                                return (
                                    <button key={tab.key} onClick={() => setActiveSubTab(tab.key)}
                                        className={`px-3 py-1 rounded-sm text-[11px] font-black transition-all whitespace-nowrap
                                            ${isActive ? 'bg-white text-[#0067b8] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                        {tab.label}
                                        <span className="ml-1 opacity-60 tabular-nums">{countBySubTab(tab.key)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {activeSystemTab !== 'exam' && (
                        <div className="flex items-center gap-3">
                            <div className="w-px h-5 bg-gray-200 shrink-0" />
                            {/* Search bar stays in the sticky header as it is a primary tool */}
                            <div className="relative shrink-0">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input type="text" placeholder="名前・企業名で検索..."
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[12px] w-[220px] h-8 outline-none focus:bg-white focus:border-[#0067b8] transition-all" />
                            </div>
                        </div>
                    )}
                </div>

            </div>


            {/* ── Exam tab ─────────────────────────────────────── */}
            {activeSystemTab === 'exam' ? (
                <div className="flex-1 p-4">
                    <ExamTab workers={workers} onUpdate={handleOperationChange} staff={staff} />
                </div>
            ) : (
                <div className="flex flex-col flex-1 relative z-10">

                    {/* ── Filter & Sort Bar (Background Area) ── */}
                    {activeSystemTab !== 'exam' && (
                        <div className="max-w-[1440px] mx-auto w-full px-6 pt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
                            {/* Filter Selects */}
                            <div className="flex items-center gap-2">
                                <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
                                    className="text-[12px] border border-gray-200 rounded-md px-3 py-2 bg-white outline-none focus:border-[#0067b8] cursor-pointer shadow-sm transition-all font-bold text-gray-700 hover:border-gray-300">
                                    <option value="すべて">企業: すべて</option>
                                    {companyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select value={filterOccupation} onChange={e => setFilterOccupation(e.target.value)}
                                    className="text-[12px] border border-gray-200 rounded-md px-3 py-2 bg-white outline-none focus:border-[#0067b8] cursor-pointer shadow-sm transition-all font-bold text-gray-700 hover:border-gray-300">
                                    <option value="すべて">職種: すべて</option>
                                    {occupationOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <select value={filterEntryBatch} onChange={e => setFilterEntryBatch(e.target.value)}
                                    className="text-[12px] border border-gray-200 rounded-md px-3 py-2 bg-white outline-none focus:border-[#0067b8] cursor-pointer shadow-sm transition-all font-bold text-gray-700 hover:border-gray-300">
                                    <option value="すべて">入国期生: すべて</option>
                                    {entryBatchOptions.map(b => <option key={String(b)} value={String(b)}>{b}</option>)}
                                </select>
                            </div>

                            <div className="hidden md:block w-px h-6 bg-gray-300/50" />

                            {/* Sort Buttons */}
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mr-1">並び替え:</span>
                                {([
                                    { key: 'visaExpiry', label: '在留期限' },
                                    { key: 'certEnd', label: '修了日' },
                                    { key: 'entryDate', label: '入国日' },
                                ] as const).map(({ key, label }) => {
                                    const isActive = sortBy === key;
                                    const Icon = !isActive ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
                                    return (
                                        <button key={key}
                                            onClick={() => handleSort(key)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold border transition-all shadow-sm
                                                ${isActive
                                                    ? 'bg-[#0067b8] border-[#0067b8] text-white'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                                            <Icon size={13} strokeWidth={isActive ? 3 : 2} />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}


                    {/* ── Select-all + count ── */}
                    <div className="max-w-[1440px] mx-auto w-full flex justify-between items-center px-6 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <label className="flex items-center gap-2 cursor-pointer select-none hover:text-gray-600 transition-colors">
                            <input type="checkbox"
                                checked={paginatedWorkers.length > 0 && paginatedWorkers.every(w => selectedIds.has(w.id))}
                                onChange={toggleSelectAll}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-[#0067b8] focus:ring-[#0067b8]" />
                            すべて選択
                        </label>
                        <span className="tabular-nums">{currentPage} / {totalPages || 1} ページ — {processedWorkers.length}名</span>
                    </div>



                    {/* ════════════════════════════════════════════
                        WORKER ROWS
                    ════════════════════════════════════════════ */}
                    <div className="max-w-[1440px] mx-auto w-full px-4 pb-4 overflow-x-auto">
                        <div className="w-full min-w-[1100px] divide-y divide-gray-300/80 border border-gray-300/80 rounded-md overflow-hidden">
                            {paginatedWorkers.length === 0 && (
                                <div className="bg-white/40 backdrop-blur-sm border border-gray-200/60 rounded-md p-16 text-center text-gray-400 text-sm">
                                    データがありません。
                                </div>
                            )}

                            {paginatedWorkers.map(worker => {
                                const visaDays = daysUntil(worker.visaExpiry);
                                const isSel = selectedIds.has(worker.id);
                                const elapsed = elapsedTime(worker.entryDate);

                                return (
                                    <div key={worker.id}
                                        className={`flex transition-all
                                        ${isSel
                                                ? 'bg-blue-50/20 outline outline-1 outline-[#0067b8]'
                                                : workerCardCls(worker.status)}`}>

                                        {/* ══ COL 1 — Worker Info (380px) ═══════════════ */}
                                        <div className="w-[380px] shrink-0 border-r border-gray-200 p-3 flex gap-3 relative bg-white">
                                            <input type="checkbox" checked={isSel} onChange={() => toggleSelect(worker.id)}
                                                className="mt-1 rounded border-gray-300 text-[#0067b8] cursor-pointer shrink-0 focus:ring-0 w-4 h-4" />

                                            {/* Status badges — top right */}
                                            <div className="absolute top-4 right-4 flex gap-1 flex-wrap justify-end">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusBadgeCls(worker.status)}`}>
                                                    {worker.status}
                                                </span>
                                                {visaDays !== null && visaDays <= 30 && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full border border-red-200">
                                                        期限まで{visaDays}日
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {/* Avatar + name */}
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-100 shrink-0">
                                                        {worker.photoUrl
                                                            ? <img src={worker.photoUrl} alt={worker.name} className="w-full h-full object-cover" />
                                                            : <span className="text-gray-400 font-bold text-[18px]">{worker.avatar}</span>}
                                                    </div>
                                                    {/* ── Enhanced Action Board (Slide-out) ── */}

                                                    <div className="min-w-0 pr-12">
                                                        <div className="text-[10px] text-gray-400 font-medium truncate">{worker.furigana}</div>
                                                        <Link href={`/workers/${worker.id}`} target="_blank" rel="noopener noreferrer"
                                                            className="text-[15px] font-bold text-gray-900 hover:text-[#0067b8] leading-tight block truncate">
                                                            {worker.name}
                                                        </Link>
                                                        <div className="text-[12px] text-[#0067b8] font-semibold truncate mt-0.5">{worker.company}</div>
                                                    </div>
                                                </div>

                                                {/* Key field grid */}
                                                <div className="grid grid-cols-2 gap-y-1">
                                                    <div>
                                                        <span className="text-gray-400 text-[10px]">資格: </span>
                                                        <span className="font-semibold text-gray-700 text-[11px]">{worker.entryBatch !== '---' ? worker.entryBatch : worker.visaStatus}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400 text-[10px]">期限: </span>
                                                        <span className={`font-bold text-[11px] font-mono ${visaDays !== null && visaDays <= 90 ? 'text-red-600' : 'text-gray-700'}`}>
                                                            {worker.visaExpiry !== '---' ? worker.visaExpiry : '---'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400 text-[10px]">入国: </span>
                                                        <span className="font-medium text-gray-600 text-[11px] font-mono">{worker.entryDate || '---'}</span>
                                                    </div>
                                                    {elapsed && (
                                                        <div>
                                                            <span className="text-gray-400 text-[10px]">滞在: </span>
                                                            <span className="text-emerald-600 font-bold text-[11px]">{elapsed}</span>
                                                        </div>
                                                    )}
                                                    {worker.address && (
                                                        <div className="col-span-2 flex items-center gap-1 mt-0.5 text-gray-400">
                                                            <MapPin size={10} className="shrink-0" />
                                                            <span className="truncate text-[10px]">{worker.address}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ══ COL 2 — 機構業務 (260px) ═════════════════ */}
                                        <div className="w-[260px] shrink-0 border-r border-gray-100 p-3 hover:bg-white/20 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <ProgressIcon p={worker.kikouStatus.progress} />
                                                <span className="text-[12px] font-bold text-gray-800">機構業務</span>
                                                <button
                                                    onClick={() => handleOperationChange(worker.id, 'kikou_status', 'progress', cycleProgress(worker.kikouStatus.progress))}
                                                    className={`ml-auto px-2 py-0.5 text-[10px] rounded-full border ${progressBadgeCls(worker.kikouStatus.progress)}`}>
                                                    {worker.kikouStatus.progress}
                                                </button>
                                            </div>
                                            <div className="space-y-1 text-[11px]">
                                                <div className="flex justify-between items-center h-5">
                                                    <span className="text-gray-400 text-[10px]">申請内容:</span>
                                                    {editingId === worker.id ? (
                                                        <select
                                                            value={worker.kikouStatus.type}
                                                            onChange={(e) => handleOperationChange(worker.id, 'kikou_status', 'type', e.target.value)}
                                                            className={SEL + " !w-32"}
                                                        >
                                                            {KIKOU_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className="text-gray-800 font-semibold text-[11px]">{worker.kikouStatus.type}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center h-5">
                                                    <span className="text-gray-400 text-[10px]">申請日:</span>
                                                    {editingId === worker.id ? (
                                                        <input
                                                            type="date"
                                                            value={worker.kikouStatus.application_date || ''}
                                                            onChange={(e) => handleOperationChange(worker.id, 'kikou_status', 'application_date', e.target.value)}
                                                            className={SEL + " !w-32"}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-700 font-medium text-[11px] font-mono">{worker.kikouStatus.application_date || '---'}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center h-5">
                                                    <span className="text-gray-400 text-[10px]">担当者:</span>
                                                    {editingId === worker.id ? (
                                                        <select
                                                            value={worker.kikouStatus.assignee}
                                                            onChange={(e) => handleOperationChange(worker.id, 'kikou_status', 'assignee', e.target.value)}
                                                            className={SEL + " !w-32"}
                                                        >
                                                            {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className="text-gray-700 font-medium text-[11px]">{worker.kikouStatus.assignee}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center h-5">
                                                    <span className="text-gray-400 text-[10px]">認定開始:</span>
                                                    {editingId === worker.id ? (
                                                        <input
                                                            type="date"
                                                            value={worker.cert_start_date}
                                                            onChange={(e) => handleChange(worker.id, 'cert_start_date', e.target.value)}
                                                            className={SEL + " !w-32"}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-700 font-medium text-[11px] font-mono">{worker.cert_start_date || '---'}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center h-5 border-t border-gray-100 pt-0.5">
                                                    <span className="text-gray-400 text-[10px]">認定終了:</span>
                                                    {editingId === worker.id ? (
                                                        <input
                                                            type="date"
                                                            value={worker.cert_end_date}
                                                            onChange={(e) => handleChange(worker.id, 'cert_end_date', e.target.value)}
                                                            className={SEL + " !w-32"}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-700 font-medium text-[11px] font-mono">{worker.cert_end_date || '---'}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ══ COL 3 — 入管業務 (260px) ═════════════════ */}
                                        <div className="w-[260px] shrink-0 border-r border-gray-100 p-3 hover:bg-white/20 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <ProgressIcon p={worker.nyukanStatus.progress} />
                                                <span className="text-[12px] font-bold text-gray-800">入管業務</span>
                                                <button
                                                    onClick={() => handleOperationChange(worker.id, 'nyukan_status', 'progress', cycleProgress(worker.nyukanStatus.progress))}
                                                    className={`ml-auto px-2 py-0.5 text-[10px] rounded-full border ${progressBadgeCls(worker.nyukanStatus.progress)}`}>
                                                    {worker.nyukanStatus.progress}
                                                </button>
                                            </div>
                                            <div className="space-y-1 text-[11px]">
                                                <div className="flex justify-between items-center h-5">
                                                    <span className="text-gray-400 text-[10px]">申請内容:</span>
                                                    {editingId === worker.id ? (
                                                        <select
                                                            value={worker.nyukanStatus.type}
                                                            onChange={(e) => handleOperationChange(worker.id, 'nyukan_status', 'type', e.target.value)}
                                                            className={SEL + " !w-32"}
                                                        >
                                                            {NYUKAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className="text-blue-600 font-semibold text-[11px] underline decoration-blue-200 underline-offset-2">{worker.nyukanStatus.type}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center h-5">
                                                    <span className="text-gray-400 text-[10px]">申請日:</span>
                                                    {editingId === worker.id ? (
                                                        <input
                                                            type="date"
                                                            value={worker.nyukanStatus.application_date || ''}
                                                            onChange={(e) => handleOperationChange(worker.id, 'nyukan_status', 'application_date', e.target.value)}
                                                            className={SEL + " !w-32"}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-700 font-medium text-[11px] font-mono">{worker.nyukanStatus.application_date || '---'}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center h-5">
                                                    <span className="text-gray-400 text-[10px]">担当者:</span>
                                                    {editingId === worker.id ? (
                                                        <select
                                                            value={worker.nyukanStatus.assignee}
                                                            onChange={(e) => handleOperationChange(worker.id, 'nyukan_status', 'assignee', e.target.value)}
                                                            className={SEL + " !w-32"}
                                                        >
                                                            {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className="text-gray-700 font-medium text-[11px]">{worker.nyukanStatus.assignee}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center h-5">
                                                    <span className="text-gray-400 text-[10px]">受理番号:</span>
                                                    {editingId === worker.id ? (
                                                        <input
                                                            type="text"
                                                            value={worker.nyukanStatus.receipt_number || ''}
                                                            onChange={(e) => handleOperationChange(worker.id, 'nyukan_status', 'receipt_number', e.target.value)}
                                                            className={SEL + " !w-32 px-1"}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-800 font-bold font-mono tracking-tight text-[11px]">{worker.nyukanStatus.receipt_number || '---'}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center h-5">
                                                    <span className="text-gray-400 text-[10px]">取次者:</span>
                                                    {editingId === worker.id ? (
                                                        <select
                                                            value={worker.nyukanStatus.agent || '---'}
                                                            onChange={(e) => handleOperationChange(worker.id, 'nyukan_status', 'agent', e.target.value)}
                                                            className={SEL + " !w-32"}
                                                        >
                                                            {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className="text-gray-700 font-medium text-[11px]">{worker.nyukanStatus.agent || '---'}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ══ COL 4 — メモ (flex-1) ═════════════════════ */}
                                        <div className="flex-1 p-3 min-w-[200px]">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">メモ (Memo)</span>
                                                <button
                                                    onClick={() => setEditingId(editingId === worker.id ? null : worker.id)}
                                                    className={`p-1 rounded-full transition-all ${editingId === worker.id ? 'bg-[#0067b8] text-white' : 'text-gray-300 hover:text-[#0067b8]'}`}
                                                >
                                                    {editingId === worker.id ? <CheckCircle2 size={12} /> : <Pencil size={12} />}
                                                </button>
                                            </div>
                                            <textarea
                                                value={worker.remarks}
                                                onChange={(e) => setWorkers(prev => prev.map(w => w.id === worker.id ? { ...w, remarks: e.target.value } : w))}
                                                onBlur={() => handleRemarksBlur(worker.id)}
                                                className="w-full h-24 p-2 text-[12px] bg-white/50 border border-gray-200/70 rounded-md text-gray-700 leading-relaxed outline-none focus:border-[#0067b8] focus:bg-white/80 transition-all resize-none"
                                                placeholder="メモを入力..."
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Pagination UI ── */}
                    {
                        totalPages > 1 && (
                            <div className="max-w-[1440px] mx-auto w-full px-4 pb-12 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-[12px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    前へ
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-7 h-7 flex items-center justify-center rounded-md text-[11px] font-black transition-colors
                                            ${currentPage === p
                                                    ? 'bg-[#0067b8] text-white shadow-sm'
                                                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-[12px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    次へ
                                </button>
                            </div>
                        )
                    }
                </div >
            )}


            {/* ── Infinite Command Palette (Ctrl + K) ── */}
            {
                isCommandPaletteOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-sm bg-gray-900/20">
                        <div className="w-full max-w-2xl bg-white rounded-xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="relative">
                                <Search className="absolute left-5 top-5 text-gray-400" size={20} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="人材名、受入企業、またはコマンドを入力... (例: '田中', '報告書')"
                                    className="w-full pl-14 pr-6 py-5 text-[16px] font-bold text-gray-900 outline-none border-b border-gray-100 placeholder:text-gray-300 placeholder:font-normal"
                                    value={cmdSearch}
                                    onChange={e => setCmdSearch(e.target.value)}
                                />
                            </div>

                            <div className="max-h-[400px] overflow-y-auto p-2 no-scrollbar">
                                {cmdResults.length > 0 ? (
                                    <div className="space-y-1">
                                        <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Search Results</p>
                                        {cmdResults.map(w => (
                                            <Link key={w.id} href={`/workers/${w.id}`}
                                                onClick={() => setIsCommandPaletteOpen(false)}
                                                className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 group transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0067b8] flex items-center justify-center font-black text-[12px] border border-blue-100">
                                                        {w.avatar}
                                                    </div>
                                                    <div>
                                                        <div className="text-[13px] font-bold text-gray-900 group-hover:text-[#0067b8]">{w.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase">{w.company}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 text-[9px] font-black rounded border ${statusBadgeCls(w.status)}`}>{w.status}</span>
                                                    <ChevronRight size={14} className="text-gray-300" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : cmdSearch ? (
                                    <div className="py-12 text-center text-gray-400 text-[13px] font-bold uppercase tracking-widest">No matching records found</div>
                                ) : (
                                    <div className="p-4 space-y-6">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">クイックアクション</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button className="flex items-center gap-3 p-3 rounded-md border border-gray-100 hover:border-[#0067b8] hover:bg-blue-50/50 transition-all text-left">
                                                    <Plus size={16} className="text-[#0067b8]" />
                                                    <span className="text-[12px] font-bold text-gray-700">新規人材登録</span>
                                                </button>
                                                <button className="flex items-center gap-3 p-3 rounded-md border border-gray-100 hover:border-[#0067b8] hover:bg-blue-50/50 transition-all text-left">
                                                    <Loader2 size={16} className="text-[#0067b8]" />
                                                    <span className="text-[12px] font-bold text-gray-700">統合レポート出力</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">最近のコンテキスト</p>
                                            <p className="text-[11px] text-gray-400 italic px-1">入力を開始してデータベースを検索...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-gray-300 rounded font-bold">↑↓</kbd>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase">Navigate</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-gray-300 rounded font-bold">↵</kbd>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase">Select</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-[#0067b8] uppercase tracking-widest">KikanCloud Console</span>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* ════ 一括操作 RIGHT SIDEBAR (Fixed & Top-most) ════ */}
            <div className={`fixed top-0 right-0 h-full z-[800] transition-transform duration-300 ease-in-out ${selectedIds.size > 0 ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ width: '320px' }}>
                <div className="h-full bg-white border-l border-gray-200 flex flex-col shadow-2xl">

                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0067b8] flex items-center justify-center text-[15px] font-black text-white">{selectedIds.size}</div>
                            <div className="text-[15px] font-black text-gray-900 leading-none">一括操作</div>
                        </div>
                        <button onClick={() => setSelectedIds(new Set())}
                            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Fields */}
                    <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto no-scrollbar">

                        {/* Status Select */}
                        <div className="space-y-4">
                            <div>
                                <div className="text-[11px] text-gray-500 font-bold mb-1.5 ml-1 uppercase">進捗更新</div>
                                <select value={batchForm.worker_status} onChange={e => setBatchForm(p => ({ ...p, worker_status: e.target.value }))}
                                    className="w-full text-[13px] rounded-lg bg-gray-50 text-gray-800 border border-gray-200 py-2.5 px-3 outline-none focus:bg-white focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8]/20 transition-all font-bold">
                                    <option value="">変更なし</option>
                                    {['未入国', '対応中', '就業中', '失踪', '帰国', '転籍済'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="h-px bg-gray-100 mx-2" />

                            {[
                                { label: '機構：申請内容', key: 'kikou_type', options: KIKOU_OPTIONS.slice(1) },
                                { label: '機構：進捗', key: 'kikou_progress', options: PROGRESS_OPTIONS },
                                { label: '機構：申請日', key: 'kikou_application_date', type: 'date' },
                                { label: '機構：担当者', key: 'kikou_assignee', options: staff.map(s => s.full_name) },
                                { label: '機構：認定開始', key: 'cert_start_date', type: 'date' },
                                { label: '機構：認定終了', key: 'cert_end_date', type: 'date' },
                            ].map((field) => (
                                <div key={field.key}>
                                    <div className="text-[11px] text-gray-500 font-bold mb-1.5 ml-1 uppercase">{field.label}</div>
                                    {field.type === 'date' ? (
                                        <input type="date" value={(batchForm as any)[field.key]} onChange={e => setBatchForm(p => ({ ...p, [field.key]: e.target.value }))}
                                            className="w-full text-[13px] rounded-lg bg-gray-50 text-gray-800 border border-gray-200 py-2.5 px-3 outline-none focus:bg-white focus:border-[#0067b8] transition-all font-bold" />
                                    ) : (
                                        <select value={(batchForm as any)[field.key]} onChange={e => setBatchForm(p => ({ ...p, [field.key]: e.target.value }))}
                                            className="w-full text-[13px] rounded-lg bg-gray-50 text-gray-800 border border-gray-200 py-2.5 px-3 outline-none focus:bg-white focus:border-[#0067b8] transition-all font-bold">
                                            <option value="">変更なし</option>
                                            {field.options?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    )}
                                </div>
                            ))}

                            <div className="h-px bg-gray-100 mx-2" />

                            {[
                                { label: '入管：申請内容', key: 'nyukan_type', options: NYUKAN_OPTIONS.slice(1) },
                                { label: '入管：進捗', key: 'nyukan_progress', options: PROGRESS_OPTIONS },
                                { label: '入管：申請日', key: 'nyukan_application_date', type: 'date' },
                                { label: '入管：担当者', key: 'nyukan_assignee', options: staff.map(s => s.full_name) },
                                { label: '入管：受理番号', key: 'nyukan_receipt', type: 'text', placeholder: '番号を入力' },
                                { label: '入管：取次者', key: 'nyukan_agent', options: staff.map(s => s.full_name) },
                            ].map((field) => (
                                <div key={field.key}>
                                    <div className="text-[11px] text-gray-500 font-bold mb-1.5 ml-1 uppercase">{field.label}</div>
                                    {field.type === 'date' ? (
                                        <input type="date" value={(batchForm as any)[field.key]} onChange={e => setBatchForm(p => ({ ...p, [field.key]: e.target.value }))}
                                            className="w-full text-[13px] rounded-lg bg-gray-50 text-gray-800 border border-gray-200 py-2.5 px-3 outline-none focus:bg-white focus:border-[#0067b8] transition-all font-bold" />
                                    ) : field.type === 'text' ? (
                                        <input type="text" placeholder={field.placeholder} value={(batchForm as any)[field.key]} onChange={e => setBatchForm(p => ({ ...p, [field.key]: e.target.value }))}
                                            className="w-full text-[13px] rounded-lg bg-gray-50 text-gray-800 border border-gray-200 py-2.5 px-3 outline-none focus:bg-white focus:border-[#0067b8] transition-all font-bold placeholder:font-normal placeholder:text-gray-300" />
                                    ) : (
                                        <select value={(batchForm as any)[field.key]} onChange={e => setBatchForm(p => ({ ...p, [field.key]: e.target.value }))}
                                            className="w-full text-[13px] rounded-lg bg-gray-50 text-gray-800 border border-gray-200 py-2.5 px-3 outline-none focus:bg-white focus:border-[#0067b8] transition-all font-bold">
                                            <option value="">変更なし</option>
                                            {field.options?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Apply Button */}
                    <div className="px-5 py-5 border-t border-gray-100 bg-gray-50/80 backdrop-blur-md shrink-0">
                        <button onClick={applyBatch}
                            className="w-full bg-[#0067b8] text-white py-4 rounded-xl text-[14px] font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
                            <CheckCircle2 size={18} />
                            {selectedIds.size}名に一括適用
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
