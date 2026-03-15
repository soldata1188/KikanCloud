'use client'

import React, { useState, useMemo, useRef } from 'react';
import { RefreshCw, ArrowLeft, Search, Building2, Users2, Settings2, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import CompanyColumn from './CompanyColumn';
import WorkerColumn from './WorkerColumn';
import OperationColumn from './OperationColumn';
import EntryBatchColumn from '../workers/EntryBatchColumn';
import OperationListItem from './OperationListItem';

interface OperationsClientProps {
    initialWorkers: any[];
    companies: any[];
    staff: any[];
    tenantId: string;
}

export default function OperationsClient({
    initialWorkers,
    companies,
    staff,
    tenantId,
}: OperationsClientProps) {
    const supabase = createClient();

    // --- State ---
    // --- Centralized State ---
    const [workers, setWorkers] = useState(initialWorkers || []);
    const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [viewState, setViewState] = useState<'batches' | 'companies' | 'workers' | 'operations'>('batches');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [mobileTab, setMobileTab] = useState(0); // 0=企業 1=労働者 2=業務

    // Global Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [visaFilter, setVisaFilter] = useState('all');
    const [batchFilter, setBatchFilter] = useState('all');
    const [certFilter, setCertFilter] = useState('all');
    const [workerStatusFilter, setWorkerStatusFilter] = useState('working');

    // Debounce timer refs for DB writes
    const dbWriteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // --- Derived Data ---
    // --- Derived Data (Workers) ---
    const allMappedWorkers = useMemo(() => {
        return (workers || []).map(w => ({
            id: w.id,
            name: w.full_name_romaji || 'Unknown',
            furigana: w.full_name_kana || '',
            company: w.companies?.name_jp || '---',
            companyId: w.company_id,
            visaExpiry: w.zairyu_exp || (w.visas?.[0]?.expiration_date) || w.passport_exp || '---',
            status: w.status === 'working' ? '就業中' : w.status === 'standby' ? '対応中' : w.status === 'waiting' ? '未入国' : 'その他',
            avatar: (w.full_name_romaji || 'U').charAt(0),
            photoUrl: w.avatar_url || null,
            nyukan_status: w.nyukan_status || { type: '---', progress: '未着手', assignee: '---' },
            kikou_status: w.kikou_status || { type: '---', progress: '未着手', assignee: '---' },
            kentei_status: w.kentei_status || { type: '---', progress: '未着手', assignee: '---' },
            system_status: w.system_status || { progress: '未着手', application_date: '', assignee: '---' },
            airport_status: w.airport_status || { progress: '未着手', return_date: '', reentry_date: '', assignee: '---' },
            system_type_content: w.system_type_content || '---',
            systemType: w.system_type,
            visaStatus: w.visa_status || '',
            occupation: w.industry_field || '---',
            rawStatus: w.status,
            remarks: w.remarks || '',
            address: w.japan_residence || '---',
            cert_start_date: w.cert_start_date,
            cert_end_date: w.cert_end_date,
            entryBatch: w.entry_batch || '---',
            entryDate: w.entry_date || '0000-00-00',
            expirationDate: w.zairyu_exp || w.visas?.[0]?.expiration_date || '9999-12-31'
        }));
    }, [workers]);

    // Apply Global Filters to Workers
    const filteredWorkers = useMemo(() => {
        let list = allMappedWorkers;

        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            list = list.filter(w =>
                w.name.toLowerCase().includes(lowSearch) ||
                w.furigana.toLowerCase().includes(lowSearch) ||
                w.company.toLowerCase().includes(lowSearch)
            );
        }

        if (visaFilter !== 'all') list = list.filter(w => w.systemType === visaFilter);
        if (batchFilter !== 'all') list = list.filter(w => w.entryBatch === batchFilter);
        if (certFilter !== 'all') list = list.filter(w => w.cert_end_date?.startsWith(certFilter));

        // 1. Filter by Entry Batch Column (Drill-down)
        if (selectedBatch) {
            list = list.filter(w => w.entryBatch === selectedBatch);
        }

        // 2. Filter by Company Column context
        if (selectedCompanyId) {
            list = list.filter(w => w.companyId === selectedCompanyId);
        }

        // Apply Status Tab Filter
        if (workerStatusFilter !== 'all') {
            list = list.filter(w => w.rawStatus === workerStatusFilter);
        }
        return list.sort((a, b) => {
            // Priority 1: Visa Expiration Date (Earliest first)
            const dateA = a.expirationDate || '9999-12-31';
            const dateB = b.expirationDate || '9999-12-31';
            const dateCompare = dateA.localeCompare(dateB);
            if (dateCompare !== 0) return dateCompare;

            // Priority 2: Company Name (Alphabetical)
            return (a.company || '').localeCompare(b.company || '', 'ja');
        });
    }, [allMappedWorkers, searchTerm, visaFilter, batchFilter, certFilter, selectedCompanyId, selectedBatch, workerStatusFilter]);

    // Derived Batch List
    const batchItems = useMemo(() => {
        const map = new Map<string, { count: number; date: string; minDays: number | null; maxDays: number | null }>();
        const now = Date.now();

        allMappedWorkers.forEach(w => {
            const batch = w.entryBatch || '未設定';
            const date = (w.entryDate && w.entryDate !== '0000-00-00') ? w.entryDate : '';

            let daysLeft: number | null = null;
            if (w.visaExpiry && w.visaExpiry !== '---') {
                daysLeft = Math.ceil((new Date(w.visaExpiry).getTime() - now) / 86400000);
            }

            const existing = map.get(batch);
            if (!existing) {
                map.set(batch, {
                    count: 1,
                    date,
                    minDays: daysLeft,
                    maxDays: daysLeft
                });
            } else {
                existing.count++;
                if (date && (!existing.date || date < existing.date)) existing.date = date;
                if (daysLeft !== null) {
                    if (existing.minDays === null || daysLeft < existing.minDays) existing.minDays = daysLeft;
                    if (existing.maxDays === null || daysLeft > existing.maxDays) existing.maxDays = daysLeft;
                }
            }
        });
        return Array.from(map.entries())
            .map(([label, { count, date, minDays, maxDays }]) => ({ label, count, date, minDays, maxDays }))
            .sort((a, b) => {
                const na = parseInt(a.label.match(/(\d+)/)?.[1] ?? '0', 10);
                const nb = parseInt(b.label.match(/(\d+)/)?.[1] ?? '0', 10);
                if (na !== nb) return nb - na;

                const dateA = a.date || '0000-00-00';
                const dateB = b.date || '0000-00-00';
                if (dateA !== dateB) return dateB.localeCompare(dateA);

                return a.label.localeCompare(b.label, 'ja');
            });
    }, [allMappedWorkers]);

    const totalBatchCount = useMemo(() => batchItems.reduce((sum, b) => sum + b.count, 0), [batchItems]);

    // Derived Companies (Smart Filter: hide companies if they don't match searching workers OR selected batch)
    const filteredCompanies = useMemo(() => {
        let list = companies.map(c => {
            const workersInCompany = allMappedWorkers.filter(w => w.companyId === c.id);
            const now = Date.now();

            let minDays: number | null = null;
            let maxDays: number | null = null;
            const visaTypes = new Set<string>();

            workersInCompany.forEach(w => {
                if (w.visaExpiry && w.visaExpiry !== '---') {
                    const days = Math.ceil((new Date(w.visaExpiry).getTime() - now) / 86400000);
                    if (minDays === null || days < minDays) minDays = days;
                    if (maxDays === null || days > maxDays) maxDays = days;
                }
                if (w.systemType && w.systemType !== '---') {
                    visaTypes.add(w.systemType);
                }
            });

            return {
                ...c,
                worker_count: workersInCompany.length,
                minDays,
                maxDays,
                visaTypes: Array.from(visaTypes)
            };
        });

        // Apply Batch Drill-down Filter
        if (selectedBatch) {
            const companyIdsInBatch = new Set(
                allMappedWorkers
                    .filter(w => w.entryBatch === selectedBatch)
                    .map(w => w.companyId)
            );
            list = list.filter(c => companyIdsInBatch.has(c.id));
        }

        const cleanName = (name: string) => {
            return name.replace(/株式会社|有限会社|合同会社|（株）|\(株\)|（有）|\(有\)|（同）|\(同\)/g, '').trim();
        };

        if (!searchTerm) {
            return list.sort((a, b) => {
                const nameA = cleanName(a.name_jp || '');
                const nameB = cleanName(b.name_jp || '');
                return nameA.localeCompare(nameB, 'ja');
            });
        }

        const lowSearch = searchTerm.toLowerCase();
        const matchingWorkerCompanyIds = new Set(
            allMappedWorkers
                .filter(w => w.name.toLowerCase().includes(lowSearch) || w.furigana.toLowerCase().includes(lowSearch))
                .map(w => w.companyId)
        );

        const result = list.filter(c =>
            c.name_jp.toLowerCase().includes(lowSearch) ||
            matchingWorkerCompanyIds.has(c.id)
        );

        return result.sort((a, b) => {
            const nameA = cleanName(a.name_jp || '');
            const nameB = cleanName(b.name_jp || '');
            return nameA.localeCompare(nameB, 'ja');
        });
    }, [companies, searchTerm, allMappedWorkers, selectedBatch]);

    // Filter Options for Header
    const filterOptions = useMemo(() => {
        const visas = new Set<string>();
        const batches = new Set<string>();
        const certs = new Set<string>();

        allMappedWorkers.forEach(w => {
            if (w.systemType) visas.add(w.systemType);
            if (w.entryBatch && w.entryBatch !== '---') batches.add(w.entryBatch);
            if (w.cert_end_date) certs.add(w.cert_end_date.substring(0, 7)); // YYYY-MM
        });

        return {
            visas: Array.from(visas).sort(),
            batches: Array.from(batches).sort((a, b) => {
                const na = parseInt(a.match(/(\d+)/)?.[1] ?? '0', 10);
                const nb = parseInt(b.match(/(\d+)/)?.[1] ?? '0', 10);
                if (na !== nb) return nb - na;
                return a.localeCompare(b, 'ja');
            }),
            certs: Array.from(certs).sort().reverse()
        };
    }, [allMappedWorkers]);

    const selectedWorkers = useMemo(() => {
        return filteredWorkers.filter(w => selectedWorkerIds.includes(w.id));
    }, [filteredWorkers, selectedWorkerIds]);

    // --- Handlers ---
    const handleSelectBatch = (batch: string | null) => {
        setSelectedBatch(batch);
        setSelectedCompanyId(null);
        setSelectedWorkerIds([]);
        setLastSelectedId(null);
        setViewState('companies');
    };

    const handleSelectCompany = (id: string | null) => {
        setSelectedCompanyId(id);
        setSelectedWorkerIds([]);
        setLastSelectedId(null);
        setViewState('workers');
    };

    const handleSelectWorker = (id: string, event?: React.MouseEvent) => {
        if (!event || (!event.ctrlKey && !event.metaKey && !event.shiftKey)) {
            // Normal click
            setSelectedWorkerIds([id]);
            setLastSelectedId(id);
        } else if (event.shiftKey && lastSelectedId) {
            // Shift click: select range
            const currentIndex = filteredWorkers.findIndex(w => w.id === id);
            const lastIndex = filteredWorkers.findIndex(w => w.id === lastSelectedId);
            const start = Math.min(currentIndex, lastIndex);
            const end = Math.max(currentIndex, lastIndex);
            const rangeIds = filteredWorkers.slice(start, end + 1).map(w => w.id);
            setSelectedWorkerIds(Array.from(new Set([...selectedWorkerIds, ...rangeIds])));
        } else {
            // Ctrl/Meta click: toggle
            setSelectedWorkerIds(prev =>
                prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
            );
            setLastSelectedId(id);
        }
        setViewState('operations');
    };

    const handleBulkUpdate = async (updates: { field: string, subField: string, value: string }[]) => {
        if (selectedWorkerIds.length === 0 || updates.length === 0) return;

        // Optimistic update
        const updatedWorkers = workers.map(w => {
            if (selectedWorkerIds.includes(w.id)) {
                let updatedW = { ...w };
                updates.forEach(({ field, subField, value }) => {
                    if (field === 'direct') {
                        updatedW = { ...updatedW, [subField]: value };
                    } else {
                        const current = updatedW[field] || {};
                        updatedW = { ...updatedW, [field]: { ...current, [subField]: value } };
                    }
                });
                return updatedW;
            }
            return w;
        });
        setWorkers(updatedWorkers);

        // API update
        try {
            const promises = selectedWorkerIds.map(async (id) => {
                const currentWorker = workers.find(w => w.id === id);
                if (!currentWorker) return;

                const updatePayload: any = {};
                updates.forEach(({ field, subField, value }) => {
                    if (field === 'direct') {
                        updatePayload[subField] = value;
                    } else {
                        const currentField = updatePayload[field] || currentWorker[field] || {};
                        updatePayload[field] = { ...currentField, [subField]: value };
                    }
                });

                return supabase
                    .from('workers')
                    .update(updatePayload)
                    .eq('id', id);
            });
            await Promise.all(promises);
        } catch (err) {
            console.error('Bulk save failed:', err);
        }
    };

    const handleUpdateOperation = (field: string, subField: string, value: string) => {
        if (selectedWorkerIds.length === 0) return;

        // Immediate optimistic update
        setWorkers(prev => prev.map(w => {
            if (!selectedWorkerIds.includes(w.id)) return w;
            if (field === 'direct') return { ...w, [subField]: value };
            const current = w[field] || {};
            return { ...w, [field]: { ...current, [subField]: value } };
        }));

        // Debounced DB write (400ms — reduces calls during rapid typing)
        const timerKey = `${field}.${subField}`;
        clearTimeout(dbWriteTimers.current[timerKey]);
        const idsSnapshot = [...selectedWorkerIds];
        dbWriteTimers.current[timerKey] = setTimeout(async () => {
            try {
                await Promise.all(idsSnapshot.map(async (id) => {
                    const updatePayload: any = {};
                    if (field === 'direct') {
                        updatePayload[subField] = value;
                    } else {
                        const currentWorker = workers.find(w => w.id === id);
                        const currentField = currentWorker ? currentWorker[field] || {} : {};
                        updatePayload[field] = { ...currentField, [subField]: value };
                    }
                    return supabase.from('workers').update(updatePayload).eq('id', id);
                }));
            } catch (err) {
                console.error('Debounced update failed:', err);
            }
        }, 400);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        const { data } = await supabase
            .from('workers')
            .select('*, companies(name_jp)')
            .eq('is_deleted', false)
            .eq('tenant_id', tenantId)
            .in('status', ['working', 'standby', 'waiting']);
        if (data) setWorkers(data);
        setTimeout(() => setIsRefreshing(false), 500);
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden text-gray-900 antialiased">
            {/* 1. Unified Global Header */}
            <header className="h-[44px] bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40 shrink-0">
                <div className="flex items-center gap-4 flex-1">

                    {/* Global Search */}
                    <div className="relative w-[180px] group">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="名前・企業で検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            suppressHydrationWarning
                            className="w-full h-7 pl-7 pr-2 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Desktop Filters */}
                    <div className="hidden xl:flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                            <select
                                value={visaFilter}
                                onChange={(e) => setVisaFilter(e.target.value)}
                                suppressHydrationWarning
                                className="bg-transparent text-xs font-normal uppercase text-gray-600 outline-none pr-4 cursor-pointer"
                            >
                                <option value="all">すべての在留資格</option>
                                {filterOptions.visas.map(v => (
                                    <option key={v} value={v}>{v === 'ginou_jisshu' ? '技能実習' : v === 'ikusei_shuro' ? '育成就労' : v === 'tokuteigino' ? '特定技能' : v}</option>
                                ))}
                            </select>
                            <div className="w-px h-3 bg-gray-300" />
                            <select
                                value={batchFilter}
                                onChange={(e) => setBatchFilter(e.target.value)}
                                suppressHydrationWarning
                                className="bg-transparent text-xs font-normal uppercase text-gray-600 outline-none pr-4 cursor-pointer"
                            >
                                <option value="all">すべての期生</option>
                                {filterOptions.batches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <div className="w-px h-3 bg-gray-300" />
                            <select
                                value={certFilter}
                                onChange={(e) => setCertFilter(e.target.value)}
                                suppressHydrationWarning
                                className="bg-transparent text-xs font-normal uppercase text-gray-600 outline-none pr-2 cursor-pointer"
                            >
                                <option value="all">すべての修了月</option>
                                {filterOptions.certs.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className={`p-1.5 rounded-lg bg-gray-50 text-gray-400 border border-gray-200 transition-all active:scale-95 ${isRefreshing ? 'animate-spin text-blue-600' : 'hover:bg-white hover:text-blue-600'}`}
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </header>

            {/* Desktop: Seamless Unified Block Layout */}
            <div className="hidden lg:flex flex-1 items-stretch overflow-x-auto thin-scrollbar border-t border-gray-200 bg-white">

                    {/* Column -1: Entry Batches */}
                    <div className="w-[160px] flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200">
                        <div className="h-[44px] px-3 border-b border-gray-200 bg-white flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-2 shrink-0">
                                <Calendar size={18} className="text-gray-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-gray-900">期生</span>
                            </div>
                            <button
                                onClick={() => handleSelectBatch(null)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight transition-all
                                    ${selectedBatch === null ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                            >
                                すべて
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <EntryBatchColumn
                                batches={batchItems}
                                selectedBatch={selectedBatch}
                                onSelect={handleSelectBatch}
                                hideAll={true}
                            />
                        </div>
                    </div>

                    {/* Column 0: Companies */}
                    <div className="w-[320px] flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200">
                        <div className="h-[44px] px-3 border-b border-gray-200 bg-white flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-2 shrink-0">
                                <Building2 size={18} className="text-blue-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-blue-700">企業リスト</span>
                            </div>
                            <button
                                onClick={() => handleSelectCompany(null)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight transition-all
                                    ${selectedCompanyId === null ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                            >
                                すべて
                            </button>
                            <span className="ml-auto text-xs font-bold bg-white text-blue-700 px-1.5 py-0.5 rounded-lg border border-blue-200 shadow-sm shrink-0">{filteredCompanies.length}</span>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <CompanyColumn
                                companies={filteredCompanies}
                                selectedId={selectedCompanyId}
                                onSelect={handleSelectCompany}
                                hideAll={true}
                            />
                        </div>
                    </div>

                    {/* Column 1: Workers */}
                    <div className="w-[460px] flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200">
                        <div className="h-[44px] px-3 border-b border-gray-200 bg-white flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 text-slate-900 shrink-0">
                                <Users2 size={18} className="text-slate-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-950">労働者リスト</span>
                            </div>
                            <div className="flex items-center gap-1 flex-1">
                                {[
                                    { id: 'all', label: 'すべて' },
                                    { id: 'working', label: '就業中' },
                                    { id: 'standby', label: '対応中' },
                                    { id: 'waiting', label: '未入国' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setWorkerStatusFilter(tab.id)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight transition-all
                                            ${workerStatusFilter === tab.id
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-400 hover:text-gray-700'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <span className="text-xs font-bold bg-white text-slate-500 px-1.5 py-0.5 rounded-lg border border-gray-200 shadow-sm shrink-0">{filteredWorkers.length}</span>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <WorkerColumn
                                workers={filteredWorkers}
                                selectedIds={selectedWorkerIds}
                                onSelect={handleSelectWorker}
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden min-w-[380px]">
                        <div className="h-[44px] px-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-slate-900">
                                <Settings2 size={18} className="text-slate-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-950">業務オペレーション</span>
                            </div>
                            {selectedWorkers.length > 0 && (
                                <span className="text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg shadow-sm">{selectedWorkers.length}名選択</span>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <OperationColumn
                                workers={selectedWorkers}
                                staff={staff}
                                onUpdate={handleUpdateOperation}
                                onBulkUpdate={handleBulkUpdate}
                            />
                        </div>
                    </div>

            </div>

            {/* Mobile: Tab Navigation */}
            <div className="flex lg:hidden flex-1 flex-col overflow-hidden bg-white">
                {/* Mobile Tab Bar */}
                <div className="flex border-b border-[var(--color-border)] bg-white flex-shrink-0">
                    {['企業', '労働者', '業務'].map((tab, i) => (
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
                        <div className="absolute inset-0">
                            <CompanyColumn
                                companies={filteredCompanies}
                                selectedId={selectedCompanyId}
                                onSelect={(id) => { handleSelectCompany(id); setMobileTab(1); }}
                            />
                        </div>
                    )}
                    {mobileTab === 1 && (
                        <div className="absolute inset-0">
                            <WorkerColumn
                                workers={filteredWorkers}
                                selectedIds={selectedWorkerIds}
                                onSelect={(id, e) => { handleSelectWorker(id, e); setMobileTab(2); }}
                            />
                        </div>
                    )}
                    {mobileTab === 2 && (
                        <div className="absolute inset-0">
                            <OperationColumn
                                workers={selectedWorkers}
                                staff={staff}
                                onUpdate={handleUpdateOperation}
                                onBulkUpdate={handleBulkUpdate}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

