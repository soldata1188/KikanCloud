'use client'

import React, { useState } from 'react'

import { updateWorkerStatus, updateOperationData } from './actions'

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

export default function OperationsClient({ initialWorkers, companies }: { initialWorkers: any[], companies: any[] }) {
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

    // Modal state (Removed)

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

    const handleBulkChange = async (field: WorkerField, value: string) => {
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

    return (
        <div className="bg-white p-6">
            {/* Status Cards */}
            <div className="flex flex-wrap gap-8 mb-6">
                {STATUS_CARDS.map(status => {
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
                                    {status === 'すべて' ? '全ステータス' : status}
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
                        className="text-xs p-1.5 border border-[#878787] rounded outline-none focus:border-[#1f1f1f] bg-white cursor-pointer min-w-[110px]"
                    >
                        <option value="すべて" disabled>制度区分</option>
                        {systemOptions.map(opt => <option key={opt} value={opt}>{opt === 'すべて' ? 'すべて (区分)' : opt}</option>)}
                    </select>

                    <select
                        value={filterCompany}
                        onChange={(e) => setFilterCompany(e.target.value)}
                        className="text-xs p-1.5 border border-[#878787] rounded outline-none focus:border-[#1f1f1f] bg-white cursor-pointer min-w-[130px]"
                    >
                        <option value="すべて" disabled>配属先企業</option>
                        {companyOptions.map(opt => <option key={opt} value={opt}>{opt === 'すべて' ? 'すべて (企業)' : opt}</option>)}
                    </select>

                    <select
                        value={filterOccupation}
                        onChange={(e) => setFilterOccupation(e.target.value)}
                        className="text-xs p-1.5 border border-[#878787] rounded outline-none focus:border-[#1f1f1f] bg-white cursor-pointer min-w-[120px]"
                    >
                        <option value="すべて" disabled>職種</option>
                        {occupationOptions.map(opt => <option key={opt} value={opt}>{opt === 'すべて' ? 'すべて (職種)' : opt}</option>)}
                    </select>

                    <select
                        value={filterBatch}
                        onChange={(e) => setFilterBatch(e.target.value)}
                        className="text-xs p-1.5 border border-[#878787] rounded outline-none focus:border-[#1f1f1f] bg-white cursor-pointer min-w-[120px]"
                    >
                        <option value="すべて" disabled>入国期生</option>
                        {batchOptions.map(opt => <option key={opt} value={opt}>{opt === 'すべて' ? 'すべて (期生)' : opt}</option>)}
                    </select>

                    <select
                        value={filterVisaStatus}
                        onChange={(e) => setFilterVisaStatus(e.target.value)}
                        className="text-xs p-1.5 border border-[#878787] rounded outline-none focus:border-[#1f1f1f] bg-white cursor-pointer min-w-[120px]"
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
                            className="text-sm p-1.5 border border-[#878787] rounded outline-none focus:border-[#1f1f1f] bg-white cursor-pointer min-w-[150px]"
                        >
                            {sortOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-semibold text-green-800 shrink-0">
                        {selectedIds.length} 件選択中
                    </span>

                    <div className="flex items-center gap-2 border-l border-green-200 pl-4 flex-wrap">
                        <span className="text-xs text-gray-600 font-medium">一括変更:</span>

                        <select onChange={(e) => handleBulkChange('status', e.target.value)} className="text-xs p-1.5 border border-gray-300 rounded outline-none focus:border-green-500 cursor-pointer text-gray-700 bg-white" defaultValue="">
                            <option value="" disabled>ステータス...</option>
                            {STATUS_CARDS.filter(s => s !== 'すべて').map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            )
            }

            <div className="overflow-x-auto pb-10">
                <table className="w-full border-collapse text-sm text-left">
                    <thead className="bg-gray-50 text-gray-800">
                        <tr>
                            <th className="border border-gray-350 px-4 py-3 text-center w-[40px] shrink-0">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === workers.length && workers.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 text-primary-600 rounded border-gray-300 cursor-pointer"
                                />
                            </th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold whitespace-nowrap min-w-[200px]">外国人材 / 受入企業</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold whitespace-nowrap w-[160px] min-w-[160px] max-w-[160px]">認定情報</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold whitespace-nowrap w-[160px] min-w-[160px] max-w-[160px]">在留情報</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold whitespace-nowrap w-[200px] min-w-[200px]">検定業務</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold whitespace-nowrap w-[200px] min-w-[200px]">機構業務/建設特定</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold whitespace-nowrap w-[200px] min-w-[200px]">入管業務</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold whitespace-nowrap min-w-[250px]">備考 (MEMO)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedWorkers.map((worker) => (
                            <tr key={worker.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(worker.id) ? 'bg-green-50/50' : ''}`}>
                                <td className="border border-gray-350 px-4 py-3 text-center align-top pt-5 w-[40px] shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(worker.id)}
                                        onChange={() => toggleSelect(worker.id)}
                                        className="w-4 h-4 text-primary-600 rounded border-gray-300 cursor-pointer"
                                    />
                                </td>
                                {/* Worker Info (Avatar, Name, ID) & Company */}
                                <td className="border border-gray-350 px-4 py-3 align-top">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 shrink-0 rounded-md bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-lg">
                                                {worker.avatar}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 truncate" title={worker.name}>{worker.name}</div>
                                                <div className="text-[11px] text-gray-400 mt-0.5 truncate" title={worker.furigana}>{worker.furigana}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-2 mt-1">
                                            <div className="flex items-center">
                                                <select
                                                    value={worker.status}
                                                    onChange={(e) => handleChange(worker.id, 'status', e.target.value)}
                                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded outline-none cursor-pointer hover:opacity-80 transition-opacity ${worker.status === '就業中' ? 'bg-green-50 text-green-700' :
                                                        worker.status === '帰国' ? 'bg-gray-100 text-gray-600' :
                                                            worker.status === '失踪' ? 'bg-red-50 text-red-700' :
                                                                'bg-orange-50 text-orange-700'
                                                        }`}
                                                >
                                                    {STATUS_CARDS.filter(s => s !== 'すべて').map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div className="text-[11px] font-medium text-gray-600 truncate mt-0.5" title={worker.company}>
                                                🏢 {worker.company}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Certification Info */}
                                <td className="border border-gray-350 px-4 py-3">
                                    <div className="flex flex-col gap-1 inline-flex w-full">
                                        <div className="text-xs text-gray-500 whitespace-nowrap">
                                            制度: <span className="text-gray-900 font-medium">{worker.systemCategory}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5 gap-2">
                                            <span className="text-xs text-gray-500 whitespace-nowrap">職種: <span className="text-gray-900 font-medium">{worker.occupation}</span></span>
                                        </div>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <div className="text-xs text-gray-500 whitespace-nowrap">
                                            開始: <span className="text-gray-900 font-medium">{worker.certStartDate}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 whitespace-nowrap">
                                            終了: <span className="text-gray-900 font-medium">{worker.certEndDate}</span>
                                        </div>
                                    </div>
                                </td>

                                {/* Residence Info (Status, Expiry, Duration) */}
                                <td className="border border-gray-350 px-4 py-3">
                                    <div className="flex flex-col gap-1 inline-flex w-full">
                                        <div className="text-xs text-gray-500 whitespace-nowrap">
                                            資格: <span className="text-gray-900 font-medium">{worker.visaStatus}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5 gap-2">
                                            <span className="text-xs text-gray-500 whitespace-nowrap">期限: <span className="text-gray-900 font-medium">{worker.visaExpiry}</span></span>
                                        </div>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <div className="text-xs text-gray-500 whitespace-nowrap">
                                            入国: <span className="text-gray-900 font-medium">{worker.entryDate || '---'}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 whitespace-nowrap">
                                            期生: <span className="text-gray-900 font-medium">{getBatchString(worker.entryDate)}</span>
                                        </div>
                                    </div>
                                </td>

                                {/* 検定業務 (Kentei Ops) */}
                                <td className="border border-gray-350 px-3 py-2 align-top w-[200px] min-w-[200px]">
                                    <div className="flex flex-col gap-1.5 h-full relative">
                                        <div className="flex justify-between gap-1">
                                            <select value={worker.kenteiStatus.type} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'type', e.target.value)} className="text-xs p-1 outline-none w-1/2 cursor-pointer bg-transparent text-gray-700 font-medium">
                                                {KENTEI_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                            <select value={worker.kenteiStatus.assignee} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'assignee', e.target.value)} className="text-xs p-1 outline-none w-1/2 cursor-pointer bg-transparent text-gray-700 text-right">
                                                {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex justify-between gap-1 border-t border-gray-100 pt-1.5 mt-0.5 mb-1">
                                            <div className="flex flex-col gap-1 text-[10px]">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400 w-10">学科</span>
                                                    <input type="date" value={worker.kenteiStatus.exam_date_written || ''} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'exam_date_written', e.target.value)} className="w-[85px] bg-transparent outline-none text-gray-700 cursor-pointer" />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400 w-10">実技</span>
                                                    <input type="date" value={worker.kenteiStatus.exam_date_practical || ''} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'exam_date_practical', e.target.value)} className="w-[85px] bg-transparent outline-none text-gray-700 cursor-pointer" />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400 w-10">会場</span>
                                                    <input type="text" placeholder="---" value={worker.kenteiStatus.exam_location || ''} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'exam_location', e.target.value)} className="w-[85px] bg-transparent outline-none text-gray-700 placeholder-gray-300" />
                                                </div>
                                            </div>
                                        </div>
                                        <select value={worker.kenteiStatus.progress} onChange={e => handleOperationChange(worker.id, 'kentei_status', 'progress', e.target.value)} className={`text-xs p-1 rounded font-medium outline-none w-full text-center cursor-pointer transition-colors mt-auto ${worker.kenteiStatus.progress === '完了' ? 'bg-green-100 text-green-700' : worker.kenteiStatus.progress === '進行中' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {PROGRESS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </td>

                                {/* 機構業務/建設特定 (Kikou Ops) */}
                                <td className="border border-gray-350 px-3 py-2 align-top w-[200px] min-w-[200px]">
                                    <div className="flex flex-col gap-1.5 h-full relative">
                                        <div className="flex justify-between gap-1">
                                            <select value={worker.kikouStatus.type} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'type', e.target.value)} className="text-xs p-1 outline-none w-1/2 cursor-pointer bg-transparent text-gray-700 font-medium">
                                                {KIKOU_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                            <select value={worker.kikouStatus.assignee} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'assignee', e.target.value)} className="text-xs p-1 outline-none w-1/2 cursor-pointer bg-transparent text-gray-700 text-right">
                                                {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex justify-between gap-1 border-t border-gray-100 pt-1.5 mt-0.5 mb-1">
                                            <div className="flex flex-col gap-1 text-[10px] w-full">
                                                <div className="flex items-center justify-between gap-1 w-full relative">
                                                    <select value={worker.kikouStatus.construction_type || '---'} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'construction_type', e.target.value)} className="w-[105px] bg-transparent outline-none text-gray-500 cursor-pointer">
                                                        {CONSTRUCTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                    <select value={worker.kikouStatus.construction_assignee || '---'} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'construction_assignee', e.target.value)} className="w-[70px] bg-transparent outline-none text-gray-400 text-right cursor-pointer absolute right-0">
                                                        {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <select value={worker.kikouStatus.progress} onChange={e => handleOperationChange(worker.id, 'kikou_status', 'progress', e.target.value)} className={`text-xs p-1 rounded font-medium outline-none w-full text-center cursor-pointer transition-colors mt-auto ${worker.kikouStatus.progress === '完了' ? 'bg-green-100 text-green-700' : worker.kikouStatus.progress === '進行中' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {PROGRESS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </td>

                                {/* 入管業務 (Nyukan Ops) */}
                                <td className="border border-gray-350 px-3 py-2 align-top w-[200px] min-w-[200px]">
                                    <div className="flex flex-col gap-1.5 h-full relative">
                                        <div className="flex justify-between gap-1">
                                            <select value={worker.nyukanStatus.type} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'type', e.target.value)} className="text-xs p-1 outline-none w-1/2 cursor-pointer bg-transparent text-gray-700 font-medium">
                                                {NYUKAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                            <select value={worker.nyukanStatus.assignee} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'assignee', e.target.value)} className="text-xs p-1 outline-none w-1/2 cursor-pointer bg-transparent text-gray-700 text-right">
                                                {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex justify-between gap-1 border-t border-gray-100 pt-1.5 mt-0.5 mb-1">
                                            <div className="flex flex-col gap-1 text-[10px]">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400 w-10">申請日</span>
                                                    <input type="date" value={worker.nyukanStatus.application_date || ''} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'application_date', e.target.value)} className="w-[85px] bg-transparent outline-none text-gray-700 cursor-pointer" />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400 w-10">受理号</span>
                                                    <input type="text" placeholder="---" value={worker.nyukanStatus.receipt_number || ''} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'receipt_number', e.target.value)} className="w-[85px] bg-transparent outline-none text-gray-700 placeholder-gray-300" />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400 w-10">取次者</span>
                                                    <input type="text" placeholder="---" value={worker.nyukanStatus.agent || ''} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'agent', e.target.value)} className="w-[85px] bg-transparent outline-none text-gray-700 placeholder-gray-300" />
                                                </div>
                                            </div>
                                        </div>
                                        <select value={worker.nyukanStatus.progress} onChange={e => handleOperationChange(worker.id, 'nyukan_status', 'progress', e.target.value)} className={`text-xs p-1 rounded font-medium outline-none w-full text-center cursor-pointer transition-colors mt-auto ${worker.nyukanStatus.progress === '完了' ? 'bg-green-100 text-green-700' : worker.nyukanStatus.progress === '進行中' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {PROGRESS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </td>

                                {/* 備考 (MEMO) */}
                                <td className="border border-gray-350 p-2 align-top">
                                    <textarea
                                        value={worker.remarks}
                                        onChange={(e) => setWorkers(prev => prev.map(w => w.id === worker.id ? { ...w, remarks: e.target.value } : w))}
                                        onBlur={() => handleRemarksBlur(worker.id)}
                                        placeholder="特記事項やメモを入力..."
                                        className="w-full h-[76px] text-xs p-2 border border-gray-200 rounded outline-none focus:border-primary-500 hover:border-gray-300 transition-colors resize-y bg-white/50 focus:bg-white"
                                    />
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
                {processedWorkers.length === 0 && (
                    <div className="text-center py-10 text-gray-500 text-sm border-b border-l border-r border-gray-350">
                        データがありません。
                    </div>
                )}
            </div>
        </div>
    )
}
