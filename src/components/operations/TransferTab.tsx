'use client'

import React, { useState } from 'react'

export default function TransferTab({ initialTransfers = [] }: { initialTransfers?: any[] }) {
    const [transfers, setTransfers] = useState(initialTransfers)

    return (
        <div className="w-full bg-white p-6 border border-gray-350 border-t-0 shadow-none">
            <div className="overflow-x-auto no-scrollbar pb-10">
                <table className="w-full border-collapse text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-800">
                        <tr>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[150px] sticky left-0 z-10 bg-gray-50 shadow-[1px_0_0_0_#d1d5db]">氏名</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[150px] sticky left-[150px] z-10 bg-gray-50 shadow-[1px_0_0_0_#d1d5db]">現在の企業</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[150px]">元の企業</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[150px]">新しい企業</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[150px]">異動理由</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[120px]">異動日</th>
                            <th className="border border-gray-350 px-4 py-3 font-semibold min-w-[180px]">ステータス</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialTransfers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500 text-sm border-b border-l border-r border-gray-350">
                                    データがありません。
                                </td>
                            </tr>
                        ) : (
                            initialTransfers.map((transfer, idx) => (
                                <tr key={idx} className="hover:bg-primary-50 transition-colors">
                                    <td className="border border-gray-350 p-3 bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#d1d5db] font-medium group-hover:bg-primary-50">
                                        {transfer.worker?.full_name_romaji || '---'}
                                    </td>
                                    <td className="border border-gray-350 p-3 bg-white sticky left-[150px] z-10 shadow-[1px_0_0_0_#d1d5db] text-gray-600 group-hover:bg-primary-50">
                                        {transfer.worker?.companies?.name_jp || '---'}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {transfer.from_company?.name_jp || <span className="text-gray-400">データなし</span>}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {transfer.to_company ? transfer.to_company.name_jp : '未定 (TBD)'}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {transfer.reason === 'voluntary' ? '自己都合' : '会社都合'}
                                    </td>
                                    <td className="border border-gray-350 p-3">
                                        {transfer.transfer_date || <span className="text-gray-400">データなし</span>}
                                    </td>
                                    <td className="border border-gray-350 p-2">
                                        <select
                                            value={transfer.status || 'intent_declared'}
                                            className="w-full text-xs p-1.5 border border-gray-350 bg-gray-50 rounded outline-none focus:border-primary-500 cursor-pointer"
                                            onChange={() => { }} // Placeholder for future mutations
                                        >
                                            <option value="intent_declared">意向表明 (Intent Declared)</option>
                                            <option value="hello_work_matching">ハローワーク (Hello Work)</option>
                                            <option value="paperwork_submitted">書類提出 (Paperwork Submitted)</option>
                                            <option value="transferred">移籍完了 (Transferred)</option>
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
