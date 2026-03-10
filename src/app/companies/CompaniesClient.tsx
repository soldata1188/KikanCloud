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

    // Handlers
    const handleSelectIndustry = (ind: string | null) => {
        setSelectedIndustry(ind);
        if (mobileView === 'industry') setMobileView('list');
    };

    const handleSelectCompany = (id: string) => {
        setSelectedCompanyId(id);
        if (mobileView === 'list') setMobileView('detail');
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Normally we fetch again, here we simulate or skip
        setTimeout(() => setIsRefreshing(false), 500);
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden text-gray-900 antialiased">
            {/* 1. Unified Global Header */}
            <header className="h-[42px] bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <h2 className="text-[14px] font-black tracking-tight text-gray-950 border-r border-gray-200 pr-4 shrink-0">
                        受入<span className="text-blue-700">企業</span>
                    </h2>

                    {/* Global Search */}
                    <div className="relative flex-1 max-w-sm group">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="企業名または法人番号..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-7 pl-9 pr-3 bg-gray-50 border border-gray-300 rounded-[6px] text-[13px] font-semibold text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsBulkImportModalOpen(true)}
                        className="h-7 px-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-[6px] text-[12px] font-black flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
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
                        <Link href="/companies/new" className="h-7 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-[6px] text-[12px] font-black flex items-center gap-1.5 active:scale-95 transition-all shadow-sm">
                            <Plus size={13} />
                            <span>新規登録</span>
                        </Link>
                    )}
                </div>
            </header>

            {/* 2. Desktop: 4-Column Layout */}
            <div className="hidden lg:flex flex-1 overflow-x-auto thin-scrollbar bg-white">
                <div className="flex w-full min-w-max h-full border-t border-gray-200 overflow-hidden bg-white">

                    {/* Column 0: Industry (240px) */}
                    <div className="w-[240px] shrink-0 flex flex-col overflow-hidden border-r border-gray-300">
                        <div className="h-[48px] px-4 border-b border-gray-300 bg-white flex items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <Briefcase size={14} className="text-gray-400" />
                                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-900">業種区分</span>
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

                    {/* Column 1: Company List (320px) */}
                    <div className="w-[320px] shrink-0 flex flex-col overflow-hidden border-r border-gray-300">
                        <div className="h-[48px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-slate-900">
                                <Building2 size={14} className="text-slate-400" />
                                <span className="text-[11px] font-semibold uppercase tracking-widest">企業リスト</span>
                            </div>
                            <span className="text-[11px] font-bold bg-gray-50 px-1.5 py-0.5 rounded-[6px] text-slate-600 border border-gray-200 shadow-sm">
                                {filteredCompanies.length}
                            </span>
                        </div>

                        {/* Tabs - Refined to match Workers/Audits style */}
                        <div className="flex bg-white shrink-0 p-1.5 gap-1.5 border-b border-gray-300">
                            <button onClick={() => setActiveTab('active')} className={`flex-1 h-7 rounded-[4px] text-[11px] font-semibold transition-all ${activeTab === 'active' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>受入中</button>
                            <button onClick={() => setActiveTab('inactive')} className={`flex-1 h-7 rounded-[4px] text-[11px] font-semibold transition-all ${activeTab === 'inactive' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>未受入</button>
                            <button onClick={() => setActiveTab('all')} className={`flex-1 h-7 rounded-[4px] text-[11px] font-semibold transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>すべて</button>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <CompanyListColumn
                                companies={filteredCompanies}
                                selectedIds={selectedCompanyId ? [selectedCompanyId] : []}
                                onSelect={handleSelectCompany}
                            />
                        </div>
                    </div>

                    {/* Column 2: Detail (720px) */}
                    <div className="w-[720px] shrink-0 flex flex-col overflow-hidden border-r border-gray-300 bg-white">
                        <CompanyDetailColumn companies={selectedCompany ? [selectedCompany] : []} />
                    </div>

                    {/* Column 3: Documents (Flexible wide) */}
                    <div className="flex-1 min-w-[320px] flex flex-col overflow-hidden">
                        <div className="h-[48px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <FileText size={14} className="text-gray-400" />
                                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-900 truncate">書類・資料 ({selectedCompany?.name_jp || '未選択'})</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <CompanyDocumentsColumn companyId={selectedCompanyId} />
                        </div>
                    </div>

                </div>
            </div>

            {/* Mobile View with Drill-down */}
            <div className="flex lg:hidden flex-1 flex-col overflow-hidden bg-white">
                <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-20 shrink-0">
                    <div className="flex items-center gap-3">
                        {mobileView !== 'list' && (
                            <button
                                onClick={() => setMobileView(mobileView === 'docs' || mobileView === 'detail' ? 'list' : 'list')}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 active:bg-gray-100"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <h1 className="text-[16px] font-black tracking-tight">
                            {mobileView === 'industry' ? '業種区分' : mobileView === 'list' ? '企業リスト' : mobileView === 'detail' ? '企業詳細' : '書類管理'}
                        </h1>
                    </div>
                    {mobileView === 'detail' && (
                        <button
                            onClick={() => setMobileView('docs')}
                            className="px-3 py-1.5 text-[11px] font-bold bg-slate-100 text-slate-700 rounded flex items-center gap-1.5"
                        >
                            書類へ <FileText size={12} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {mobileView === 'industry' && (
                        <div className="absolute inset-0">
                            <IndustryColumn industries={industries} selectedIndustry={selectedIndustry} onSelect={handleSelectIndustry} />
                        </div>
                    )}
                    {mobileView === 'list' && (
                        <div className="absolute inset-0 flex flex-col">
                            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                                <div className="flex bg-white rounded-md border border-gray-200 p-[2px]">
                                    <button onClick={() => setActiveTab('active')} className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-colors ${activeTab === 'active' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>受入中</button>
                                    <button onClick={() => setActiveTab('inactive')} className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-colors ${activeTab === 'inactive' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>未受入</button>
                                    <button onClick={() => setActiveTab('all')} className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-colors ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>すべて</button>
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
                    {mobileView === 'detail' && (
                        <div className="absolute inset-0">
                            <CompanyDetailColumn companies={selectedCompany ? [selectedCompany] : []} />
                        </div>
                    )}
                    {mobileView === 'docs' && (
                        <div className="absolute inset-0">
                            <CompanyDocumentsColumn companyId={selectedCompanyId} />
                        </div>
                    )}
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
