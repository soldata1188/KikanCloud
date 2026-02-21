'use client'
import { useState, useRef } from 'react'
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react'

export function AvatarUploadZone({ defaultUrl = '' }: { defaultUrl?: string }) {
    const [preview, setPreview] = useState<string>(defaultUrl)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const processFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (e) => setPreview(e.target?.result as string)
            reader.readAsDataURL(file)

            // Update the hidden input file list (requires DataTransfer workaround for security reasons)
            if (fileInputRef.current) {
                const dataTransfer = new DataTransfer()
                dataTransfer.items.add(file)
                fileInputRef.current.files = dataTransfer.files
            }
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) processFile(file)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
    }

    const clearPreview = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setPreview('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                name="avatar_file"
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
            />
            {preview ? (
                <div className="relative group w-32 h-32 rounded-xl overflow-hidden border-2 border-[#ededed] shadow-sm">
                    <img src={preview} alt="Avatar Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            onClick={clearPreview}
                            className="bg-white text-red-500 hover:text-red-600 p-2 rounded-full absolute top-2 right-2 shadow-sm transition-transform hover:scale-110"
                            title="Xóa ảnh"
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`w-full max-w-md h-32 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${isDragging
                            ? 'border-[#24b47e] bg-[#24b47e]/5 scale-[1.02] shadow-sm'
                            : 'border-[#dfdfdf] bg-[#fbfcfd] hover:bg-[#f5f7f9] hover:border-[#24b47e]/50'
                        }`}
                >
                    <div className={`p-3 rounded-full transition-colors ${isDragging ? 'bg-[#24b47e]/10 text-[#24b47e]' : 'bg-gray-100 text-gray-400 group-hover:text-[#24b47e] group-hover:bg-[#24b47e]/5'}`}>
                        <UploadCloud size={24} />
                    </div>
                    <div className="text-center">
                        <p className={`text-sm font-medium ${isDragging ? 'text-[#24b47e]' : 'text-gray-600'}`}>
                            クリックまたは顔写真をドラッグ＆ドロップ
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1 font-mono">JPG, PNG, GIF (Max. 5MB)</p>
                    </div>
                </div>
            )}
        </div>
    )
}
