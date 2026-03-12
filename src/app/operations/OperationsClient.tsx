'use client'

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { RefreshCw, ArrowLeft, Search, Building2, Users2, Settings2, Filter, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import CompanyColumn from './CompanyColumn';
import WorkerColumn from './WorkerColumn';
import OperationColumn from './OperationColumn';
import EntryBatchColumn from '../workers/EntryBatchColumn';
import OperationListItem from './OperationListItem';

interface OperationsClientProps {
    initialWorkers: any[];
    companies: any[];
    initialVisas: any[];
    initialExams: any[];
    initialTransfers: any[];
    staff: any[];
}

export default function OperationsClient({
    initialWorkers,
    companies,
    staff
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

    // Global Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [visaFilter, setVisaFilter] = useState('all');
    const [batchFilter, setBatchFilter] = useState('all');
    const [certFilter, setCertFilter] = useState('all');

    // Column widths (resizable)
    const [companyWidth, setCompanyWidth] = useState(280);
    const [workerWidth, setWorkerWidth] = useState(420);
    const isResizing = useRef(false);

    const startResize = useCallback((col: 'company' | 'worker', startX: number) => {
        isResizing.current = true;
        const startWidth = col === 'company' ? companyWidth : workerWidth;
        const setter = col === 'company' ? setCompanyWidth : setWorkerWidth;
        const min = col === 'company' ? 180 : 200;
        const max = col === 'company' ? 500 : 700;

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
    }, [companyWidth, workerWidth]);

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
            status: w.status === 'working' ? '就業中' : w.status === 'waiting' ? '配属待ち' : 'その他',
            avatar: (w.full_name_romaji || 'U').charAt(0),
            photoUrl: w.avatar_url || null,
            nyukan_status: w.nyukan_status || { type: '---', progress: '未着手', assignee: '---' },
            kikou_status: w.kikou_status || { type: '---', progress: '未着手', assignee: '---' },
            kentei_status: w.kentei_status || { type: '---', progress: '未着手', assignee: '---' },
            system_status: w.system_status || { progress: '未着手', application_date: '', assignee: '---' },
            airport_status: w.airport_status || { progress: '未着手', return_date: '', reentry_date: '', assignee: '---' },
            system_type_content: w.system_type_content || '---',
            systemType: w.system_type,
            occupation: w.industry_field || '---',
            remarks: w.remarks || '',
            address: w.address || '---',
            cert_start_date: w.cert_start_date,
            cert_end_date: w.cert_end_date,
            entryBatch: w.entry_batch || '---',
            entryDate: w.entry_date || '0000-00-00'
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
        return list.sort((a, b) => {
            const ed = (b.entryDate || '0000-00-00').localeCompare(a.entryDate || '0000-00-00');
            if (ed !== 0) return ed;
            return (a.name || '').localeCompare(b.name || '', 'ja');
        });
    }, [allMappedWorkers, searchTerm, visaFilter, batchFilter, certFilter, selectedCompanyId, selectedBatch]);

    // Derived Batch List
    const batchItems = useMemo(() => {
        const map = new Map<string, { count: number; date: string; minDays: number | null; maxDays: number | null }>();
        const now = Date.now();

        allMappedWorkers.forEach(w => {
            const batch = w.entryBatch || '未設定';
            const date = w.cert_start_date || ''; // Using cert_start_date for reference if entry_date missing

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
                const dateA = a.date || '0000-00-00';
                const dateB = b.date || '0000-00-00';
                if (dateA !== dateB) return dateB.localeCompare(dateA);

                const na = parseInt(a.label.match(/(\d+)/)?.[1] ?? '0', 10);
                const nb = parseInt(b.label.match(/(\d+)/)?.[1] ?? '0', 10);
                if (na !== nb) return nb - na;
                return a.label.localeCompare(b.label, 'ja');
            });
    }, [allMappedWorkers]);

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
            batches: Array.from(batches).sort(),
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

    const handleUpdateOperation = async (field: string, subField: string, value: string) => {
        if (selectedWorkerIds.length === 0) return;

        // Optimistic update for all selected ones
        const updatedWorkers = workers.map(w => {
            if (selectedWorkerIds.includes(w.id)) {
                if (field === 'direct') {
                    return { ...w, [subField]: value };
                } else {
                    const current = w[field] || {};
                    return { ...w, [field]: { ...current, [subField]: value } };
                }
            }
            return w;
        });
        setWorkers(updatedWorkers);

        // API update for each
        try {
            const promises = selectedWorkerIds.map(async (id) => {
                const updatePayload: any = {};
                if (field === 'direct') {
                    updatePayload[subField] = value;
                } else {
                    const currentWorker = workers.find(w => w.id === id);
                    const currentField = currentWorker ? currentWorker[field] || {} : {};
                    updatePayload[field] = { ...currentField, [subField]: value };
                }

                return supabase
                    .from('workers')
                    .update(updatePayload)
                    .eq('id', id);
            });

            await Promise.all(promises);
        } catch (err) {
            console.error('Bulk update failed:', err);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        const { data } = await supabase
            .from('workers')
            .select('*, companies(name_jp)')
            .eq('is_deleted', false);
        if (data) setWorkers(data);
        setTimeout(() => setIsRefreshing(false), 500);
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden text-gray-900 antialiased">
            {/* 1. Unified Global Header */}
            <header className="h-[44px] bg-white border-b border-gray-300 flex items-center justify-between px-4 z-40 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <h2 className="text-base font-bold tracking-tight text-gray-950 border-r border-gray-300 pr-4 shrink-0">
                        業務<span className="text-blue-700 font-bold">管理</span>
                    </h2>

                    {/* Global Search */}
                    <div className="relative flex-1 max-w-sm group">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="企業名、労働者名で検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            suppressHydrationWarning
                            className="w-full h-8 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-[6px] text-sm font-normal text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                        />
                    </div>

                    {/* Desktop Filters */}
                    <div className="hidden xl:flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-[6px] border border-gray-200">
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
                        className={`p-1.5 rounded-[6px] bg-gray-50 text-gray-400 border border-gray-200 transition-all active:scale-95 ${isRefreshing ? 'animate-spin text-blue-600' : 'hover:bg-white hover:text-blue-600'}`}
                    >
                        <RefreshCw size={14} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {staff?.[0]?.full_name?.charAt(0) || 'A'}
                    </div>
                </div>
            </header>

            {/* Desktop: Seamless Unified Block Layout */}
            <div className="hidden lg:flex flex-1 overflow-x-auto thin-scrollbar bg-white">
                <div className="flex w-full min-w-max h-full border-t border-gray-200 overflow-hidden bg-white">

                    {/* Column -1: Entry Batches (Fixed 180px) */}
                    <div className="w-[180px] flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-300">
                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-slate-900">
                                <Calendar size={18} className="text-slate-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-950">入国期生</span>
                            </div>
                            <span className="text-xs font-bold bg-white text-slate-500 px-1.5 py-0.5 rounded-[6px] border border-gray-200 shadow-sm">{batchItems.length}</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <EntryBatchColumn
                                batches={batchItems}
                                selectedBatch={selectedBatch}
                                onSelect={handleSelectBatch}
                            />
                        </div>
                    </div>

                    {/* Column 0: Companies */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-300" style={{ width: companyWidth }}>
                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-slate-900">
                                <Building2 size={18} className="text-slate-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-950">企業リスト</span>
                            </div>
                            <span className="text-xs font-bold bg-white text-slate-500 px-1.5 py-0.5 rounded-[6px] border border-gray-200 shadow-sm">{filteredCompanies.length}</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <CompanyColumn
                                companies={filteredCompanies}
                                selectedId={selectedCompanyId}
                                onSelect={handleSelectCompany}
                            />
                        </div>
                    </div>

                    {/* Resize Handle: Company | Worker */}
                    <div
                        className="relative flex-shrink-0 w-[1px] bg-gray-200 group/resize hover:bg-blue-300 transition-colors cursor-col-resize z-10"
                        onMouseDown={(e) => startResize('company', e.clientX)}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity">
                            <div className="flex flex-col gap-[3px] py-2 px-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 1: Workers */}
                    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-300" style={{ width: workerWidth }}>
                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-slate-900">
                                <Users2 size={18} className="text-slate-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-950">労働者リスト</span>
                            </div>
                            <span className="text-xs font-bold bg-white text-slate-500 px-1.5 py-0.5 rounded-[6px] border border-gray-200 shadow-sm">{filteredWorkers.length}</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <WorkerColumn
                                workers={filteredWorkers}
                                selectedIds={selectedWorkerIds}
                                onSelect={handleSelectWorker}
                            />
                        </div>
                    </div>

                    {/* Resize Handle: Worker | Operations */}
                    <div
                        className="relative flex-shrink-0 w-[1px] bg-gray-200 group/resize hover:bg-blue-300 transition-colors cursor-col-resize"
                        onMouseDown={(e) => startResize('worker', e.clientX)}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity">
                            <div className="flex flex-col gap-[3px] py-2 px-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400" />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden min-w-[400px]">
                        <div className="h-[44px] px-4 border-b border-gray-300 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-slate-900">
                                <Settings2 size={18} className="text-slate-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-950">業務オペレーション</span>
                            </div>
                            {selectedWorkers.length > 0 && (
                                <span className="text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded-[6px] shadow-sm">{selectedWorkers.length}名選択</span>
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
            </div>

            {/* Mobile: Drill-down */}
            <div className="flex lg:hidden flex-1 flex-col overflow-hidden bg-white">
                <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        {viewState !== 'batches' && (
                            <button
                                onClick={() => {
                                    if (viewState === 'operations') setViewState('workers');
                                    else if (viewState === 'workers') setViewState('companies');
                                    else if (viewState === 'companies') setViewState('batches');
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 active:bg-gray-100"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <h1 className="text-base font-bold tracking-tight uppercase">
                            {viewState === 'batches' ? '入国期生' : viewState === 'companies' ? '企業選択' : viewState === 'workers' ? '労働者選択' : '業務内容'}
                        </h1>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className={`p-2 text-gray-400 hover:text-blue-600 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {viewState === 'batches' && (
                        <div className="absolute inset-0">
                            <EntryBatchColumn
                                batches={batchItems}
                                selectedBatch={selectedBatch}
                                onSelect={handleSelectBatch}
                            />
                        </div>
                    )}
                    {viewState === 'companies' && (
                        <div className="absolute inset-0">
                            <CompanyColumn
                                companies={filteredCompanies}
                                selectedId={selectedCompanyId}
                                onSelect={handleSelectCompany}
                            />
                        </div>
                    )}
                    {viewState === 'workers' && (
                        <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
                            {filteredWorkers.map(w => (
                                <OperationListItem
                                    key={w.id}
                                    worker={{
                                        id: w.id,
                                        full_name_romaji: w.name,
                                        full_name_kana: w.furigana,
                                        company_name: w.company,
                                        visa_status: w.systemType === 'ginou_jisshu' ? '技能実習' : w.systemType === 'ikusei_shuro' ? '育成就労' : '特定技能',
                                        zairyu_exp: w.visaExpiry,
                                        entry_date: w.entryDate,
                                        address: w.address,
                                        kikou_status: {
                                            progress: w.kikou_status?.progress || '未着手',
                                            type: w.kikou_status?.type || '---',
                                            application_date: w.kikou_status?.application_date || '---',
                                            assignee: w.kikou_status?.assignee || '---'
                                        },
                                        nyukan_status: {
                                            progress: w.nyukan_status?.progress || '未着手',
                                            application_date: w.nyukan_status?.application_date || '---',
                                            receipt_number: w.nyukan_status?.receipt_number || '---'
                                        },
                                        remarks: w.remarks
                                    }}
                                    onEditMemo={(id) => {
                                        setSelectedWorkerIds([id]);
                                        setViewState('operations');
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    {viewState === 'operations' && (
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

