'use client'
import { useState, useTransition } from 'react'
import { X, Save, Edit3 } from 'lucide-react'
import { bulkUpdateWorkerField } from '@/app/actions/operations'
import { useRouter } from 'next/navigation'

const EDITABLE_FIELDS = [
    { id: 'address', label: '社宅住所', type: 'text' },
    { id: 'status', label: 'ステータス', type: 'select', options: ['waiting', 'standby', 'working', 'missing', 'returned', 'transferred'], labels: ['入国待ち', '対応中', '就業中', '失踪', '帰国', '転籍済'] },
    { id: 'entry_batch', label: '期生', type: 'text' },
    { id: 'visa_status', label: '在留資格', type: 'text' },
    { id: 'industry_field', label: '職種', type: 'text' },
    { id: 'entry_date', label: '入国日', type: 'date' },
    { id: 'zairyu_exp', label: '在留期限', type: 'date' },
    { id: 'cert_start_date', label: '認定開始', type: 'date' },
    { id: 'cert_end_date', label: '認定修了', type: 'date' },
    { id: 'sending_org', label: '送出機関', type: 'text' },
    { id: 'insurance_exp', label: '保険期限', type: 'date' },
]

export function BulkEditModal({
    selectedIds,
    onClose,
    onSuccess
}: {
    selectedIds: string[]
    onClose: () => void
    onSuccess: () => void
}) {
    const [selectedField, setSelectedField] = useState(EDITABLE_FIELDS[0].id)
    const [value, setValue] = useState('')
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedField) return

        let finalValue: any = value
        if (finalValue === '') finalValue = null // Allow clearing fields

        startTransition(async () => {
            try {
                await bulkUpdateWorkerField(selectedIds, selectedField, finalValue)
                alert(`選択した${selectedIds.length}名のデータを一括変更しました。`)
                onSuccess()
                router.refresh()
            } catch (error) {
                console.error(error)
                alert('エラーが発生しました。')
            }
        })
    }

    const currentFieldDef = EDITABLE_FIELDS.find(f => f.id === selectedField)

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-150">
                    <h3 className="font-bold flex items-center gap-2 text-gray-900"><Edit3 size={18} className="text-primary-600" /> 一括変更</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    <div className="text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                        対象: <span className="font-bold text-primary-600">{selectedIds.length}</span> 名を選択中
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">変更する項目</label>
                            <select
                                value={selectedField}
                                onChange={(e) => {
                                    setSelectedField(e.target.value)
                                    setValue('') // Reset value when field changes
                                }}
                                className="w-full h-[38px] border border-gray-300 rounded-md px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                            >
                                {EDITABLE_FIELDS.map(f => (
                                    <option key={f.id} value={f.id}>{f.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">変更後の値</label>
                            {currentFieldDef?.type === 'select' ? (
                                <select
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-full h-[38px] border border-gray-300 rounded-md px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
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
                                    className="w-full h-[38px] border border-gray-300 rounded-md px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="クリアする場合は空にしてください"
                                    className="w-full h-[38px] border border-gray-300 rounded-md px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-150">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-md hover:bg-gray-50 transition-colors">
                            キャンセル
                        </button>
                        <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-primary-600 text-white font-bold rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                            {isPending ? <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4" /> : <Save size={18} />}
                            一括変更する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
