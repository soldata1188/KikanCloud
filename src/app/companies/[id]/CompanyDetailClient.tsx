'use client'

import React, { useState } from 'react';
import { ArrowLeft, Building2, FileText, X, ExternalLink, Users, Briefcase, DownloadCloud, Phone, Mail, Trash2, Pencil, ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { deleteCompany } from '@/app/companies/actions';

interface DocumentFile { name: string; url: string; created_at: string; }

const DataRow = ({ label, value, isLast = false }: { label: React.ReactNode; value: React.ReactNode; isLast?: boolean }) => (
    <div className={`flex flex-col sm:flex-row ${!isLast ? 'border-b border-slate-100' : ''} hover:bg-slate-50/40 transition-colors`}>
        <div className="w-full sm:w-[180px] lg:w-[200px] bg-slate-50/60 px-5 py-2.5 flex items-center border-b sm:border-b-0 sm:border-r border-slate-100 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
        </div>
        <div className="flex-1 px-5 py-2.5 flex items-center min-h-[40px] text-[13.5px] text-slate-800 font-medium break-words">
            {value || <span className="text-slate-300 font-normal">—</span>}
        </div>
    </div>
);

const SectionCard = ({ icon, iconColor, title, children }: { icon: React.ReactNode; iconColor: string; title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-slate-200 overflow-hidden rounded-2xl shadow-sm">
        <div className="px-5 py-3 border-b border-slate-700 flex items-center gap-2.5 bg-slate-800">
            <span className={iconColor}>{icon}</span>
            <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex flex-col">{children}</div>
    </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CompanyDetailClient({ company, documents }: { company: any; documents: DocumentFile[] }) {
    const [previewDoc, setPreviewDoc] = useState<DocumentFile | null>(null);

    const activeWorkersList = company.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false) || [];
    const activeWorkers = activeWorkersList.length;
    const activeGinouCount = activeWorkersList.filter((w: any) => w.system_type === 'ginou_jisshu').length;
    const activeTokuteiCount = activeWorkersList.filter((w: any) => w.system_type === 'tokuteigino').length;
    const activeIkuseiCount = activeWorkersList.filter((w: any) => w.system_type === 'ikusei_shuro').length;

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">

            {/* ── Top Action Bar ── */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/companies"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                        <ArrowLeft size={18} strokeWidth={2} />
                    </Link>
                    <div className="w-px h-5 bg-slate-200" />
                    <div>
                        <h2 className="text-[16px] font-bold tracking-tight text-slate-900 leading-tight">
                            {company.name_jp || '名前なし'}
                        </h2>
                        {company.name_romaji && (
                            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-px">{company.name_romaji}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/companies/${company.id}/edit`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-[12px] font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                        <Pencil size={13} strokeWidth={2} /> 編集
                    </Link>
                    <form action={deleteCompany} onSubmit={e => { if (!window.confirm('本当に削除しますか？')) e.preventDefault(); }}>
                        <input type="hidden" name="id" value={company.id} />
                        <button type="submit"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-red-600 text-[12px] bg-white font-bold hover:bg-red-50 border border-red-200 transition-colors rounded-lg shadow-sm">
                            <Trash2 size={13} strokeWidth={2} /> 削除
                        </button>
                    </form>
                </div>
            </div>

            <div className="flex-1 flex flex-row overflow-hidden">

                {/* LEFT: Data */}
                <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-24">
                    <div className="max-w-2xl mx-auto space-y-5">

                        {/* Company Hero Card */}
                        <div className="bg-slate-800 rounded-2xl shadow-md overflow-hidden">
                            <div className="px-6 pt-6 pb-5 flex flex-col md:flex-row gap-5 items-center md:items-start">
                                {/* Icon */}
                                <div className="w-20 h-20 rounded-xl bg-slate-700 border-2 border-slate-600 flex items-center justify-center shrink-0">
                                    <Building2 size={36} strokeWidth={1.5} className="text-slate-400" />
                                </div>
                                {/* Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/10 text-slate-300 border border-white/10 font-mono">
                                            {company.corporate_number ? `法人番号 ${company.corporate_number}` : '法人番号なし'}
                                        </span>
                                        {company.industry && (
                                            <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md">
                                                {company.industry}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-[20px] font-black text-white tracking-tight leading-tight">{company.name_jp}</h3>
                                    {company.name_kana && <p className="text-[12px] text-slate-400 mt-0.5">{company.name_kana}</p>}
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                                        {company.phone && (
                                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                                                <Phone size={11} /> {company.phone}
                                            </span>
                                        )}
                                        {company.email && (
                                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                                                <Mail size={11} /> {company.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* 従業員数 */}
                                <div className="text-center shrink-0">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">従業員数</div>
                                    <div className="text-[22px] font-black text-white leading-none">
                                        {company.employee_count || '—'}<span className="text-[13px] text-slate-400 ml-0.5">名</span>
                                    </div>
                                </div>
                            </div>

                            {/* Worker summary bar */}
                            <div className="border-t border-white/10 px-6 py-3 bg-black/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users size={13} className="text-slate-400" />
                                    <span className="text-[11px] text-slate-400 font-bold">現在受入人数</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[15px] font-black ${activeWorkers > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        合計 {activeWorkers}名
                                    </span>
                                    {(activeGinouCount > 0 || activeTokuteiCount > 0 || activeIkuseiCount > 0) && (
                                        <div className="flex gap-2 text-[10px] text-slate-400 border-l pl-3 border-white/10">
                                            {activeGinouCount > 0 && <span>技実 <strong className="text-slate-300">{activeGinouCount}</strong></span>}
                                            {activeTokuteiCount > 0 && <span>特技 <strong className="text-slate-300">{activeTokuteiCount}</strong></span>}
                                            {activeIkuseiCount > 0 && <span>育就 <strong className="text-slate-300">{activeIkuseiCount}</strong></span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 企業基本情報 */}
                        <SectionCard icon={<Building2 size={14} />} iconColor="text-emerald-400" title="企業基本情報">
                            <DataRow label="企業名" value={company.name_jp} />
                            <DataRow label="フリガナ" value={company.name_kana} />
                            <DataRow label="ローマ字" value={company.name_romaji} />
                            <DataRow label="法人番号" value={company.corporate_number ? <span className="font-mono text-[13px]">{company.corporate_number}</span> : null} />
                            <DataRow label="業種" value={company.industry} />
                            <DataRow label="受入職種" value={company.accepted_occupations} />
                            <DataRow label="従業員数" value={company.employee_count ? `${company.employee_count} 名` : undefined} />
                            <DataRow label="所在地" value={
                                <div className="flex flex-col">
                                    {company.postal_code && <span className="font-mono text-slate-400 text-[11px] mb-0.5">〒{company.postal_code}</span>}
                                    <span>{company.address}</span>
                                </div>
                            } isLast />
                        </SectionCard>

                        {/* 担当者・連絡先 */}
                        <SectionCard icon={<Users size={14} />} iconColor="text-blue-400" title="担当者・連絡先">
                            <DataRow label="代表者名" value={company.representative} />
                            <DataRow label="代表者ローマ字" value={company.representative_romaji} />
                            <DataRow label="電話番号" value={company.phone ? <span className="font-mono">{company.phone}</span> : null} />
                            <DataRow label="メールアドレス" value={company.email ? <span className="font-mono text-[12px]">{company.email}</span> : null} />
                            <DataRow label="担当者名" value={company.pic_name} />
                            <DataRow label="講習責任者" value={
                                <div className="flex items-center gap-2">
                                    <span>{company.manager_name}</span>
                                    {company.training_date && (
                                        <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                            講習: {company.training_date}
                                        </span>
                                    )}
                                </div>
                            } />
                            <DataRow label="生活指導員" value={company.life_advisor} />
                            <DataRow label="技能指導員" value={company.tech_advisor} isLast />
                        </SectionCard>

                        {/* 登録番号・費用 */}
                        <SectionCard icon={<Briefcase size={14} />} iconColor="text-violet-400" title="登録番号・費用">
                            <DataRow label="労働保険番号" value={company.labor_insurance_number ? <span className="font-mono text-[12px]">{company.labor_insurance_number}</span> : null} />
                            <DataRow label="雇用保険番号" value={company.employment_insurance_number ? <span className="font-mono text-[12px]">{company.employment_insurance_number}</span> : null} />
                            <DataRow label="受理届出番号" value={company.acceptance_notification_number ? <span className="font-mono text-[12px]">{company.acceptance_notification_number}</span> : null} />
                            <DataRow label="受理届出日" value={company.acceptance_notification_date ? <span className="font-mono">{company.acceptance_notification_date}</span> : null} />
                            <DataRow label="一般監理費" value={company.general_supervision_fee ? `${company.general_supervision_fee.toLocaleString()} 円` : undefined} />
                            <DataRow label="3号監理費" value={company.category_3_supervision_fee ? `${company.category_3_supervision_fee.toLocaleString()} 円` : undefined} />
                            <DataRow label="支援料" value={company.support_fee ? `${company.support_fee.toLocaleString()} 円` : undefined} isLast />
                        </SectionCard>

                        {/* 備考 */}
                        <div className="bg-white border border-slate-200 overflow-hidden rounded-2xl shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-700 bg-slate-800">
                                <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">備考・特記事項</h3>
                            </div>
                            <div className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {company.remarks || <span className="text-slate-300 italic">特記事項なし</span>}
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT: Documents */}
                <div className="w-[340px] shrink-0 h-full flex flex-col bg-white border-l border-slate-200 relative z-10">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-800">
                        <div className="flex items-center gap-2.5">
                            <FileText size={15} className="text-blue-400" />
                            <h3 className="text-[13px] font-bold text-white">企業書類</h3>
                        </div>
                        <span className="bg-white/10 text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-white/10">
                            {documents.length} 件
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar pb-24 bg-slate-50/40">
                        {documents.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl mt-2">
                                <DownloadCloud size={26} className="text-slate-300 mb-2" />
                                <span className="text-[12px] font-medium text-slate-400">書類は存在いたしません</span>
                            </div>
                        ) : (
                            documents.map((doc, idx) => (
                                <div key={idx} onClick={() => setPreviewDoc(doc)}
                                    className={`group flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-150
                                        ${previewDoc?.name === doc.name
                                            ? 'border-slate-400 bg-slate-800 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm'}`}>
                                    <div className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg transition-colors
                                        ${previewDoc?.name === doc.name
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-800 group-hover:text-white'}`}>
                                        <FileText size={16} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-[12px] font-bold truncate ${previewDoc?.name === doc.name ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                            {doc.name}
                                        </h4>
                                        <p className={`text-[10px] mt-0.5 font-medium ${previewDoc?.name === doc.name ? 'text-slate-400' : 'text-slate-400'}`}>
                                            {new Date(doc.created_at).toLocaleDateString('ja-JP')}
                                        </p>
                                    </div>
                                    <ChevronRight size={13} className={previewDoc?.name === doc.name ? 'text-slate-400' : 'text-slate-300 group-hover:text-slate-500'} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Preview Slide-out */}
                {previewDoc && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-30 flex">
                        <div className="flex-1" onClick={() => setPreviewDoc(null)} />
                        <div className="w-[85%] sm:w-[520px] h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right-full duration-200">
                            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-800">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 text-blue-300 flex items-center justify-center shrink-0">
                                        <FileText size={15} />
                                    </div>
                                    <h4 className="font-bold text-white truncate text-[13px]">{previewDoc.name}</h4>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <a href={previewDoc.url} target="_blank" rel="noopener noreferrer"
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                        <ExternalLink size={15} />
                                    </a>
                                    <a href={previewDoc.url} download={previewDoc.name}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-white/10 rounded-lg transition-colors">
                                        <DownloadCloud size={15} />
                                    </a>
                                    <button onClick={() => setPreviewDoc(null)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1">
                                        <X size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-100 p-4 overflow-hidden flex flex-col">
                                {previewDoc.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-full object-contain rounded-xl shadow-md" />
                                    </div>
                                ) : previewDoc.url.match(/\.(pdf)$/i) ? (
                                    <iframe src={`${previewDoc.url}#view=FitH`} className="w-full h-full rounded-xl shadow-sm border border-slate-200 bg-white" title={previewDoc.name} />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                                        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                                            <FileText size={32} className="text-slate-300" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-slate-600 mb-1 text-[13px]">プレビュー非対応形式</p>
                                            <p className="text-[11px] text-slate-400">ダウンロードして確認してください</p>
                                        </div>
                                        <a href={previewDoc.url} download
                                            className="px-5 py-2 bg-slate-800 text-white text-[12px] font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2">
                                            <DownloadCloud size={14} /> ダウンロード
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
