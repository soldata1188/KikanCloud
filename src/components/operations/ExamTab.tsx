'use client'

import React, { useState } from 'react'
import { Printer } from 'lucide-react'

export default function ExamTab({ workers = [], onUpdate }: { workers?: any[], onUpdate?: (id: string, field: 'kentei_status', subField: any, value: string) => void }) {
    // Filter workers who have a valid kenteiStatus type selected
    const examWorkers = workers.filter(w => w.kenteiStatus && w.kenteiStatus.type && w.kenteiStatus.type !== '---');

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none print:rounded-none">
            {/* Print-only Title */}
            <div className="hidden print:block text-center mb-6">
                <h1 className="text-xl font-bold border-b-2 border-black inline-block pb-1">検定・試験進捗一覧</h1>
                <div className="text-right text-[10px] mt-2 text-gray-500">
                    印刷日: {new Date().toLocaleDateString('ja-JP')}
                </div>
            </div>

            {/* Header with Print Button */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/30 print:hidden">
                <h3 className="text-gray-800 font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                    検定・試験進捗一覧
                </h3>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <Printer size={16} />
                    PDFとして印刷 (A4横)
                </button>
            </div>

            <div className="overflow-x-auto no-scrollbar print:overflow-visible">
                <table className="w-full border-collapse text-sm text-left whitespace-nowrap print:whitespace-normal">
                    <thead className="bg-gray-50 text-gray-800 print:bg-gray-100">
                        <tr>
                            <th className="border border-gray-350 px-4 py-3 font-semibold w-[12%] sticky left-0 z-10 bg-gray-50 shadow-[1px_0_0_0_#d1d5db] print:w-[12%] print-col-name">氏名</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold w-[18%] sticky left-[150px] z-10 bg-gray-50 shadow-[1px_0_0_0_#d1d5db] print:w-[18%] print-col-corp">受入企業</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold w-[10%] print:w-[10%] print-col-task">業務内容</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold w-[10%] print:w-[10%] print-col-date">学科日</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold w-[10%] print:w-[10%] print-col-date">実技日</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold w-[10%] print:w-[10%] print-col-staff">担当者</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold w-[10%] print:w-[10%] print-col-status">進捗</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold w-[20%] print:w-[20%] print-col-venue">試験会場</th>
                        </tr>
                    </thead>
                    <tbody>
                        {examWorkers.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-10 text-gray-500 text-sm border-b border-l border-r border-gray-350">
                                    対象データがありません。
                                </td>
                            </tr>
                        ) : (
                            examWorkers.map((worker) => (
                                <tr key={worker.id} className="hover:bg-primary-50 transition-colors">
                                    <td className="border border-gray-350 p-3 bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#d1d5db] font-medium group-hover:bg-primary-50">
                                        {worker.name || '---'}
                                    </td>
                                    <td className="border border-gray-350 p-3 bg-white sticky left-[150px] z-10 shadow-[1px_0_0_0_#d1d5db] text-gray-600 group-hover:bg-primary-50">
                                        {worker.company || '---'}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {worker.kenteiStatus.type}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {worker.kenteiStatus.exam_date_written || <span className="text-gray-400">---</span>}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {worker.kenteiStatus.exam_date_practical || <span className="text-gray-400">---</span>}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {worker.kenteiStatus.assignee || '---'}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${worker.kenteiStatus.progress === '完了' ? 'bg-green-100 text-green-700' :
                                            worker.kenteiStatus.progress === '進行中' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {worker.kenteiStatus.progress || '未着手'}
                                        </span>
                                    </td>
                                    <td className="border border-gray-350 p-2">
                                        <div className="print:hidden">
                                            <input
                                                type="text"
                                                placeholder="試験会場..."
                                                value={worker.kenteiStatus.exam_location || ''}
                                                onChange={(e) => onUpdate?.(worker.id, 'kentei_status', 'exam_location', e.target.value)}
                                                className="w-full text-xs p-1.5 border border-gray-200 rounded outline-none focus:border-primary-400 bg-gray-50/50"
                                            />
                                        </div>
                                        <div className="hidden print:block text-[9pt] px-1">
                                            {worker.kenteiStatus.exam_location || '---'}
                                        </div>
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
                    .print-col-venue { width: 20% !important; }
                    
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
