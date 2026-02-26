'use client'
import { useState, useTransition } from 'react'
import { X, Save, Edit3 } from 'lucide-react'
import { bulkUpdateWorkerField } from '@/app/actions/operations'
import { useRouter } from 'next/navigation'

type CompanyOption = { id: string; name_jp: string }

const BASE_FIELDS = [
    { id: 'status', label: 'ステータス', type: 'select', options: ['waiting', 'standby', 'working', 'missing', 'returned', 'transferred'], labels: ['未入国', '対応中', '就業中', '失踪', '帰国', '転籍済'] },
    { id: 'visa_status', label: '在留資格', type: 'text' },
    { id: 'industry_field', label: '職種区分', type: 'text' },
    { id: 'sending_org', label: '送出機関', type: 'text' },
    { id: 'entry_batch', label: '期生', type: 'text' },
    { id: 'nationality', label: '国籍', type: 'text' },
    { id: 'dob', label: '生年月日', type: 'date' },
    { id: 'entry_date', label: '入国日', type: 'date' },
    { id: 'zairyu_exp', label: '在留期限', type: 'date' },
    { id: 'passport_exp', label: '旅券期限', type: 'date' },
    { id: 'insurance_exp', label: '保険期限', type: 'date' },
    { id: 'address', label: '社宅住所', type: 'text' },
]

export function BulkEditModal({
    selectedIds,
    onClose,
    onSuccess,
    companies = [],
}: {
    selectedIds: string[]
    onClose: () => void
    onSuccess: () => void
    companies?: CompanyOption[]
}) {
    const EDITABLE_FIELDS = [
        { id: 'company_id', label: '受入企業', type: 'company' },
        ...BASE_FIELDS,
    ]

    const [selectedField, setSelectedField] = useState(EDITABLE_FIELDS[0].id)
    const [value, setValue] = useState('')
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedField) return

        let finalValue: any = value
        if (finalValue === '') finalValue = null

        startTransition(async () => {
            try {
                await bulkUpdateWorkerField(selectedIds, selectedField, finalValue)
                alert(`選択した${selectedIds.length}名のデータを一括変更しました。`)
                onSuccess()
                router.refresh()
            } catch {
                alert('エラーが発生しました。')
            }
        })
    }

    const currentFieldDef = EDITABLE_FIELDS.find(f => f.id === selectedField)

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-800">
                    <h3 className="font-bold flex items-center gap-2 text-white text-[15px]">
                        <Edit3 size={16} className="text-emerald-400" />
                        一括変更
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">

                    {/* Count badge */}
                    <div className="text-sm font-medium text-slate-600 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500 text-white text-xs font-bold rounded-full">{selectedIds.length}</span>
                        名を選択中 — 以下の項目を一括変更します
                    </div>

                    {/* Field selector as pill tabs */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">変更する項目</label>
                        <div className="flex flex-wrap gap-1.5">
                            {EDITABLE_FIELDS.map(f => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => { setSelectedField(f.id); setValue('') }}
                                    className={`text-[12px] font-bold px-3 py-1.5 rounded-full border transition-all duration-150
                                        ${selectedField === f.id
                                            ? 'bg-slate-800 text-white border-slate-800 shadow'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Value input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            {currentFieldDef?.label} — 変更後の値
                        </label>

                        {currentFieldDef?.type === 'company' ? (
                            <select
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full h-[38px] border border-slate-200 rounded-xl px-3 text-sm focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] outline-none transition-all bg-white"
                                required
                            >
                                <option value="" disabled>企業を選択してください</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name_jp}</option>
                                ))}
                            </select>
                        ) : currentFieldDef?.type === 'select' ? (
                            <select
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full h-[38px] border border-slate-200 rounded-xl px-3 text-sm focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] outline-none transition-all bg-white"
                                required
                            >
                                <option value="" disabled>選択してください</option>
                                {currentFieldDef.options?.map((opt, i) => (
                                    <option key={opt} value={opt}>{currentFieldDef.labels?.[i] || opt}</option>
                                ))}
                            </select>
                        ) : currentFieldDef?.type === 'date' ? (
                            <input
                                type="date"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full h-[38px] border border-slate-200 rounded-xl px-3 text-sm focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] outline-none transition-all"
                            />
                        ) : (
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="クリアする場合は空にしてください"
                                className="w-full h-[38px] border border-slate-200 rounded-xl px-3 text-sm focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] outline-none transition-all"
                            />
                        )}
                    </div>

                    {/* Footer buttons */}
                    <div className="flex gap-3 pt-2 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm">
                            キャンセル
                        </button>
                        <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                            {isPending ? <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4" /> : <Save size={16} />}
                            一括変更する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
