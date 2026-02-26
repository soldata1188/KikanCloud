'use client'

import { Save } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OrganizationForm({ initialData }: { initialData: any }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ text: '', type: '' })

    // Controlled state — values persist after save without reverting
    const [fields, setFields] = useState({
        name: initialData?.name || '',
        license_number: initialData?.license_number || '',
        representative: initialData?.representative || '',
        address: initialData?.address || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
    })

    const set = (key: keyof typeof fields) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setFields(prev => ({ ...prev, [key]: e.target.value }))

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage({ text: '', type: '' })

        try {
            const res = await fetch('/api/organization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fields)
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || '更新に失敗しました')
            }

            setMessage({ text: '基本情報を更新しました ✓', type: 'success' })
            router.refresh()
        } catch (error: any) {
            setMessage({ text: error.message, type: 'error' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            {message.text && (
                <div className={`p-4 mb-6 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#1f1f1f] mb-2">機関名 / 組合名 <span className="text-red-500">*</span></label>
                        <input name="name" type="text" required value={fields.name} onChange={set('name')}
                            className="w-full bg-white border border-gray-350 focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] rounded-md px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#1f1f1f] mb-2">許可番号 / 登録番号</label>
                        <input name="license_number" type="text" value={fields.license_number} onChange={set('license_number')}
                            className="w-full bg-white border border-gray-350 focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] rounded-md px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#1f1f1f] mb-2">代表者名</label>
                        <input name="representative" type="text" value={fields.representative} onChange={set('representative')}
                            className="w-full bg-white border border-gray-350 focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] rounded-md px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#1f1f1f] mb-2">所在地</label>
                        <input name="address" type="text" value={fields.address} onChange={set('address')}
                            className="w-full bg-white border border-gray-350 focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] rounded-md px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#1f1f1f] mb-2">電話番号</label>
                        <input name="phone" type="text" value={fields.phone} onChange={set('phone')}
                            className="w-full bg-white border border-gray-350 focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] rounded-md px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#1f1f1f] mb-2">代表Email</label>
                        <input name="email" type="email" value={fields.email} onChange={set('email')}
                            className="w-full bg-white border border-gray-350 focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] rounded-md px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                    </div>
                </div>

                <div className="pt-8 flex justify-center">
                    <button type="submit" disabled={isLoading}
                        className="w-full md:w-[350px] bg-[#24b47e] hover:bg-[#1e9a6a] text-white rounded-md px-6 py-3 font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {isLoading
                            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <><Save size={18} /> 保存する</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
