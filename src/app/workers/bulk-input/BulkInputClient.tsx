'use client'
import { useState, useTransition } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

type RowData = {
 id: string;
 full_name_romaji: string;
 full_name_kana: string;
 dob: string;
 system_type: string;
 status: string;
 company_id: string;
 zairyu_no: string;
}

export function BulkInputClient({ companies }: { companies: { id: string, name_jp: string }[] }) {
 const router = useRouter()
 const [rows, setRows] = useState<RowData[]>([
 { id: '1', full_name_romaji: '', full_name_kana: '', dob: '', system_type: 'ikusei_shuro', status: 'working', company_id: '', zairyu_no: '' },
 { id: '2', full_name_romaji: '', full_name_kana: '', dob: '', system_type: 'ikusei_shuro', status: 'working', company_id: '', zairyu_no: '' },
 { id: '3', full_name_romaji: '', full_name_kana: '', dob: '', system_type: 'ikusei_shuro', status: 'working', company_id: '', zairyu_no: '' },
 ])
 const [isPending, startTransition] = useTransition()
 const [error, setError] = useState('')

 const addRow = () => {
 setRows([...rows, { id: Date.now().toString(), full_name_romaji: '', full_name_kana: '', dob: '', system_type: 'ikusei_shuro', status: 'working', company_id: '', zairyu_no: '' }])
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
 const validRows = rows.filter(r => r.full_name_romaji.trim() !== '')
 if (validRows.length === 0) {
 setError('ローマ字氏名が入力されている行がありません。少なくとも1名は入力してください。')
 return
 }

 startTransition(async () => {
 try {
 // Here we might need to map it carefully. importWorkers in actions usually takes an array of maps
 // let's transform to exactly what importWorkers needs or we create a new server action explicitly.
 const payload = validRows.map(r => ({
 full_name_romaji: r.full_name_romaji,
 full_name_kana: r.full_name_kana,
 dob: r.dob,
 system_type: r.system_type,
 status: r.status,
 company_id: r.company_id || undefined,
 zairyu_no: r.zairyu_no,
 }))

 const response = await fetch('/api/workers/bulk', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 });

 if (!response.ok) {
 const resError = await response.json();
 throw new Error(resError.message || 'Error occurred');
 }

 alert(`${validRows.length}名の人材データを登録しました！`)
 router.push('/workers')
 router.refresh()
 } catch (err: any) {
 setError(err.message || '登録に失敗しました。')
 }
 })
 }

 return (
 <div className="flex-1 flex flex-col items-start w-full relative">
 <div className="w-full overflow-x-auto border border-gray-350 rounded-md mb-4">
 <table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px]">
 <thead className="bg-white">
 <tr>
 <th className="px-3 py-3 w-10 text-center text-[#878787]">#</th>
 <th className="px-3 py-3 font-medium text-gray-700">氏名（ローマ字） <span className="text-red-500">*</span></th>
 <th className="px-3 py-3 font-medium text-gray-700">氏名（カナ）</th>
 <th className="px-3 py-3 font-medium text-gray-700">生年月日 (YYYY-MM-DD)</th>
 <th className="px-3 py-3 font-medium text-gray-700">制度区分</th>
 <th className="px-3 py-3 font-medium text-gray-700">ステータス</th>
 <th className="px-3 py-3 font-medium text-gray-700">配属先企業</th>
 <th className="px-3 py-3 font-medium text-gray-700">在留カード番号</th>
 <th className="px-3 py-3 w-10 text-center"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#e1e5ea]">
 {rows.map((row, idx) => (
 <tr key={row.id} className="hover:bg-gray-50/50 group">
 <td className="px-3 py-2 text-center text-[#878787] text-xs">{idx + 1}</td>
 <td className="px-1 py-1">
 <input type="text"value={row.full_name_romaji} onChange={(e) => handleChange(row.id, 'full_name_romaji', e.target.value)} placeholder="NGUYEN VAN A"className="w-full px-3 py-2 uppercase outline-none border border-gray-350 focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-transparent hover:bg-white/50"/>
 </td>
 <td className="px-1 py-1">
 <input type="text"value={row.full_name_kana} onChange={(e) => handleChange(row.id, 'full_name_kana', e.target.value)} placeholder="グエン ヴァン ア"className="w-full px-3 py-2 outline-none border border-gray-350 focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-transparent hover:bg-white/50"/>
 </td>
 <td className="px-1 py-1">
 <input type="date"value={row.dob} onChange={(e) => handleChange(row.id, 'dob', e.target.value)} className="w-full px-3 py-2 outline-none border border-gray-350 focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-transparent hover:bg-white/50"/>
 </td>
 <td className="px-1 py-1">
 <select value={row.system_type} onChange={(e) => handleChange(row.id, 'system_type', e.target.value)} className="w-full px-3 py-2 outline-none border border-gray-350 focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-white hover:bg-gray-50">
 <option value="ikusei_shuro">育成就労</option>
 <option value="tokuteigino">特定技能</option>
 <option value="ginou_jisshu">技能実習</option>
 </select>
 </td>
 <td className="px-1 py-1">
 <select value={row.status} onChange={(e) => handleChange(row.id, 'status', e.target.value)} className="w-full px-3 py-2 outline-none border border-gray-350 focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-white hover:bg-gray-50">
 <option value="working">就業中</option>
 <option value="standby">対応中</option>
 <option value="waiting">入国待ち</option>
 <option value="missing">失踪</option>
 <option value="returned">帰国</option>
 </select>
 </td>
 <td className="px-1 py-1">
 <select value={row.company_id} onChange={(e) => handleChange(row.id, 'company_id', e.target.value)} className="w-full px-3 py-2 outline-none border border-gray-350 focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-white hover:bg-gray-50">
 <option value="">-- 未配属 --</option>
 {companies.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
 </select>
 </td>
 <td className="px-1 py-1">
 <input type="text"value={row.zairyu_no} onChange={(e) => handleChange(row.id, 'zairyu_no', e.target.value)} placeholder="XX123456"className="w-full px-3 py-2 uppercase font-mono outline-none border border-gray-350 focus:border-[#24b47e] focus:bg-white rounded transition-colors bg-transparent hover:bg-white/50"/>
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
 <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 text-[#24b47e] bg-white hover:bg-blue-100 rounded-md font-medium transition-colors text-sm">
 <Plus size={16} /> 10行追加
 </button>
 {error && <span className="text-red-500 text-sm">{error}</span>}
 </div>

 <button onClick={handleSave} disabled={isPending} className="fixed bottom-10 right-10 flex items-center gap-2 px-8 py-4 bg-[#24b47e] hover:bg-[#1e9a6a] text-white rounded-md font-bold hover:scale-105 transition-all outline-none z-50">
 <Save size={20} /> {isPending ? '保存中...' : '一括登録を実行'}
 </button>
 </div>
 )
}
