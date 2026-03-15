'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Search, Building2, Plus, Briefcase, FileText, ArrowLeft, Users } from 'lucide-react';
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

    // Selection states
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    // Mobile view state
    const [mobileView, setMobileView] = useState<'industry' | 'list' | 'detail' | 'docs'>('list');
    const [mobileTab, setMobileTab] = useState(1); // 0=業種 1=企業 2=詳細 3=書類
    const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);


    // ── Data Processing ──
    const mappedCompanies = useMemo(() => {
        return companies.map(c => {
            const allWorkers = c.workers?.filter((w: any) => w.is_deleted === false) || [];
            const activeWorkers = allWorkers.filter((w: any) => w.status === 'working' || w.status === 'processing');
            return {
                ...c,
                employee_count: allWorkers.length,
                active_worker_count: activeWorkers.length,
                industry: c.industry || '未分類',
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

        const cleanName = (name: string) => {
            return name.replace(/株式会社|有限会社|合同会社|（株）|\(株\)|（有）|\(有\)|（同）|\(同\)/g, '').trim();
        };

        return result.sort((a, b) => {
            const nameA = cleanName(a.name_jp || '');
            const nameB = cleanName(b.name_jp || '');
            return nameA.localeCompare(nameB, 'ja');
        });
    }, [mappedCompanies, searchTerm, selectedIndustry]);

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
    }, [filteredCompanies.length, selectedIndustry, searchTerm]);

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
        setMobileTab(2); // auto-switch to 詳細 tab on mobile
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
            <header className="hidden md:flex h-[44px] bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <h2 className="text-base font-bold tracking-tight text-gray-950 border-r border-gray-300 pr-4 shrink-0">
                        企業<span className="text-emerald-600 font-bold">管理</span>
                    </h2>
                    <div className="relative w-[180px] group">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="名前・企業で検索..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            suppressHydrationWarning
                            className="w-full h-7 pl-7 pr-2 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#0067b8] focus:bg-white transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className={`p-1.5 rounded-lg bg-gray-50 text-gray-400 border border-gray-200 transition-all active:scale-95 ${isRefreshing ? 'animate-spin text-blue-600' : 'hover:bg-white hover:text-blue-600'}`}
                    >
                        <RefreshCw size={14} />
                    </button>
                    {(userRole === 'admin' || userRole === 'staff') && (
                        <Link href="/companies/new" className="btn btn-sm btn-primary">
                            <Plus size={14} />
                            新規登録
                        </Link>
                    )}
                </div>
            </header>

            {/* 2. Content Area */}
            <div className="flex-1 flex overflow-hidden bg-white p-0">
                {/* ── DESKTOP LAYOUT ── */}
                <div className="hidden lg:flex flex-1 items-stretch border-t border-gray-200 overflow-hidden bg-white">
                    {/* Column 0: Industry */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200 w-[150px]">
                        <div className="h-[44px] px-3 border-b border-gray-200 bg-white flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-2 shrink-0">
                                <Briefcase size={18} className="text-gray-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-gray-900">業種</span>
                            </div>
                            <button
                                onClick={() => handleSelectIndustry(null)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight transition-all
                                    ${selectedIndustry === null ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                            >
                                すべて
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <IndustryColumn
                                industries={industries}
                                selectedIndustry={selectedIndustry}
                                onSelect={handleSelectIndustry}
                                hideAll={true}
                            />
                        </div>
                    </div>

                    {/* Column 1: Company List */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200 w-[320px]">
                        <div className="h-[44px] px-3 border-b border-gray-200 bg-white flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-2 shrink-0">
                                <Building2 size={18} className="text-emerald-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-emerald-700">企業リスト</span>
                            </div>
                            <div className="flex-1" />
                            <span className="text-xs font-bold bg-gray-50 px-1.5 py-0.5 rounded-lg text-slate-600 border border-gray-200 shadow-sm shrink-0">
                                {filteredCompanies.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <CompanyListColumn
                                companies={filteredCompanies}
                                selectedIds={selectedCompanyId ? [selectedCompanyId as string] : []}
                                onSelect={handleSelectCompany}
                            />
                        </div>
                    </div>

                    {/* Column 2: Detail */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200 bg-white w-[440px]">
                        <CompanyDetailColumn companies={selectedCompany ? [selectedCompany] : []} />
                    </div>

                    {/* Column 2.5: Worker List */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200 bg-white w-[400px]">
                        <div className="h-[44px] px-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-gray-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-gray-900">人材リスト</span>
                            </div>
                            <span className="text-xs font-bold bg-gray-50 px-1.5 py-0.5 rounded-lg text-slate-600 border border-gray-200 shadow-sm">
                                {selectedCompany?.workers?.filter((w: any) => !w.is_deleted).length || 0}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-6">
                            {Object.keys(groupedWorkers).length > 0 ? (
                                Object.entries(groupedWorkers).map(([status, list]) => (
                                    <div key={status} className="space-y-2">
                                        <div className="flex items-center gap-2 px-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                                {VISA_LABELS[status] || status}
                                            </span>
                                            <div className="flex-1 h-px bg-emerald-100" />
                                            <span className="text-xs font-normal text-emerald-600/50">{list.length}</span>
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
                                                        <div className="text-sm font-bold text-slate-900 uppercase truncate">
                                                            {worker.full_name_romaji || '---'}
                                                        </div>
                                                        <div className="text-xs text-slate-400 truncate uppercase tracking-tighter">
                                                            {worker.full_name_kana || '---'}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <div className="text-xs font-mono font-normal text-slate-400">
                                                            {worker.zairyu_exp ? String(worker.zairyu_exp).replace(/-/g, '/') : '---'}
                                                        </div>
                                                        <div className={`text-xs font-bold ${worker.status === 'working' ? 'text-emerald-500' : 'text-amber-500'}`}>
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
                                    <p className="text-xs font-bold">該当者なし</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 3: Documents (Flexible wide) */}
                    <div className="flex-1 min-w-[320px] flex flex-col overflow-hidden">
                        <div className="h-[44px] px-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <FileText size={18} className="text-gray-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-gray-900 truncate">書類・資料 ({selectedCompany?.name_jp || '未選択'})</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden bg-white">
                            <CompanyDocumentsColumn companyId={selectedCompanyId} />
                        </div>
                    </div>
                </div>

                {/* ── MOBILE LAYOUT (Tab Navigation) ── */}
                <div className="lg:hidden flex-1 flex flex-col overflow-hidden bg-white">
                    {/* Mobile Tab Bar */}
                    <div className="flex border-b border-[var(--color-border)] bg-white flex-shrink-0">
                        {['業種', '企業', '詳細', '書類'].map((tab, i) => (
                            <button key={i}
                                className={`flex-1 py-2.5 text-xs font-medium transition-colors
                                    ${mobileTab === i
                                        ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                                        : 'text-[var(--color-text-muted)]'}`}
                                onClick={() => setMobileTab(i)}
                            >{tab}</button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        {mobileTab === 0 && (
                            <div className="absolute inset-0 bg-white overflow-y-auto">
                                <IndustryColumn
                                    industries={industries}
                                    selectedIndustry={selectedIndustry}
                                    onSelect={(ind) => { handleSelectIndustry(ind); setMobileTab(1); }}
                                />
                            </div>
                        )}
                        {mobileTab === 1 && (
                            <div className="absolute inset-0 bg-white">
                                <CompanyListColumn
                                    companies={filteredCompanies}
                                    selectedIds={selectedCompanyId ? [selectedCompanyId as string] : []}
                                    onSelect={handleSelectCompany}
                                />
                            </div>
                        )}
                        {mobileTab === 2 && (
                            <div className="absolute inset-0 bg-white flex flex-col overflow-y-auto">
                                {selectedCompany ? (
                                    <CompanyDetailColumn companies={[selectedCompany]} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 p-8"
                                        style={{ color: 'var(--color-text-muted)' }}>
                                        <Building2 size={32} opacity={0.3} />
                                        <span className="text-sm">企業を選択してください</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {mobileTab === 3 && (
                            <div className="absolute inset-0 bg-white flex flex-col overflow-y-auto">
                                {selectedCompanyId ? (
                                    <CompanyDocumentsColumn companyId={selectedCompanyId} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 p-8"
                                        style={{ color: 'var(--color-text-muted)' }}>
                                        <FileText size={32} opacity={0.3} />
                                        <span className="text-sm">企業を選択してください</span>
                                    </div>
                                )}
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
