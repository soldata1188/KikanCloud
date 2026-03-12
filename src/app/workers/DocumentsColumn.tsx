'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FileText, Upload, Trash2, Eye, FilePlus, FolderOpen, X, UploadCloud, Check } from 'lucide-react';
import { saveDocumentRecord, deleteDocumentRecord } from './documents-actions';

// ── Doc Type Config ───────────────────────────────────────
const DOC_TYPES: Record<string, { label: string; color: string; bg: string }> = {
    passport: { label: 'パスポート', color: 'text-blue-700', bg: 'bg-blue-100' },
    zairyu_card: { label: '在留カード', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    contract: { label: '契約書', color: 'text-violet-700', bg: 'bg-violet-100' },
    photo: { label: '写真', color: 'text-amber-700', bg: 'bg-amber-100' },
    other: { label: 'その他', color: 'text-gray-600', bg: 'bg-gray-100' },
};

interface WorkerDoc {
    id: string;
    doc_type: string;
    file_name: string;
    file_path: string;
    file_size: number;
    created_at: string;
}

interface DocumentsColumnProps {
    workerId: string | null;
}

export default function DocumentsColumn({ workerId }: DocumentsColumnProps) {
    const [docs, setDocs] = useState<WorkerDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadDocType, setUploadDocType] = useState(DOC_TYPES['passport'].label);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchDocs = useCallback(async () => {
        if (!workerId) { setDocs([]); return; }
        setLoading(true);
        try {
            const { data } = await supabase
                .from('worker_documents')
                .select('*')
                .eq('worker_id', workerId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });
            setDocs(data || []);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workerId]);

    useEffect(() => { fetchDocs(); }, [fetchDocs]);

    const handleFileSelect = (file: File) => {
        if (!file || !workerId) return;
        setPendingFile(file);
        setError(null);
    };

    const confirmUpload = async () => {
        if (!pendingFile || !workerId) return;
        setUploading(true);
        setError(null);

        try {
            // Generate formatted file name: [DocTypeName]_[YYYYMMDD].[ext]
            const date = new Date();
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}${mm}${dd}`;

            const originalExt = pendingFile.name.split('.').pop() || '';
            const typeLabel = uploadDocType.trim() || '書類';
            const formattedFileName = `${typeLabel}_${dateStr}.${originalExt}`;

            const docTypeKey = Object.entries(DOC_TYPES).find(([k, v]) => v.label === typeLabel)?.[0] || 'other';

            const path = `${workerId}/${Date.now()}_${formattedFileName}`;

            const { error: uploadErr } = await supabase.storage
                .from('worker_docs')
                .upload(path, pendingFile);

            if (uploadErr) throw uploadErr;

            await saveDocumentRecord({
                workerId,
                docType: docTypeKey,
                fileName: formattedFileName,
                filePath: path,
                fileSize: pendingFile.size,
                contentType: pendingFile.type,
            });
            await fetchDocs();
            setPendingFile(null);
        } catch (err: any) {
            setError(err.message || 'アップロードに失敗しました');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const cancelUpload = () => {
        setPendingFile(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (workerId && !uploading && !pendingFile) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (workerId && !uploading && !pendingFile && !isDragging) setIsDragging(true);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!workerId || uploading || pendingFile) return;
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };


    const handleView = async (doc: WorkerDoc) => {
        try {
            const { data, error } = await supabase.storage
                .from('worker_docs')
                .createSignedUrl(doc.file_path, 120);
            if (error) throw error;
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            } else {
                throw new Error("URLを取得できませんでした。");
            }
        } catch (err: any) {
            console.error('View error:', err);
            alert(`エラー: ファイルを開けません (${err.message})`);
        }
    };

    const handleDelete = async (doc: WorkerDoc) => {
        if (!confirm(`「${doc.file_name}」を削除しますか？`)) return;
        try {
            const { error } = await supabase.storage.from('worker_docs').remove([doc.file_path]);
            if (error) {
                console.warn('Storage file could not be removed (maybe already deleted):', error.message);
            }
            await deleteDocumentRecord(doc.id);
            await fetchDocs();
        } catch (err: any) {
            console.error('Delete error:', err);
            alert(`エラー: 削除できません (${err.message})`);
        }
    };

    const fmtSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`;
        return `${(bytes / 1048576).toFixed(1)}MB`;
    };

    const fmtDate = (s: string) =>
        new Date(s).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' });

    // ── Empty state (no worker selected) ──
    if (!workerId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white">
                <FolderOpen size={44} className="text-gray-200 mb-3" />
                <p className="text-[13px] font-black text-gray-300">人材を選択してください</p>
                <p className="text-[10px] text-gray-200 mt-1 leading-relaxed">
                    書類を管理するには<br />左のリストから人材を選択します
                </p>
            </div>
        );
    }

    return (
        <div
            className="h-full flex flex-col bg-white overflow-hidden relative"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Drag & Drop Overlay */}
            {isDragging && !pendingFile && (
                <div className="absolute inset-0 z-50 bg-slate-800/80 backdrop-blur-sm border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center pointer-events-none transition-all">
                    <UploadCloud size={48} className="text-white mb-4 animate-bounce" />
                    <p className="text-[14px] font-black text-white tracking-widest uppercase">ドロップして追加</p>
                    <p className="text-[11px] font-medium text-slate-300 mt-1">ファイルを一時保持します</p>
                </div>
            )}

            {/* ── Upload Bar ── */}
            <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
                <div className="max-w-[600px] mx-auto w-full space-y-2">
                    {!pendingFile ? (
                        // Default State: Select file button only
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-9 px-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                            >
                                <UploadCloud size={14} className="text-slate-500" />
                                ファイル選択 または D&D
                            </button>
                        </div>
                    ) : (
                        // Pending State: Select type and confirm
                        <div className="flex flex-col gap-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] text-emerald-800 font-bold truncate pr-3" title={pendingFile.name}>
                                    📄 {pendingFile.name}
                                </p>
                                <span className="text-xs text-emerald-600 font-mono shrink-0">{fmtSize(pendingFile.size)}</span>
                            </div>
                            <div className="flex flex-col gap-2 mt-1">
                                <input
                                    list="doc-types-list"
                                    value={uploadDocType}
                                    onChange={e => setUploadDocType(e.target.value)}
                                    disabled={uploading}
                                    placeholder="種類 (例: パスポート)"
                                    className="w-full h-8 px-2 bg-white border border-emerald-200 rounded-md text-[11px] font-bold outline-none focus:border-emerald-500 transition-all text-emerald-800"
                                />
                                <datalist id="doc-types-list">
                                    {Object.entries(DOC_TYPES).map(([k, v]) => (
                                        v.label !== 'その他' && <option key={k} value={v.label} />
                                    ))}
                                </datalist>
                                <div className="flex gap-1.5 shrink-0 justify-end">
                                    <button
                                        onClick={cancelUpload}
                                        disabled={uploading}
                                        className="flex-1 h-8 px-2 bg-white hover:bg-slate-50 border border-emerald-200 text-slate-500 rounded-md text-[11px] font-bold transition-all"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={confirmUpload}
                                        disabled={uploading}
                                        className="flex-1 h-8 px-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-[11px] font-black flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20"
                                    >
                                        {uploading
                                            ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            : <Check size={13} />}
                                        {uploading ? '保存中' : '保存'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleUpload}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.csv"
                    />

                    {error && (
                        <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                            <X size={10} /> {error}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Document List ── */}
            <div className="flex-1 overflow-y-auto thin-scrollbar">
                <div className="max-w-[600px] mx-auto w-full">
                    {loading ? (
                        <div className="flex items-center justify-center h-20">
                            <span className="w-5 h-5 border-2 border-slate-100 border-t-slate-500 rounded-full animate-spin" />
                        </div>
                    ) : docs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <FilePlus size={36} className="text-gray-200 mb-3" />
                            <p className="text-[12px] font-bold text-gray-300">書類がありません</p>
                            <p className="text-[10px] text-gray-200 mt-0.5">ドラッグ＆ドロップ、またはファイルを選択して追加できます</p>
                        </div>
                    ) : (
                        <div>
                            {docs.map(doc => {
                                const cfg = DOC_TYPES[doc.doc_type] ?? DOC_TYPES.other;
                                return (
                                    <div
                                        key={doc.id}
                                        className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-slate-50 transition-colors group"
                                    >
                                        {/* Icon */}
                                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                            <FileText size={17} className="text-slate-500" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-bold text-gray-800 truncate leading-tight">
                                                {doc.file_name}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                <span className={`text-xs font-black px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                                <span className="text-xs text-gray-400 font-mono">{fmtSize(doc.file_size)}</span>
                                                <span className="text-xs text-gray-400">{fmtDate(doc.created_at)}</span>
                                            </div>
                                        </div>

                                        {/* Actions — visible on hover */}
                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleView(doc)}
                                                title="表示・ダウンロード"
                                                className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all"
                                            >
                                                <Eye size={13} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doc)}
                                                title="削除"
                                                className="w-7 h-7 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-all"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
