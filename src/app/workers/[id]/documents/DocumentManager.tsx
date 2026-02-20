'use client'
import { useState, useRef, useTransition } from 'react'
import { uploadWorkerDocument, deleteWorkerDocument } from './actions'
import { Upload, FileText, Image as ImageIcon, File, Trash2, Download, Loader2, FolderOpen, ShieldCheck, Book, CreditCard, FileSignature } from 'lucide-react'

export function DocumentManager({ workerId, documents, role }: { workerId: string, documents: any[], role: string }) {
    const [isPending, startTransition] = useTransition()
    const [dragActive, setDragActive] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [docType, setDocType] = useState('zairyu_card')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (file: File) => {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('doc_type', docType)

        try {
            await uploadWorkerDocument(workerId, formData)
        } catch (error: any) {
            alert(error.message)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    }

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'passport': return { label: 'パスポート', color: 'bg-indigo-100 text-indigo-700', icon: <Book size={24} className="text-indigo-500" /> }
            case 'zairyu_card': return { label: '在留カード', color: 'bg-blue-100 text-blue-700', icon: <CreditCard size={24} className="text-blue-500" /> }
            case 'contract': return { label: '雇用契約書', color: 'bg-green-100 text-green-700', icon: <FileSignature size={24} className="text-green-500" /> }
            case 'photo': return { label: '証明写真', color: 'bg-pink-100 text-pink-700', icon: <ImageIcon size={24} className="text-pink-500" /> }
            default: return { label: 'その他資料', color: 'bg-gray-100 text-gray-700', icon: <FileText size={24} className="text-gray-500" /> }
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CỘT TRÁI: UPLOAD ZONE */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-[32px] shadow-sm border border-[#e1e5ea] p-6 sticky top-24">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-[#1f1f1f] flex items-center gap-2"><Upload size={20} className="text-[#4285F4]" /> 新規アップロード</h3>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG形式対応（最大5MB）</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-[#444746] mb-2">書類の種類 <span className="text-red-500">*</span></label>
                            <select value={docType} onChange={(e) => setDocType(e.target.value)} disabled={uploading || isPending} className="w-full bg-[#f0f4f9] border border-transparent focus:border-[#4285F4] focus:bg-white rounded-[32px] px-4 py-3 text-sm font-medium outline-none transition-colors cursor-pointer">
                                <option value="zairyu_card">在留カード (表・裏)</option>
                                <option value="passport">パスポート (顔写真ページ)</option>
                                <option value="contract">雇用条件書・契約書</option>
                                <option value="photo">証明写真 (ビザ申請用)</option>
                                <option value="other">その他資料</option>
                            </select>
                        </div>

                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]); }}
                            className={`border-2 border-dashed rounded-[20px] p-8 text-center transition-colors relative cursor-pointer group ${dragActive ? 'border-[#4285F4] bg-blue-50/50' : 'border-[#e1e5ea] hover:border-[#4285F4] hover:bg-blue-50/30'}`}
                        >
                            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading || isPending} />
                            <div className="flex flex-col items-center justify-center gap-2">
                                {uploading ? <Loader2 size={32} className="text-[#4285F4] animate-spin mb-1" /> : <Upload size={32} className="text-gray-400 group-hover:text-[#4285F4] transition-colors mb-1" />}
                                <p className="text-[#1f1f1f] font-medium text-sm">{uploading ? 'アップロード中...' : 'クリックしてファイルを選択'}</p>
                                <p className="text-[10px] text-gray-400">またはドラッグ＆ドロップ</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CỘT PHẢI: DOCUMENT LIST */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-[32px] shadow-sm border border-[#e1e5ea] overflow-hidden min-h-[400px]">
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2"><FolderOpen size={20} className="text-orange-500" /> 保管されたファイル</h3>
                        <span className="text-xs font-bold text-gray-500 bg-gray-200 px-3 py-1 rounded-[32px] flex items-center gap-1"><ShieldCheck size={14} /> {documents.length}件</span>
                    </div>

                    {documents.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center gap-4 text-gray-400">
                            <File size={48} className="opacity-30" strokeWidth={1.5} />
                            <p className="text-sm font-medium">アップロードされた書類はありません。</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {documents.map(doc => {
                                const typeStyle = getTypeStyle(doc.doc_type)
                                return (
                                    <li key={doc.id} className="p-4 hover:bg-blue-50/30 transition-colors flex items-center justify-between gap-4 group">
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className={`w-12 h-12 rounded-[32px] flex items-center justify-center shrink-0 border border-gray-100 bg-white shadow-sm`}>
                                                {typeStyle.icon}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap ${typeStyle.color}`}>{typeStyle.label}</span>
                                                    <span className="font-bold text-[#1f1f1f] text-sm truncate" title={doc.file_name}>{doc.file_name}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 flex items-center gap-2">
                                                    <span>{formatBytes(doc.file_size)}</span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-[32px]"></span>
                                                    <span>{new Date(doc.created_at).toLocaleDateString('ja-JP')}</span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-[32px]"></span>
                                                    <span>{doc.uploaded_by?.split(' ').pop()}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            {doc.signedUrl && (
                                                <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 text-[#444746] hover:text-[#4285F4] hover:bg-blue-50 rounded-[32px] transition-colors font-bold text-xs flex items-center gap-1" title="プレビュー / ダウンロード"><Download size={14} /> 開く</a>
                                            )}
                                            {role === 'admin' && (
                                                <form action={deleteWorkerDocument}>
                                                    <input type="hidden" name="docId" value={doc.id} />
                                                    <input type="hidden" name="filePath" value={doc.file_path} />
                                                    <input type="hidden" name="workerId" value={workerId} />
                                                    <button type="submit" onClick={(e) => { if (!confirm('このファイルを完全に削除しますか？')) e.preventDefault() }} disabled={isPending} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[32px] transition-colors disabled:opacity-50" title="削除">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}
