'use client'

import { Save, Building2, Hash, User, MapPin, Phone, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Shared styles ──────────────────────────────────────────────────
const L = "block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1"
const I = "w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-gray-300 font-bold"

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

            setMessage({ text: '機関の基本情報を更新しました', type: 'success' })
            router.refresh()

            // Auto-clear message after 3 seconds
            setTimeout(() => setMessage({ text: '', type: '' }), 3000)
        } catch (error: any) {
            setMessage({ text: error.message, type: 'error' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto py-2">
            {/* ── Status Message ── */}
            {message.text && (
                <div className={`p-4 mb-8 rounded-md text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border
                    ${message.type === 'success'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* ── Section Header ── */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-md bg-blue-50 text-[#0067b8] flex items-center justify-center">
                        <Building2 size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">機関情報の編集</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">組合・機関の公開情報および連絡先を設定します。</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Organization Name */}
                    <div className="md:col-span-2">
                        <label className={L}>機関名 / 組合名 <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input name="name" type="text" required value={fields.name} onChange={set('name')}
                                className={I} placeholder="例: KikanCloud協同組合" />
                        </div>
                    </div>

                    {/* License Number */}
                    <div>
                        <label className={L}>許可番号 / 登録番号</label>
                        <div className="relative">
                            <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input name="license_number" type="text" value={fields.license_number} onChange={set('license_number')}
                                className={I} placeholder="例: 12345678" />
                        </div>
                    </div>

                    {/* Representative */}
                    <div>
                        <label className={L}>代表者名</label>
                        <div className="relative">
                            <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input name="representative" type="text" value={fields.representative} onChange={set('representative')}
                                className={I} placeholder="例: 田中 太郎" />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                        <label className={L}>所在地</label>
                        <div className="relative">
                            <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input name="address" type="text" value={fields.address} onChange={set('address')}
                                className={I} placeholder="例: 東京都千代田区1-1-1" />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className={L}>電話番号</label>
                        <div className="relative">
                            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input name="phone" type="text" value={fields.phone} onChange={set('phone')}
                                className={I} placeholder="例: 03-1234-5678" />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className={L}>代表Email</label>
                        <div className="relative">
                            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input name="email" type="email" value={fields.email} onChange={set('email')}
                                className={I} placeholder="例: info@example.com" />
                        </div>
                    </div>
                </div>

                {/* ── Actions ── */}
                <div className="pt-8 flex justify-center border-t border-gray-100">
                    <button type="submit" disabled={isLoading}
                        className="w-full md:w-[320px] bg-blue-700 hover:bg-blue-800 text-white rounded-lg h-12 font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-50">
                        {isLoading
                            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : (
                                <>
                                    <Save size={18} />
                                    <span className="text-sm uppercase tracking-widest">設定を保存する</span>
                                </>
                            )}
                    </button>
                </div>
            </form>
        </div>
    )
}
