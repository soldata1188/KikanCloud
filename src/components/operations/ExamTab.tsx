'use client'

import React from 'react'
import { Printer } from 'lucide-react'

export default function ExamTab({
    workers = [],
    onUpdate,
    staff = []
}: {
    workers?: any[],
    onUpdate?: (id: string, field: 'kentei_status', subField: any, value: string) => void,
    staff?: { id: string, full_name: string }[]
}) {
    const [batchFilter, setBatchFilter] = React.useState('all');
    const [typeFilter, setTypeFilter] = React.useState('all');
    const [occFilter, setOccFilter] = React.useState('all');
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [hiddenCols, setHiddenCols] = React.useState<Set<string>>(new Set());

    // Unique filter options
    const uniqueBatches = Array.from(new Set(workers.filter(w => w.entryBatch).map(w => w.entryBatch))).sort();
    const uniqueTypes = Array.from(new Set(workers.filter(w => w.kenteiStatus?.type).map(w => w.kenteiStatus.type))).sort();
    const uniqueOccs = Array.from(new Set(workers.filter(w => w.occupation).map(w => w.occupation))).sort();

    // Filter and Sort (Flat List)
    const processedWorkers = React.useMemo(() => {
        let list = workers
            .filter(w => w.kenteiStatus && w.kenteiStatus.type && w.kenteiStatus.type !== '---')
            .filter(w => batchFilter === 'all' || w.entryBatch === batchFilter)
            .filter(w => typeFilter === 'all' || w.kenteiStatus.type === typeFilter)
            .filter(w => occFilter === 'all' || w.occupation === occFilter);

        // Sort: Newest Exam Dates First
        list.sort((a, b) => {
            const dateA = a.kenteiStatus.exam_date_written || a.kenteiStatus.exam_date_practical || '0000-00-00';
            const dateB = b.kenteiStatus.exam_date_written || b.kenteiStatus.exam_date_practical || '0000-00-00';
            return dateB.localeCompare(dateA);
        });

        return list;
    }, [workers, batchFilter, typeFilter, occFilter]);

    // Initial select all
    React.useEffect(() => {
        if (processedWorkers.length > 0 && selectedIds.size === 0) {
            setSelectedIds(new Set(processedWorkers.map(w => w.id)));
        }
    }, [processedWorkers]);

    const toggleId = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === processedWorkers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(processedWorkers.map(w => w.id)));
        }
    };

    const toggleCol = (col: string) => {
        const next = new Set(hiddenCols);
        if (next.has(col)) next.delete(col);
        else next.add(col);
        setHiddenCols(next);
    };

    const STAFF_OPTIONS = ['---', ...staff.map(s => s.full_name)];
    const hasData = processedWorkers.length > 0;

    const PRINT_COLUMNS = [
        { id: 'name', label: '氏名/企業' },
        { id: 'entry', label: '入国日' },
        { id: 'written', label: '学科' },
        { id: 'practical', label: '実技' },
        { id: 'occ', label: '職種/業務' },
        { id: 'loc', label: '地点/立会' },
    ];

    return (
        <div className="w-full bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none print-target">
            {/* Print-only Title */}
            <div className="hidden print:block text-center mb-6">
                <h1 className="text-xl font-bold border-b-2 border-black inline-block pb-1">検定・試験進捗一覧</h1>
                <div className="text-right text-[10px] mt-2 text-slate-500">
                    印刷日: {new Date().toLocaleDateString('ja-JP')}
                </div>
            </div>

            {/* Header with Print Button and Filters */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/30 print:hidden space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-slate-800 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#24b47e]"></span>
                            検定・試験進捗一覧
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1 pl-4">※ 必要のない項目や行のチェックを外して印刷できます</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-full">
                            {PRINT_COLUMNS.map(col => (
                                <button
                                    key={col.id}
                                    onClick={() => toggleCol(col.id)}
                                    className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all ${!hiddenCols.has(col.id)
                                        ? 'bg-white text-slate-700 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-500'
                                        }`}
                                >
                                    {col.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#24b47e] text-white rounded-[32px] text-sm font-bold hover:bg-[#1e9a6a] transition-all shadow-md shadow-[#24b47e]/20 active:scale-95 ml-2"
                        >
                            <Printer size={16} />
                            PDFとして印刷 (A4横)
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">入国期生</label>
                        <select
                            value={batchFilter}
                            onChange={(e) => setBatchFilter(e.target.value)}
                            className="block w-40 text-xs border border-slate-200 rounded-[32px] px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#24b47e]/20 bg-white"
                        >
                            <option value="all">すべて</option>
                            {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">業務内容</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="block w-40 text-xs border border-slate-200 rounded-[32px] px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#24b47e]/20 bg-white"
                        >
                            <option value="all">すべて</option>
                            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">職種</label>
                        <select
                            value={occFilter}
                            onChange={(e) => setOccFilter(e.target.value)}
                            className="block w-40 text-xs border border-slate-200 rounded-[32px] px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#24b47e]/20 bg-white"
                        >
                            <option value="all">すべて</option>
                            {uniqueOccs.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto no-scrollbar print:overflow-visible">
                <table className="w-full border-collapse text-sm text-left whitespace-nowrap print:whitespace-normal">
                    <thead className="bg-slate-100/80 text-slate-600 print:bg-slate-200">
                        <tr>
                            <th className="border-b border-r border-slate-200 px-3 py-4 font-bold w-[40px] sticky left-0 z-20 bg-slate-100 text-center print:hidden">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === processedWorkers.length && processedWorkers.length > 0}
                                    onChange={toggleAll}
                                    className="cursor-pointer accent-[#24b47e]"
                                />
                            </th>
                            <th className={`border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[220px] sticky left-[40px] z-10 bg-slate-100 backdrop-blur-sm shadow-[1px_0_0_0_#e2e8f0] ${hiddenCols.has('name') ? 'print:hidden' : ''}`}>氏名 / 受入企業</th>
                            <th className={`border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[150px] sticky left-[260px] z-10 bg-slate-100 backdrop-blur-sm shadow-[1px_0_0_0_#e2e8f0] text-left ${hiddenCols.has('entry') ? 'print:hidden' : ''}`}>入国期生 / 入国日</th>
                            <th className={`border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[80px] sticky left-[410px] z-10 bg-slate-100 backdrop-blur-sm shadow-[1px_0_0_0_#e2e8f0] text-left ${hiddenCols.has('written') ? 'print:hidden' : ''}`}>学科日</th>
                            <th className={`border-b border-r border-slate-200 px-2 py-4 font-bold text-[11px] uppercase tracking-wider w-[50px] sticky left-[490px] z-10 bg-slate-100 backdrop-blur-sm shadow-[1px_0_0_0_#e2e8f0] text-left ${hiddenCols.has('written') ? 'print:hidden' : ''}`}>学科</th>
                            <th className={`border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[80px] sticky left-[540px] z-10 bg-slate-100 backdrop-blur-sm shadow-[1px_0_0_0_#e2e8f0] text-left ${hiddenCols.has('practical') ? 'print:hidden' : ''}`}>実技日</th>
                            <th className={`border-b border-r border-slate-200 px-2 py-4 font-bold text-[11px] uppercase tracking-wider w-[50px] sticky left-[620px] z-10 bg-slate-100 backdrop-blur-sm shadow-[1px_0_0_0_#e2e8f0] text-left ${hiddenCols.has('practical') ? 'print:hidden' : ''}`}>実技</th>
                            <th className={`border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[8%] text-left ${hiddenCols.has('occ') ? 'print:hidden' : ''}`}>職種</th>
                            <th className={`border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[8%] print-col-task text-left ${hiddenCols.has('occ') ? 'print:hidden' : ''}`}>業務内容</th>
                            <th className={`border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[10%] text-left ${hiddenCols.has('loc') ? 'print:hidden' : ''}`}>地点</th>
                            <th className={`border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[10%] text-left ${hiddenCols.has('loc') ? 'print:hidden' : ''}`}>立会者</th>
                            <th className="border-b border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[8%] text-left print:hidden">進捗</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {!hasData ? (
                            <tr>
                                <td colSpan={12} className="text-left py-16 text-slate-400 text-sm pl-4">
                                    対象データがありません。
                                </td>
                            </tr>
                        ) : (
                            processedWorkers.map((worker) => (
                                <tr key={worker.id} className={`group transition-colors hover:bg-slate-50/50 ${!selectedIds.has(worker.id) ? 'print:hidden grayscale text-slate-300' : ''}`}>
                                    <td className="border-r border-slate-100/50 px-3 py-4 bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50/50 transition-colors text-center print:hidden">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(worker.id)}
                                            onChange={() => toggleId(worker.id)}
                                            className="cursor-pointer accent-[#24b47e]"
                                        />
                                    </td>
                                    <td className={`border-r border-slate-100/50 p-4 bg-white sticky left-[40px] z-10 shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50/50 transition-colors ${hiddenCols.has('name') ? 'print:hidden' : ''}`}>
                                        <div className="font-bold text-slate-800 leading-tight">{worker.name || '---'}</div>
                                        <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">{worker.company || '---'}</div>
                                    </td>
                                    <td className={`border-r border-slate-100/50 p-4 bg-white sticky left-[260px] z-10 shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50/50 transition-colors ${hiddenCols.has('entry') ? 'print:hidden' : ''}`}>
                                        <div className="font-medium text-slate-700">{worker.entryBatch || '---'}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{worker.entryDate || '---'}</div>
                                    </td>
                                    <td className={`border-r border-slate-100/50 p-4 bg-white sticky left-[410px] z-10 text-slate-600 text-left shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50/50 transition-colors ${hiddenCols.has('written') ? 'print:hidden' : ''}`}>
                                        <input
                                            type="date"
                                            value={worker.kenteiStatus.exam_date_written || ''}
                                            onChange={(e) => onUpdate?.(worker.id, 'kentei_status', 'exam_date_written', e.target.value)}
                                            className="text-xs bg-transparent outline-none border-none w-full text-left font-mono"
                                        />
                                    </td>
                                    <td className={`border-r border-slate-100/50 p-2 bg-white sticky left-[490px] z-10 text-left shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50/50 transition-colors ${hiddenCols.has('written') ? 'print:hidden' : ''}`}>
                                        <button
                                            onClick={() => {
                                                const next = worker.kenteiStatus.exam_result_written === '○' ? '×' : (worker.kenteiStatus.exam_result_written === '×' ? '---' : '○');
                                                onUpdate?.(worker.id, 'kentei_status', 'exam_result_written', next);
                                            }}
                                            className={`w-7 h-7 rounded-full font-black text-sm transition-all active:scale-90 ${worker.kenteiStatus.exam_result_written === '○' ? 'bg-emerald-100 text-emerald-700' :
                                                worker.kenteiStatus.exam_result_written === '×' ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-300'
                                                }`}
                                        >
                                            {worker.kenteiStatus.exam_result_written === '---' || !worker.kenteiStatus.exam_result_written ? '-' : worker.kenteiStatus.exam_result_written}
                                        </button>
                                    </td>
                                    <td className={`border-r border-slate-100/50 p-4 bg-white sticky left-[540px] z-10 text-slate-600 text-left shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50/50 transition-colors ${hiddenCols.has('practical') ? 'print:hidden' : ''}`}>
                                        <input
                                            type="date"
                                            value={worker.kenteiStatus.exam_date_practical || ''}
                                            onChange={(e) => onUpdate?.(worker.id, 'kentei_status', 'exam_date_practical', e.target.value)}
                                            className="text-xs bg-transparent outline-none border-none w-full text-left font-mono"
                                        />
                                    </td>
                                    <td className={`border-r border-slate-100/50 p-2 bg-white sticky left-[620px] z-10 text-left shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50/50 transition-colors ${hiddenCols.has('practical') ? 'print:hidden' : ''}`}>
                                        <button
                                            onClick={() => {
                                                const next = worker.kenteiStatus.exam_result_practical === '○' ? '×' : (worker.kenteiStatus.exam_result_practical === '×' ? '---' : '○');
                                                onUpdate?.(worker.id, 'kentei_status', 'exam_result_practical', next);
                                            }}
                                            className={`w-7 h-7 rounded-full font-black text-sm transition-all active:scale-90 ${worker.kenteiStatus.exam_result_practical === '○' ? 'bg-emerald-100 text-emerald-700' :
                                                worker.kenteiStatus.exam_result_practical === '×' ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-300'
                                                }`}
                                        >
                                            {worker.kenteiStatus.exam_result_practical === '---' || !worker.kenteiStatus.exam_result_practical ? '-' : worker.kenteiStatus.exam_result_practical}
                                        </button>
                                    </td>
                                    <td className={`border-r border-slate-100/50 p-4 text-slate-600 text-left ${hiddenCols.has('occ') ? 'print:hidden' : ''}`}>
                                        {worker.occupation || '---'}
                                    </td>
                                    <td className={`border-r border-slate-100/50 p-4 text-slate-700 text-left ${hiddenCols.has('occ') ? 'print:hidden' : ''}`}>
                                        {worker.kenteiStatus.type}
                                    </td>
                                    <td className={`border-r border-slate-100/50 p-4 text-slate-600 text-left ${hiddenCols.has('loc') ? 'print:hidden' : ''}`}>
                                        <input
                                            list="exam-locations"
                                            type="text"
                                            value={worker.kenteiStatus.exam_location || ''}
                                            onChange={(e) => onUpdate?.(worker.id, 'kentei_status', 'exam_location', e.target.value)}
                                            className="text-xs bg-transparent outline-none border border-slate-100 rounded-[32px] px-3 py-1 w-full text-left"
                                            placeholder="地点..."
                                        />
                                    </td>
                                    <td className={`border-r border-slate-100/50 p-4 text-slate-600 text-left ${hiddenCols.has('loc') ? 'print:hidden' : ''}`}>
                                        <select
                                            value={worker.kenteiStatus.witness || '---'}
                                            onChange={(e) => onUpdate?.(worker.id, 'kentei_status', 'witness', e.target.value)}
                                            className="text-xs bg-transparent outline-none w-full cursor-pointer text-left"
                                        >
                                            {STAFF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-4 text-left print:hidden">
                                        <button
                                            onClick={() => {
                                                const next = worker.kenteiStatus.progress === '完了' ? '未着手' : (worker.kenteiStatus.progress === '進行中' ? '完了' : '進行中');
                                                onUpdate?.(worker.id, 'kentei_status', 'progress', next);
                                            }}
                                            className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm transition-all active:scale-95 ${worker.kenteiStatus.progress === '完了' ? 'bg-emerald-50 text-[#24b47e]' :
                                                worker.kenteiStatus.progress === '進行中' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-slate-100 text-slate-400'
                                                }`}
                                        >
                                            {worker.kenteiStatus.progress || '未着手'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div >

            <datalist id="exam-locations">
                <option value="CAT大阪南" />
                <option value="CAT兵庫" />
                <option value="CAT東関東" />
                <option value="会社住所" />
            </datalist>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }
                    
                    html, body {
                        width: 100%;
                        height: auto;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    body * {
                        visibility: hidden;
                    }
                    
                    .print-target,
                    .print-target * {
                        visibility: visible !important;
                    }
                    
                    .print-target {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important;
                    }

                    .print-hidden {
                        display: none !important;
                    }

                    table {
                        width: 100% !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                        border: 1.5px solid #000 !important;
                        margin: 0 auto !important;
                    }
                    
                    th, td {
                        border: 1px solid #000 !important;
                        padding: 8px 4px !important;
                        font-size: 8pt !important;
                        white-space: normal !important;
                        word-break: break-all !important;
                        text-align: left !important;
                        vertical-align: middle !important;
                        color: #000 !important;
                        visibility: visible !important;
                    }

                    th {
                        background-color: #f1f5f9 !important;
                        font-weight: bold !important;
                    }

                    input, select {
                        border: none !important;
                        background: none !important;
                        appearance: none !important;
                        text-align: left !important;
                        width: 100% !important;
                        font-family: inherit !important;
                        font-size: inherit !important;
                        color: #000 !important;
                        visibility: visible !important;
                    }

                    .sticky {
                        position: static !important;
                        box-shadow: none !important;
                        background: none !important;
                        left: auto !important;
                        z-index: auto !important;
                        backdrop-filter: none !important;
                        -webkit-backdrop-filter: none !important;
                    }
                }
                `
            }} />
        </div >
    )
}
