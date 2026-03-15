'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Search, RefreshCw, Plus, FileDown,
    X, CalendarPlus, CheckCircle2, CalendarCheck, Clock, Save, ArrowLeft, History
} from 'lucide-react';

import AuditStatusColumn from './AuditStatusColumn';
import AuditCompanyListColumn from './AuditCompanyListColumn';
import AuditScheduleColumn from './AuditScheduleColumn';
import AuditTimelineBoard from './AuditTimelineBoard';
import AuditWorkerListColumn from './AuditWorkerListColumn';
import { createAuditInline } from './actions';

interface AuditsClientProps {
    matrixData: any[];
    filterMonth: string;
    userRole?: string;
    companies?: { id: string; name_jp: string }[];
    defaultPicName?: string;
    staffList?: { id: string; name: string }[];
    allCompletedAudits?: any[];
}

/* ─────────────────────────────────────────────────────────────
   PDF SETTINGS MODAL (Ported from original)
───────────────────────────────────────────────────────────── */
function PdfSettingsModal({ filterMonth, matrixData, onClose }: { filterMonth: string; matrixData: any[]; onClose: () => void }) {
    const picSet = new Set<string>();
    matrixData.forEach(row => {
        Object.values(row.auditsByType || {}).forEach((a: any) => { if (a?.pic_name) picSet.add(a.pic_name); });
    });
    const picOptions = Array.from(picSet).sort((a, b) => a.localeCompare(b, 'ja'));
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['overdue', 'no_data', 'today_due', 'future']);
    const [selectedPic, setSelectedPic] = useState('');
    const toggleStatus = (key: string) => setSelectedStatuses(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
    const targetCount = matrixData.filter(row => {
        const statusOk = selectedStatuses.length === 0 || selectedStatuses.includes(row.kansaStatus || 'no_data');
        const picOk = !selectedPic || Object.values(row.auditsByType || {}).some((a: any) => a?.pic_name === selectedPic);
        return statusOk && picOk;
    }).length;
    const handlePrint = () => {
        const params = new URLSearchParams();
        params.set('month', filterMonth);
        if (selectedStatuses.length > 0 && selectedStatuses.length < 4) params.set('statuses', selectedStatuses.join(','));
        if (selectedPic) params.set('pic', selectedPic);
        window.open(`/audits/print?${params.toString()}`, '_blank');
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden border border-gray-200 flex flex-col">
                <div className="flex items-center justify-between px-6 py-5 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <FileDown size={20} className="text-blue-600" />
                        <h3 className="font-normal text-gray-900 text-[16px] tracking-tight">PDF出力設定</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <span className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-3 pl-1">対象ステータス</span>
                        <div className="grid grid-cols-2 gap-2">
                            {['overdue', 'no_data', 'today_due', 'future'].map(s => {
                                const isOn = selectedStatuses.includes(s);
                                return (
                                    <button key={s} onClick={() => toggleStatus(s)} className={`px-4 py-3 rounded-lg border-2 text-[12px] font-normal transition-all text-left ${isOn ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-400 opacity-60'}`}>
                                        {s === 'overdue' ? '予定超過' : s === 'no_data' ? '予定未作' : s === 'today_due' ? '今月予定' : '次月以降'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2 pl-1">担当者</span>
                        <select value={selectedPic} onChange={e => setSelectedPic(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none text-[13px] font-normal focus:border-[#0067b8] transition-all">
                            <option value="">全担当者</option>
                            {picOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="bg-blue-600/5 rounded-lg p-4 flex items-center justify-between border border-blue-100/50">
                        <span className="text-[11px] font-normal text-blue-600/60 uppercase tracking-widest">選択済み企業数</span>
                        <span className="text-[24px] font-normal text-blue-600">{targetCount}<span className="text-[12px] font-normal ml-1 opacity-60">社</span></span>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/30">
                    <button onClick={onClose} className="flex-1 py-3 text-[13px] font-normal text-gray-500 hover:text-gray-700 transition-colors">キャンセル</button>
                    <button onClick={handlePrint} disabled={targetCount === 0} className="flex-[2] py-3 bg-blue-600 text-white rounded-lg text-[13px] font-normal hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-40 uppercase tracking-widest">レポート出力</button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   ADD SCHEDULE MODAL (Ported from original)
───────────────────────────────────────────────────────────── */
function AddScheduleModal({ companies, defaultPicName, defaultCompanyId, defaultAuditType = 'homon', filterMonth, onClose, onSuccess, staffList = [] }: any) {
    const [status, setStatus] = useState<'planned' | 'completed'>('planned');
    const [isPending, startTransition] = useTransition();
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        startTransition(async () => {
            const result = await createAuditInline(new FormData(e.currentTarget));
            if (!result?.error) onSuccess();
        });
    };
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden border border-gray-200">
                <div className="flex items-center justify-between px-6 py-5 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <CalendarPlus size={20} className="text-blue-600" />
                        <h3 className="font-normal text-gray-900 text-[16px] tracking-tight">新規スケジュールの追加</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                        {(['planned', 'completed'] as const).map(s => (
                            <button key={s} type="button" onClick={() => setStatus(s)} className={`px-4 py-3 rounded-lg border-2 flex items-center gap-3 transition-all ${status === s ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-400 opacity-60'}`}>
                                {s === 'planned' ? <CalendarCheck size={16} /> : <CheckCircle2 size={16} />}
                                <span className="text-[13px] font-normal uppercase">{s === 'planned' ? '予定' : '完了'}</span>
                            </button>
                        ))}
                    </div>
                    <input type="hidden" name="status" value={status} />
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2 pl-1">対象企業</label>
                            <select name="company_id" required defaultValue={defaultCompanyId} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none text-[13px] font-normal focus:border-[#0067b8] appearance-none">
                                <option value="">選択してください</option>
                                {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2 pl-1">種別</label>
                                <select name="audit_type" required defaultValue={defaultAuditType} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none text-[13px] font-normal focus:border-[#0067b8] appearance-none">
                                    <option value="homon">社宅訪問</option>
                                    <option value="kansa">監査訪問</option>
                                    <option value="rinji">臨時対応</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2 pl-1">担当者</label>
                                <select name="pic_name" defaultValue={defaultPicName} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none text-[13px] font-normal focus:border-[#0067b8] appearance-none">
                                    <option value="">— 担当を選択 —</option>
                                    {staffList.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest block mb-2 pl-1">実施予定日</label>
                            <input name="scheduled_date" type="date" required defaultValue={`${filterMonth}-01`} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none text-[13px] font-normal focus:border-[#0067b8]" />
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-[13px] font-normal text-gray-500">キャンセル</button>
                        <button type="submit" disabled={isPending} className="flex-[2] py-3 bg-blue-600 text-white rounded-lg text-[13px] font-normal flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 uppercase tracking-widest">
                            {isPending ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
                            {isPending ? '保存中...' : 'スケジュールを保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export function AuditsClient({ matrixData, filterMonth, userRole, companies = [], defaultPicName = '', staffList = [], allCompletedAudits = [] }: AuditsClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [preAuditData, setPreAuditData] = useState<{ cid: string, type: string }>({ cid: '', type: 'homon' });

    // Filter Logic
    const filtered = useMemo(() => {
        let result = matrixData;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(row => row.company.name_jp?.toLowerCase().includes(lower));
        }
        if (activeTab !== 'all') {
            result = result.filter(row => row.kansaStatus === activeTab);
        }
        const cleanName = (name: string) => {
            return name.replace(/株式会社|有限会社|合同会社|（株）|\(株\)|（有）|\(有\)|（同）|\(同\)/g, '').trim();
        };

        return result.sort((a, b) => {
            const nameA = cleanName(a.company.name_jp || '');
            const nameB = cleanName(b.company.name_jp || '');
            return nameA.localeCompare(nameB, 'ja');
        });
    }, [matrixData, searchTerm, activeTab]);

    // Selection Handling
    useEffect(() => {
        if (selectedCompanyId && !filtered.find(r => r.company.id === selectedCompanyId)) {
            setSelectedCompanyId(null);
        }
    }, [filtered, selectedCompanyId]);

    const selectedRow = useMemo(() => {
        return matrixData.find(r => r.company.id === selectedCompanyId) || null;
    }, [matrixData, selectedCompanyId]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: matrixData.length };
        matrixData.forEach(r => {
            const ks = r.kansaStatus || 'no_data';
            c[ks] = (c[ks] || 0) + 1;
        });
        return c;
    }, [matrixData]);

    // Mobile View State
    const [mobileView, setMobileView] = useState<'status' | 'list' | 'detail'>('status');

    // Handlers for Drill-down
    const handleSelectStatus = (tab: string) => {
        setActiveTab(tab);
        setMobileView('list');
    };

    const handleSelectCompany = (id: string | null) => {
        setSelectedCompanyId(id);
        if (id) setMobileView('detail');
    };

    const handleBack = () => {
        if (mobileView === 'detail') setMobileView('list');
        else if (mobileView === 'list') setMobileView('status');
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setSelectedCompanyId(null);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 800);
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] overflow-hidden text-gray-900 antialiased selection:bg-blue-100">
            {/* 1. Header Desktop (Hidden on Mobile) */}
            <header className="hidden md:flex h-[44px] bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <h2 className="text-[15px] font-normal tracking-tight text-gray-950 border-r border-gray-300 pr-4 shrink-0">
                        監査<span className="text-blue-700 font-normal">訪問</span>
                    </h2>
                    <div className="relative w-[180px] group">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="名前・企業で検索..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            suppressHydrationWarning
                            className="w-full h-7 pl-7 pr-2 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/audits/history"
                        className="h-7 px-3 bg-white border border-gray-300 text-gray-950 hover:border-blue-600 hover:text-blue-700 rounded-lg text-[12px] font-normal flex items-center gap-1.5 active:scale-95 transition-all shadow-sm">
                        <History size={13} /><span>履歴管理</span>
                    </Link>
                    <button
                        onClick={() => setShowPdfModal(true)}
                        className="h-7 px-3 bg-white border border-gray-300 text-gray-950 hover:border-blue-600 hover:text-blue-700 rounded-lg text-[12px] font-normal flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                    >
                        <FileDown size={13} /><span>PDF出力</span>
                    </button>
                    <button onClick={handleRefresh} className={`p-1.5 rounded-lg bg-gray-50 text-gray-400 border border-gray-200 transition-all active:scale-95 ${isRefreshing ? 'animate-spin text-blue-600' : 'hover:bg-white hover:text-blue-600'}`}>
                        <RefreshCw size={14} />
                    </button>
                    {(userRole === 'admin' || userRole === 'staff') && (
                        <button onClick={() => setShowAddModal(true)} className="h-7 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[12px] font-normal flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-blue-100">
                            <Plus size={13} /><span>新規登録</span>
                        </button>
                    )}
                </div>
            </header>

            {/* 2. Content Area */}
            <div className="flex-1 flex overflow-hidden bg-[#f8fafc] p-0">
                {/* ── DESKTOP LAYOUT ── */}
                <div className="hidden lg:flex flex-1 border-t border-gray-200 overflow-hidden bg-[#f8fafc]">
                    {/* Column 1: Status Tabs (260px) */}
                    <div className="w-[260px] shrink-0 border-r border-gray-300 flex flex-col bg-white">
                        <div className="h-[44px] px-4 flex items-center border-b border-gray-300 bg-white shrink-0">
                            <span className="text-[11px] font-normal text-gray-900 uppercase tracking-widest">モニタリングステータス</span>
                        </div>
                       <AuditStatusColumn
                            counts={counts}
                            activeTab={activeTab}
                            onSelect={handleSelectStatus}
                        />
                    </div>

                    {/* Column 2: Company List (260px) */}
                    <div className="w-[260px] shrink-0 border-r border-gray-300 flex flex-col bg-white">
                        <div className="h-[44px] px-4 border-b border-gray-200 bg-white flex items-center shrink-0">
                            <div className="flex items-center justify-between w-full">
                                <span className="text-[11px] font-normal text-slate-900 uppercase tracking-widest">対象企業一覧</span>
                               <div className="flex items-center gap-2">
                                    {selectedCompanyId && (
                                        <button
                                            onClick={() => setSelectedCompanyId(null)}
                                            className="text-[11px] font-normal text-slate-700 hover:text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-gray-300 shadow-sm active:scale-95 transition-all"
                                        >
                                            ボード表示
                                        </button>
                                    )}
                                    <span className="text-[11px] font-normal bg-gray-50 text-slate-600 px-1.5 py-0.5 rounded-lg shadow-sm border border-gray-200">{filtered.length}</span>
                                </div>
                            </div>
                        </div>
                        <AuditCompanyListColumn
                            companies={filtered}
                            selectedId={selectedCompanyId}
                            onSelect={handleSelectCompany}
                        />
                    </div>

                    {/* Column 3: Worker List (260px) - Visible only when selected */}
                    {selectedCompanyId && selectedRow && (
                        <AuditWorkerListColumn
                            workers={selectedRow.activeWorkers || []}
                        />
                    )}

                    {/* Column 4: Monthly Schedule / Audit Timeline Board (Flex-1) */}
                    <div className="flex-1 min-w-[500px] border-r border-gray-200 flex flex-col bg-white overflow-hidden">
                        {selectedCompanyId ? (
                            <AuditScheduleColumn
                                row={selectedRow}
                                filterMonth={filterMonth}
                                staffList={staffList}
                                onSaved={() => router.refresh()}
                                onOpenAddModal={(cid, type) => { setPreAuditData({ cid, type }); setShowAddModal(true); }}
                            />
                        ) : (
                            <AuditTimelineBoard
                                allCompletedAudits={allCompletedAudits}
                                companies={companies}
                                filterMonth={filterMonth}
                                onSelectCompany={setSelectedCompanyId}
                                staffList={staffList}
                            />
                        )}
                    </div>
                </div>

                {/* ── MOBILE LAYOUT (Drill-down) ── */}
                <div className="lg:hidden flex-1 flex flex-col bg-gray-100 pb-20">
                    {/* Headers Mobile */}
                    <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
                        {mobileView !== 'status' && (
                            <button
                                onClick={handleBack}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <h1 className="text-[15px] font-normal tracking-tight">
                            {mobileView === 'status' ? '監査ステータス' : mobileView === 'list' ? `${TAB_CONFIG_LOCAL[activeTab] || '企業一覧'}` : 'スケジュール詳細'}
                        </h1>
                        {mobileView === 'status' && (
                            <button onClick={handleRefresh} className="ml-auto p-2 text-gray-400">
                                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {mobileView === 'status' && (
                            <div className="absolute inset-0 bg-white">
                                <AuditStatusColumn
                                    counts={counts}
                                    activeTab={activeTab}
                                    onSelect={handleSelectStatus}
                                />
                            </div>
                        )}
                        {mobileView === 'list' && (
                            <div className="absolute inset-0 bg-white">
                                <AuditCompanyListColumn
                                    companies={filtered}
                                    selectedId={selectedCompanyId}
                                    onSelect={handleSelectCompany}
                                />
                            </div>
                        )}
                        {mobileView === 'detail' && selectedRow && (
                            <div className="absolute inset-0 bg-white flex flex-col">
                                <div className="flex-1 overflow-y-auto">
                                    <AuditScheduleColumn
                                        row={selectedRow}
                                        filterMonth={filterMonth}
                                        staffList={staffList}
                                        onSaved={() => router.refresh()}
                                        onOpenAddModal={(cid, type) => { setPreAuditData({ cid, type }); setShowAddModal(true); }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddModal && <AddScheduleModal companies={companies} defaultPicName={defaultPicName} defaultCompanyId={preAuditData.cid || selectedCompanyId} defaultAuditType={preAuditData.type} filterMonth={filterMonth} staffList={staffList} onClose={() => { setShowAddModal(false); setPreAuditData({ cid: '', type: 'homon' }); }} onSuccess={() => { setShowAddModal(false); setPreAuditData({ cid: '', type: 'homon' }); router.refresh(); }} />}
            {showPdfModal && <PdfSettingsModal filterMonth={filterMonth} matrixData={matrixData} onClose={() => setShowPdfModal(false)} />}
        </div>
    );
}

const TAB_CONFIG_LOCAL: Record<string, string> = {
    all: 'すべて',
    overdue: '予定超過',
    today_due: '今月予定',
    future: '次月以降',
    no_data: '予定未作'
};
