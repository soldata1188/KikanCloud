'use client'

import React, { useState } from 'react';
import { ArrowLeft, User, FileText, X, ExternalLink, IdCard, Briefcase, FileBadge2, DownloadCloud, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { deleteWorker } from '@/app/workers/actions';

interface DocumentFile {
    name: string;
    url: string;
    created_at: string;
}

const DOC_TYPES: Record<string, string> = {
    'avatar': '顔写真',
    'zairyu_card': '在留カード',
    'passport': 'パスポート',
    'resume': '履歴書',
    'cert_notice': '認定通知',
    'insurance': '総合保険',
    'my_number': '個人番号',
    'pension': '年金番号',
    'bank': '銀行口座',
    'health_check': '健康診断',
    'skill_test': '検定合格',
    'ccus': 'CCUSカード'
};

function getDocName(filename: string) {
    let mapped = filename;
    for (const key of Object.keys(DOC_TYPES)) {
        if (filename.startsWith(key + '_')) {
            mapped = DOC_TYPES[key];
            break;
        }
    }
    return mapped;
}

const DataRow = ({ label, value, isLast = false }: { label: React.ReactNode, value: React.ReactNode, isLast?: boolean }) => (
    <div className={`flex flex-col sm:flex-row ${!isLast ? 'border-b border-gray-350' : ''} hover:bg-gray-50/50 transition-colors`}>
        <div className="w-full sm:w-[150px] lg:w-[200px] bg-gray-50/50 px-4 py-2 flex items-center border-b sm:border-b-0 sm:border-r border-gray-350 shrink-0">
            <span className="text-[13px] font-bold text-gray-600">{label}</span>
        </div>
        <div className="flex-1 px-4 py-2 flex items-center min-h-[38px] text-[14px] text-[#1f1f1f] font-medium break-words">
            {value || <span className="text-gray-400 italic font-normal text-sm">--</span>}
        </div>
    </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WorkerDetailClient({ worker, documents }: { worker: any, documents: DocumentFile[] }) {
    const [previewDoc, setPreviewDoc] = useState<DocumentFile | null>(null);

    const formatSystemType = (sys: string) => {
        if (sys === 'ikusei_shuro') return '育成就労';
        if (sys === 'tokuteigino') return '特定技能';
        if (sys === 'ginou_jisshu') return '技能実習';
        return sys;
    };

    const formatStatus = (st: string) => {
        const mapping: Record<string, { label: string, bg: string, text: string }> = {
            'waiting': { label: '入国待', bg: 'bg-[#ff9800]/10', text: 'text-[#ff9800]' },
            'standby': { label: '対応中', bg: 'bg-gray-1000/10', text: 'text-blue-600' },
            'working': { label: '就業中', bg: 'bg-[#24b47e]/10', text: 'text-[#24b47e]' },
            'missing': { label: '失踪', bg: 'bg-red-500/10', text: 'text-red-600' },
            'returned': { label: '帰国', bg: 'bg-gray-500/10', text: 'text-gray-600' }
        };
        const res = mapping[st] || { label: st, bg: 'bg-gray-100', text: 'text-gray-700' };
        return (
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border border-current ${res.bg} ${res.text}`}>
                {res.label}
            </span>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden text-[#1f1f1f]">
            {/* Action Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-350 bg-white shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <Link href="/workers" className="w-10 h-10 flex items-center justify-center rounded-none hover:bg-gray-100 transition-colors">
                        <ArrowLeft size={24} strokeWidth={1.5} />
                    </Link>
                    <div>
                        <h2 className="text-[20px] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 leading-tight">
                            {worker.full_name_romaji || '氏名未登録'}
                        </h2>
                        {worker.full_name_kana && <p className="text-xs text-gray-400 font-medium">{worker.full_name_kana}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <form action={deleteWorker} onSubmit={(e) => {
                        if (!window.confirm('本当に削除いたしますか？')) {
                            e.preventDefault();
                        }
                    }}>
                        <input type="hidden" name="id" value={worker.id} />
                        <button type="submit" className="px-4 py-2 text-red-600 text-sm bg-white font-bold hover:bg-red-50 border border-red-200 transition-colors rounded-none flex items-center gap-2">
                            <Trash2 size={16} strokeWidth={2} /> 削除
                        </button>
                    </form>
                    <Link href={`/workers/${worker.id}/edit`} className="px-4 py-2 text-[#1f1f1f] text-sm bg-white font-bold hover:bg-gray-50 border border-gray-350 transition-colors rounded-none flex items-center gap-2">
                        <Pencil size={16} strokeWidth={2} /> 編集
                    </Link>
                </div>
            </div>

            {/* Split View */}
            <div className="flex-1 flex flex-row overflow-hidden bg-white">

                {/* LEFT PANE: Data View */}
                <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-24 border-r border-gray-350">
                    <div className="max-w-3xl mx-auto space-y-6">

                        {/* Profile Header */}
                        <div className="bg-white border border-gray-350 p-6 flex flex-col md:flex-row gap-6 items-center md:items-start transition-shadow">
                            <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-white overflow-hidden shrink-0">
                                {worker.avatar_url ? (
                                    <img src={worker.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User size={40} strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-3">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                    <span className="bg-gray-100 text-blue-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider border border-blue-200">
                                        {formatSystemType(worker.system_type)}
                                    </span>
                                    {formatStatus(worker.status)}
                                    {worker.nationality && (
                                        <span className="flex items-center gap-1 text-sm font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-350">
                                            {worker.nationality}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#1f1f1f]">{worker.full_name_romaji}</h3>
                                    {worker.companies?.name_jp && (
                                        <p className="text-sm font-bold text-[#24b47e] mt-1 flex items-center justify-center md:justify-start gap-1">
                                            <Briefcase size={14} /> 配属先企業：{worker.companies.name_jp}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-white border border-gray-350 overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-350 bg-gray-50/50">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <User size={16} className="text-[#24b47e]" /> 基本情報
                                </h3>
                            </div>
                            <div className="flex flex-col">
                                <DataRow label="氏名（ローマ字）" value={worker.full_name_romaji} />
                                <DataRow label="氏名（カナ）" value={worker.full_name_kana} />
                                <DataRow label="生年月日" value={worker.dob} />
                                <DataRow label="性別" value={worker.gender === 'male' ? '男性' : worker.gender === 'female' ? '女性' : worker.gender} />
                                <DataRow label="配偶者" value={worker.has_spouse === true ? '有' : worker.has_spouse === false ? '無' : worker.has_spouse} />
                                <DataRow label="血液型" value={worker.blood_type} />
                                <DataRow label="国籍" value={worker.nationality} />
                                <DataRow label="本国の出生地" value={worker.birthplace} />
                                <DataRow label="社宅住所" value={worker.address} isLast />
                            </div>
                        </div>

                        {/* Management Info */}
                        <div className="bg-white border border-gray-350 overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-350 bg-gray-50/50">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Briefcase size={16} className="text-blue-500" /> 管理情報
                                </h3>
                            </div>
                            <div className="flex flex-col">
                                <DataRow label="職種区分" value={worker.industry_field} />
                                <DataRow label="配属先企業" value={worker.companies?.name_jp} />
                                <DataRow label="送出機関" value={worker.sending_org} />
                                <DataRow label="入国期生" value={worker.entry_batch} />
                                <DataRow label="入国日" value={worker.entry_date} isLast />
                            </div>
                        </div>

                        {/* Visas and Certs */}
                        <div className="bg-white border border-gray-350 overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-350 bg-gray-50/50">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <IdCard size={16} className="text-purple-500" /> 証明書・期限
                                </h3>
                            </div>
                            <div className="flex flex-col">
                                <DataRow label="在留資格" value={worker.visa_status} />
                                <DataRow label="在留カード番号" value={worker.zairyu_no} />
                                <DataRow label="在留期限" value={
                                    <span className={worker.zairyu_exp ? "font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded" : ""}>{worker.zairyu_exp}</span>
                                } />
                                <DataRow label="パスポート番号" value={worker.passport_no} />
                                <DataRow label="パスポート期限" value={worker.passport_exp} />
                                <DataRow label="保険期限" value={worker.insurance_exp} />
                                <DataRow label="認定番号" value={worker.cert_no} />
                                <DataRow label="認定期間" value={worker.cert_start_date ? `${worker.cert_start_date} ~ ${worker.cert_end_date || ''}` : ''} isLast />
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="bg-white border border-gray-350 overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-350 bg-gray-50/50">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    備考・特記事項
                                </h3>
                            </div>
                            <div className="px-5 py-4 text-sm text-[#1f1f1f] whitespace-pre-wrap">
                                {(worker as any).remarks || <span className="text-gray-400">（特記事項はございません）</span>}
                            </div>
                        </div>

                    </div>
                </div>


                {/* RIGHT PANE: Document List */}
                <div className="w-[380px] shrink-0 h-full flex flex-col bg-white border-l border-gray-350 relative z-10">
                    <div className="flex items-center justify-between p-5 border-b border-gray-350 bg-white">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-blue-600">
                                <FileBadge2 size={16} />
                            </div>
                            <h3 className="text-[15px] font-bold">関連書類</h3>
                        </div>
                        <span className="bg-gray-100/80 border border-gray-350 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">
                            {documents.length}件
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar pb-24">
                        {documents.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-350 rounded-[12px] bg-gray-50/50">
                                <DownloadCloud size={28} className="text-gray-300 mb-3" />
                                <span className="text-sm font-medium text-gray-500">書類は存在いたしません。</span>
                            </div>
                        ) : (
                            <div className="grid gap-2.5">
                                {documents.map((doc, idx) => {
                                    const niceName = getDocName(doc.name);
                                    // Extract extension
                                    const extMatch = doc.name.match(/\.[0-9a-z]+$/i);
                                    const ext = extMatch ? extMatch[0].toLowerCase() : '';

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setPreviewDoc(doc)}
                                            className="group flex flex-col p-3 rounded-none border border-gray-350 bg-white hover:border-[#24b47e]/40 hover:bg-[#24b47e]/[0.02] cursor-pointer transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 flex-shrink-0 bg-gray-100/50 border border-blue-100 flex items-center justify-center text-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                                                    <FileText size={18} strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[13px] font-bold text-gray-800 truncate leading-tight group-hover:text-[#24b47e] transition-colors">{niceName}</h4>
                                                    <p className="text-[11px] text-gray-400 mt-1 font-medium truncate tracking-wide" title={doc.name}>{doc.name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Document Preview Overlay */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in">
                    <div className="bg-white rounded-[12px] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-350 bg-gray-50/80">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded">
                                    <FileText size={16} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[14px] text-gray-800 leading-none">{getDocName(previewDoc.name)}</h3>
                                    <p className="text-[11px] text-gray-500 mt-1">{previewDoc.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewDoc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors rounded-none outline-none"
                                    title="新しいタブで開く"
                                >
                                    <ExternalLink size={18} />
                                </a>
                                <button
                                    onClick={() => setPreviewDoc(null)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-none outline-none"
                                    title="閉じる"
                                >
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Content Viewer */}
                        <div className="flex-1 bg-[#e5e5e5] relative flex items-center justify-center p-4 overflow-hidden">
                            {/* IF PDF or other IFRAME supported files */}
                            <iframe
                                src={previewDoc.url} className="w-full h-full border-none bg-white rounded"
                                title="Document Preview"
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}