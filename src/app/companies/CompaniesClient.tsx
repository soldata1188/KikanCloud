'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Search, Building2, Plus, Briefcase, FileText, ArrowLeft, List } from 'lucide-react';
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
            <header className="hidden md:flex h-[42px] bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <h2 className="text-[14px] font-normal tracking-tight text-gray-950 border-r border-gray-200 pr-4 shrink-0">
                        企業<span className="text-emerald-600">管理</span>
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
                    {/* Column 0: Industry (150px) */}
                    <div className="w-[150px] shrink-0 flex flex-col overflow-hidden border-r border-gray-300">
                        <div className="h-[48px] px-4 border-b border-gray-300 bg-white flex items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <Briefcase size={20} className="text-gray-400" />
                                <span className="text-[15px] font-normal uppercase tracking-widest text-gray-900">業種区分</span>
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

                    {/* Column 1: Company List (300px) */}
                    <div className="w-[300px] shrink-0 flex flex-col overflow-hidden border-r border-gray-300">
                        <div className="h-[48px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-slate-900">
                                <Building2 size={20} className="text-emerald-400" />
                                <span className="text-[15px] font-normal uppercase tracking-widest text-emerald-700">企業リスト</span>
                            </div>
                            <span className="text-[11px] font-normal bg-gray-50 px-1.5 py-0.5 rounded-[6px] text-slate-600 border border-gray-200 shadow-sm">
                                {filteredCompanies.length}
                            </span>
                        </div>

                        {/* Tabs - Synchronized with Workers style */}
                        <div className="flex border-b border-gray-300 bg-white shrink-0">
                            <button onClick={() => setActiveTab('active')}
                                className={`flex-1 h-[48px] flex items-center justify-center text-[10px] font-normal uppercase tracking-widest transition-all border-b-2
                                ${activeTab === 'active' ? 'bg-slate-900 text-white border-slate-900' : 'text-gray-400 hover:text-gray-600 border-transparent'}`}>
                                受入中
                            </button>
                            <button onClick={() => setActiveTab('inactive')}
                                className={`flex-1 h-[48px] flex items-center justify-center text-[10px] font-normal uppercase tracking-widest transition-all border-b-2
                                ${activeTab === 'inactive' ? 'bg-slate-900 text-white border-slate-900' : 'text-gray-400 hover:text-gray-600 border-transparent'}`}>
                                未受入
                            </button>
                            <button onClick={() => setActiveTab('all')}
                                className={`flex-1 h-[48px] flex items-center justify-center text-[10px] font-normal uppercase tracking-widest transition-all border-b-2
                                ${activeTab === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'text-gray-400 hover:text-gray-600 border-transparent'}`}>
                                すべて
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <CompanyListColumn
                                companies={filteredCompanies}
                                selectedIds={selectedCompanyId ? [selectedCompanyId] : []}
                                onSelect={handleSelectCompany}
                            />
                        </div>
                    </div>

                    {/* Column 2: Detail (600px) */}
                    <div className="w-[600px] shrink-0 flex flex-col overflow-hidden border-r border-gray-300 bg-white">
                        <CompanyDetailColumn companies={selectedCompany ? [selectedCompany] : []} />
                    </div>

                    {/* Column 3: Documents (Flexible wide) */}
                    <div className="flex-1 min-w-[320px] flex flex-col overflow-hidden">
                        <div className="h-[48px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <FileText size={20} className="text-gray-400" />
                                <span className="text-[15px] font-normal uppercase tracking-widest text-gray-900 truncate">書類・資料 ({selectedCompany?.name_jp || '未選択'})</span>
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
                                className="ml-auto px-3 py-1.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded flex items-center gap-1.5"
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
                                        <button onClick={() => setActiveTab('active')} className={`flex-1 text-[10px] uppercase font-bold py-1.5 rounded transition-colors ${activeTab === 'active' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-400'}`}>受入中</button>
                                        <button onClick={() => setActiveTab('inactive')} className={`flex-1 text-[10px] uppercase font-bold py-1.5 rounded transition-colors ${activeTab === 'inactive' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-400'}`}>未受入</button>
                                        <button onClick={() => setActiveTab('all')} className={`flex-1 text-[10px] uppercase font-bold py-1.5 rounded transition-colors ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-400'}`}>すべて</button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <CompanyListColumn
                                        companies={filteredCompanies}
                                        selectedIds={selectedCompanyId ? [selectedCompanyId] : []}
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
