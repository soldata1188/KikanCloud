'use client'

import React, { useState } from 'react'

export default function ExamTab({ initialExams = [] }: { initialExams?: any[] }) {
    const [exams, setExams] = useState(initialExams)

    return (
        <div className="w-full bg-white p-6 border border-gray-350 border-t-0 shadow-none">
            <div className="overflow-x-auto no-scrollbar pb-10">
                <table className="w-full border-collapse text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-800">
                        <tr>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[150px] sticky left-0 z-10 bg-gray-50 shadow-[1px_0_0_0_#d1d5db]">氏名</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[150px] sticky left-[150px] z-10 bg-gray-50 shadow-[1px_0_0_0_#d1d5db]">受入企業</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[120px]">試験種類</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[150px]">目標レベル</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[120px]">期限</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[150px]">結果</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialExams.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-gray-500 text-sm border-b border-l border-r border-gray-350">
                                    データがありません。
                                </td>
                            </tr>
                        ) : (
                            initialExams.map((worker, idx) => (
                                <tr key={idx} className="hover:bg-primary-50 transition-colors">
                                    <td className="border border-gray-350 p-3 bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#d1d5db] font-medium group-hover:bg-primary-50">
                                        {worker.full_name_romaji || '---'}
                                    </td>
                                    <td className="border border-gray-350 p-3 bg-white sticky left-[150px] z-10 shadow-[1px_0_0_0_#d1d5db] text-gray-600 group-hover:bg-primary-50">
                                        {worker.companies?.name_jp || '---'}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {worker.exams && worker.exams.length > 0 ? (worker.exams[0].exam_type === 'japanese' ? '日本語' : '技能') : <span className="text-gray-400">データなし</span>}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {worker.exams && worker.exams.length > 0 ? worker.exams[0].target_level : <span className="text-gray-400">データなし</span>}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {worker.exams && worker.exams.length > 0 ? worker.exams[0].deadline_date : <span className="text-gray-400">データなし</span>}
                                    </td>
                                    <td className="border border-gray-350 p-2">
                                        {worker.exams && worker.exams.length > 0 ? (
                                            <select
                                                value={worker.exams[0].result || 'planned'}
                                                className="w-full text-xs p-1.5 border border-gray-350 bg-gray-50 rounded outline-none focus:border-primary-500 cursor-pointer"
                                                onChange={() => { }} // Placeholder for future active updates
                                            >
                                                <option value="planned">予定 (Planned)</option>
                                                <option value="passed">合格 (Passed)</option>
                                                <option value="failed">不合格 (Failed)</option>
                                            </select>
                                        ) : (
                                            <span className="text-gray-400">データなし</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
