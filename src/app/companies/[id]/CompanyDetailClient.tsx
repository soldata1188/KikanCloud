'use client'

import React, { useState } from 'react';
import { ArrowLeft, Building2, FileText, X, ExternalLink, Users, Briefcase, DownloadCloud, Phone, Mail, Trash2, Pencil, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import { deleteCompany } from '@/app/companies/actions';

interface DocumentFile { name: string; url: string; created_at: string; }

const DataRow = ({ label, value, isLast = false }: { label: React.ReactNode; value: React.ReactNode; isLast?: boolean }) => (
    <div className={`flex flex-col sm:flex-row ${!isLast ? 'border-b border-gray-100' : ''} hover:bg-gray-50/50 transition-colors`}>
        <div className="w-full sm:w-[160px] lg:w-[180px] px-5 py-3 flex items-start border-b sm:border-b-0 sm:border-r border-gray-100 shrink-0 bg-gray-50/30">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</span>
        </div>
        <div className="flex-1 px-5 py-3 flex items-center min-h-[44px] text-[13px] text-gray-900 font-bold break-words leading-relaxed">
            {value || <span className="text-gray-300 font-normal">---</span>}
        </div>
    </div>
);

const SectionCard = ({ icon, iconColor, title, children }: { icon: React.ReactNode; iconColor: string; title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 overflow-hidden rounded-md shadow-sm">
        <div className={`px-5 py-2.5 border-b border-[#005a9e] flex items-center gap-2.5 bg-[#0067b8]`}>
            <span className="text-white">{icon}</span>
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{title}</h3>
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
        <div className="flex-1 flex flex-col h-full bg-gray-50 relative overflow-hidden">
            <div className="flex-1 flex flex-row overflow-hidden bg-gray-50">
                {/* ── LEFT: Content Wrapper ── */}
                <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
                    {/* ── Top Action Bar ── */}
                    <div className="flex items-center justify-between px-6 h-[57px] border-b border-gray-200 bg-white shrink-0 z-20">
                        <div className="flex items-center gap-3">
                            <Link href="/companies"
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
                                <ArrowLeft size={18} strokeWidth={2} />
                            </Link>
                            <div className="w-px h-5 bg-gray-200" />
                            <div>
                                <h2 className="text-[15px] font-bold tracking-tight text-gray-900 leading-tight">
                                    {company.name_jp || '名前なし'}
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/companies/${company.id}/edit`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-[11px] font-bold rounded-md hover:bg-gray-50 transition-colors">
                                <Pencil size={12} strokeWidth={2} /> 編集
                            </Link>
                            <form action={deleteCompany} onSubmit={e => { if (!window.confirm('本当に削除いたしますか？')) e.preventDefault(); }}>
                                <input type="hidden" name="id" value={company.id} />
                                <button type="submit"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 text-[11px] bg-white font-bold hover:bg-rose-50 border border-rose-200 transition-colors rounded-md">
                                    <Trash2 size={12} strokeWidth={2} /> 削除
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                        <div className="w-full max-w-[1200px] mx-auto p-8 space-y-8">

                            {/* ── Enhanced Hero Section ── */}
                            <div className="bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col md:flex-row shadow-sm">
                                <div className="w-[200px] p-8 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col items-center justify-center bg-gray-50/30">
                                    <div className="w-28 h-28 rounded-md bg-white border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex items-center justify-center">
                                        <Building2 size={56} strokeWidth={1} className="text-gray-200" />
                                    </div>
                                    <div className="mt-5 flex flex-col items-center">
                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black border border-emerald-200 bg-emerald-50 text-emerald-700 tracking-[0.1em] uppercase shadow-sm`}>
                                            受入中
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 p-10 flex flex-col justify-center bg-white relative">
                                    <div className="text-[10px] text-[#0067b8] font-black uppercase tracking-[0.3em] mb-4">企業情報管理記録</div>
                                    <h3 className="text-[32px] font-black text-gray-900 tracking-tighter leading-none uppercase mb-6">
                                        {company.name_jp}
                                    </h3>

                                    <div className="flex flex-wrap gap-4">
                                        {company.corporate_number && (
                                            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gray-50 text-gray-900 text-[11px] font-black rounded border border-gray-200 uppercase tracking-widest">
                                                <span className="text-[#0067b8] text-[9px] font-black mr-0.5">ID</span>
                                                {company.corporate_number.replace(/\D/g, '')}
                                            </div>
                                        )}
                                        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gray-50 text-gray-900 text-[11px] font-black rounded border border-gray-200 uppercase tracking-widest">
                                            <Briefcase size={12} className="text-[#0067b8]" />
                                            {company.industry || '業種未設定'}
                                        </div>
                                        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gray-100 text-[#0067b8] text-[11px] font-black rounded border border-blue-100 uppercase tracking-widest">
                                            <Users size={12} className="text-[#0067b8]" />
                                            現在受入 {activeWorkers} 名
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 企業基本情報 */}
                            <SectionCard icon={<Building2 size={14} />} iconColor="text-white" title="企業基本情報">
                                <DataRow label="企業名" value={company.name_jp} />
                                <DataRow label="フリガナ" value={company.name_kana} />
                                <DataRow label="ローマ字" value={company.name_romaji} />
                                <DataRow label="法人番号" value={company.corporate_number ? <span className="font-mono text-[13px]">{company.corporate_number.replace(/\D/g, '')}</span> : null} />
                                <DataRow label="業種" value={company.industry} />
                                <DataRow label="受入職種" value={company.accepted_occupations} />
                                <DataRow label="従業員数" value={company.employee_count ? `${company.employee_count} 名` : undefined} />
                                <DataRow label="所在地" value={
                                    <div className="flex flex-col">
                                        {company.postal_code && <span className="font-mono text-gray-400 text-[11px] mb-0.5">〒{company.postal_code}</span>}
                                        <span>{company.address}</span>
                                    </div>
                                } isLast />
                            </SectionCard>

                            {/* 担当者・連絡先 */}
                            <SectionCard icon={<Users size={14} />} iconColor="text-white" title="担当者・連絡先">
                                <DataRow label="代表者名" value={company.representative} />
                                <DataRow label="代表者ローマ字" value={company.representative_romaji} />
                                <DataRow label="電話番号" value={company.phone ? <span className="font-mono">{company.phone}</span> : null} />
                                <DataRow label="メールアドレス" value={company.email ? <span className="font-mono text-[12px]">{company.email}</span> : null} />
                                <DataRow label="担当者名" value={company.pic_name} />
                                <DataRow label="講習責任者" value={
                                    <div className="flex items-center gap-2">
                                        <span>{company.manager_name}</span>
                                        {company.training_date && (
                                            <span className="text-[11px] text-[#0067b8] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-black">
                                                講習: {company.training_date}
                                            </span>
                                        )}
                                    </div>
                                } />
                                <DataRow label="生活指導員" value={company.life_advisor} />
                                <DataRow label="技能指導員" value={company.tech_advisor} isLast />
                            </SectionCard>

                            {/* 登録番号・費用 */}
                            <SectionCard icon={<Briefcase size={14} />} iconColor="text-white" title="登録番号・費用">
                                <DataRow label="労働保険番号" value={company.labor_insurance_number ? <span className="font-mono text-[12px]">{company.labor_insurance_number}</span> : null} />
                                <DataRow label="雇用保険番号" value={company.employment_insurance_number ? <span className="font-mono text-[12px]">{company.employment_insurance_number}</span> : null} />
                                <DataRow label="受理届出番号" value={company.acceptance_notification_number ? <span className="font-mono text-[12px]">{company.acceptance_notification_number}</span> : null} />
                                <DataRow label="受理届出日" value={company.acceptance_notification_date ? <span className="font-mono">{company.acceptance_notification_date}</span> : null} />
                                <DataRow label="一般監理費" value={company.general_supervision_fee ? `${company.general_supervision_fee.toLocaleString()} 円` : undefined} />
                                <DataRow label="3号監理費" value={company.category_3_supervision_fee ? `${company.category_3_supervision_fee.toLocaleString()} 円` : undefined} />
                                <DataRow label="支援料" value={company.support_fee ? `${company.support_fee.toLocaleString()} 円` : undefined} isLast />
                            </SectionCard>

                            {/* 備考 */}
                            <SectionCard icon={<FileText size={14} />} iconColor="text-white" title="備考・特記事項">
                                <div className="px-5 py-4 text-[13px] text-gray-900 font-bold leading-relaxed whitespace-pre-wrap">
                                    {company.remarks || <span className="text-gray-300 font-normal">特記事項なし</span>}
                                </div>
                            </SectionCard>

                        </div>
                    </div>
                </div>

                {/* RIGHT: Documents */}
                <div className="w-[340px] shrink-0 h-full flex flex-col bg-white border-l border-gray-200 relative overflow-hidden">
                    <div className={`px-5 py-4 border-b border-[#005a9e] flex items-center justify-between bg-[#0067b8]`}>
                        <div className="flex items-center gap-2.5">
                            <FileText size={15} className="text-white" />
                            <h3 className="text-[13px] font-black text-white uppercase tracking-widest">企業書類</h3>
                        </div>
                        <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black border border-white/20">
                            {documents.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar pb-24 bg-gray-50/30">
                        {documents.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-md mt-2">
                                <DownloadCloud size={26} className="text-gray-300 mb-2" />
                                <span className="text-[12px] font-bold text-gray-400">書類は存在いたしません</span>
                            </div>
                        ) : (
                            documents.map((doc, idx) => (
                                <div key={idx} onClick={() => setPreviewDoc(doc)}
                                    className={`group flex items-center gap-3 p-3.5 rounded-md border cursor-pointer transition-all duration-150
                                        ${previewDoc?.name === doc.name
                                            ? 'border-[#0067b8] bg-[#0067b8] shadow-sm'
                                            : 'border-gray-200 bg-white hover:border-[#0067b8] hover:shadow-sm'}`}>
                                    <div className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-md transition-colors
                                        ${previewDoc?.name === doc.name
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-100 text-gray-500 group-hover:bg-[#0067b8] group-hover:text-white'}`}>
                                        <FileText size={16} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-[12px] font-black truncate ${previewDoc?.name === doc.name ? 'text-white' : 'text-gray-900 group-hover:text-[#0067b8]'}`}>
                                            {doc.name}
                                        </h4>
                                        <p className={`text-[10px] mt-0.5 font-bold ${previewDoc?.name === doc.name ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {new Date(doc.created_at).toLocaleDateString('ja-JP')}
                                        </p>
                                    </div>
                                    <ChevronRight size={13} className={previewDoc?.name === doc.name ? 'text-white' : 'text-gray-300 group-hover:text-[#0067b8]'} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Preview Slide-out */}
                {previewDoc && (
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-30 flex">
                        <div className="flex-1" onClick={() => setPreviewDoc(null)} />
                        <div className="w-[85%] sm:w-[520px] h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right-full duration-200">
                            <div className="px-5 py-4 border-b border-[#005a9e] flex items-center justify-between bg-[#0067b8]">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-md bg-white/10 text-white flex items-center justify-center shrink-0">
                                        <FileText size={15} />
                                    </div>
                                    <h4 className="font-black text-white truncate text-[13px] uppercase tracking-widest">{previewDoc.name}</h4>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <a href={previewDoc.url} target="_blank" rel="noopener noreferrer"
                                        className="w-8 h-8 flex items-center justify-center text-blue-100 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                                        <ExternalLink size={15} />
                                    </a>
                                    <a href={previewDoc.url} download={previewDoc.name}
                                        className="w-8 h-8 flex items-center justify-center text-blue-100 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                                        <DownloadCloud size={15} />
                                    </a>
                                    <button onClick={() => setPreviewDoc(null)}
                                        className="w-8 h-8 flex items-center justify-center text-blue-100 hover:text-white hover:bg-white/10 rounded-md transition-colors ml-1">
                                        <X size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-gray-100 p-4 overflow-hidden flex flex-col">
                                {previewDoc.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-full object-contain rounded-md shadow-md" />
                                    </div>
                                ) : previewDoc.url.match(/\.(pdf)$/i) ? (
                                    <iframe src={`${previewDoc.url}#view=FitH`} className="w-full h-full rounded-md shadow-sm border border-gray-200 bg-white" title={previewDoc.name} />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                                        <div className="w-20 h-20 rounded-md bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                                            <FileText size={32} className="text-gray-300" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-black text-gray-600 mb-1 text-[13px] uppercase tracking-widest">プレビュー非対応形式</p>
                                            <p className="text-[11px] text-gray-400 font-bold">ダウンロードして確認してください</p>
                                        </div>
                                        <a href={previewDoc.url} download
                                            className="px-5 py-2 bg-[#0067b8] text-white text-[12px] font-black rounded-md hover:bg-[#005a9e] transition-colors flex items-center gap-2 uppercase tracking-widest">
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
