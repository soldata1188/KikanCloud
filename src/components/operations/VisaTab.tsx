'use client'

import React, { useState } from 'react'

export default function VisaTab({ initialVisas = [] }: { initialVisas?: any[] }) {
    const [visas, setVisas] = useState(initialVisas)

    return (
        <div className="w-full bg-white p-6 border border-gray-350 border-t-0 shadow-none">
            <div className="overflow-x-auto no-scrollbar pb-10">
                <table className="w-full border-collapse text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-800">
                        <tr>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[150px] sticky left-0 z-10 bg-gray-50 shadow-[1px_0_0_0_#d1d5db]">氏名</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[150px] sticky left-[150px] z-10 bg-gray-50 shadow-[1px_0_0_0_#d1d5db]">受入企業</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[120px]">制度</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[150px]">ビザ種類</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[120px]">有効期限</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[180px]">申請状況</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialVisas.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-gray-500 text-sm border-b border-l border-r border-gray-350">
                                    データがありません。
                                </td>
                            </tr>
                        ) : (
                            initialVisas.map((visa, idx) => (
                                <tr key={idx} className="hover:bg-primary-50 transition-colors">
                                    <td className="border border-gray-350 p-3 bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#d1d5db] font-medium group-hover:bg-primary-50">
                                        {visa.worker?.full_name_romaji || '---'}
                                    </td>
                                    <td className="border border-gray-350 p-3 bg-white sticky left-[150px] z-10 shadow-[1px_0_0_0_#d1d5db] text-gray-600 group-hover:bg-primary-50">
                                        {visa.worker?.companies?.name_jp || '---'}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {visa.worker?.system_type === 'tokuteigino' ? '特定技能' : (visa.worker?.system_type === 'ginou_jisshu' ? '技能実習' : '育成就労')}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {visa.visa_type || <span className="text-gray-400">データなし</span>}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {visa.expiration_date || <span className="text-gray-400">データなし</span>}
                                    </td>
                                    <td className="border border-gray-350 p-2">
                                        <select
                                            value={visa.process_status || 'gathering'}
                                            className="w-full text-xs p-1.5 border border-gray-350 bg-gray-50 rounded outline-none focus:border-primary-500 cursor-pointer"
                                            onChange={() => { }} // Placeholder for active handle implementation
                                        >
                                            <option value="gathering">書類収集 (Gathering)</option>
                                            <option value="submitted">申請済 (Submitted)</option>
                                            <option value="additional_req">追加資料 (Additional Req)</option>
                                            <option value="approved">許可 (Approved)</option>
                                        </select>
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
