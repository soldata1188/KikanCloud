'use client'
import { useState, useTransition } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

type RowData = {
    id: string;
    name_jp: string;
    name_romaji: string;
    corporate_number: string;
    industry: string;
    postal_code: string;
    address: string;
    phone: string;
    pic_name: string;
}

export function BulkInputClient() {
    const router = useRouter()
    const [rows, setRows] = useState<RowData[]>([
        { id: '1', name_jp: '', name_romaji: '', corporate_number: '', industry: '', postal_code: '', address: '', phone: '', pic_name: '' },
        { id: '2', name_jp: '', name_romaji: '', corporate_number: '', industry: '', postal_code: '', address: '', phone: '', pic_name: '' },
        { id: '3', name_jp: '', name_romaji: '', corporate_number: '', industry: '', postal_code: '', address: '', phone: '', pic_name: '' },
    ])
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')

    const addRow = () => {
        setRows([...rows, { id: Date.now().toString(), name_jp: '', name_romaji: '', corporate_number: '', industry: '', postal_code: '', address: '', phone: '', pic_name: '' }])
    }

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id))
        }
    }

    const handleChange = (id: string, field: keyof RowData, value: string) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r))
    }

    const handleSave = () => {
        setError('')
        const validRows = rows.filter(r => r.name_jp.trim() !== '')
        if (validRows.length === 0) {
            setError('企業名が入力されている行がありません。少なくとも1社は入力してください。')
            return
        }

        startTransition(async () => {
            try {
                const payload = validRows.map(r => ({
                    name_jp: r.name_jp,
                    name_romaji: r.name_romaji,
                    corporate_number: r.corporate_number,
                    industry: r.industry,
                    postal_code: r.postal_code,
                    address: r.address,
                    phone: r.phone,
                    pic_name: r.pic_name,
                }))

                const response = await fetch('/api/companies/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const resError = await response.json();
                    throw new Error(resError.message || 'Error occurred');
                }

                alert(`${validRows.length}件の企業データを登録しました！`)
                router.push('/companies')
                router.refresh()
            } catch (err: any) {
                setError(err.message || '登録に失敗しました。')
            }
        })
    }

    return (
        <div className="flex-1 flex flex-col items-start w-full relative">
            <div className="w-full overflow-x-auto border border-gray-350 rounded-md mb-4">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[1200px]">
                    <thead className="bg-[#fbfcfd]">
                        <tr>
                            <th className="px-3 py-3 w-10 text-center text-[#878787] border-b border-gray-350">#</th>
                            <th className="px-3 py-3 font-medium text-gray-700 border-b border-gray-350">企業名 <span className="text-red-500">*</span></th>
                            <th className="px-3 py-3 font-medium text-gray-700 border-b border-gray-350">フリガナ（ローマ字）</th>
                            <th className="px-3 py-3 font-medium text-gray-700 border-b border-gray-350">法人番号</th>
                            <th className="px-3 py-3 font-medium text-gray-700 border-b border-gray-350">業種</th>
                            <th className="px-3 py-3 font-medium text-gray-700 border-b border-gray-350 w-24">郵便番号</th>
                            <th className="px-3 py-3 font-medium text-gray-700 border-b border-gray-350">所在地</th>
                            <th className="px-3 py-3 font-medium text-gray-700 border-b border-gray-350">電話番号</th>
                            <th className="px-3 py-3 font-medium text-gray-700 border-b border-gray-350">担当者名</th>
                            <th className="px-3 py-3 w-10 text-center border-b border-gray-350"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1e5ea]">
                        {rows.map((row, idx) => (
                            <tr key={row.id} className="hover:bg-gray-50/50 group">
                                <td className="px-3 py-2 text-center text-[#878787] text-xs">{idx + 1}</td>
                                <td className="px-1 py-1">
                                    <input type="text" value={row.name_jp} onChange={(e) => handleChange(row.id, 'name_jp', e.target.value)} placeholder="株式会社サンプル" className="w-full px-3 py-2 outline-none border border-transparent focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-transparent hover:bg-white border-gray-200 focus:ring-2 focus:ring-[#24b47e]/20" />
                                </td>
                                <td className="px-1 py-1">
                                    <input type="text" value={row.name_romaji} onChange={(e) => handleChange(row.id, 'name_romaji', e.target.value)} placeholder="SAMPLE INC." className="w-full px-3 py-2 uppercase outline-none border border-transparent focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-transparent hover:bg-white border-gray-200 focus:ring-2 focus:ring-[#24b47e]/20" />
                                </td>
                                <td className="px-1 py-1">
                                    <input type="text" value={row.corporate_number} onChange={(e) => handleChange(row.id, 'corporate_number', e.target.value)} placeholder="1234567890123" className="w-full px-3 py-2 font-mono outline-none border border-transparent focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-transparent hover:bg-white border-gray-200 focus:ring-2 focus:ring-[#24b47e]/20" />
                                </td>
                                <td className="px-1 py-1">
                                    <input type="text" value={row.industry} onChange={(e) => handleChange(row.id, 'industry', e.target.value)} placeholder="製造業" className="w-full px-3 py-2 outline-none border border-transparent focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-transparent hover:bg-white border-gray-200 focus:ring-2 focus:ring-[#24b47e]/20" />
                                </td>
                                <td className="px-1 py-1">
                                    <input type="text" value={row.postal_code} onChange={(e) => handleChange(row.id, 'postal_code', e.target.value)} placeholder="000-0000" className="w-full px-3 py-2 font-mono outline-none border border-transparent focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-transparent hover:bg-white border-gray-200 focus:ring-2 focus:ring-[#24b47e]/20" />
                                </td>
                                <td className="px-1 py-1">
                                    <input type="text" value={row.address} onChange={(e) => handleChange(row.id, 'address', e.target.value)} placeholder="東京都千代田区..." className="w-full px-3 py-2 outline-none border border-transparent focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-transparent hover:bg-white border-gray-200 focus:ring-2 focus:ring-[#24b47e]/20" />
                                </td>
                                <td className="px-1 py-1">
                                    <input type="text" value={row.phone} onChange={(e) => handleChange(row.id, 'phone', e.target.value)} placeholder="03-0000-0000" className="w-full px-3 py-2 font-mono outline-none border border-transparent focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-transparent hover:bg-white border-gray-200 focus:ring-2 focus:ring-[#24b47e]/20" />
                                </td>
                                <td className="px-1 py-1">
                                    <input type="text" value={row.pic_name} onChange={(e) => handleChange(row.id, 'pic_name', e.target.value)} placeholder="山田 太郎" className="w-full px-3 py-2 outline-none border border-transparent focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-transparent hover:bg-white border-gray-200 focus:ring-2 focus:ring-[#24b47e]/20" />
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <button onClick={() => removeRow(row.id)} disabled={rows.length <= 1} className="p-1.5 text-[#878787] hover:text-red-500 rounded hover:bg-red-50 transition-colors disabled:opacity-30">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center w-full mb-8">
                <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 text-[#24b47e] bg-white hover:bg-[#e8f5e9] border border-[#24b47e]/30 rounded-md font-medium transition-colors text-sm">
                    <Plus size={16} /> 行を追加
                </button>
                {error && <span className="text-red-500 text-sm bg-red-50 px-3 py-1.5 rounded border border-red-200">{error}</span>}
            </div>

            <button onClick={handleSave} disabled={isPending} className="fixed bottom-10 right-10 flex items-center gap-2 px-8 py-4 bg-[#24b47e] hover:bg-[#1e9a6a] text-white rounded-md font-bold hover:scale-105 shadow-lg transition-all outline-none z-50 disabled:opacity-70 disabled:hover:scale-100">
                <Save size={20} /> {isPending ? '保存中...' : '一括登録を実行'}
            </button>
        </div>
    )
}
