'use client'

import React from 'react'
import { Printer } from 'lucide-react'

export default function ExamTab({ workers = [], onUpdate }: { workers?: any[], onUpdate?: (id: string, field: 'kentei_status', subField: any, value: string) => void }) {
    // Filter workers who have a valid kenteiStatus type selected
    const examWorkers = workers.filter(w => w.kenteiStatus && w.kenteiStatus.type && w.kenteiStatus.type !== '---');

    return (
        <div className="w-full bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none">
            {/* Print-only Title */}
            <div className="hidden print:block text-center mb-6">
                <h1 className="text-xl font-bold border-b-2 border-black inline-block pb-1">検定・試験進捗一覧</h1>
                <div className="text-right text-[10px] mt-2 text-slate-500">
                    印刷日: {new Date().toLocaleDateString('ja-JP')}
                </div>
            </div>

            {/* Header with Print Button */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/30 print:hidden">
                <h3 className="text-slate-800 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#24b47e]"></span>
                    検定・試験進捗一覧
                </h3>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#24b47e] text-white rounded-[12px] text-sm font-bold hover:bg-[#1e9a6a] transition-all shadow-md shadow-[#24b47e]/20 active:scale-95"
                >
                    <Printer size={16} />
                    PDFとして印刷 (A4横)
                </button>
            </div>

            <div className="overflow-x-auto no-scrollbar print:overflow-visible">
                <table className="w-full border-collapse text-sm text-left whitespace-nowrap print:whitespace-normal">
                    <thead className="bg-slate-50/50 text-slate-500 print:bg-slate-100">
                        <tr>
                            <th className="border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[12%] sticky left-0 z-10 bg-slate-50/80 backdrop-blur-sm print:w-[12%] print-col-name shadow-[1px_0_0_0_#e2e8f0]">氏名</th>
                            <th className="border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[18%] sticky left-[150px] z-10 bg-slate-50/80 backdrop-blur-sm print:w-[18%] print-col-corp shadow-[1px_0_0_0_#e2e8f0]">受入企業</th>
                            <th className="border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[10%] print:w-[10%] print-col-task text-center">業務内容</th>
                            <th className="border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[10%] print:w-[10%] print-col-date text-center">学科日</th>
                            <th className="border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[10%] print:w-[10%] print-col-date text-center">実技日</th>
                            <th className="border-b border-r border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[10%] print:w-[10%] print-col-staff text-center">担当者</th>
                            <th className="border-b border-slate-200 px-4 py-4 font-bold text-[11px] uppercase tracking-wider w-[10%] print:w-[10%] print-col-status text-center">進捗</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {examWorkers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-16 text-slate-400 text-sm">
                                    対象データがありません。
                                </td>
                            </tr>
                        ) : (
                            examWorkers.map((worker) => (
                                <tr key={worker.id} className="group transition-colors hover:bg-slate-50/50">
                                    <td className="border-r border-slate-100/50 p-4 bg-white sticky left-0 z-10 font-bold text-slate-800 shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50/50 transition-colors">
                                        {worker.name || '---'}
                                    </td>
                                    <td className="border-r border-slate-100/50 p-4 bg-white sticky left-[150px] z-10 text-slate-600 font-medium shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50/50 transition-colors">
                                        {worker.company || '---'}
                                    </td>
                                    <td className="border-r border-slate-100/50 p-4 text-slate-700 text-center">
                                        {worker.kenteiStatus.type}
                                    </td>
                                    <td className="border-r border-slate-100/50 p-4 text-slate-600 font-mono text-center">
                                        {worker.kenteiStatus.exam_date_written || <span className="text-slate-300">---</span>}
                                    </td>
                                    <td className="border-r border-slate-100/50 p-4 text-slate-600 font-mono text-center">
                                        {worker.kenteiStatus.exam_date_practical || <span className="text-slate-300">---</span>}
                                    </td>
                                    <td className="border-r border-slate-100/50 p-4 text-slate-600 text-center">
                                        {worker.kenteiStatus.assignee || '---'}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm ${worker.kenteiStatus.progress === '完了' ? 'bg-emerald-50 text-[#24b47e]' :
                                            worker.kenteiStatus.progress === '進行中' ? 'bg-blue-50 text-blue-600' :
                                                'bg-slate-100 text-slate-400'
                                            }`}>
                                            {worker.kenteiStatus.progress || '未着手'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 5mm;
                    }
                    
                    /* Reset everything for printing */
                    html, body {
                        width: 100%;
                        height: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    body * {
                        visibility: hidden;
                    }
                    
                    .print-target,
                    .print-target * {
                        visibility: visible;
                    }
                    
                    .print-target {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        visibility: visible;
                        display: block !important;
                    }

                    .print-hidden {
                        display: none !important;
                    }

                    table {
                        width: 100% !important;
                        max-width: 100% !important;
                        table-layout: fixed !important;
                        border-collapse: collapse !important;
                        border: 1.5px solid #000 !important;
                        margin: 0 auto !important;
                        visibility: visible !important;
                    }
                    
                    th, td {
                        border: 1px solid #000 !important;
                        padding: 8px 4px !important;
                        font-size: 8.5pt !important;
                        white-space: normal !important;
                        word-break: break-all !important;
                        overflow: hidden !important;
                        visibility: visible !important;
                    }

                    /* Strictly enforce column widths in print */
                    .print-col-name { width: 12% !important; }
                    .print-col-corp { width: 18% !important; }
                    .print-col-task { width: 10% !important; }
                    .print-col-date { width: 10% !important; }
                    .print-col-staff { width: 10% !important; }
                    .print-col-status { width: 10% !important; }
                    
                    th {
                        background-color: #f3f4f6 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        font-weight: bold !important;
                    }

                    .sticky {
                        position: static !important;
                        box-shadow: none !important;
                        background: none !important;
                        left: auto !important;
                        right: auto !important;
                    }
                }
                `
            }} />
        </div>
    )
}
