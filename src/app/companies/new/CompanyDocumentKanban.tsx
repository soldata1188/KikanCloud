'use client'
import React, { useState, useRef } from 'react'
import { UploadCloud, FileText, X, ArrowLeft, Image as ImageIcon } from 'lucide-react'

// Defined Document Types for Company
const COMPANY_DOC_TYPES = [
    { id: 'kigyo_shashin', label: '企業写真' },
    { id: 'tokibohon', label: '登記謄本' },
    { id: 'kensetsu_kyoka', label: '建設許可' },
    { id: 'shataku_madorizu', label: '社宅間取図' },
    { id: 'koshu_shuryosho', label: '講習終了証' },
    { id: 'ccus_id', label: 'CCUS事業者ID' }
]

type StorageFile = {
    id: string;
    file: File;
    timestamp: string;
}

export function CompanyDocumentKanban() {
    const [stagedFile, setStagedFile] = useState<File | null>(null)
    const [stagedTargetDoc, setStagedTargetDoc] = useState<string>('')
    const [newCustomCategory, setNewCustomCategory] = useState<string>('')
    const [files, setFiles] = useState<Record<string, StorageFile[]>>({})

    const mainFileInputRef = useRef<HTMLInputElement>(null)

    const handleMainFileDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            setStagedFile(droppedFile)
            setStagedTargetDoc('') // Reset selection
            setNewCustomCategory('')
        }
    }

    const handleMainFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setStagedFile(selectedFile)
            setStagedTargetDoc('')
            setNewCustomCategory('')
        }
    }

    const stageToStorage = () => {
        if (!stagedFile) return;

        let categoryId = stagedTargetDoc;
        let categoryLabel = '';

        if (categoryId === 'new_custom') {
            if (!newCustomCategory.trim()) return;
            categoryId = `custom_${Date.now()}`;
            categoryLabel = newCustomCategory.trim();
            // In a real app we'd add this to a dynamic list, here we just use it directly
        }

        const newFile: StorageFile = {
            id: Math.random().toString(36).substring(7),
            file: stagedFile,
            timestamp: new Date().toLocaleDateString('ja-JP')
        }

        setFiles(prev => {
            const currentFiles = prev[categoryId] || [];
            return {
                ...prev,
                [categoryId]: [...currentFiles, newFile]
            }
        })

        // Reset Staging Area
        setStagedFile(null)
        setStagedTargetDoc('')
        setNewCustomCategory('')
        if (mainFileInputRef.current) mainFileInputRef.current.value = ''
    }

    const removeFromStorage = (docId: string, fileId: string) => {
        if (!confirm('本当にこのファイルを削除しますか？')) return;
        setFiles(prev => {
            const currentFiles = prev[docId] || [];
            const newFiles = currentFiles.filter(f => f.id !== fileId);
            if (newFiles.length === 0) {
                const newObj = { ...prev };
                delete newObj[docId];
                return newObj;
            }
            return {
                ...prev,
                [docId]: newFiles
            }
        })
    }

    // Dynamic document list combining predefined and active custom types
    const activeDocTypes = [...COMPANY_DOC_TYPES]

    // Auto-append any custom keys from state that aren't in predefined list
    Object.keys(files).forEach(key => {
        if (key.startsWith('custom_') && !activeDocTypes.find(d => d.id === key)) {
            // we lost the label, let's just use the key or a default in this simple demo
            activeDocTypes.push({ id: key, label: '追加書類' })
        }
    })

    return (
        <div className="w-[300px] shrink-0 h-full flex flex-col bg-gray-50 border-l border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white z-10">
                <div className="flex items-center gap-1.5">
                    <UploadCloud size={18} className="text-gray-900" />
                    <h3 className="text-[15px] font-bold text-gray-900">書類関係</h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-24 space-y-6">

                {/* 1. Staging Area */}
                <div>
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 pl-1">1. ステージングエリア</h4>
                    <div
                        className={`cursor-pointer w-full h-[120px] border-2 border-dashed rounded-[10px] flex flex-col items-center justify-center p-3 transition-all relative
                            ${stagedFile ? 'border-emerald-500 bg-emerald-500/5' : 'border-gray-400 bg-white hover:bg-gray-50 hover:border-gray-900'}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleMainFileDrop}
                        onClick={() => mainFileInputRef.current?.click()}
                    >
                        <input type="file" className="hidden" ref={mainFileInputRef} onChange={handleMainFileSelect} />
                        {stagedFile ? (
                            <div className="flex flex-col items-center animate-in zoom-in-95 duration-200 w-full">
                                <FileText size={32} className="text-emerald-500 mb-1.5" />
                                <div className="text-[13px] font-bold text-emerald-500 text-center truncate w-full px-2" title={stagedFile.name}>{stagedFile.name}</div>
                                <div className="text-[10px] text-emerald-500/80 mt-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-none">ファイル受信済み</div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center group">
                                <UploadCloud size={28} className="text-gray-400 mb-2 group-hover:text-gray-600 transition-colors" />
                                <div className="text-[13px] font-bold text-gray-900">ここに書類をドロップ</div>
                                <div className="text-[11px] text-gray-500 mt-0.5 font-medium">クリックまたはドラッグ＆ドロップ</div>
                            </div>
                        )}
                    </div>

                    {/* Action Card: Slides down when file is staged */}
                    {stagedFile && (
                        <div className="mt-3 p-3 bg-white border border-emerald-500/30 rounded-[10px] animate-in slide-in-from-top-2 fade-in-50 duration-200 relative">
                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">カテゴリー指定:</label>
                            <select
                                value={stagedTargetDoc}
                                onChange={e => setStagedTargetDoc(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 focus:border-[#0067b8] focus:bg-white focus:ring-1 focus:ring-[#0067b8]/10 focus:outline-none rounded-none pl-2.5 pr-8 py-2 text-xs mb-3 font-medium transition-colors cursor-pointer appearance-none"
                            >
                                <option value="">-- 書類の種類を選択 --</option>
                                {COMPANY_DOC_TYPES.map(doc => {
                                    const count = files[doc.id]?.length || 0;
                                    return (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.label} {count > 0 ? `(${count}件 追加済み)` : ''}
                                        </option>
                                    )
                                })}
                                <option value="new_custom" className="font-bold text-emerald-500">➕ 新規カテゴリーを追加</option>
                            </select>

                            {stagedTargetDoc === 'new_custom' && (
                                <input
                                    type="text"
                                    placeholder="カテゴリー名を入力..."
                                    value={newCustomCategory}
                                    onChange={e => setNewCustomCategory(e.target.value)}
                                    className="w-full bg-white border border-gray-300 focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8]/10 focus:outline-none rounded-none pl-2.5 pr-2 py-2 text-xs mb-3 font-medium transition-colors"
                                />
                            )}

                            <button
                                type="button"
                                onClick={stageToStorage}
                                disabled={!stagedTargetDoc || (stagedTargetDoc === 'new_custom' && !newCustomCategory.trim())}
                                className="w-full py-2 bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-none hover:bg-black transition-colors flex items-center justify-center gap-1.5"
                            >
                                ストレージへ保存 <ArrowLeft size={14} className="rotate-180" />
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. Storage Board */}
                <div>
                    <div className="flex items-center justify-between mb-2.5 pl-1">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">2. ストレージ（保管庫）</h4>
                        {Object.keys(files).length > 0 && (
                            <span className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded-none font-bold text-[10px]">
                                {Object.values(files).reduce((acc, arr) => acc + arr.length, 0)} ファイル
                            </span>
                        )}
                    </div>

                    <div className="space-y-2.5 relative min-h-[140px] rounded-none border border-gray-100 bg-gray-50/50 p-2">
                        {Object.keys(files).length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                <FileText size={24} className="text-gray-300 mb-2" />
                                <span className="text-[11px] text-gray-400 font-medium italic">空のストレージです。<br />ここにファイルを分類してください。</span>
                            </div>
                        )}

                        {activeDocTypes.map(doc => {
                            const fileArr = files[doc.id] || [];

                            if (fileArr.length === 0) return null;

                            return (
                                <React.Fragment key={doc.id}>
                                    {fileArr.map((f, idx) => (
                                        <div key={f.id} className="p-1.5 bg-white border border-gray-200 rounded-none flex items-center justify-between animate-in fade-in zoom-in-95 duration-200 group">
                                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                <div className="w-7 h-7 rounded-none flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500">
                                                    {doc.id === 'kigyo_shashin' ? <ImageIcon size={14} /> : <FileText size={14} />}
                                                </div>
                                                <div className="truncate flex-1">
                                                    <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5 leading-none">
                                                        <span className="truncate">{doc.label} {fileArr.length > 1 ? `#${idx + 1}` : ''}</span>
                                                    </div>
                                                    <div className="flex flex-col mt-0.5">
                                                        <div className="text-[11px] text-gray-600 font-medium truncate leading-tight" title={f.file.name}>{f.file.name}</div>
                                                        <div className="text-[9px] text-gray-400 font-medium leading-none mt-0.5">保存日: {f.timestamp}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center ml-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromStorage(doc.id, f.id)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-none text-gray-400 hover:text-white hover:bg-red-500 transition-colors"
                                                    title="ファイルを削除"
                                                >
                                                    <X size={12} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    )
}
