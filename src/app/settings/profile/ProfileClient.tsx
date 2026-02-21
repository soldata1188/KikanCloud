'use client'

import { useState, useRef, useTransition } from 'react'
import { updateProfile } from '../actions'
import { User, Upload, Check, Loader2, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfileClient({ initialData }: { initialData: any }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [name, setName] = useState(initialData?.full_name || '')
    const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatar_url || null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setAvatarFile(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

    const handleSave = () => {
        if (!name.trim()) {
            alert('氏名を入力してください。')
            return
        }

        startTransition(async () => {
            try {
                const formData = new FormData()
                formData.append('full_name', name.trim())
                if (avatarFile) {
                    formData.append('avatar', avatarFile)
                }

                await updateProfile(formData)
                setIsSuccess(true)
                router.refresh()
                setTimeout(() => setIsSuccess(false), 3000)
            } catch (error: any) {
                alert('エラーが発生しました: ' + error.message)
            }
        })
    }

    return (
        <div className="max-w-xl">
            <div className="flex flex-col gap-6">

                {/* 1. Ảnh đại diện */}
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-[#1f1f1f]">プロフィール画像</label>
                    <div className="flex items-center gap-6">
                        <div className="relative group w-24 h-24 rounded-full overflow-hidden border border-gray-200 bg-white flex shrink-0 items-center justify-center">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={40} className="text-[#878787]" />
                            )}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                            >
                                <Camera size={24} />
                            </div>
                        </div>

                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#1f1f1f] rounded-md text-sm font-medium transition-colors"
                            >
                                <Upload size={16} /> 写真を変更
                            </button>
                            <p className="text-xs text-[#878787] mt-2">推奨サイズ: 256x256pxの正方形</p>
                        </div>
                    </div>
                </div>

                {/* 2. User Info */}
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-[#1f1f1f]">氏名</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-transparent focus:border-[#24b47e] focus:bg-white rounded-[16px] outline-none text-[#1f1f1f] transition-all"
                        placeholder="氏名を入力..."
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-[#1f1f1f]">メールアドレス (Email)</label>
                    <input
                        type="email"
                        value={initialData?.email || ''}
                        readOnly
                        className="w-full px-4 py-3 bg-white/50 border border-transparent rounded-[16px] text-[#878787] cursor-not-allowed outline-none"
                    />
                    <p className="text-[11px] text-[#878787]">※メールアドレスの変更はセキュリティの観点から現在サポートされていません。</p>
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-[#1f1f1f]">権限 (Role)</label>
                    <div className="w-full px-4 py-3 bg-white/50 text-[#878787] rounded-[16px] cursor-not-allowed">
                        {initialData?.role === 'super_admin' ? 'Super Admin' :
                            initialData?.role === 'union_admin' ? '管理者 (Admin)' : 'スタッフ (Staff)'}
                    </div>
                    <p className="text-[11px] text-[#878787]">※ご自身の権限は変更できません。</p>
                </div>

                <div className="mt-4 flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="px-8 py-3 bg-[#24b47e] hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold rounded-md transition-colors flex items-center gap-2"
                    >
                        {isPending && <Loader2 size={18} className="animate-spin" />}
                        変更を保存
                    </button>
                    {isSuccess && (
                        <span className="text-green-600 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-left-4">
                            <Check size={18} /> 保存しました
                        </span>
                    )}
                </div>

            </div>
        </div>
    )
}
