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
        <div className="w-full bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none print:rounded-none print-target">
            {/* Print-only Title */}
            <div className="hidden print:block text-center mb-6">
                <h1 className="text-xl font-bold border-b-2 border-black inline-block pb-1">検定・試験進捗一覧</h1>
                <div className="text-right text-[10px] mt-2 text-gray-400">
                    印刷日: {new Date().toLocaleDateString('ja-JP')}
                </div>
            </div>

            {/* Header with Print Button and Filters */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 print:hidden space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-gray-900 text-sm font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0067b8]"></span>
                            検定・試験進捗一覧
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5 ml-3.5">※ 必要のない項目や行のチェックを外して印刷できます</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 p-0.5 rounded-sm">
                            {PRINT_COLUMNS.map(col => (
                                <button
                                    key={col.id}
                                    onClick={() => toggleCol(col.id)}
                                    className={`px-3 py-1 rounded-sm text-[10px] font-bold transition-all ${!hiddenCols.has(col.id)
                                        ? 'bg-white text-gray-700 shadow-sm border border-gray-200'
                                        : 'text-gray-400 hover:text-gray-500'
                                        }`}
                                >
                                    {col.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-1.5 bg-[#0067b8] text-white rounded-sm text-[12px] font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95 ml-2"
                        >
                            <Printer size={14} />
                            PDFとして印刷 (A4横)
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 items-end">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-0.5 italic">入国期生</label>
                        <select
                            value={batchFilter}
                            onChange={(e) => setBatchFilter(e.target.value)}
                            className="block w-36 text-[11px] border border-gray-200 rounded-sm px-3 py-1.5 outline-none focus:border-[#0067b8] bg-white text-gray-700 font-medium"
                        >
                            <option value="all">すべて</option>
                            {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-0.5 italic">業務内容</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="block w-36 text-[11px] border border-gray-200 rounded-sm px-3 py-1.5 outline-none focus:border-[#0067b8] bg-white text-gray-700 font-medium"
                        >
                            <option value="all">すべて</option>
                            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-0.5 italic">職種</label>
                        <select
                            value={occFilter}
                            onChange={(e) => setOccFilter(e.target.value)}
                            className="block w-36 text-[11px] border border-gray-200 rounded-sm px-3 py-1.5 outline-none focus:border-[#0067b8] bg-white text-gray-700 font-medium"
                        >
                            <option value="all">すべて</option>
                            {uniqueOccs.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto no-scrollbar print:overflow-visible">
                <table className="w-full border-collapse text-sm text-left whitespace-nowrap print:whitespace-normal">
                    <thead className="bg-gray-50 text-gray-500 print:bg-gray-100">
                        <tr>
                            <th className="border-b border-r border-gray-200 px-3 py-3 font-bold w-[40px] sticky left-0 z-20 bg-gray-50 text-center print:hidden">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === processedWorkers.length && processedWorkers.length > 0}
                                    onChange={toggleAll}
                                    className="cursor-pointer accent-[#0067b8]"
                                />
                            </th>
                            <th className={`border-b border-r border-gray-200 px-4 py-3 font-bold text-[10px] uppercase tracking-wider w-[220px] sticky left-[40px] z-10 bg-gray-50 shadow-[1px_0_0_0_#e5e7eb] ${hiddenCols.has('name') ? 'print:hidden' : ''}`}>氏名 / 受入企業</th>
                            <th className={`border-b border-r border-gray-200 px-4 py-3 font-bold text-[10px] uppercase tracking-wider w-[150px] sticky left-[260px] z-10 bg-gray-50 shadow-[1px_0_0_0_#e5e7eb] text-left ${hiddenCols.has('entry') ? 'print:hidden' : ''}`}>入国期生 / 入国日</th>
                            <th className={`border-b border-r border-gray-200 px-4 py-3 font-bold text-[10px] uppercase tracking-wider w-[100px] sticky left-[410px] z-10 bg-gray-50 shadow-[1px_0_0_0_#e5e7eb] text-left ${hiddenCols.has('written') ? 'print:hidden' : ''}`}>学科日</th>
                            <th className={`border-b border-r border-gray-200 px-2 py-3 font-bold text-[10px] uppercase tracking-wider w-[50px] sticky left-[510px] z-10 bg-gray-50 shadow-[1px_0_0_0_#e5e7eb] text-center ${hiddenCols.has('written') ? 'print:hidden' : ''}`}>学科</th>
                            <th className={`border-b border-r border-gray-200 px-4 py-3 font-bold text-[10px] uppercase tracking-wider w-[100px] sticky left-[560px] z-10 bg-gray-50 shadow-[1px_0_0_0_#e5e7eb] text-left ${hiddenCols.has('practical') ? 'print:hidden' : ''}`}>実技日</th>
                            <th className={`border-b border-r border-gray-200 px-2 py-3 font-bold text-[10px] uppercase tracking-wider w-[50px] sticky left-[660px] z-10 bg-gray-50 shadow-[1px_0_0_0_#e5e7eb] text-center ${hiddenCols.has('practical') ? 'print:hidden' : ''}`}>実技</th>
                            <th className={`border-b border-r border-gray-200 px-4 py-3 font-bold text-[10px] uppercase tracking-wider w-[100px] text-left ${hiddenCols.has('occ') ? 'print:hidden' : ''}`}>職種</th>
                            <th className={`border-b border-r border-gray-200 px-4 py-3 font-bold text-[10px] uppercase tracking-wider w-[120px] print-col-task text-left ${hiddenCols.has('occ') ? 'print:hidden' : ''}`}>業務内容</th>
                            <th className={`border-b border-r border-gray-200 px-4 py-3 font-bold text-[10px] uppercase tracking-wider w-[120px] text-left ${hiddenCols.has('loc') ? 'print:hidden' : ''}`}>地点</th>
                            <th className={`border-b border-r border-gray-200 px-4 py-3 font-bold text-[10px] uppercase tracking-wider w-[100px] text-left ${hiddenCols.has('loc') ? 'print:hidden' : ''}`}>立会者</th>
                            <th className="border-b border-gray-200 px-4 py-3 font-bold text-[10px] uppercase tracking-wider w-[80px] text-left print:hidden">進捗</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {!hasData ? (
                            <tr>
                                <td colSpan={12} className="text-left py-12 text-gray-400 text-xs pl-4">
                                    対象データがありません。
                                </td>
                            </tr>
                        ) : (
                            processedWorkers.map((worker) => (
                                <tr key={worker.id} className={`group transition-colors hover:bg-gray-50/50 ${!selectedIds.has(worker.id) ? 'print:hidden grayscale text-gray-300' : ''}`}>
                                    <td className="border-r border-gray-100 px-3 py-3 bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#f3f4f6] group-hover:bg-gray-50/50 transition-colors text-center print:hidden">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(worker.id)}
                                            onChange={() => toggleId(worker.id)}
                                            className="cursor-pointer accent-[#0067b8]"
                                        />
                                    </td>
                                    <td className={`border-r border-gray-100 p-3 bg-white sticky left-[40px] z-10 shadow-[1px_0_0_0_#f3f4f6] group-hover:bg-gray-50/50 transition-colors ${hiddenCols.has('name') ? 'print:hidden' : ''}`}>
                                        <div className="font-bold text-gray-900 leading-tight text-sm">{worker.name || '---'}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px]">{worker.company || '---'}</div>
                                    </td>
                                    <td className={`border-r border-gray-100 p-3 bg-white sticky left-[260px] z-10 shadow-[1px_0_0_0_#f3f4f6] group-hover:bg-gray-50/50 transition-colors ${hiddenCols.has('entry') ? 'print:hidden' : ''}`}>
                                        <div className="font-bold text-gray-700 text-[11px]">{worker.entryBatch || '---'}</div>
                                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{worker.entryDate || '---'}</div>
                                    </td>
                                    <td className={`border-r border-gray-100 p-3 bg-white sticky left-[410px] z-10 text-gray-600 text-left shadow-[1px_0_0_0_#f3f4f6] group-hover:bg-gray-50/50 transition-colors ${hiddenCols.has('written') ? 'print:hidden' : ''}`}>
                                        <input
                                            type="date"
                                            value={worker.kenteiStatus.exam_date_written || ''}
                                            onChange={(e) => onUpdate?.(worker.id, 'kentei_status', 'exam_date_written', e.target.value)}
                                            className="text-[11px] bg-transparent outline-none border border-transparent hover:border-gray-200 focus:border-[#0067b8] rounded-sm px-1 w-full text-left font-mono"
                                        />
                                    </td>
                                    <td className={`border-r border-gray-100 p-2 bg-white sticky left-[510px] z-10 text-center shadow-[1px_0_0_0_#f3f4f6] group-hover:bg-gray-50/50 transition-colors ${hiddenCols.has('written') ? 'print:hidden' : ''}`}>
                                        <button
                                            onClick={() => {
                                                const next = worker.kenteiStatus.exam_result_written === '○' ? '×' : (worker.kenteiStatus.exam_result_written === '×' ? '---' : '○');
                                                onUpdate?.(worker.id, 'kentei_status', 'exam_result_written', next);
                                            }}
                                            className={`w-6 h-6 rounded-sm font-black text-[12px] transition-all active:scale-90 border ${worker.kenteiStatus.exam_result_written === '○' ? 'bg-blue-50 text-[#0067b8] border-blue-100' :
                                                worker.kenteiStatus.exam_result_written === '×' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-300 border-gray-100'
                                                }`}
                                        >
                                            {worker.kenteiStatus.exam_result_written === '---' || !worker.kenteiStatus.exam_result_written ? '-' : worker.kenteiStatus.exam_result_written}
                                        </button>
                                    </td>
                                    <td className={`border-r border-gray-100 p-3 bg-white sticky left-[560px] z-10 text-gray-600 text-left shadow-[1px_0_0_0_#f3f4f6] group-hover:bg-gray-50/50 transition-colors ${hiddenCols.has('practical') ? 'print:hidden' : ''}`}>
                                        <input
                                            type="date"
                                            value={worker.kenteiStatus.exam_date_practical || ''}
                                            onChange={(e) => onUpdate?.(worker.id, 'kentei_status', 'exam_date_practical', e.target.value)}
                                            className="text-[11px] bg-transparent outline-none border border-transparent hover:border-gray-200 focus:border-[#0067b8] rounded-sm px-1 w-full text-left font-mono"
                                        />
                                    </td>
                                    <td className={`border-r border-gray-100 p-2 bg-white sticky left-[660px] z-10 text-center shadow-[1px_0_0_0_#f3f4f6] group-hover:bg-gray-50/50 transition-colors ${hiddenCols.has('practical') ? 'print:hidden' : ''}`}>
                                        <button
                                            onClick={() => {
                                                const next = worker.kenteiStatus.exam_result_practical === '○' ? '×' : (worker.kenteiStatus.exam_result_practical === '×' ? '---' : '○');
                                                onUpdate?.(worker.id, 'kentei_status', 'exam_result_practical', next);
                                            }}
                                            className={`w-6 h-6 rounded-sm font-black text-[12px] transition-all active:scale-90 border ${worker.kenteiStatus.exam_result_practical === '○' ? 'bg-blue-50 text-[#0067b8] border-blue-100' :
                                                worker.kenteiStatus.exam_result_practical === '×' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-300 border-gray-100'
                                                }`}
                                        >
                                            {worker.kenteiStatus.exam_result_practical === '---' || !worker.kenteiStatus.exam_result_practical ? '-' : worker.kenteiStatus.exam_result_practical}
                                        </button>
                                    </td>
                                    <td className={`border-r border-gray-100 p-3 text-gray-600 text-left text-[11px] ${hiddenCols.has('occ') ? 'print:hidden' : ''}`}>
                                        {worker.occupation || '---'}
                                    </td>
                                    <td className={`border-r border-gray-100 p-3 text-gray-700 text-left font-bold text-[11px] ${hiddenCols.has('occ') ? 'print:hidden' : ''}`}>
                                        {worker.kenteiStatus.type}
                                    </td>
                                    <td className={`border-r border-gray-100 p-3 text-gray-600 text-left ${hiddenCols.has('loc') ? 'print:hidden' : ''}`}>
                                        <input
                                            list="exam-locations"
                                            type="text"
                                            value={worker.kenteiStatus.exam_location || ''}
                                            onChange={(e) => onUpdate?.(worker.id, 'kentei_status', 'exam_location', e.target.value)}
                                            className="text-[11px] bg-transparent outline-none border border-gray-100 rounded-sm px-2 py-1 w-full text-left focus:border-[#0067b8] transition-colors"
                                            placeholder="地点..."
                                        />
                                    </td>
                                    <td className={`border-r border-gray-100 p-3 text-gray-600 text-left ${hiddenCols.has('loc') ? 'print:hidden' : ''}`}>
                                        <select
                                            value={worker.kenteiStatus.witness || '---'}
                                            onChange={(e) => onUpdate?.(worker.id, 'kentei_status', 'witness', e.target.value)}
                                            className="text-[11px] bg-transparent outline-none w-full cursor-pointer text-left border border-transparent hover:border-gray-100 focus:border-[#0067b8] rounded-sm py-1"
                                        >
                                            {STAFF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-3 text-left print:hidden">
                                        <button
                                            onClick={() => {
                                                const next = worker.kenteiStatus.progress === '完了' ? '未着手' : (worker.kenteiStatus.progress === '進行中' ? '完了' : '進行中');
                                                onUpdate?.(worker.id, 'kentei_status', 'progress', next);
                                            }}
                                            className={`px-2 py-1 rounded-sm text-[10px] font-bold shadow-sm transition-all active:scale-95 border ${worker.kenteiStatus.progress === '完了' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                worker.kenteiStatus.progress === '進行中' ? 'bg-blue-50 text-[#0067b8] border-blue-100' :
                                                    'bg-gray-50 text-gray-400 border-gray-200'
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
                        border: 1px solid #000 !important;
                        margin: 0 auto !important;
                    }
                    
                    th, td {
                        border: 1px solid #000 !important;
                        padding: 6px 4px !important;
                        font-size: 8pt !important;
                        white-space: normal !important;
                        word-break: break-all !important;
                        text-align: left !important;
                        vertical-align: middle !important;
                        color: #000 !important;
                        visibility: visible !important;
                    }

                    th {
                        background-color: #f3f4f6 !important;
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
