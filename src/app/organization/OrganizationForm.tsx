'use client'

import { Building2, Save } from 'lucide-react'
import { useState } from 'react'

export default function OrganizationForm({ initialData }: { initialData: any }) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ text: '', type: '' })

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage({ text: '', type: '' })

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const license_number = formData.get('license_number') as string
        const address = formData.get('address') as string
        const representative = formData.get('representative') as string
        const phone = formData.get('phone') as string
        const email = formData.get('email') as string

        try {
            const res = await fetch('/api/organization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, license_number, address, representative, phone, email })
            })

            if (!res.ok) throw new Error('更新に失敗しました')

            setMessage({ text: '基本情報を更新しました', type: 'success' })
        } catch (error: any) {
            setMessage({ text: error.message, type: 'error' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-2xl">
            {message.text && (
                <div className={`p-4 mb-6 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#1f1f1f] mb-2">機関名 / 組合名 <span className="text-red-500">*</span></label>
                        <input name="name" type="text" required defaultValue={initialData.name} className="w-full bg-[#fbfcfd] focus:bg-white border border-[#878787] focus:border-[#1f1f1f] rounded-md px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#1f1f1f] mb-2">許可番号 / 登録番号</label>
                        <input name="license_number" type="text" defaultValue={initialData.license_number} className="w-full bg-[#fbfcfd] focus:bg-white border border-[#878787] focus:border-[#1f1f1f] rounded-md px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#1f1f1f] mb-2">代表者名</label>
                        <input name="representative" type="text" defaultValue={initialData.representative} className="w-full bg-[#fbfcfd] focus:bg-white border border-[#878787] focus:border-[#1f1f1f] rounded-md px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#1f1f1f] mb-2">所在地</label>
                        <input name="address" type="text" defaultValue={initialData.address} className="w-full bg-[#fbfcfd] focus:bg-white border border-[#878787] focus:border-[#1f1f1f] rounded-md px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#1f1f1f] mb-2">電話番号</label>
                        <input name="phone" type="text" defaultValue={initialData.phone} className="w-full bg-[#fbfcfd] focus:bg-white border border-[#878787] focus:border-[#1f1f1f] rounded-md px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#1f1f1f] mb-2">代表Email</label>
                        <input name="email" type="email" defaultValue={initialData.email} className="w-full bg-[#fbfcfd] focus:bg-white border border-[#878787] focus:border-[#1f1f1f] rounded-md px-3 py-2.5 text-sm outline-none text-[#1f1f1f] transition-all" />
                    </div>
                </div>

                <div className="pt-6 flex">
                    <button type="submit" disabled={isLoading} className="flex-1 bg-[#24b47e] hover:bg-[#1e9a6a] text-white rounded-md px-6 py-3 font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={18} /> 保存する</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
