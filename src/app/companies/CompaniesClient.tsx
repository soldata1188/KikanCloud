'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { RefreshCw, Search, Building2, Plus, Briefcase, FileText, ArrowLeft, List, Users, ChevronDown } from 'lucide-react';
import { BulkImportModal } from './BulkImportModal';

import IndustryColumn from './IndustryColumn';
import CompanyListColumn from './CompanyListColumn';
import CompanyDetailColumn from './CompanyDetailColumn';
import CompanyDocumentsColumn from './CompanyDocumentsColumn';

interface CompaniesClientProps {
    companies: any[];
    userRole?: string;
}

export function CompaniesClient({ companies: initialCompanies, userRole }: CompaniesClientProps) {
    const [companies, setCompanies] = useState(initialCompanies || []);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('active');

    // Selection states
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    // Mobile view state
    const [mobileView, setMobileView] = useState<'industry' | 'list' | 'detail' | 'docs'>('list');
    const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);

    // Column widths (resizable)
    const [industryWidth, setIndustryWidth] = useState(150);
    const [listWidth, setListWidth] = useState(300);
    const [detailWidth, setDetailWidth] = useState(440);
    const [workerListWidth, setWorkerListWidth] = useState(400);
    const isResizing = useRef(false);

    const startResize = useCallback((col: 'industry' | 'list' | 'detail' | 'workerList', startX: number) => {
        isResizing.current = true;
        const startWidth = col === 'industry' ? industryWidth : col === 'list' ? listWidth : col === 'detail' ? detailWidth : workerListWidth;
        const setter = col === 'industry' ? setIndustryWidth : col === 'list' ? setListWidth : col === 'detail' ? setDetailWidth : setWorkerListWidth;
        const min = col === 'industry' ? 100 : col === 'list' ? 200 : col === 'detail' ? 350 : 300;
        const max = col === 'industry' ? 300 : col === 'list' ? 500 : col === 'detail' ? 1000 : 800;

        const onMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const delta = e.clientX - startX;
            setter(Math.min(max, Math.max(min, startWidth + delta)));
        };
        const onMouseUp = () => {
            isResizing.current = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [industryWidth, listWidth, detailWidth]);

    // ── Data Processing ──
    const mappedCompanies = useMemo(() => {
        return companies.map(c => {
            const allWorkers = c.workers?.filter((w: any) => w.is_deleted === false) || [];
            const activeWorkers = allWorkers.filter((w: any) => w.status === 'working' || w.status === 'processing');
            return {
                ...c,
                employee_count: allWorkers.length,
                active_worker_count: activeWorkers.length,
                industry: c.industry_type || c.industry || '未分類',
            };
        });
    }, [companies]);

    // Derived Industries
    const industries = useMemo(() => {
        const counts: Record<string, number> = {};
        mappedCompanies.forEach(c => {
            const ind = c.industry || '未分類';
            counts[ind] = (counts[ind] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count);
    }, [mappedCompanies]);

    // Apply Filters
    const filteredCompanies = useMemo(() => {
        let result = mappedCompanies;

        // Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.name_jp?.toLowerCase().includes(lower) ||
                c.name_romaji?.toLowerCase().includes(lower) ||
                c.corporate_number?.includes(searchTerm)
            );
        }

        // Industry filter
        if (selectedIndustry) {
            result = result.filter(c => (c.industry || '未分類') === selectedIndustry);
        }

        // Tab filter
        if (activeTab === 'active') {
            result = result.filter(c => c.active_worker_count > 0);
        } else if (activeTab === 'inactive') {
            result = result.filter(c => c.active_worker_count === 0);
        }

        const cleanName = (name: string) => {
            return name.replace(/株式会社|有限会社|合同会社|（株）|\(株\)|（有）|\(有\)|（同）|\(同\)/g, '').trim();
        };

        return result.sort((a, b) => {
            const nameA = cleanName(a.name_jp || '');
            const nameB = cleanName(b.name_jp || '');
            return nameA.localeCompare(nameB, 'ja');
        });
    }, [mappedCompanies, searchTerm, selectedIndustry, activeTab]);

    // Auto-select first company when list changes
    useEffect(() => {
        if (filteredCompanies.length > 0) {
            if (!selectedCompanyId || !filteredCompanies.find(c => c.id === selectedCompanyId)) {
                setSelectedCompanyId(filteredCompanies[0].id);
            }
        } else {
            setSelectedCompanyId(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredCompanies.length, selectedIndustry, activeTab, searchTerm]);

    const selectedCompany = useMemo(() => {
        return mappedCompanies.find(c => c.id === selectedCompanyId) || null;
    }, [mappedCompanies, selectedCompanyId]);

    // Grouped Workers for selection
    const groupedWorkers = useMemo(() => {
        if (!selectedCompany) return {};
        const groups: Record<string, any[]> = {};
        selectedCompany.workers?.forEach((w: any) => {
            if (w.is_deleted) return;
            const status = w.visa_status || 'other';
            if (!groups[status]) groups[status] = [];
            groups[status].push(w);
        });
        return groups;
    }, [selectedCompany]);

    const VISA_LABELS: Record<string, string> = {
        ginou_jisshu: '技能実習',
        ikusei_shuro: '育成就労',
        tokuteigino: '特定技能',
        other: 'その他'
    };

    // Handlers for Drill-down
    const handleSelectIndustry = (industry: string | null) => {
        setSelectedIndustry(industry);
        if (mobileView === 'industry') setMobileView('list');
    };

    const handleSelectCompany = (id: string, event?: React.MouseEvent) => {
        setSelectedCompanyId(id);
        if (mobileView === 'list') setMobileView('detail');
    };

    const handleBack = () => {
        if (mobileView === 'docs') setMobileView('detail');
        else if (mobileView === 'detail') setMobileView('list');
        else if (mobileView === 'list') setMobileView('industry');
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 800);
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden text-gray-900 antialiased selection:bg-blue-100 uppercase tracking-tight">
            {/* 1. Header Desktop (Hidden on Mobile) */}
            <header className="hidden md:flex h-[44px] bg-white border-b border-gray-300 flex items-center justify-between px-4 z-40 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <h2 className="text-[15px] font-normal tracking-tight text-gray-950 border-r border-gray-300 pr-4 shrink-0">
                        企業<span className="text-emerald-600 font-normal">管理</span>
                    </h2>
                    <div className="relative flex-1 max-w-sm group">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="企業名または代表者名で検索..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            suppressHydrationWarning
                            className="w-full h-7 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] font-normal text-gray-900 placeholder:text-gray-500 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsBulkImportModalOpen(true)}
                        className="h-7 px-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-[6px] text-[12px] font-normal flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                    >
                        <List size={13} />
                        <span>一括入力</span>
                    </button>
                    <button
                        onClick={handleRefresh}
                        className={`p-1.5 rounded-[6px] bg-gray-50 text-gray-400 border border-gray-200 transition-all active:scale-95 ${isRefreshing ? 'animate-spin text-blue-600' : 'hover:bg-white hover:text-blue-600'}`}
                    >
                        <RefreshCw size={14} />
                    </button>
                    {(userRole === 'admin' || userRole === 'staff') && (
                        <Link href="/companies/new" className="h-7 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-[6px] text-[12px] font-normal flex items-center gap-1.5 active:scale-95 transition-all shadow-sm">
                            <Plus size={13} />
                            <span>新規登録</span>
                        </Link>
                    )}
                </div>
            </header>

            {/* 2. Content Area */}
            <div className="flex-1 flex overflow-hidden bg-white p-0">
                {/* ── DESKTOP LAYOUT ── */}
                <div className="hidden lg:flex flex-1 border-t border-gray-200 overflow-hidden bg-white">
                    {/* Column 0: Industry */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-300" style={{ width: industryWidth }}>
                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <Briefcase size={16} className="text-gray-400" />
                                <span className="text-[13px] font-normal uppercase tracking-widest text-gray-900">業種区分</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <IndustryColumn
                                industries={industries}
                                selectedIndustry={selectedIndustry}
                                onSelect={handleSelectIndustry}
                            />
                        </div>
                    </div>

                    {/* Resize Handle: Industry | List */}
                    <div
                        className="relative flex-shrink-0 w-[1px] bg-gray-200 group/resize hover:bg-blue-300 transition-colors cursor-col-resize z-10"
                        onMouseDown={(e) => startResize('industry', e.clientX)}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity pointer-events-none">
                            <div className="flex flex-col gap-[3px] py-2 px-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 1: Company List */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-300" style={{ width: listWidth }}>
                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-slate-900">
                                <Building2 size={16} className="text-emerald-400" />
                                <span className="text-[13px] font-normal uppercase tracking-widest text-emerald-700">企業リスト</span>
                            </div>
                            <span className="text-[10px] font-normal bg-gray-50 px-1.5 py-0.5 rounded-[6px] text-slate-600 border border-gray-200 shadow-sm">
                                {filteredCompanies.length}
                            </span>
                        </div>

                        {/* Tabs - Synchronized with Workers style */}
                        <div className="flex border-b border-gray-300 bg-white shrink-0">
                            <button onClick={() => setActiveTab('active')}
                                className={`flex-1 h-[44px] flex items-center justify-center text-[10px] font-normal uppercase tracking-widest transition-all border-b-2
                                ${activeTab === 'active' ? 'bg-slate-900 text-white border-slate-900' : 'text-gray-400 hover:text-gray-600 border-transparent'}`}>
                                受入中
                            </button>
                            <button onClick={() => setActiveTab('inactive')}
                                className={`flex-1 h-[44px] flex items-center justify-center text-[10px] font-normal uppercase tracking-widest transition-all border-b-2
                                ${activeTab === 'inactive' ? 'bg-slate-900 text-white border-slate-900' : 'text-gray-400 hover:text-gray-600 border-transparent'}`}>
                                未受入
                            </button>
                            <button onClick={() => setActiveTab('all')}
                                className={`flex-1 h-[44px] flex items-center justify-center text-[10px] font-normal uppercase tracking-widest transition-all border-b-2
                                ${activeTab === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'text-gray-400 hover:text-gray-600 border-transparent'}`}>
                                すべて
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <CompanyListColumn
                                companies={filteredCompanies}
                                selectedIds={selectedCompanyId ? [selectedCompanyId as string] : []}
                                onSelect={handleSelectCompany}
                            />
                        </div>
                    </div>

                    {/* Resize Handle: List | Detail */}
                    <div
                        className="relative flex-shrink-0 w-[1px] bg-gray-200 group/resize hover:bg-blue-300 transition-colors cursor-col-resize z-10"
                        onMouseDown={(e) => startResize('list', e.clientX)}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity pointer-events-none">
                            <div className="flex flex-col gap-[3px] py-2 px-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Detail */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-300 bg-white" style={{ width: detailWidth }}>
                        <CompanyDetailColumn companies={selectedCompany ? [selectedCompany] : []} />
                    </div>

                    {/* Resize Handle: Detail | Worker List */}
                    <div
                        className="relative flex-shrink-0 w-[1px] bg-gray-200 group/resize hover:bg-blue-300 transition-colors cursor-col-resize z-10"
                        onMouseDown={(e) => startResize('detail', e.clientX)}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity pointer-events-none">
                            <div className="flex flex-col gap-[3px] py-2 px-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 2.5: Worker List (Seamless Design) */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-300 bg-white" style={{ width: workerListWidth }}>
                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-gray-400" />
                                <span className="text-[13px] font-normal uppercase tracking-widest text-gray-900">人材リスト</span>
                            </div>
                            <span className="text-[10px] font-normal bg-gray-50 px-1.5 py-0.5 rounded-[6px] text-slate-600 border border-gray-200 shadow-sm">
                                {selectedCompany?.workers?.filter((w: any) => !w.is_deleted).length || 0}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-6">
                            {Object.keys(groupedWorkers).length > 0 ? (
                                Object.entries(groupedWorkers).map(([status, list]) => (
                                    <div key={status} className="space-y-2">
                                        <div className="flex items-center gap-2 px-2">
                                            <span className="text-[11px] font-normal uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                                {VISA_LABELS[status] || status}
                                            </span>
                                            <div className="flex-1 h-px bg-emerald-100" />
                                            <span className="text-[10px] font-normal text-emerald-600/50">{list.length}</span>
                                        </div>
                                        <div className="grid gap-1">
                                            {list.map(worker => (
                                                <div key={worker.id} className="flex items-center gap-3 p-2 bg-white border-b border-gray-50 hover:bg-slate-50/50 transition-all group">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-normal text-slate-500 overflow-hidden shrink-0 border border-white shadow-sm">
                                                        {worker.avatar_url
                                                            ? <img src={worker.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            : (worker.full_name_romaji || 'U').charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[12px] font-normal text-slate-900 uppercase truncate">
                                                            {worker.full_name_romaji || '---'}
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 truncate uppercase tracking-tighter">
                                                            {worker.full_name_kana || '---'}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <div className="text-[9px] font-mono font-normal text-slate-400">
                                                            {worker.zairyu_exp ? String(worker.zairyu_exp).replace(/-/g, '/') : '---'}
                                                        </div>
                                                        <div className={`text-[9px] font-normal ${worker.status === 'working' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                            {worker.status === 'working' ? '就業中' : '準備中'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 opacity-40">
                                    <Users size={32} className="text-gray-300 mb-2" />
                                    <p className="text-[12px]">該当者なし</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resize Handle: Worker List | Documents */}
                    <div
                        className="relative flex-shrink-0 w-[1px] bg-gray-200 group/resize hover:bg-blue-300 transition-colors cursor-col-resize z-10"
                        onMouseDown={(e) => startResize('workerList', e.clientX)}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity pointer-events-none">
                            <div className="flex flex-col gap-[3px] py-2 px-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Documents (Flexible wide) */}
                    <div className="flex-1 min-w-[320px] flex flex-col overflow-hidden">
                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-gray-400" />
                                <span className="text-[13px] font-normal uppercase tracking-widest text-gray-900 truncate">書類・資料 ({selectedCompany?.name_jp || '未選択'})</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden bg-white">
                            <CompanyDocumentsColumn companyId={selectedCompanyId} />
                        </div>
                    </div>
                </div>

                {/* ── MOBILE LAYOUT (Drill-down) ── */}
                <div className="lg:hidden flex-1 flex flex-col bg-[#F5F5F7] pb-20 overflow-hidden">
                    {/* Headers Mobile */}
                    <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
                        {mobileView !== 'industry' && (
                            <button
                                onClick={handleBack}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <h1 className="text-[15px] font-normal tracking-tight uppercase">
                            {mobileView === 'industry' ? '業種別リスト' : mobileView === 'list' ? (selectedIndustry || 'すべて') : mobileView === 'detail' ? '企業詳細' : '書類管理'}
                        </h1>
                        {mobileView === 'industry' && (
                            <button onClick={handleRefresh} className="ml-auto p-2 text-gray-400">
                                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>
                        )}
                        {mobileView === 'detail' && (
                            <button
                                onClick={() => setMobileView('docs')}
                                className="ml-auto px-3 py-1.5 text-[10px] font-normal bg-blue-50 text-blue-600 rounded flex items-center gap-1.5"
                            >
                                書類 <FileText size={12} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {mobileView === 'industry' && (
                            <div className="absolute inset-0 bg-white overflow-y-auto">
                                <IndustryColumn
                                    industries={industries}
                                    selectedIndustry={selectedIndustry}
                                    onSelect={handleSelectIndustry}
                                />
                            </div>
                        )}
                        {(mobileView === 'list' || (mobileView === 'industry' && selectedIndustry)) && (
                            <div className="absolute inset-0 bg-white flex flex-col">
                                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                                    <div className="flex bg-white rounded-md border border-gray-200 p-[2px]">
                                        <button onClick={() => setActiveTab('active')} className={`flex-1 text-[10px] uppercase font-normal py-1.5 rounded transition-colors ${activeTab === 'active' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-400'}`}>受入中</button>
                                        <button onClick={() => setActiveTab('inactive')} className={`flex-1 text-[10px] uppercase font-normal py-1.5 rounded transition-colors ${activeTab === 'inactive' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-400'}`}>未受入</button>
                                        <button onClick={() => setActiveTab('all')} className={`flex-1 text-[10px] uppercase font-normal py-1.5 rounded transition-colors ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-400'}`}>すべて</button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <CompanyListColumn
                                        companies={filteredCompanies}
                                        selectedIds={selectedCompanyId ? [selectedCompanyId as string] : []}
                                        onSelect={handleSelectCompany}
                                    />
                                </div>
                            </div>
                        )}
                        {mobileView === 'detail' && selectedCompany && (
                            <div className="absolute inset-0 bg-white flex flex-col overflow-y-auto">
                                <CompanyDetailColumn companies={[selectedCompany]} />
                            </div>
                        )}
                        {mobileView === 'docs' && selectedCompanyId && (
                            <div className="absolute inset-0 bg-white flex flex-col overflow-y-auto">
                                <CompanyDocumentsColumn companyId={selectedCompanyId} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isBulkImportModalOpen && (
                <BulkImportModal
                    onClose={() => setIsBulkImportModalOpen(false)}
                    onSuccess={() => setIsBulkImportModalOpen(false)}
                />
            )}
        </div>
    );
}
