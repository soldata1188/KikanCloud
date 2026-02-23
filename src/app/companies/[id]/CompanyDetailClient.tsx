'use client'

import React, { useState } from 'react';
import { ArrowLeft, Building2, FileText, Expand, X, ExternalLink, Calendar, Users, Activity, Briefcase, DownloadCloud, Phone, Mail, MapPin, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { deleteCompany } from '@/app/companies/actions';

interface DocumentFile {
    name: string;
    url: string;
    created_at: string;
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
export default function CompanyDetailClient({ company, documents }: { company: any, documents: DocumentFile[] }) {
    const [previewDoc, setPreviewDoc] = useState<DocumentFile | null>(null);

    const activeWorkersList = company.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false) || [];
    const activeWorkers = activeWorkersList.length;
    const activeGinouCount = activeWorkersList.filter((w: any) => w.system_type === 'ginou_jisshu').length;
    const activeTokuteiCount = activeWorkersList.filter((w: any) => w.system_type === 'tokuteigino').length;
    const activeIkuseiCount = activeWorkersList.filter((w: any) => w.system_type === 'ikusei_shuro').length;


    return (
        <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden text-[#1f1f1f]">
            {/* Action Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-350 bg-white shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <Link href="/companies" className="w-10 h-10 flex items-center justify-center rounded-none hover:bg-gray-100 transition-colors">
                        <ArrowLeft size={24} strokeWidth={1.5} />
                    </Link>
                    <div>
                        <h2 className="text-[20px] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 leading-tight">
                            {company.name_jp || '名前なし'}
                        </h2>
                        {company.name_romaji && <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">{company.name_romaji}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <form action={deleteCompany} onSubmit={(e) => {
                        if (!window.confirm('本当に削除しますか？\n(Are you sure you want to delete this company?)')) {
                            e.preventDefault();
                        }
                    }}>
                        <input type="hidden" name="id" value={company.id} />
                        <button type="submit" className="px-4 py-2 text-red-600 text-sm bg-white font-bold hover:bg-red-50 border border-red-200 transition-colors rounded-none flex items-center gap-2">
                            <Trash2 size={16} strokeWidth={2} /> 削除
                        </button>
                    </form>
                    <Link href={`/companies/${company.id}/edit`} className="px-4 py-2 text-[#1f1f1f] text-sm bg-white font-bold hover:bg-gray-50 border border-gray-350 transition-colors rounded-none flex items-center gap-2">
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
                            <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                <Building2 size={40} className="text-[#878787]" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-3 w-full">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                    <span className="bg-gray-100 text-[#1f1f1f] px-2 py-0.5 text-xs font-bold border border-gray-300">
                                        {company.corporate_number ? `法人番号: ${company.corporate_number}` : '法人番号なし'}
                                    </span>
                                    {company.industry && (
                                        <span className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200">
                                            {company.industry}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#1f1f1f]">{company.name_jp}</h3>
                                        <div className="text-sm font-medium text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                            {company.phone && <span className="flex items-center gap-1"><Phone size={14} />{company.phone}</span>}
                                            {company.email && <span className="flex items-center gap-1"><Mail size={14} />{company.email}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 mb-0.5 font-bold">従業員数</div>
                                        <div className="text-lg font-bold text-[#1f1f1f] leading-none">{company.employee_count ? `${company.employee_count}名` : '---'}</div>
                                    </div>
                                </div>
                                {/* 受入状況 Summary */}
                                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm flex items-center justify-between">
                                    <div className="font-bold text-gray-600">現在受入人数</div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-lg font-bold ${activeWorkers > 0 ? 'text-[#24b47e]' : 'text-gray-800'}`}>
                                            合計 {activeWorkers}名
                                        </span>
                                        {(activeGinouCount > 0 || activeTokuteiCount > 0 || activeIkuseiCount > 0) && (
                                            <div className="flex gap-3 text-xs text-gray-500 border-l pl-4 border-gray-300">
                                                {activeGinouCount > 0 && <span>技能実習: <strong className="text-gray-800">{activeGinouCount}</strong></span>}
                                                {activeTokuteiCount > 0 && <span>特定技能: <strong className="text-gray-800">{activeTokuteiCount}</strong></span>}
                                                {activeIkuseiCount > 0 && <span>育成就労: <strong className="text-gray-800">{activeIkuseiCount}</strong></span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-white border border-gray-350 overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-350 bg-gray-50/50">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Building2 size={16} className="text-[#24b47e]" /> 企業基本情報
                                </h3>
                            </div>
                            <div className="flex flex-col">
                                <DataRow label="企業名" value={company.name_jp} />
                                <DataRow label="フリガナ" value={company.name_kana} />
                                <DataRow label="ローマ字" value={company.name_romaji} />
                                <DataRow label="法人番号" value={company.corporate_number ? <span className="font-mono">{company.corporate_number}</span> : null} />
                                <DataRow label="業種" value={company.industry} />
                                <DataRow label="受入職種" value={company.accepted_occupations} />
                                <DataRow label="従業員数" value={company.employee_count ? `${company.employee_count} 名` : undefined} />
                                <DataRow label="所在地" value={
                                    <div className="flex flex-col">
                                        {company.postal_code && <span className="font-mono text-gray-500 text-xs mb-0.5">〒{company.postal_code}</span>}
                                        <span>{company.address}</span>
                                    </div>
                                } isLast />
                            </div>
                        </div>

                        {/* Contact & Rep Info */}
                        <div className="bg-white border border-gray-350 overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-350 bg-gray-50/50">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Users size={16} className="text-blue-500" /> 担当者・連絡先
                                </h3>
                            </div>
                            <div className="flex flex-col">
                                <DataRow label="代表者名" value={company.representative} />
                                <DataRow label="代表者ローマ字" value={company.representative_romaji} />
                                <DataRow label="電話番号" value={company.phone ? <span className="font-mono">{company.phone}</span> : null} />
                                <DataRow label="メールアドレス" value={company.email ? <span className="font-mono">{company.email}</span> : null} />
                                <DataRow label="担当者名" value={company.pic_name} />
                                <DataRow label="講習責任者" value={
                                    <div className="flex items-center gap-2">
                                        <span>{company.manager_name}</span>
                                        {company.training_date && <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">講習: {company.training_date}</span>}
                                    </div>
                                } />
                                <DataRow label="生活指導員" value={company.life_advisor} />
                                <DataRow label="技能指導員" value={company.tech_advisor} isLast />
                            </div>
                        </div>

                        {/* Insurance & Fees */}
                        <div className="bg-white border border-gray-350 overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-350 bg-gray-50/50">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Briefcase size={16} className="text-purple-500" /> 登録番号・費用
                                </h3>
                            </div>
                            <div className="flex flex-col">
                                <DataRow label="労働保険番号" value={company.labor_insurance_number ? <span className="font-mono">{company.labor_insurance_number}</span> : null} />
                                <DataRow label="雇用保険番号" value={company.employment_insurance_number ? <span className="font-mono">{company.employment_insurance_number}</span> : null} />
                                <DataRow label="受理届出番号" value={company.acceptance_notification_number ? <span className="font-mono">{company.acceptance_notification_number}</span> : null} />
                                <DataRow label="受理届出日" value={company.acceptance_notification_date ? <span className="font-mono">{company.acceptance_notification_date}</span> : null} />
                                <DataRow label="一般監理費" value={company.general_supervision_fee ? `${company.general_supervision_fee.toLocaleString()} 円` : undefined} />
                                <DataRow label="3号監理費" value={company.category_3_supervision_fee ? `${company.category_3_supervision_fee.toLocaleString()} 円` : undefined} />
                                <DataRow label="支援料" value={company.support_fee ? `${company.support_fee.toLocaleString()} 円` : undefined} isLast />
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="bg-yellow-50/30 border border-yellow-200 overflow-hidden">
                            <div className="px-5 py-3 border-b border-yellow-200 bg-yellow-100/30">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-yellow-800">
                                    <FileText size={16} /> 備考・特記事項
                                </h3>
                            </div>
                            <div className="p-5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {company.remarks || <span className="text-gray-400">（特記事項なし）</span>}
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT PANE: Document List */}
                <div className="w-[380px] shrink-0 h-full flex flex-col bg-white border-l border-gray-350 relative z-10">
                    <div className="p-4 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2 text-[#1f1f1f] text-sm">
                            <FileText size={18} className="text-[#24b47e]" /> 企業書類
                        </h3>
                        <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{documents.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full no-scrollbar p-3 space-y-2 relative">
                        {documents.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                                <FileText size={32} className="mb-2 opacity-20" />
                                <p className="text-sm">アップロードされた書類はありません</p>
                            </div>
                        ) : (
                            documents.map((doc, idx) => (
                                <div
                                    key={idx}
                                    className={`group flex items-center gap-3 p-3 rounded-md border text-left transition-all cursor-pointer ${previewDoc?.name === doc.name ? 'border-[#24b47e] bg-[#24b47e]/5 shadow-sm ring-1 ring-[#24b47e]' : 'border-gray-200 bg-white hover:border-[#24b47e] hover:shadow-sm'}`}
                                    onClick={() => setPreviewDoc(doc)}
                                >
                                    <div className={`w-10 h-10 rounded shrink-0 flex items-center justify-center ${previewDoc?.name === doc.name ? 'bg-[#24b47e] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-[#24b47e]/10 group-hover:text-[#24b47e]'} transition-colors`}>
                                        <FileText size={20} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className={`text-[13px] font-bold truncate ${previewDoc?.name === doc.name ? 'text-[#24b47e]' : 'text-[#1f1f1f] group-hover:text-[#24b47e]'} transition-colors`}>
                                            {doc.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {new Date(doc.created_at).toLocaleDateString('ja-JP')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* File Preview Overlay (Mobile/Slide-out) */}
                {previewDoc && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex">
                        <div className="flex-1" onClick={() => setPreviewDoc(null)}></div>
                        <div className="w-[85%] sm:w-[500px] h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right-full duration-200">
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                        <FileText size={16} />
                                    </div>
                                    <h4 className="font-bold text-[#1f1f1f] truncate text-sm" title={previewDoc.name}>{previewDoc.name}</h4>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <a
                                        href={previewDoc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="別タブで開く"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                    <a
                                        href={previewDoc.url}
                                        download={previewDoc.name}
                                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#24b47e] hover:bg-green-50 rounded transition-colors"
                                        title="ダウンロード"
                                    >
                                        <DownloadCloud size={16} />
                                    </a>
                                    <button
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-1"
                                        onClick={() => setPreviewDoc(null)}
                                        title="閉じる"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-gray-100/50 p-6 overflow-hidden flex flex-col relative">
                                {previewDoc.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                    <div className="flex-1 w-full h-full relative flexitems-center justify-center p-2">
                                        <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-full object-contain rounded drop-shadow-md mx-auto" />
                                    </div>
                                ) : previewDoc.url.match(/\.(pdf)$/i) ? (
                                    <iframe src={`${previewDoc.url}#view=FitH`} className="w-full h-full rounded shadow-sm border border-gray-200 bg-white" title={previewDoc.name} />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
                                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                            <FileText size={32} className="text-gray-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-gray-600 mb-1">プレビュー非対応形式</p>
                                            <p className="text-xs text-gray-400">ダウンロードして内容をご確認ください</p>
                                        </div>
                                        <a href={previewDoc.url} download className="mt-2 px-6 py-2 bg-[#24b47e] text-white text-sm font-bold rounded shadow-sm hover:bg-[#1e9a6a] transition-colors flex items-center gap-2">
                                            <DownloadCloud size={16} /> ダウンロード
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
