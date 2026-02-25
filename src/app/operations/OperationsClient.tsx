'use client'

import React, { useState } from 'react'
import Link from 'next/link'

import { updateWorkerStatus, updateOperationData } from './actions'
import ExamTab from '@/components/operations/ExamTab'

export interface OperationData {
    type: string;
    progress: string;
    assignee: string;
    note?: string; // Kept for compatibility if they switch back
    // Kentei fields
    exam_date_written?: string;
    exam_date_practical?: string;
    exam_location?: string;
    // Nyukan fields
    application_date?: string;
    receipt_number?: string;
    agent?: string;
    // Kikou / Construction Sub-fields
    construction_type?: string;
    construction_assignee?: string;
}

const PROGRESS_OPTIONS = ['未着手', '進行中', '完了'];

// Helper function to calculate duration from entry date
const calculateDuration = (entryDate: string) => {
    if (!entryDate) return '不明';
    const start = new Date(entryDate);
    const now = new Date();

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();

    if (months < 0) {
        years--;
        months += 12;
    }

    if (years === 0 && months === 0) return '1ヶ月未満';
    if (years === 0) return `${months}ヶ月`;
    return `${years}年 ${months}ヶ月`;
};

const KENTEI_OPTIONS = ['---', '初級', '専門級', '日本語N4', '完了'];
const KIKOU_OPTIONS = ['---', '認定申請', '転籍申請', '軽微変更', '困難届出', '完了'];
const CONSTRUCTION_OPTIONS = ['---', 'オンライン申請', '変更届出等'];
const NYUKAN_OPTIONS = ['---', '在留資格', '資格変更', '期間更新', '特定活動', '特定変更', '特定更新', '届出等', '完了'];
const STAFF_OPTIONS = ['---', 'Yamada', 'Suzuki', 'Nguyen', 'Tran', 'Sato'];

type WorkerField = 'status' | 'kentei_status' | 'kikou_status' | 'nyukan_status';

export default function OperationsClient({
    initialWorkers = [],
    companies = [],
    initialVisas = [],
    initialExams = [],
    initialTransfers = []
}: {
    initialWorkers?: any[],
    companies?: any[],
    initialVisas?: any[],
    initialExams?: any[],
    initialTransfers?: any[]
}) {
    // Map initial data into our UI shape because the DB schema differs slightly 
    // from the mock data format previously used.
    const mappedWorkers = initialWorkers.map(w => {
        const reverseStatusMap: Record<string, string> = {
            'waiting': '入国待ち',
            'standby': '対応中',
            'working': '就業中',
            'missing': '失踪',
            'returned': '帰国'
        };

        return {
            id: w.id,
            name: w.full_name_romaji || '名前なし',
            furigana: w.full_name_kana || '---',
            avatar: (w.full_name_romaji || '?').charAt(0).toUpperCase(),
            company: w.companies?.name_jp || '未所属',
            address: w.address || '---',
            systemCategory: w.system_type === 'tokuteigino' ? '特定技能' : (w.system_type === 'ginou_jisshu' ? '技能実習' : '育成就労'),
            occupation: w.industry_field || '---',
            visaStatus: w.visa_status || '---',
            visaExpiry: w.visas?.[0]?.expiration_date || '---',
            entryDate: w.entry_date || '',
            certStartDate: w.cert_start_date || '---',
            certEndDate: w.cert_end_date || '---',
            applicationDate: '',
            remarks: w.remarks || '',
            status: reverseStatusMap[w.status] || '入国待ち',
            kenteiStatus: (typeof w.kentei_status === 'object' && w.kentei_status ? w.kentei_status : { type: '---', progress: '未着手', assignee: '---', exam_date_written: '', exam_date_practical: '', exam_location: '' }) as OperationData,
            kikouStatus: (typeof w.kikou_status === 'object' && w.kikou_status ? w.kikou_status : { type: '---', progress: '未着手', assignee: '---', construction_type: '---', construction_assignee: '---' }) as OperationData,
            nyukanStatus: (typeof w.nyukan_status === 'object' && w.nyukan_status ? w.nyukan_status : { type: '---', progress: '未着手', assignee: '---', application_date: '', receipt_number: '', agent: '' }) as OperationData
        };
    });

    const [workers, setWorkers] = useState(mappedWorkers);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Filters State
    const DEFAULT_STATUSES = ['入国待ち', '対応中', '就業中'];
    const [activeStatuses, setActiveStatuses] = useState<string[]>(DEFAULT_STATUSES);

    const toggleStatus = (status: string) => {
        if (status === 'すべて') {
            setActiveStatuses(['すべて']);
            return;
        }

        let newStatuses = activeStatuses.filter(s => s !== 'すべて');
        if (newStatuses.includes(status)) {
            newStatuses = newStatuses.filter(s => s !== status);
        } else {
            newStatuses.push(status);
        }

        if (newStatuses.length === 0) {
            setActiveStatuses(DEFAULT_STATUSES);
        } else {
            setActiveStatuses(newStatuses);
        }
    };
    const [filterSystem, setFilterSystem] = useState('すべて');
    const [filterCompany, setFilterCompany] = useState('すべて');
    const [filterOccupation, setFilterOccupation] = useState('すべて');
    const [filterBatch, setFilterBatch] = useState('すべて');
    const [filterVisaStatus, setFilterVisaStatus] = useState('すべて');

    const [sortOrder, setSortOrder] = useState('在留期限(近い順)');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    React.useEffect(() => {
        setCurrentPage(1);
    }, [activeStatuses, filterSystem, filterCompany, filterOccupation, filterBatch, filterVisaStatus, sortOrder]);

    const STATUS_CARDS = ['すべて', '入国待ち', '対応中', '就業中', '失踪', '帰国', '転籍済'];
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
        .filter(w => activeStatuses.includes('すべて') || activeStatuses.includes(w.status))
        .filter(w => filterSystem === 'すべて' || w.systemCategory === filterSystem)
        .filter(w => filterCompany === 'すべて' || w.company === filterCompany)
        .filter(w => filterOccupation === 'すべて' || w.occupation === filterOccupation)
        .filter(w => filterBatch === 'すべて' || getBatchString(w.entryDate) === filterBatch)
        .filter(w => filterVisaStatus === 'すべて' || w.visaStatus === filterVisaStatus)
        .sort((a, b) => {
            if (sortOrder === '在留期限(近い順)' || sortOrder === '登録順' || sortOrder === '名前順（A-Z）') {
                const expA = a.visaExpiry && a.visaExpiry !== '---' ? new Date(a.visaExpiry).getTime() : Infinity;
                const expB = b.visaExpiry && b.visaExpiry !== '---' ? new Date(b.visaExpiry).getTime() : Infinity;
                return expA - expB;
            }
            if (sortOrder === '認定終了日(近い順)') {
                const certA = a.certEndDate && a.certEndDate !== '---' ? new Date(a.certEndDate).getTime() : Infinity;
                const certB = b.certEndDate && b.certEndDate !== '---' ? new Date(b.certEndDate).getTime() : Infinity;
                return certA - certB;
            }
            if (sortOrder === '入国期生(近い順)') {
                const entryA = a.entryDate ? new Date(a.entryDate).getTime() : 0;
                const entryB = b.entryDate ? new Date(b.entryDate).getTime() : 0;
                return entryB - entryA; // Descending: newer (larger timestamp) comes first
            }
            return 0;
        });

    const totalPages = Math.ceil(processedWorkers.length / itemsPerPage);
    const paginatedWorkers = processedWorkers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleChange = async (id: string, field: WorkerField, value: string) => {
        // Optimistic UI Update locally
        setWorkers(workers.map(w => w.id === id ? { ...w, [field]: value } : w));

        // Push update to Supabase
        try {
            await updateWorkerStatus(id, field, value);
        } catch (error) {
            console.error(error);
            alert("更新エラーが発生しました"); // Quick fallback
        }
    };

    const handleOperationChange = async (id: string, field: 'kentei_status' | 'kikou_status' | 'nyukan_status', subField: keyof OperationData, value: string) => {
        const workerIndex = workers.findIndex(w => w.id === id);
        if (workerIndex === -1) return;
        const worker = workers[workerIndex];
        const stateField = field === 'kentei_status' ? 'kenteiStatus' : field === 'kikou_status' ? 'kikouStatus' : 'nyukanStatus';

        const newOpData = { ...worker[stateField], [subField]: value };

        // Optimistic update
        setWorkers(prev => prev.map(w => w.id === id ? { ...w, [stateField]: newOpData } : w));

        try {
            await updateOperationData(id, field, newOpData);
        } catch (error) {
            console.error(error);
            alert("更新エラーが発生しました"); // Quick fallback
        }
    };

    const handleRemarksBlur = async (id: string) => {
        const worker = workers.find(w => w.id === id);
        if (!worker) return;
        try {
            await updateWorkerStatus(id, 'remarks', worker.remarks);
        } catch (error) {
            console.error(error);
            alert("備考の更新に失敗しました");
        }
    };

    const handleBulkChange = async (field: WorkerField | 'remarks', value: string) => {
        // Optimistic bulk UI update locally
        setWorkers(workers.map(w => selectedIds.includes(w.id) ? { ...w, [field]: value } : w));

        try {
            for (const id of selectedIds) {
                await updateWorkerStatus(id, field, value);
            }
        } catch (error) {
            console.error(error);
            alert("一部の更新に失敗しました。ページをリロードしてください。");
        }
    };

    const handleBulkOperationChange = async (field: 'kentei_status' | 'kikou_status' | 'nyukan_status', subField: keyof OperationData, value: string) => {
        const stateField = field === 'kentei_status' ? 'kenteiStatus' : field === 'kikou_status' ? 'kikouStatus' : 'nyukanStatus';

        // Optimistic bulk UI update locally
        setWorkers(prevWorkers => prevWorkers.map(w => selectedIds.includes(w.id) ? { ...w, [stateField]: { ...w[stateField], [subField]: value } } : w));

        try {
            for (const id of selectedIds) {
                const worker = workers.find(w => w.id === id);
                if (worker) {
                    const newOpData = { ...worker[stateField], [subField]: value };
                    await updateOperationData(id, field, newOpData);
                }
            }
        } catch (error) {
            console.error(error);
            alert("一部の更新に失敗しました。ページをリロードしてください。");
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === workers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(workers.map(w => w.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const [activeTab, setActiveTab] = useState<'overview' | 'exam'>('overview');

    return (
        <div className="bg-transparent">
            {/* Tabs Header */}
            <div className="flex px-6 pt-4 space-x-1 border-b border-gray-350 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors whitespace-nowrap border-t border-l border-r ${activeTab === 'overview'
                        ? 'bg-white text-gray-900 border-gray-350 border-b-white relative top-[1px]'
                        : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
                        }`}
                >
                    総括一覧 (Overview)
                </button>
                <button
                    onClick={() => setActiveTab('exam')}
                    className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors whitespace-nowrap border-t border-l border-r ${activeTab === 'exam'
                        ? 'bg-white text-gray-900 border-gray-350 border-b-white relative top-[1px]'
                        : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
                        }`}
                >
                    検定・試験 (Exams)
                </button>
            </div>

            {/* Filter & Sort Bar (Global for Overview) */}
            {activeTab === 'overview' && (
                <div className="w-[1200px] mx-auto p-6 pb-2">
                    <div className="flex flex-wrap gap-8 mb-6">
                        {STATUS_CARDS.filter(s => s !== 'すべて').map(status => {
                            const count = status === 'すべて' ? workers.length : workers.filter(w => w.status === status).length;
                            const isActive = activeStatuses.includes(status);
                            return (
                                <div
                                    key={status}
                                    onClick={() => toggleStatus(status)}
                                    className={`group relative flex flex-col min-w-[120px] pr-4 py-2 cursor-pointer transition-all duration-200 ease-out`}
                                >
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className={`text-sm font-bold tracking-wide transition-colors ${isActive ? 'text-[#198f63]' : 'text-gray-500 group-hover:text-gray-800'}`}>
                                            {status}
                                        </span>
                                        <div className={`relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors duration-300 ${isActive ? 'bg-[#24b47e] shadow-inner' : 'bg-gray-200 group-hover:bg-gray-300'}`}>
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${isActive ? 'translate-x-[16px]' : 'translate-x-[3px]'}`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Filter & Sort Bar */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                        <div className="flex flex-wrap items-center gap-3 flex-1">
                            <span className="text-sm font-semibold text-gray-700 w-16 shrink-0">絞り込み:</span>
                            <select
                                value={filterSystem}
                                onChange={(e) => setFilterSystem(e.target.value)}
                                className="text-xs p-1.5 border border-[#878787] rounded outline-none focus:border-[#1f1f1f] bg-white cursor-pointer w-[110px]"
                            >
                                <option value="すべて" disabled>制度区分</option>
                                {systemOptions.map(opt => <option key={opt} value={opt}>{opt === 'すべて' ? 'すべて (区分)' : opt}</option>)}
                            </select>

                            <select
                                value={filterCompany}
                                onChange={(e) => setFilterCompany(e.target.value)}
                                className="text-xs p-1.5 border border-[#878787] rounded outline-none focus:border-[#1f1f1f] bg-white cursor-pointer w-[110px]"
                            >
                                <option value="すべて" disabled>配属先企業</option>
                                {companyOptions.map(opt => <option key={opt} value={opt}>{opt === 'すべて' ? 'すべて (企業)' : opt}</option>)}
                            </select>

                            <select
                                value={filterOccupation}
                                onChange={(e) => setFilterOccupation(e.target.value)}
                                className="text-xs p-1.5 border border-[#878787] rounded outline-none focus:border-[#1f1f1f] bg-white cursor-pointer w-[110px]"
                            >
                                <option value="すべて" disabled>職種</option>
                                {occupationOptions.map(opt => <option key={opt} value={opt}>{opt === 'すべて' ? 'すべて (職種)' : opt}</option>)}
                            </select>

                            <select
                                value={filterBatch}
                                onChange={(e) => setFilterBatch(e.target.value)}
                                className="text-xs p-1.5 border border-[#878787] rounded outline-none focus:border-[#1f1f1f] bg-white cursor-pointer w-[110px]"
                            >
                                <option value="すべて" disabled>入国期生</option>
                                {batchOptions.map(opt => <option key={opt} value={opt}>{opt === 'すべて' ? 'すべて (期生)' : opt}</option>)}
                            </select>

                            <select
                                value={filterVisaStatus}
                                onChange={(e) => setFilterVisaStatus(e.target.value)}
                                className="text-xs p-1.5 border border-[#878787] rounded outline-none focus:border-[#1f1f1f] bg-white cursor-pointer w-[110px]"
                            >
                                <option value="すべて" disabled>在留資格</option>
                                {visaOptions.map(opt => <option key={opt} value={opt}>{opt === 'すべて' ? 'すべて (資格)' : opt}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-700">並び順:</span>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className="text-xs p-1.5 border border-[#878787] rounded outline-none focus:border-[#1f1f1f] bg-white cursor-pointer w-[110px]"
                                >
                                    {sortOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex flex-col items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                            <div className="text-sm font-semibold text-green-800 flex items-center gap-2 w-full border-b border-green-200/60 pb-2 mb-1">
                                <span className="text-base">🛠 {selectedIds.length} 件選択中の一括変更</span>
                                <div className="text-[11px] text-green-700 font-normal ml-auto">※項目を変更・入力枠外クリックすると、選択中のすべての行に即時反映されます。</div>
                            </div>

                            <div className="flex flex-wrap gap-2 w-full">
                                {/* Basic Info & Status */}
                                <div className="flex flex-wrap items-center gap-1.5 border border-green-200 rounded p-1.5 bg-white shadow-sm">
                                    <span className="text-[10px] text-green-800 font-bold shrink-0 w-[45px]">基本管理</span>
                                    <select onChange={(e) => handleBulkChange('status', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none focus:border-green-500 cursor-pointer text-gray-700 bg-gray-50 max-w-[95px]" defaultValue="">
                                        <option value="" disabled>ステータス</option>
                                        {STATUS_CARDS.filter(s => s !== 'すべて').map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <input type="text" placeholder="メモ一括上書き..." onBlur={e => handleBulkChange('remarks', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleBulkChange('remarks', e.currentTarget.value) }} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-text text-gray-700 bg-gray-50 w-[120px]" />
                                </div>

                                {/* Kentei */}
                                <div className="flex flex-wrap items-center gap-1.5 border border-green-200 rounded p-1.5 bg-white shadow-sm">
                                    <span className="text-[10px] text-green-800 font-bold shrink-0 w-[45px]">検定業務</span>
                                    <select onChange={e => handleBulkOperationChange('kentei_status', 'type', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 max-w-[85px]" defaultValue="">
                                        <option value="" disabled>業務</option>
                                        {KENTEI_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <select onChange={e => handleBulkOperationChange('kentei_status', 'assignee', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 max-w-[85px]" defaultValue="">
                                        <option value="" disabled>担当</option>
                                        {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <div className="flex items-center gap-1"><span className="text-[9px] text-gray-500">学科</span><input type="date" title="学科日" onChange={e => handleBulkOperationChange('kentei_status', 'exam_date_written', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 w-[105px]" /></div>
                                    <div className="flex items-center gap-1"><span className="text-[9px] text-gray-500">実技</span><input type="date" title="実技日" onChange={e => handleBulkOperationChange('kentei_status', 'exam_date_practical', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 w-[105px]" /></div>
                                    <select onChange={e => handleBulkOperationChange('kentei_status', 'progress', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 max-w-[85px]" defaultValue="">
                                        <option value="" disabled>進捗</option>
                                        {PROGRESS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>

                                {/* Kikou */}
                                <div className="flex flex-wrap items-center gap-1.5 border border-green-200 rounded p-1.5 bg-white shadow-sm">
                                    <span className="text-[10px] text-green-800 font-bold shrink-0 w-[45px] leading-[1.2]">機構業務<br />建設特定</span>
                                    <select onChange={e => handleBulkOperationChange('kikou_status', 'type', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 max-w-[85px]" defaultValue="">
                                        <option value="" disabled>機構業務</option>
                                        {KIKOU_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <select onChange={e => handleBulkOperationChange('kikou_status', 'assignee', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 max-w-[85px]" defaultValue="">
                                        <option value="" disabled>機構担当</option>
                                        {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <select onChange={e => handleBulkOperationChange('kikou_status', 'construction_type', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 max-w-[85px]" defaultValue="">
                                        <option value="" disabled>建設業務</option>
                                        {CONSTRUCTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <select onChange={e => handleBulkOperationChange('kikou_status', 'construction_assignee', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 max-w-[85px]" defaultValue="">
                                        <option value="" disabled>建担当</option>
                                        {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <select onChange={e => handleBulkOperationChange('kikou_status', 'progress', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 max-w-[85px]" defaultValue="">
                                        <option value="" disabled>進捗</option>
                                        {PROGRESS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>

                                {/* Nyukan */}
                                <div className="flex flex-wrap items-center gap-1.5 border border-green-200 rounded p-1.5 bg-white shadow-sm">
                                    <span className="text-[10px] text-green-800 font-bold shrink-0 w-[45px]">入管業務</span>
                                    <select onChange={e => handleBulkOperationChange('nyukan_status', 'type', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 max-w-[85px]" defaultValue="">
                                        <option value="" disabled>業務</option>
                                        {NYUKAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <select onChange={e => handleBulkOperationChange('nyukan_status', 'assignee', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 max-w-[85px]" defaultValue="">
                                        <option value="" disabled>担当</option>
                                        {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <div className="flex items-center gap-1"><span className="text-[9px] text-gray-500">申請</span><input type="date" title="申請日" onChange={e => handleBulkOperationChange('nyukan_status', 'application_date', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 w-[105px]" /></div>
                                    <div className="flex items-center gap-1"><span className="text-[9px] text-gray-500">取次</span><input type="text" placeholder="取次..." onBlur={e => handleBulkOperationChange('nyukan_status', 'agent', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleBulkOperationChange('nyukan_status', 'agent', e.currentTarget.value) }} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-text text-gray-700 bg-gray-50 w-[95px]" /></div>
                                    <select onChange={e => handleBulkOperationChange('nyukan_status', 'progress', e.target.value)} className="text-xs p-1 border border-gray-300 rounded outline-none cursor-pointer text-gray-700 bg-gray-50 max-w-[85px]" defaultValue="">
                                        <option value="" disabled>進捗</option>
                                        {PROGRESS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 pb-10">
                        {paginatedWorkers.length > 0 && (
                            <div className="flex items-center gap-3 px-2 mb-2">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === workers.length && workers.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 text-primary-600 rounded border-gray-300 cursor-pointer"
                                />
                                <span className="text-sm font-semibold text-gray-700">すべて選択 (Select All)</span>
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
                            <div key={groupKey} className="flex flex-col gap-3">
                                {/* Group Header */}
                                <div className="flex items-center gap-3 px-2 mt-3 mb-1">
                                    <span className="font-bold text-gray-800 text-[15px] flex items-center gap-2">
                                        🏢 {group[0].company}
                                    </span>
                                    <span className="text-xs bg-gray-100 px-2.5 py-0.5 rounded-md text-gray-600 font-medium">
                                        入国日: {group[0].entryDate || '未定'}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium ml-auto">
                                        {group.length}名
                                    </span>
                                </div>

                                {/* Group Workers */}
                                {group.map((worker) => (
                                    <div key={worker.id} className={`flex flex-col xl:flex-row gap-3 p-3 border rounded-xl shadow-sm transition-all duration-200 bg-white relative ${selectedIds.includes(worker.id) ? 'border-green-400 ring-1 ring-green-400 bg-green-50/20' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}>

                                        {/* Header / Mobile Checkbox */}
                                        <div className="flex items-center justify-between xl:hidden font-semibold text-sm text-gray-700 border-b border-gray-100 pb-2 mb-1">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(worker.id)}
                                                    onChange={() => toggleSelect(worker.id)}
                                                    className="w-4 h-4 text-primary-600 rounded border-gray-300 cursor-pointer"
                                                />
                                                <span>選択</span>
                                            </div>
                                            <span className="text-xs text-gray-400 font-normal">ID: {worker.id.substring(0, 8)}...</span>
                                        </div>

                                        {/* Col 1: Worker Info & System Info */}
                                        <div className="flex-[1.2] flex flex-col gap-2 xl:pl-4 pb-2 xl:pb-0 min-w-0">
                                            <div className="flex items-start gap-3">
                                                {/* Desktop absolute avatar overlapping the left edge */}
                                                <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 shrink-0 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-lg shadow-md border-[3px] border-white z-10 hidden xl:flex">
                                                    {worker.avatar}
                                                </div>
                                                {/* Mobile inline avatar */}
                                                <div className="w-10 h-10 shrink-0 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-lg mt-0.5 shadow-sm xl:hidden">
                                                    {worker.avatar}
                                                </div>
                                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(worker.id)}
                                                            onChange={() => toggleSelect(worker.id)}
                                                            className="w-4 h-4 text-primary-600 rounded border-gray-300 cursor-pointer shrink-0 hidden xl:block"
                                                        />
                                                        <Link href={`/workers/${worker.id}`} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 hover:text-primary-600 hover:underline truncate text-[15px] leading-tight mt-0.5" title={worker.name}>
                                                            {worker.name}
                                                        </Link>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 truncate -mt-0.5" title={worker.furigana}>{worker.furigana}</div>
                                                    <textarea
                                                        className="mt-1.5 w-full text-[11px] border border-gray-200 rounded-md p-1.5 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 resize-none h-20 bg-gray-50/50 placeholder-gray-400 text-gray-700"
                                                        placeholder="メモ・備考..."
                                                        value={worker.remarks || ''}
                                                        onChange={(e) => setWorkers(workers.map(w => w.id === worker.id ? { ...w, remarks: e.target.value } : w))}
                                                        onBlur={() => handleRemarksBlur(worker.id)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Col 2: Residence Info */}
                                        <div className="flex-1 xl:flex-none xl:w-[170px] flex flex-col gap-1.5 border-t xl:border-t-0 xl:border-l border-gray-100 pt-3 xl:pt-0 xl:pl-4 min-w-0">
                                            <div className="flex justify-between items-center w-full">
                                                <div className="text-[10px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 w-fit rounded">在留情報</div>
                                                <div className="flex items-center relative shrink-0">
                                                    <select
                                                        value={worker.status}
                                                        onChange={(e) => handleChange(worker.id, 'status', e.target.value)}
                                                        className={`appearance-none text-[10px] pl-2 pr-5 py-0.5 rounded-full font-bold outline-none cursor-pointer transition-all duration-300 shadow-sm border focus:ring-2 focus:ring-offset-1 ${worker.status === '就業中' ? 'bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-800 border-emerald-200 focus:ring-emerald-400 hover:shadow-md hover:border-emerald-300' :
                                                            worker.status === '帰国' ? 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200 focus:ring-gray-300 hover:shadow-md hover:border-gray-300' :
                                                                worker.status === '失踪' ? 'bg-gradient-to-r from-rose-50 to-red-100 text-rose-800 border-rose-200 focus:ring-rose-400 hover:shadow-md hover:border-rose-300' :
                                                                    'bg-gradient-to-r from-amber-50 to-orange-100 text-orange-800 border-orange-200 focus:ring-orange-400 hover:shadow-md hover:border-orange-300'
                                                            }`}
                                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2.5' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9' /%3E%3C/svg%3E")`, backgroundPosition: 'right 0.3rem center', backgroundRepeat: 'no-repeat', backgroundSize: '0.8em 0.8em' }}
                                                    >
                                                        {STATUS_CARDS.filter(s => s !== 'すべて').map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5 mt-0.5">
                                                <div className="text-[11px] text-gray-500 flex justify-between items-center -mt-0.5">
                                                    <span>資格:</span> <span className="text-gray-900 font-medium">{worker.visaStatus}</span>
                                                </div>
                                                <div className="text-[11px] text-gray-500 flex justify-between items-center">
                                                    <span>期限:</span> <span className="text-gray-900 font-medium">{worker.visaExpiry}</span>
                                                </div>
                                                <div className="text-[11px] text-gray-500 flex justify-between items-center">
                                                    <span>認定:</span> <span className="text-gray-900 font-medium truncate ml-2">{(worker.certStartDate && worker.certStartDate !== '---') ? worker.certStartDate : '---'} ~ {(worker.certEndDate && worker.certEndDate !== '---') ? worker.certEndDate : '---'}</span>
                                                </div>
                                                <div className="text-[11px] text-gray-500 flex justify-between items-start mt-0.5 pt-1.5 border-t border-gray-100">
                                                    <span className="shrink-0">職種:</span> <span className="text-gray-900 font-medium text-right line-clamp-2 leading-[1.3]">{worker.occupation || '---'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Col 4: Kentei Ops */}
                                        <div className="flex-1 flex flex-col gap-1.5 border-t xl:border-t-0 xl:border-l border-gray-100 pt-3 xl:pt-0 xl:pl-4 min-w-0">
                                            <div className="text-[10px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 w-fit rounded">検定業務</div>
                                            <div className="flex justify-between gap-1 mt-0.5">
                                                <select value={worker.kenteiStatus.type} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'type', e.target.value)} className="text-[11px] py-0.5 px-1 outline-none w-1/2 rounded bg-gray-50 border border-gray-200 text-gray-700 font-medium cursor-pointer max-w-[50%]">
                                                    {KENTEI_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                                <select value={worker.kenteiStatus.assignee} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'assignee', e.target.value)} className="text-[11px] py-0.5 px-1 outline-none w-1/2 rounded bg-gray-50 border border-gray-200 text-gray-700 cursor-pointer">
                                                    {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-1 border border-gray-100 rounded p-1 bg-gray-50/50">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] bg-white border border-gray-200 rounded px-1 py-px text-gray-500 shrink-0 shadow-sm leading-none">学科</span>
                                                    <input type="date" value={worker.kenteiStatus.exam_date_written || ''} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'exam_date_written', e.target.value)} className="text-[11px] flex-1 w-full bg-transparent outline-none text-gray-700 cursor-pointer" />
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] bg-white border border-gray-200 rounded px-1 py-px text-gray-500 shrink-0 shadow-sm leading-none">実技</span>
                                                    <input type="date" value={worker.kenteiStatus.exam_date_practical || ''} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'exam_date_practical', e.target.value)} className="text-[11px] flex-1 w-full bg-transparent outline-none text-gray-700 cursor-pointer" />
                                                </div>
                                            </div>
                                            <select value={worker.kenteiStatus.progress} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'progress', e.target.value)} className={`text-[11px] py-1 px-1.5 rounded font-medium outline-none w-full text-center cursor-pointer transition-colors mt-auto shadow-sm ${worker.kenteiStatus.progress === '完了' ? 'bg-green-100 text-green-700 border-green-200 border' : worker.kenteiStatus.progress === '進行中' ? 'bg-blue-100 text-blue-700 border-blue-200 border' : 'bg-gray-100 text-gray-600 border-gray-200 border'}`}>
                                                {PROGRESS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>

                                        {/* Col 5: Kikou Ops */}
                                        <div className="flex-1 flex flex-col gap-1.5 border-t xl:border-t-0 xl:border-l border-gray-100 pt-3 xl:pt-0 xl:pl-4 min-w-0">
                                            <div className="text-[10px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 w-fit rounded">機構業務/建設特定</div>
                                            <div className="flex justify-between gap-1 mt-0.5">
                                                <select value={worker.kikouStatus.type} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'type', e.target.value)} className="text-[11px] py-0.5 px-1 outline-none w-1/2 rounded bg-gray-50 border border-gray-200 text-gray-700 font-medium cursor-pointer max-w-[50%]">
                                                    {KIKOU_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                                <select value={worker.kikouStatus.assignee} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'assignee', e.target.value)} className="text-[11px] py-0.5 px-1 outline-none w-1/2 rounded bg-gray-50 border border-gray-200 text-gray-700 cursor-pointer">
                                                    {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-1 border border-gray-100 rounded p-1 bg-gray-50/50">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] bg-white border border-gray-200 rounded px-1 py-px text-gray-500 shrink-0 shadow-sm leading-none">業務</span>
                                                    <select value={worker.kikouStatus.construction_type || '---'} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'construction_type', e.target.value)} className="text-[11px] flex-1 w-full bg-transparent outline-none text-gray-700 cursor-pointer truncate pl-1">
                                                        {CONSTRUCTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] bg-white border border-gray-200 rounded px-1 py-px text-gray-500 shrink-0 shadow-sm leading-none">担当</span>
                                                    <select value={worker.kikouStatus.construction_assignee || '---'} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'construction_assignee', e.target.value)} className="text-[11px] flex-1 w-full bg-transparent outline-none text-gray-700 cursor-pointer text-left pl-1">
                                                        {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <select value={worker.kikouStatus.progress} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'progress', e.target.value)} className={`text-[11px] py-1 px-1.5 rounded font-medium outline-none w-full text-center cursor-pointer transition-colors mt-auto shadow-sm ${worker.kikouStatus.progress === '完了' ? 'bg-green-100 text-green-700 border-green-200 border' : worker.kikouStatus.progress === '進行中' ? 'bg-purple-100 text-purple-700 border-purple-200 border' : 'bg-gray-100 text-gray-600 border-gray-200 border'}`}>
                                                {PROGRESS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>

                                        {/* Col 6: Nyukan Ops */}
                                        <div className="flex-1 flex flex-col gap-1.5 border-t xl:border-t-0 xl:border-l border-gray-100 pt-3 xl:pt-0 xl:pl-4 min-w-0">
                                            <div className="text-[10px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 w-fit rounded">入管業務</div>
                                            <div className="flex justify-between gap-1 mt-0.5">
                                                <select value={worker.nyukanStatus.type} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'type', e.target.value)} className="text-[11px] py-0.5 px-1 outline-none w-1/2 rounded bg-gray-50 border border-gray-200 text-gray-700 font-medium cursor-pointer max-w-[50%]">
                                                    {NYUKAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                                <select value={worker.nyukanStatus.assignee} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'assignee', e.target.value)} className="text-[11px] py-0.5 px-1 outline-none w-1/2 rounded bg-gray-50 border border-gray-200 text-gray-700 cursor-pointer">
                                                    {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-1 border border-gray-100 rounded p-1 bg-gray-50/50">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] bg-white border border-gray-200 rounded px-1 py-px text-gray-500 shrink-0 shadow-sm leading-none">申請</span>
                                                    <input type="date" value={worker.nyukanStatus.application_date || ''} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'application_date', e.target.value)} className="text-[11px] flex-1 w-full bg-transparent outline-none text-gray-700 cursor-pointer" />
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] bg-white border border-gray-200 rounded px-1 py-px text-gray-500 shrink-0 shadow-sm leading-none">取次</span>
                                                    <input type="text" placeholder="---" value={worker.nyukanStatus.agent || ''} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'agent', e.target.value)} className="text-[11px] flex-1 w-full bg-transparent outline-none text-gray-700 placeholder-gray-300 pl-1" />
                                                </div>
                                            </div>
                                            <select value={worker.nyukanStatus.progress} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'progress', e.target.value)} className={`text-[11px] py-1 px-1.5 rounded font-medium outline-none w-full text-center cursor-pointer transition-colors mt-auto shadow-sm ${worker.nyukanStatus.progress === '完了' ? 'bg-green-100 text-green-700 border-green-200 border' : worker.nyukanStatus.progress === '進行中' ? 'bg-orange-100 text-orange-700 border-orange-200 border' : 'bg-gray-100 text-gray-600 border-gray-200 border'}`}>
                                                {PROGRESS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}

                        {processedWorkers.length === 0 && (
                            <div className="text-center py-12 text-gray-500 text-sm bg-gray-50 rounded-xl border border-gray-200">
                                データがありません。
                            </div>
                        )}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 bg-transparent mt-2">
                                <div className="text-sm text-gray-500">
                                    全 <span className="font-semibold">{processedWorkers.length}</span> 件中 <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-semibold">{Math.min(currentPage * itemsPerPage, processedWorkers.length)}</span> 件を表示
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 text-[#1f1f1f]">最初へ</button>
                                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 text-[#1f1f1f]">&lsaquo;</button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                                        .map((p, i, arr) => (
                                            <React.Fragment key={p}>
                                                {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 py-1 flex items-center justify-center min-w-[36px]">...</span>}
                                                <button
                                                    onClick={() => setCurrentPage(p)}
                                                    className={`px-3 py-1 border rounded text-sm min-w-[36px] ${currentPage === p ? 'bg-[#24b47e] text-white border-[#24b47e]' : 'border-gray-300 hover:bg-gray-50 text-[#1f1f1f]'}`}
                                                >
                                                    {p}
                                                </button>
                                            </React.Fragment>
                                        ))}

                                    <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 text-[#1f1f1f]">&rsaquo;</button>
                                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 text-[#1f1f1f]">最後へ</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'exam' && (
                <div className="w-[1200px] mx-auto p-6 print-target print:w-full print:mx-0 print:p-0">
                    <ExamTab workers={workers} onUpdate={handleOperationChange} />
                </div>
            )}
        </div>
    )
}
