'use client'
import { useState, useRef, useTransition } from 'react'
import { uploadClientDocument } from '@/app/portal/actions'
import { ChevronDown, Upload, Download, Loader2, CheckCircle2 } from 'lucide-react'

export function SmartDrawer({ workerId, documents, title, docType, icon, allowUpload = true }: { workerId: string, documents: any[], title: string, docType: string, icon: React.ReactNode, allowUpload?: boolean }) {
 const [isOpen, setIsOpen] = useState(false)
 const [isPending, startTransition] = useTransition()
 const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7))
 const fileInputRef = useRef<HTMLInputElement>(null)

 const filteredDocs = allowUpload
 ? documents.filter(d => d.doc_type === docType)
 : documents; // For read-only union docs, use all passed docs

 const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (!file) return
 const formData = new FormData()
 formData.append('file', file)
 formData.append('doc_type', docType)
 formData.append('target_month', targetMonth)

 startTransition(async () => {
 try {
 await uploadClientDocument(workerId, formData)
 alert('ファイルの提出が完了しました。')
 } catch (err: any) { alert(err.message) }
 if (fileInputRef.current) fileInputRef.current.value = ''
 })
 }

 return (
 <div className="bg-white rounded-[24px] border border-gray-350 overflow-hidden mb-4">
 <button onClick={() => setIsOpen(!isOpen)} className="w-full px-4 py-2 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors">
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${allowUpload ? 'bg-orange-50 text-orange-600' : 'bg-white text-primary-600'}`}>{icon}</div>
 <div className="text-left">
 <h3 className="font-bold text-[#1f1f1f]">{title}</h3>
 <p className="text-xs text-[#878787]">{filteredDocs.length}件のファイル</p>
 </div>
 </div>
 <ChevronDown className={`text-[#878787] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
 </button>

 {isOpen && (
 <div className="px-6 pb-6 pt-2 border-t border-gray-350 bg-white/50">
 {allowUpload && (
 <div className="mb-6 flex gap-4 items-end bg-white p-4 rounded-md"> <div className="w-1/3">
 <label className="block text-xs font-bold text-[#878787] mb-1">対象月</label>
 <input type="month"value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} disabled={isPending} className="w-full bg-white border border-gray-350 rounded-md px-3 py-2 text-sm outline-none focus:border-orange-400"/>
 </div>
 <div className="flex-1 relative">
 <input type="file"ref={fileInputRef} onChange={handleUpload} disabled={isPending} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"accept=".pdf,.jpg,.jpeg,.png,.xlsx"/>
 <button disabled={isPending} className="w-full py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-sm rounded-md border border-orange-200 transition-colors flex items-center justify-center gap-2">
 {isPending ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16} />} 提出ファイルを選択
 </button>
 </div>
 </div>
 )}

 <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
 {filteredDocs.length === 0 ? <p className="text-sm text-[#878787] text-center py-4">データがありません</p> : filteredDocs.map(doc => (
 <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-md"> <div className="flex items-center gap-3 overflow-hidden">
 <CheckCircle2 className="text-primary-500 shrink-0"size={18} />
 <div className="min-w-0">
 <p className="text-sm font-bold text-[#1f1f1f] truncate"title={doc.file_name}>{allowUpload ?`[${doc.target_month}]`: ''}{doc.file_name}</p>
 <p className="text-[10px] text-[#878787]">{new Date(doc.created_at).toLocaleDateString('ja-JP')} <span className="mx-1">|</span> {doc.uploaded_by}</p>
 </div>
 </div>
 {doc.signedUrl && <a href={doc.signedUrl} target="_blank"rel="noopener noreferrer"className="p-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-primary-600 rounded-lg transition-colors shrink-0"><Download size={16} /></a>}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )
}
