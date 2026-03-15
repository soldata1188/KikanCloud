'use client'

import React, { useState, useRef } from 'react';
import { ArrowLeft, UploadCloud, FileText, Loader2, X, User, IdCard, Briefcase, Save, FileBadge2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface WorkerData {
    full_name_romaji: string; full_name_kana: string; dob: string; gender: string;
    blood_type: string; nationality: string; address: string; company_id: string;
    industry_field: string; sending_org: string; system_type: string; status: string;
    entry_batch: string; entry_date: string; insurance_exp: string; visa_status: string;
    zairyu_exp: string; passport_no: string; passport_exp: string;
    cert_no: string; cert_start_date: string; cert_end_date: string; remarks: string;
    has_spouse: string; birthplace: string; japan_residence: string;
}

interface Company {
    id: string;
    name_jp: string;
}

interface EditWorkerProps {
    companies: Company[];
    worker: {
        id: string;
        full_name_romaji?: string;
        full_name_kana?: string;
        dob?: string;
        gender?: string;
        blood_type?: string;
        nationality?: string;
        address?: string;
        company_id?: string;
        industry_field?: string;
        sending_org?: string;
        system_type?: string;
        status?: string;
        entry_batch?: string;
        entry_date?: string;
        insurance_exp?: string;
        visa_status?: string;
        zairyu_exp?: string;
        passport_no?: string;
        passport_exp?: string;
        cert_no?: string;
        cert_start_date?: string;
        cert_end_date?: string;
        remarks?: string;
        has_spouse?: boolean;
        birthplace?: string;
        japan_residence?: string;
        avatar_url?: string;
    };
}

const DOC_TYPES = [
    { id: 'avatar', label: '顔写真' },
    { id: 'zairyu_card', label: '在留カード' },
    { id: 'passport', label: 'パスポート' },
    { id: 'resume', label: '履歴書' },
    { id: 'cert_notice', label: '認定通知' },
    { id: 'insurance', label: '総合保険' },
    { id: 'my_number', label: '個人番号' },
    { id: 'pension', label: '年金番号' },
    { id: 'bank', label: '銀行口座' },
    { id: 'health_check', label: '健康診断' },
    { id: 'skill_test', label: '検定合格' },
    { id: 'ccus', label: 'CCUSカード' },
];

const FormRow = ({ label, required, children, isLast = false }: {
    label: string; required?: boolean; children: React.ReactNode; isLast?: boolean
}) => (
    <div className={`flex flex-col sm:flex-row ${!isLast ? 'border-b border-gray-100' : ''} hover:bg-gray-50/50 transition-colors group`}>
        <div className="w-full sm:w-[160px] lg:w-[180px] px-5 py-3 flex items-start border-b sm:border-b-0 sm:border-r border-gray-100 shrink-0 bg-gray-50/30 group-hover:bg-gray-100/30 transition-colors">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 flex flex-wrap items-center gap-1">
                {label}
                {required && <span className="text-rose-500 font-bold">*</span>}
            </label>
        </div>
        <div className="flex-1 px-5 py-3 flex items-center min-h-[44px]">
            <div className="w-full">{children}</div>
        </div>
    </div>
);

const SectionCard = ({ icon, title, children }: {
    icon: React.ReactNode; title: string; children: React.ReactNode
}) => (
    <div className="bg-gray-50 border border-gray-200 overflow-hidden rounded-md">
        <div className="px-5 py-3 border-b border-[#005a9e] flex items-center gap-2.5 bg-[#0067b8]">
            <span className="text-white font-bold">{icon}</span>
            <h3 className="text-base font-bold text-white uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex flex-col">{children}</div>
    </div>
);

export default function EditWorkerClient({ companies, worker }: EditWorkerProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<WorkerData>({
        full_name_romaji: worker.full_name_romaji || '',
        full_name_kana: worker.full_name_kana || '',
        dob: worker.dob || '',
        gender: worker.gender || '',
        blood_type: worker.blood_type || '',
        nationality: worker.nationality || 'ベトナム',
        address: worker.address || '',
        company_id: worker.company_id || '',
        industry_field: worker.industry_field || '',
        sending_org: worker.sending_org || '',
        system_type: worker.system_type || 'ikusei_shuro',
        status: worker.status || 'waiting',
        entry_batch: worker.entry_batch || '',
        entry_date: worker.entry_date || '',
        insurance_exp: worker.insurance_exp || '',
        visa_status: worker.visa_status || '',
        zairyu_exp: worker.zairyu_exp || '',
        passport_no: worker.passport_no || '',
        passport_exp: worker.passport_exp || '',
        cert_no: worker.cert_no || '',
        cert_start_date: worker.cert_start_date || '',
        cert_end_date: worker.cert_end_date || '',
        remarks: worker.remarks || '',
        has_spouse: worker.has_spouse ? 'true' : 'false',
        birthplace: worker.birthplace || '',
        japan_residence: worker.japan_residence || '',
    });

    const [files, setFiles] = useState<Record<string, { id: string; file: File; timestamp: string }[]>>({});
    const [customDocTypes, setCustomDocTypes] = useState<{ id: string; label: string }[]>([]);
    const [newCustomCategory, setNewCustomCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastError, setToastError] = useState<string | null>(null);
    const [stagedFile, setStagedFile] = useState<File | null>(null);
    const [stagedTargetDoc, setStagedTargetDoc] = useState('');
    const mainFileInputRef = useRef<HTMLInputElement>(null);

    const allDocTypes = [...DOC_TYPES, ...customDocTypes];

    const statusCfg: Record<string, { label: string; bg: string; text: string; border: string }> = {
        'waiting': { label: '未入国', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
        'standby': { label: '対応中', bg: 'bg-blue-50', text: 'text-[#0067b8]', border: 'border-blue-200' },
        'working': { label: '就業中', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        'missing': { label: '失踪', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
        'returned': { label: '帰国', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
        'transferred': { label: '転籍済', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    };
    const cfg = statusCfg[formData.status] || { label: formData.status, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleMainFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) { setStagedFile(f); setStagedTargetDoc(''); }
    };

    const handleMainFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f?.type) { setStagedFile(f); setStagedTargetDoc(''); }
    };

    const stageToStorage = () => {
        if (!stagedFile || !stagedTargetDoc) return;
        let finalTargetDoc = stagedTargetDoc;
        if (stagedTargetDoc === 'new_custom' && newCustomCategory.trim()) {
            const newId = `custom_${Date.now()}`;
            setCustomDocTypes(prev => [...prev, { id: newId, label: newCustomCategory.trim() }]);
            finalTargetDoc = newId;
            setNewCustomCategory('');
        }
        let finalFile = stagedFile;
        const existingNames = Object.values(files).flatMap(arr => arr.map(f => f.file.name));
        if (existingNames.includes(stagedFile.name)) {
            const parts = stagedFile.name.split('.');
            const ext = parts.length > 1 ? parts.pop() : '';
            const base = parts.join('.');
            const suffix = Math.floor(Math.random() * 1000);
            finalFile = new File([stagedFile], ext ? `${base}_${suffix}.${ext}` : `${base}_${suffix}`, { type: stagedFile.type });
        }
        processFile(finalFile, finalTargetDoc);
        setStagedFile(null); setStagedTargetDoc('');
    };

    const removeFromStorage = (docId: string, fileId?: string) => {
        if (!fileId) return;
        setFiles(prev => {
            const n = { ...prev };
            if (n[docId]) {
                n[docId] = n[docId].filter(f => f.id !== fileId);
                if (n[docId].length === 0) delete n[docId];
            }
            return n;
        });
    };

    const processFile = async (file: File, docId: string) => {
        const fileId = Math.random().toString(36).substring(7);
        const timestamp = new Date().toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        setFiles(prev => ({
            ...prev,
            [docId]: [...(prev[docId] || []), { id: fileId, file, timestamp }]
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('id', worker.id);
            Object.entries(formData).forEach(([k, v]) => {
                if (v !== undefined && v !== null) {
                    payload.append(k, String(v));
                }
            });

            Object.entries(files).forEach(([docId, arr]) => {
                arr.forEach(f => payload.append(`file_${docId}`, f.file));
            });

            const res = await fetch('/api/company_workers/update_with_files', {
                method: 'POST',
                body: payload
            });

            const result = await res.json();
            if (result.success) {
                router.push(`/workers/${worker.id}`);
                router.refresh();
            } else {
                throw new Error(result.error || '保存システムエラーが発生しました');
            }
        } catch (e: any) {
            setToastError(`保存に失敗しました: ${e.message}`);
            setTimeout(() => setToastError(null), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputCls = (fieldName?: string) => "w-full bg-transparent focus:bg-gray-50 border border-transparent hover:border-gray-200 rounded-md px-3 py-2 text-sm outline-none text-gray-900 font-bold transition-all focus:border-[#0067b8] focus:ring-1 focus:ring-blue-500/10 placeholder:text-gray-300 placeholder:font-normal";

    const formatSystemType = (sys: string) => {
        if (sys === 'ikusei_shuro') return '育成就労';
        if (sys === 'tokuteigino') return '特定技能';
        if (sys === 'ginou_jisshu') return '技能実習';
        return sys;
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden anim-page">
            {/* Toast */}
            {toastError && (
                <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3">
                    <div className="flex items-center gap-3 bg-white border border-red-200 px-4 py-3 rounded-2xl text-red-700">
                        <X className="w-5 h-5 text-red-400 shrink-0 cursor-pointer" onClick={() => setToastError(null)} />
                        <span className="text-sm font-bold">{toastError}</span>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-row overflow-hidden bg-transparent">
                {/* ── LEFT: Content Wrapper ── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* ── Top Action Bar ── */}
                    <div className="flex items-center justify-between px-6 h-[57px] border-b border-gray-200 bg-white shrink-0 z-20">
                        <div className="flex items-center gap-3">
                            <Link href={`/workers/${worker.id}`}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                                <ArrowLeft size={18} strokeWidth={2} />
                            </Link>
                            <div className="w-px h-5 bg-gray-200" />
                            <div>
                                <h2 className="text-base font-bold text-gray-900 leading-tight tracking-tight uppercase">
                                    {formData.full_name_romaji || '氏名未登録'}
                                </h2>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-xs font-bold text-[#0067b8] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-widest">
                                        編集モード
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/workers/${worker.id}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-widest rounded-md hover:bg-gray-50 transition-colors">
                                キャンセル
                            </Link>
                            <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-6 py-2 bg-[#0067b8] hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-md transition-all disabled:opacity-50 active:scale-95">
                                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {isSubmitting ? '保存中...' : '変更を保存'}
                            </button>
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                        <div className="w-full max-w-[1200px] mx-auto p-8 space-y-8 pb-32">

                            {/* ── Enhanced Hero Section ── */}
                            <div className="bg-gray-50 border border-gray-200 rounded-md overflow-hidden flex flex-col md:flex-row">
                                <div className="w-[200px] p-8 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col items-center justify-center bg-gray-100/30">
                                    <div className="w-28 h-28 rounded-md bg-white border border-gray-200 overflow-hidden transition-shadow">
                                        {worker.avatar_url ? (
                                            <img src={worker.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gray-50">
                                                <User size={56} strokeWidth={1} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-5 flex flex-col items-center">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border tracking-[0.1em] uppercase ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 p-10 flex flex-col justify-center bg-gray-50 relative">
                                    <div className="text-xs text-[#0067b8] font-bold uppercase tracking-[0.3em] mb-4">人材情報管理記録</div>
                                    <h3 className="text-4xl font-bold text-gray-900 tracking-tighter leading-none uppercase mb-8">
                                        {formData.full_name_romaji || '—'}
                                    </h3>

                                    <div className="flex flex-wrap gap-4">
                                        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gray-50 text-gray-900 text-sm font-bold rounded border border-gray-200 uppercase tracking-widest">
                                            <Briefcase size={14} className="text-[#0067b8]" />
                                            {companies?.find(c => c.id === formData.company_id)?.name_jp || '未配属'}
                                        </div>
                                        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gray-50 text-gray-900 text-sm font-bold rounded border border-gray-200 uppercase tracking-widest">
                                            {formatSystemType(formData.system_type)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                {/* LEFT COLUMN: Basic Info */}
                                <div className="space-y-8">
                                    <SectionCard icon={<User size={14} />} title="基本情報">
                                        <FormRow label="氏名（ローマ字）" required>
                                            <input name="full_name_romaji" value={formData.full_name_romaji} onChange={handleInputChange}
                                                className={inputCls('full_name_romaji')} placeholder="NGUYEN VAN A" />
                                        </FormRow>
                                        <FormRow label="氏名（カナ）">
                                            <input name="full_name_kana" value={formData.full_name_kana} onChange={handleInputChange}
                                                className={inputCls('full_name_kana')} placeholder="グエン ヴァン ア" />
                                        </FormRow>
                                        <FormRow label="生年月日">
                                            <input name="dob" type="date" value={formData.dob} onChange={handleInputChange} className={inputCls('dob')} />
                                        </FormRow>
                                        <FormRow label="性別">
                                            <select name="gender" value={formData.gender} onChange={handleInputChange} className={inputCls('gender') + ' appearance-none'}>
                                                <option value="">選択</option>
                                                <option value="male">男性</option>
                                                <option value="female">女性</option>
                                            </select>
                                        </FormRow>
                                        <FormRow label="配偶者">
                                            <div className="flex gap-4 py-1">
                                                {[['true', '有'], ['false', '無']].map(([v, l]) => (
                                                    <label key={v} className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="radio" name="has_spouse" value={v} checked={formData.has_spouse === v}
                                                            onChange={handleInputChange} className="accent-[#0067b8] w-4 h-4" />
                                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 font-bold tracking-tight">{l}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </FormRow>
                                        <FormRow label="血液型">
                                            <select name="blood_type" value={formData.blood_type} onChange={handleInputChange} className={inputCls('blood_type') + ' appearance-none'}>
                                                <option value="">選択</option>
                                                {['A', 'B', 'O', 'AB'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </FormRow>
                                        <FormRow label="国籍">
                                            <select name="nationality" value={formData.nationality} onChange={handleInputChange} className={inputCls('nationality') + ' appearance-none'}>
                                                {['ベトナム', 'インドネシア', 'フィリピン', 'カンボジア'].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </FormRow>
                                        <FormRow label="本国の出生地">
                                            <input name="birthplace" value={formData.birthplace} onChange={handleInputChange} className={inputCls('birthplace')} placeholder="ハノイ市" />
                                        </FormRow>
                                        <FormRow label="社宅住所">
                                            <input name="address" value={formData.address} onChange={handleInputChange} className={inputCls('address')} placeholder="東京都新宿区..." />
                                        </FormRow>
                                        <FormRow label="日本の居住地" isLast>
                                            <input name="japan_residence" value={formData.japan_residence} onChange={handleInputChange} className={inputCls('japan_residence')} placeholder="東京都新宿区大久保1-1-1" />
                                        </FormRow>
                                    </SectionCard>

                                    <div className="bg-white border border-gray-200 overflow-hidden rounded-md">
                                        <div className="px-5 py-3 border-b border-[#005a9e] bg-[#0067b8]">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">備考・特記事項</h3>
                                        </div>
                                        <div className="px-5 py-4">
                                            <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows={5}
                                                placeholder="実習生に関する特記事項やメモ"
                                                className="w-full bg-transparent focus:bg-gray-50 border border-gray-200 focus:border-[#0067b8] rounded-md px-3 py-2 text-sm outline-none text-gray-800 transition-all resize-y min-h-[120px] focus:ring-1 focus:ring-blue-500/20" />
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Admin & Visa */}
                                <div className="space-y-8">
                                    <SectionCard icon={<Briefcase size={14} />} title="管理情報">
                                        <FormRow label="配属先企業">
                                            <select name="company_id" value={formData.company_id} onChange={handleInputChange} className={inputCls('company_id') + ' appearance-none'}>
                                                <option value="">未配属</option>
                                                {companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                                            </select>
                                        </FormRow>
                                        <FormRow label="職種区分">
                                            <input name="industry_field" value={formData.industry_field} onChange={handleInputChange} className={inputCls('industry_field')} placeholder="溶接、建設" />
                                        </FormRow>
                                        <FormRow label="制度区分">
                                            <select name="system_type" value={formData.system_type} onChange={handleInputChange} className={inputCls('system_type') + ' appearance-none'}>
                                                <option value="ikusei_shuro">育成就労</option>
                                                <option value="tokuteigino">特定技能</option>
                                                <option value="ginou_jisshu">技能実習</option>
                                            </select>
                                        </FormRow>
                                        <FormRow label="ステータス">
                                            <select name="status" value={formData.status} onChange={handleInputChange} className={inputCls('status') + ' appearance-none'}>
                                                <option value="waiting">未入国</option>
                                                <option value="standby">対応中</option>
                                                <option value="working">就業中</option>
                                                <option value="missing">失踪</option>
                                                <option value="returned">帰国</option>
                                                <option value="transferred">転籍済</option>
                                            </select>
                                        </FormRow>
                                        <FormRow label="送出機関" isLast>
                                            <input name="sending_org" value={formData.sending_org} onChange={handleInputChange} className={inputCls('sending_org')} placeholder="VINAJAPAN JSC" />
                                        </FormRow>
                                    </SectionCard>

                                    <SectionCard icon={<IdCard size={14} />} title="証明書・期限">
                                        <FormRow label="入国期生">
                                            <input name="entry_batch" value={formData.entry_batch} onChange={handleInputChange} className={inputCls('entry_batch')} placeholder="第15期生" />
                                        </FormRow>
                                        <FormRow label="入国日">
                                            <input name="entry_date" type="date" value={formData.entry_date} onChange={handleInputChange} className={inputCls('entry_date')} />
                                        </FormRow>
                                        <FormRow label="在留資格">
                                            <input name="visa_status" value={formData.visa_status} onChange={handleInputChange} className={inputCls('visa_status')} placeholder="技能実習第1号イ" />
                                        </FormRow>
                                        <FormRow label="保険期限">
                                            <input name="insurance_exp" type="date" value={formData.insurance_exp} onChange={handleInputChange} className={inputCls('insurance_exp')} />
                                        </FormRow>
                                        <FormRow label="在留期限">
                                            <input name="zairyu_exp" type="date" value={formData.zairyu_exp} onChange={handleInputChange} className={inputCls('zairyu_exp')} />
                                        </FormRow>
                                        <FormRow label="パスポート番号">
                                            <input name="passport_no" value={formData.passport_no} onChange={handleInputChange} className={inputCls('passport_no')} placeholder="C1234567" />
                                        </FormRow>
                                        <FormRow label="パスポート期限">
                                            <input name="passport_exp" type="date" value={formData.passport_exp} onChange={handleInputChange} className={inputCls('passport_exp')} />
                                        </FormRow>
                                        <FormRow label="認定番号">
                                            <input name="cert_no" value={formData.cert_no} onChange={handleInputChange} className={inputCls('cert_no')} />
                                        </FormRow>
                                        <FormRow label="認定開始日">
                                            <input name="cert_start_date" type="date" value={formData.cert_start_date} onChange={handleInputChange} className={inputCls('cert_start_date')} />
                                        </FormRow>
                                        <FormRow label="認定修了日" isLast>
                                            <input name="cert_end_date" type="date" value={formData.cert_end_date} onChange={handleInputChange} className={inputCls('cert_end_date')} />
                                        </FormRow>
                                    </SectionCard>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Document & AI Workspace (Full Height Sidebar) ── */}
                <div className="w-[380px] shrink-0 bg-white flex flex-col overflow-hidden border-l border-gray-200">
                    <div className="flex items-center justify-between px-5 h-[57px] border-b border-gray-200 bg-gray-50 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-[#0067b8] text-white rounded">
                                <FileBadge2 size={16} />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">ドキュメント保管</h3>
                        </div>
                        {Object.values(files).reduce((a, arr) => a + arr.length, 0) > 0 && (
                            <span className="text-xs font-bold text-[#0067b8] bg-blue-50 px-2.5 py-1 rounded border border-blue-100 uppercase tracking-widest">
                                {Object.values(files).reduce((a, arr) => a + arr.length, 0)} 個
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-8 no-scrollbar">
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">新規ドキュメント追加</p>
                            <div
                                onClick={() => mainFileInputRef.current?.click()}
                                className={`cursor-pointer w-full h-[140px] border-2 border-dashed rounded-md flex flex-col items-center justify-center p-6 transition-all group/upload
                                    ${stagedFile ? 'border-[#0067b8] bg-blue-50/50' : 'border-gray-200 bg-white hover:border-[#0067b8] hover:bg-blue-50/10'}`}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleMainFileDrop}
                            >
                                <input type="file" className="hidden" ref={mainFileInputRef} onChange={handleMainFileSelect} />
                                {stagedFile ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 bg-[#0067b8] text-white rounded-md flex items-center justify-center mb-3 group-hover/upload:scale-110 transition-transform">
                                            <FileText size={28} />
                                        </div>
                                        <div className="text-xs font-bold text-gray-900 text-center truncate w-full px-2 uppercase tracking-tight">{stagedFile.name}</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-300 group-hover/upload:text-[#0067b8] transition-colors">
                                        <UploadCloud size={40} className="mb-2" />
                                        <div className="text-xs font-bold uppercase tracking-[0.2em]">ドキュメントをアップロード</div>
                                    </div>
                                )}
                            </div>

                            {stagedFile && (
                                <div className="p-4 bg-white border border-gray-200 rounded-md animate-in fade-in slide-in-from-top-2">
                                    <select value={stagedTargetDoc} onChange={e => setStagedTargetDoc(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 focus:border-[#0067b8] rounded-md px-3 py-2.5 text-sm mb-3 font-bold mb-2 font-black outline-none appearance-none cursor-pointer uppercase tracking-tight">
                                        <option value="">-- カテゴリー選択 --</option>
                                        {allDocTypes.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.label}{files[d.id]?.length > 0 ? ` (${files[d.id].length})` : ''}
                                            </option>
                                        ))}
                                        <option value="new_custom">➕ 新規カテゴリー</option>
                                    </select>
                                    {stagedTargetDoc === 'new_custom' && (
                                        <input type="text" placeholder="ラベル..." value={newCustomCategory} onChange={e => setNewCustomCategory(e.target.value)}
                                            className="w-full bg-white border border-gray-200 focus:border-[#0067b8] rounded-md px-3 py-2 text-[11px] mb-2 outline-none font-bold uppercase" />
                                    )}
                                    <button type="button" onClick={stageToStorage}
                                        disabled={!stagedTargetDoc || (stagedTargetDoc === 'new_custom' && !newCustomCategory.trim())}
                                        className="w-full py-3 bg-[#0067b8] hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-300 text-white text-xs font-bold rounded-md transition-all uppercase tracking-[0.2em]">
                                        割当と保存
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">保管済みドキュメント</p>
                            <div className="space-y-2">
                                {Object.keys(files).length === 0 && (
                                    <div className="py-16 flex flex-col items-center justify-center text-center opacity-30 border-2 border-dashed border-gray-200 rounded-md">
                                        <FileText size={40} className="text-gray-300 mb-2" />
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">空</span>
                                    </div>
                                )}
                                {Object.entries(files).map(([docId, arr]) => (
                                    <div key={docId} className="space-y-1">
                                        <div className="text-[11px] font-bold text-[#0067b8] uppercase tracking-widest pl-1 mb-1">
                                            {allDocTypes.find(d => d.id === docId)?.label || docId}
                                        </div>
                                        {arr.map(f => (
                                            <div key={f.id} className="group flex items-center justify-between p-2.5 bg-gray-50 hover:bg-white border hover:border-blue-200 rounded transition-all">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-7 h-7 bg-white border border-gray-100 rounded flex items-center justify-center text-blue-400 group-hover:text-blue-600 transition-colors">
                                                        <FileText size={14} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-bold text-gray-900 truncate uppercase tracking-tight">{f.file.name}</div>
                                                        <div className="text-xs text-gray-400 font-bold">{f.timestamp}</div>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeFromStorage(docId, f.id)} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}