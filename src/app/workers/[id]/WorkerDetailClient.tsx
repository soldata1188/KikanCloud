'use client'

import React, { useState } from 'react';
import { ArrowLeft, User, FileText, X, ExternalLink, IdCard, Briefcase, FileBadge2, DownloadCloud, Trash2, Pencil, ChevronRight } from 'lucide-react';
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
    for (const key of Object.keys(DOC_TYPES)) {
        if (filename.startsWith(key + '_')) return DOC_TYPES[key];
    }
    return filename;
}

const DataRow = ({ label, value, isLast = false }: { label: React.ReactNode; value: React.ReactNode; isLast?: boolean }) => (
    <div className={`flex flex-col sm:flex-row ${!isLast ? 'border-b border-slate-100' : ''} hover:bg-slate-50/40 transition-colors`}>
        <div className="w-full sm:w-[180px] lg:w-[200px] px-5 py-2.5 flex items-center border-b sm:border-b-0 sm:border-r border-slate-100 shrink-0 bg-slate-50/60">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
        </div>
        <div className="flex-1 px-5 py-2.5 flex items-center min-h-[40px] text-[13.5px] text-slate-800 font-medium break-words">
            {value || <span className="text-slate-300 font-normal">—</span>}
        </div>
    </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WorkerDetailClient({ worker, documents }: { worker: any; documents: DocumentFile[] }) {
    const [previewDoc, setPreviewDoc] = useState<DocumentFile | null>(null);

    const formatSystemType = (sys: string) => {
        if (sys === 'ikusei_shuro') return '育成就労';
        if (sys === 'tokuteigino') return '特定技能';
        if (sys === 'ginou_jisshu') return '技能実習';
        return sys;
    };

    const statusCfg: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
        'waiting': { label: '入国待', dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        'standby': { label: '対応中', dot: 'bg-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        'working': { label: '就業中', dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        'missing': { label: '失踪', dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        'returned': { label: '帰国', dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
    };
    const cfg = statusCfg[worker.status] || { label: worker.status, dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };

    const SectionCard = ({ icon, iconColor, title, children }: { icon: React.ReactNode; iconColor: string; title: string; children: React.ReactNode }) => (
        <div className="bg-white border border-slate-200 overflow-hidden rounded-2xl shadow-sm">
            <div className={`px-5 py-3 border-b border-slate-200 flex items-center gap-2.5 bg-slate-800`}>
                <span className={iconColor}>{icon}</span>
                <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">{title}</h3>
            </div>
            <div className="flex flex-col">{children}</div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">

            {/* ── Top Action Bar ── */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/workers"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
                        <ArrowLeft size={18} strokeWidth={2} />
                    </Link>
                    <div className="w-px h-5 bg-slate-200" />
                    <div>
                        <h2 className="text-[16px] font-bold tracking-tight text-slate-900 leading-tight">
                            {worker.full_name_romaji || '氏名未登録'}
                        </h2>
                        {worker.full_name_kana && (
                            <p className="text-[11px] text-slate-400 font-medium mt-px">{worker.full_name_kana}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/workers/${worker.id}/edit`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-[12px] font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                        <Pencil size={13} strokeWidth={2} /> 編集
                    </Link>
                    <form action={deleteWorker} onSubmit={e => { if (!window.confirm('本当に削除いたしますか？')) e.preventDefault(); }}>
                        <input type="hidden" name="id" value={worker.id} />
                        <button type="submit"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-red-600 text-[12px] bg-white font-bold hover:bg-red-50 border border-red-200 transition-colors rounded-lg shadow-sm">
                            <Trash2 size={13} strokeWidth={2} /> 削除
                        </button>
                    </form>
                </div>
            </div>

            {/* ── Split View ── */}
            <div className="flex-1 flex flex-row overflow-hidden">

                {/* LEFT: Data */}
                <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-24">
                    <div className="max-w-2xl mx-auto space-y-5">

                        {/* Profile Hero Card */}
                        <div className="bg-slate-800 rounded-2xl shadow-md overflow-hidden">
                            <div className="px-6 pt-6 pb-5 flex flex-col md:flex-row gap-5 items-center md:items-start">
                                {/* Avatar */}
                                <div className="w-20 h-20 rounded-xl bg-slate-700 border-2 border-slate-600 overflow-hidden shrink-0 shadow-lg">
                                    {worker.avatar_url ? (
                                        <img src={worker.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <User size={36} strokeWidth={1.5} />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                                        {/* System type */}
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/10 text-slate-300 border border-white/10">
                                            {formatSystemType(worker.system_type)}
                                        </span>
                                        {/* Status badge */}
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {cfg.label}
                                        </span>
                                        {worker.nationality && (
                                            <span className="text-[11px] font-bold text-slate-400 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                                                🌐 {worker.nationality}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-[20px] font-black text-white tracking-tight leading-tight">
                                        {worker.full_name_romaji || '—'}
                                    </h3>
                                    {worker.full_name_kana && (
                                        <p className="text-[12px] text-slate-400 mt-0.5">{worker.full_name_kana}</p>
                                    )}
                                    {worker.companies?.name_jp && (
                                        <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-emerald-400 font-bold">
                                            <Briefcase size={13} />
                                            {worker.companies.name_jp}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bottom bar */}
                            <div className="border-t border-white/10 px-6 py-2.5 flex items-center gap-2 bg-black/20">
                                <span className="text-[10px] text-slate-500 font-mono">ID: {worker.id?.slice(0, 8)}…</span>
                            </div>
                        </div>

                        {/* 基本情報 */}
                        <SectionCard icon={<User size={14} />} iconColor="text-emerald-400" title="基本情報">
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

                        {/* 管理情報 */}
                        <SectionCard icon={<Briefcase size={14} />} iconColor="text-blue-400" title="管理情報">
                            <DataRow label="職種区分" value={worker.industry_field} />
                            <DataRow label="配属先企業" value={worker.companies?.name_jp} />
                            <DataRow label="送出機関" value={worker.sending_org} />
                            <DataRow label="入国期生" value={worker.entry_batch} />
                            <DataRow label="入国日" value={worker.entry_date} isLast />
                        </SectionCard>

                        {/* 証明書・期限 */}
                        <SectionCard icon={<IdCard size={14} />} iconColor="text-violet-400" title="証明書・期限">
                            <DataRow label="在留資格" value={worker.visa_status} />
                            <DataRow label="在留カード番号" value={worker.zairyu_no} />
                            <DataRow label="在留期限" value={
                                worker.zairyu_exp
                                    ? <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[12px] border border-slate-200">{worker.zairyu_exp}</span>
                                    : null
                            } />
                            <DataRow label="パスポート番号" value={worker.passport_no} />
                            <DataRow label="パスポート期限" value={worker.passport_exp} />
                            <DataRow label="保険期限" value={worker.insurance_exp} />
                            <DataRow label="認定番号" value={worker.cert_no} />
                            <DataRow label="認定期間" value={worker.cert_start_date ? `${worker.cert_start_date} ～ ${worker.cert_end_date || ''}` : ''} isLast />
                        </SectionCard>

                        {/* 備考 */}
                        <div className="bg-white border border-slate-200 overflow-hidden rounded-2xl shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-200 bg-slate-800">
                                <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">備考・特記事項</h3>
                            </div>
                            <div className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {(worker as any).remarks || <span className="text-slate-300 italic">特記事項はございません</span>}
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT: Documents */}
                <div className="w-[340px] shrink-0 h-full flex flex-col bg-white border-l border-slate-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-800">
                        <div className="flex items-center gap-2.5">
                            <FileBadge2 size={15} className="text-blue-400" />
                            <h3 className="text-[13px] font-bold text-white">関連書類</h3>
                        </div>
                        <span className="bg-white/10 text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-white/10">
                            {documents.length} 件
                        </span>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar pb-24 bg-slate-50/40">
                        {documents.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl mt-2">
                                <DownloadCloud size={26} className="text-slate-300 mb-2" />
                                <span className="text-[12px] font-medium text-slate-400">書類は存在いたしません</span>
                            </div>
                        ) : (
                            documents.map((doc, idx) => {
                                const niceName = getDocName(doc.name);
                                return (
                                    <div key={idx} onClick={() => setPreviewDoc(doc)}
                                        className="group flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm cursor-pointer transition-all duration-150">
                                        <div className="w-9 h-9 shrink-0 bg-slate-100 flex items-center justify-center text-slate-500 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors">
                                            <FileText size={16} strokeWidth={1.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[12px] font-bold text-slate-700 truncate group-hover:text-slate-900">{niceName}</h4>
                                            <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono" title={doc.name}>{doc.name}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Document Preview Overlay */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm"
                    onClick={e => { if (e.target === e.currentTarget) setPreviewDoc(null); }}>
                    <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white/10 text-blue-300 rounded-lg">
                                    <FileText size={15} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[13px] text-white leading-none">{getDocName(previewDoc.name)}</h3>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{previewDoc.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <a href={previewDoc.url} target="_blank" rel="noreferrer"
                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors rounded-lg" title="新しいタブで開く">
                                    <ExternalLink size={16} />
                                </a>
                                <button onClick={() => setPreviewDoc(null)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-lg" title="閉じる">
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-100 relative p-3">
                            <iframe src={previewDoc.url} className="w-full h-full border-none bg-white rounded-xl shadow-sm" title="Document Preview" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}