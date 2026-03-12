'use client'

import React, { useState } from 'react';
import { ArrowLeft, User, FileText, X, ExternalLink, IdCard, Briefcase, FileBadge2, DownloadCloud, Trash2, Pencil, ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { deleteWorker } from '@/app/workers/actions';

interface DocumentFile {
    name: string;
    url: string;
    created_at: string;
}

interface Worker {
    id: string;
    full_name_romaji: string;
    full_name_kana: string;
    dob: string;
    gender: string;
    has_spouse: boolean;
    blood_type: string;
    nationality: string;
    birthplace: string;
    address: string;
    japan_residence: string;
    status: string;
    system_type: string;
    industry_field: string;
    sending_org: string;
    entry_batch: string;
    entry_date: string;
    visa_status: string;
    zairyu_exp: string;
    passport_no: string;
    passport_exp: string;
    insurance_exp: string;
    cert_no: string;
    cert_start_date: string;
    cert_end_date: string;
    remarks: string;
    avatar_url?: string;
    companies?: {
        name_jp: string;
    };
    kentei_status?: {
        exam_date_written?: string;
    };
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
    for (const key of Object.keys(DOC_TYPES)) {
        if (filename.startsWith(key + '_')) return DOC_TYPES[key];
    }
    return filename;
}

const DataRow = ({ label, value, isLast = false }: { label: React.ReactNode; value: React.ReactNode; isLast?: boolean }) => (
    <div className={`flex flex-col sm:flex-row ${!isLast ? 'border-b border-gray-100' : ''} hover:bg-gray-50/50 transition-colors`}>
        <div className="w-full sm:w-[150px] lg:w-[180px] px-4 py-3 flex items-start border-b sm:border-b-0 sm:border-r border-gray-100 shrink-0 bg-gray-50/30">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</span>
        </div>
        <div className="flex-1 px-4 py-3 flex items-center min-h-[44px] text-sm text-gray-900 font-bold break-words leading-relaxed">
            {value || <span className="text-gray-300 font-normal">—</span>}
        </div>
    </div>
);

// ── Pulse Timeline Helper ─────────────────────────────────────────
const DetailPulse = ({ date, label, color = "bg-[#0067b8]" }: { date: string, label: string, color?: string }) => {
    if (!date || date === '---') return null;
    const now = Date.now();
    const futureLimit = now + (180 * 86400000);
    const target = new Date(date).getTime();
    if (target < now || target > futureLimit) return null;
    const percent = ((target - now) / (futureLimit - now)) * 100;
    return (
        <div className="flex flex-col items-center absolute -top-1" style={{ left: `${percent}%` }}>
            <div className={`w-3 h-3 rounded-full border-2 border-white hover:scale-125 transition-transform ${color}`} />
            <span className="text-xs font-bold text-gray-400 absolute top-4 whitespace-nowrap uppercase tracking-tighter">{label}</span>
        </div>
    );
};

export default function WorkerDetailClient({ worker, documents }: { worker: Worker; documents: DocumentFile[] }) {
    const [previewDoc, setPreviewDoc] = useState<DocumentFile | null>(null);
    const [docsOpen, setDocsOpen] = useState(false); // mobile doc drawer

    const formatSystemType = (sys: string) => {
        if (sys === 'ikusei_shuro') return '育成就労';
        if (sys === 'tokuteigino') return '特定技能';
        if (sys === 'ginou_jisshu') return '技能実習';
        return sys;
    };

    const statusCfg: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
        'waiting': { label: '未入国', dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
        'standby': { label: '対応中', dot: 'bg-blue-600', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
        'working': { label: '就業中', dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        'missing': { label: '失踪', dot: 'bg-rose-400', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
        'returned': { label: '帰国', dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
        'transferred': { label: '転籍済', dot: 'bg-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    };
    const cfg = statusCfg[worker.status] || { label: worker.status, dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };

    const SectionCard = ({ icon, iconColor, title, children }: { icon: React.ReactNode; iconColor: string; title: string; children: React.ReactNode }) => (
        <div className="app-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                <div className="flex items-center gap-2.5">
                    <span className="text-blue-600 font-bold">{icon}</span>
                    <h3 className="text-base font-bold text-gray-800 tracking-tight">{title}</h3>
                </div>
                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={16} /></button>
            </div>
            <div className="flex flex-col">{children}</div>
        </div>
    );

    // ── Document list component (reused on desktop sidebar + mobile drawer)
    const DocumentList = () => (
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {documents.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-md bg-gray-50/30">
                    <DownloadCloud size={28} className="text-gray-200 mb-2" />
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">添付書類なし</span>
                </div>
            ) : (
                <div className="space-y-2">
                    {documents.map((doc, idx) => (
                        <div key={idx} onClick={() => setPreviewDoc(doc)}
                            className="group relative flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all active:scale-[0.98]">
                            <div className="w-11 h-11 shrink-0 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                                <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 truncate leading-tight group-hover:text-blue-600 transition-colors">{getDocName(doc.name)}</h4>
                                <p className="text-xs text-gray-400 mt-1 truncate font-mono tracking-tight">{doc.name}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 shrink-0 group-hover:text-blue-600" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden anim-page">

            {/* ── Top Action Bar ── */}
            <div className="flex items-center justify-between px-3 sm:px-6 h-[52px] border-b border-gray-200 bg-white shrink-0 z-20">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Link href="/workers"
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 shrink-0">
                        <ArrowLeft size={18} strokeWidth={2} />
                    </Link>
                    <div className="w-px h-5 bg-gray-200 shrink-0" />
                    <h2 className="text-sm sm:text-base font-bold tracking-tight text-gray-900 leading-tight truncate">
                        {worker.full_name_romaji || '氏名未登録'}
                    </h2>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    {/* Document toggle — sm to lg only */}
                    <button onClick={() => setDocsOpen(v => !v)}
                        className="lg:hidden inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-md hover:bg-gray-50 transition-colors">
                        <FileBadge2 size={14} />
                        <span className="text-xs">{documents.length}</span>
                    </button>
                    <Link href={`/workers/${worker.id}/edit`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-md hover:bg-gray-50 transition-colors">
                        <Pencil size={14} strokeWidth={2} /> 編集
                    </Link>
                    <form action={deleteWorker} onSubmit={e => { if (!window.confirm('本当に削除いたしますか？')) e.preventDefault(); }}>
                        <input type="hidden" name="id" value={worker.id} />
                        <button type="submit"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 text-xs bg-white font-bold hover:bg-rose-50 border border-rose-200 transition-colors rounded-md">
                            <Trash2 size={14} strokeWidth={2} /> 削除
                        </button>
                    </form>
                </div>
            </div>

            {/* ── Main Layout: flex-row on lg+, flex-col on mobile ── */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-transparent">

                {/* ── Content body (scrollable) ── */}
                <div className="flex-1 flex flex-col overflow-hidden lg:border-r border-gray-200">
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                        <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 space-y-5">

                            {/* ── Hero Card ── */}
                            <div className="bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col sm:flex-row">
                                {/* Avatar block */}
                                <div className="flex-row sm:flex-col w-full sm:w-[160px] px-5 py-4 sm:py-6 flex items-center sm:justify-center gap-4 sm:gap-0 border-b sm:border-b-0 sm:border-r border-gray-100 bg-gray-50/30">
                                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-md bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                                        {worker.avatar_url ? (
                                            <img src={worker.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gray-50">
                                                <User size={40} strokeWidth={1} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="sm:mt-4 flex flex-col items-start sm:items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-[0.1em] uppercase ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                            {cfg.label}
                                        </span>
                                        <span className="text-xs font-bold text-gray-500 sm:hidden">{worker.nationality || ''}</span>
                                    </div>
                                </div>

                                {/* Info block */}
                                <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center bg-white relative">
                                    <div className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-3 px-2 py-0.5 bg-blue-50 w-fit rounded">人材詳細プロファイル</div>
                                    <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-none mb-8">
                                        {worker.full_name_romaji || '—'}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 sm:gap-4">
                                        <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100/50 text-gray-800 text-sm font-bold rounded-lg border border-gray-200/50 transition-all hover:bg-white hover:shadow-sm">
                                            <Briefcase size={16} className="text-blue-600" />
                                            {worker.companies?.name_jp || '未配属'}
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100/50 text-gray-800 text-sm font-bold rounded-lg border border-gray-200/50 transition-all hover:bg-white hover:shadow-sm">
                                            <FileBadge2 size={16} className="text-blue-600" />
                                            {formatSystemType(worker.system_type)}
                                        </div>
                                    </div>
                                    {/* Pulse Timeline */}
                                    <div className="mt-10 pt-8 border-t border-gray-100">
                                        <div className="flex justify-between items-center mb-5">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">手続きリマインダー</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full relative overflow-visible">
                                            <DetailPulse date={worker.zairyu_exp} label="在留" color="bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                                            <DetailPulse date={worker.cert_end_date} label="認定" color="bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                            {worker.kentei_status?.exam_date_written && <DetailPulse date={worker.kentei_status.exam_date_written} label="検定" color="bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Mobile Document Drawer ── */}
                            {docsOpen && (
                                <div className="lg:hidden bg-white border border-gray-200 rounded-md overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 bg-[#0067b8]">
                                        <div className="flex items-center gap-3">
                                            <FileBadge2 size={16} className="text-white" />
                                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">ドキュメント保管</h3>
                                        </div>
                                        <span className="text-xs font-bold text-blue-100">{documents.length} 個</span>
                                    </div>
                                    <DocumentList />
                                </div>
                            )}

                            {/* ── Section Grid ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                                {/* LEFT */}
                                <div className="space-y-5">
                                    <SectionCard icon={<User size={14} />} iconColor="text-[#0067b8]" title="基本情報">
                                        <DataRow label="氏名（ローマ字）" value={worker.full_name_romaji} />
                                        <DataRow label="氏名（カナ）" value={worker.full_name_kana} />
                                        <DataRow label="生年月日" value={worker.dob} />
                                        <DataRow label="性別" value={worker.gender === 'male' ? '男性' : worker.gender === 'female' ? '女性' : worker.gender} />
                                        <DataRow label="配偶者" value={worker.has_spouse === true ? '有' : worker.has_spouse === false ? '無' : worker.has_spouse} />
                                        <DataRow label="血液型" value={worker.blood_type} />
                                        <DataRow label="国籍" value={worker.nationality} />
                                        <DataRow label="本国の出生地" value={worker.birthplace} />
                                        <DataRow label="社宅住所" value={worker.address} />
                                        <DataRow label="日本の居住地" value={worker.japan_residence} isLast />
                                    </SectionCard>

                                    <div className="bg-white border border-gray-200 overflow-hidden rounded-md">
                                    <div className="px-4 py-3 border-b border-[#005a9e] bg-[#0067b8]">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">備考・特記事項</h3>
                                    </div>
                                        <div className="px-5 py-5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[120px]">
                                            {worker.remarks || <span className="text-gray-300">特記事項はございません</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT */}
                                <div className="space-y-5">
                                    <SectionCard icon={<Briefcase size={14} />} iconColor="text-[#0067b8]" title="管理情報">
                                        <DataRow label="職種区分" value={worker.industry_field} />
                                        <DataRow label="配属先企業" value={worker.companies?.name_jp} />
                                        <DataRow label="送出機関" value={worker.sending_org} />
                                        <DataRow label="入国期生" value={worker.entry_batch} />
                                        <DataRow label="入国日" value={worker.entry_date} isLast />
                                    </SectionCard>

                                    <SectionCard icon={<IdCard size={14} />} iconColor="text-[#0067b8]" title="証明書・期限">
                                        <DataRow label="在留資格" value={worker.visa_status} />
                                        <DataRow label="在留期限" value={
                                            worker.zairyu_exp
                                                ? <span className="font-mono font-bold text-gray-900 bg-blue-50 px-2.5 py-1 rounded text-xs border border-blue-100">{worker.zairyu_exp}</span>
                                                : null
                                        } />
                                        <DataRow label="パスポート番号" value={worker.passport_no} />
                                        <DataRow label="パスポート期限" value={worker.passport_exp} />
                                        <DataRow label="保険期限" value={worker.insurance_exp} />
                                        <DataRow label="認定番号" value={worker.cert_no} />
                                        <DataRow label="認定期間" value={worker.cert_start_date ? `${worker.cert_start_date} ～ ${worker.cert_end_date || ''}` : ''} isLast />
                                    </SectionCard>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Document Sidebar — Desktop only ── */}
                <div className="hidden lg:flex w-[340px] shrink-0 bg-white flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-5 h-[52px] border-b border-[#005a9e] bg-[#0067b8] shrink-0">
                        <div className="flex items-center gap-3">
                            <FileBadge2 size={18} className="text-white" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">ドキュメント保管</h3>
                        </div>
                        <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">
                            {documents.length} 個のファイル
                        </span>
                    </div>
                    <DocumentList />
                </div>
            </div>

            {/* ── Document Preview Overlay ── */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-gray-900/60 backdrop-blur-[2px]"
                    onClick={e => { if (e.target === e.currentTarget) setPreviewDoc(null); }}>
                    <div className="bg-white rounded-t-xl sm:rounded-md w-full sm:max-w-5xl h-[85vh] sm:h-[90vh] flex flex-col overflow-hidden border border-gray-200">
                        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-[#0067b8] text-white rounded shrink-0">
                                    <FileText size={16} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-sm text-gray-900 leading-none uppercase tracking-tight truncate">{getDocName(previewDoc.name)}</h3>
                                    <p className="text-xs text-gray-400 mt-1 font-mono uppercase tracking-wider truncate">{previewDoc.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <a href={previewDoc.url} target="_blank" rel="noreferrer"
                                    className="p-2 text-gray-400 hover:text-[#0067b8] hover:bg-white transition-colors rounded" title="新しいタブで開く">
                                    <ExternalLink size={16} />
                                </a>
                                <button onClick={() => setPreviewDoc(null)}
                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded" title="閉じる">
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-100 relative p-3">
                            <iframe src={previewDoc.url} className="w-full h-full border-none bg-white rounded" title="ドキュメントプレビュー" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}