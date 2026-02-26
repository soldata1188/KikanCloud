'use client'

import React, { useState, useRef } from 'react';
import { ArrowLeft, UploadCloud, FileText, Loader2, Sparkles, Image as ImageIcon, X, User, IdCard, Briefcase, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface WorkerData {
    full_name_romaji: string; full_name_kana: string; dob: string; gender: string;
    blood_type: string; nationality: string; address: string; company_id: string;
    industry_field: string; sending_org: string; system_type: string; status: string;
    entry_batch: string; entry_date: string; insurance_exp: string; visa_status: string;
    zairyu_no: string; zairyu_exp: string; passport_no: string; passport_exp: string;
    cert_no: string; cert_start_date: string; cert_end_date: string; remarks: string;
    has_spouse: string; birthplace: string; japan_residence: string;
}

const DOC_TYPES = [
    { id: 'avatar', label: '顔写真', ai: false },
    { id: 'zairyu_card', label: '在留カード', ai: true },
    { id: 'passport', label: 'パスポート', ai: true },
    { id: 'resume', label: '履歴書', ai: false },
    { id: 'cert_notice', label: '認定通知', ai: false },
    { id: 'insurance', label: '総合保険', ai: false },
    { id: 'my_number', label: '個人番号', ai: false },
    { id: 'pension', label: '年金番号', ai: false },
    { id: 'bank', label: '銀行口座', ai: false },
    { id: 'health_check', label: '健康診断', ai: false },
    { id: 'skill_test', label: '検定合格', ai: false },
    { id: 'ccus', label: 'CCUSカード', ai: false },
];

// ── Shared form row ──────────────────────────────────────────
const FormRow = ({ label, required, children, isLast = false }: {
    label: string; required?: boolean; children: React.ReactNode; isLast?: boolean
}) => (
    <div className={`flex flex-col sm:flex-row ${!isLast ? 'border-b border-slate-100' : ''} hover:bg-slate-50/40 transition-colors`}>
        <div className="w-full sm:w-[180px] px-5 py-2.5 flex items-center border-b sm:border-b-0 sm:border-r border-slate-100 shrink-0 bg-slate-50/60">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                {label}
                {required && <span className="ml-1.5 text-red-500 font-bold">*</span>}
            </label>
        </div>
        <div className="flex-1 px-4 py-1.5 flex items-center">
            <div className="w-full">{children}</div>
        </div>
    </div>
);

// ── Section card ─────────────────────────────────────────────
const SectionCard = ({ icon, iconColor, title, children }: {
    icon: React.ReactNode; iconColor: string; title: string; children: React.ReactNode
}) => (
    <div className="bg-white border border-slate-200 overflow-hidden rounded-2xl shadow-sm">
        <div className="px-5 py-3 border-b border-slate-700 flex items-center gap-2.5 bg-slate-800">
            <span className={iconColor}>{icon}</span>
            <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex flex-col">{children}</div>
    </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EditWorkerClient({ companies, worker }: { companies: any[]; worker: any }) {
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
        zairyu_no: worker.zairyu_no || '',
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
    const [customDocTypes, setCustomDocTypes] = useState<{ id: string; label: string; ai: boolean }[]>([]);
    const [newCustomCategory, setNewCustomCategory] = useState('');
    const [isScanning, setIsScanning] = useState<string | null>(null);
    const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastError, setToastError] = useState<string | null>(null);
    const [stagedFile, setStagedFile] = useState<File | null>(null);
    const [stagedTargetDoc, setStagedTargetDoc] = useState('');
    const mainFileInputRef = useRef<HTMLInputElement>(null);

    const allDocTypes = [...DOC_TYPES, ...customDocTypes];

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
            setCustomDocTypes(prev => [...prev, { id: newId, label: newCustomCategory.trim(), ai: false }]);
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
        const timestamp = new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        setFiles(prev => ({ ...prev, [docId]: [...(prev[docId] || []), { id: fileId, file, timestamp }] }));
        if (docId === 'zairyu_card' || docId === 'passport') await extractDataWithAI(file, docId);
    };

    const extractDataWithAI = async (file: File, docId: string) => {
        setIsScanning(docId);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64str = (reader.result as string).split(',')[1];
                const res = await fetch('/api/ai/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64str, mimeType: file.type }) });
                if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'AI extraction failed'); }
                const result = await res.json();
                if (result.data) {
                    const newData: Partial<WorkerData> = {};
                    const fields: string[] = [];
                    const map: [string, keyof WorkerData][] = [
                        ['nameRomaji', 'full_name_romaji'], ['nameKana', 'full_name_kana'], ['dob', 'dob'],
                        ['nationality', 'nationality'], ['zairyuStatus', 'visa_status'],
                        ['zairyuCardNumber', 'zairyu_no'], ['zairyuExpiration', 'zairyu_exp'],
                        ['passportNumber', 'passport_no'], ['passportExpiration', 'passport_exp'],
                    ];
                    map.forEach(([k, fld]) => { if (result.data[k]) { (newData as any)[fld] = result.data[k]; fields.push(fld); } });
                    if (result.data.gender) { newData.gender = result.data.gender.toLowerCase() === 'male' ? 'male' : 'female'; fields.push('gender'); }
                    setFormData(prev => ({ ...prev, ...newData }));
                    setHighlightedFields(fields);
                    setTimeout(() => setHighlightedFields([]), 2500);
                }
            };
        } catch (e: any) { alert(`AIスキャンに失敗しました: ${e.message}`); }
        finally { setIsScanning(null); }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('id', worker.id);
            Object.entries(formData).forEach(([k, v]) => payload.append(k, v));
            Object.entries(files).forEach(([docId, arr]) => arr.forEach(f => payload.append(`file_${docId}`, f.file)));
            const res = await fetch('/api/company_workers/update_with_files', { method: 'POST', body: payload });
            const result = await res.json();
            if (result.success) { router.push(`/workers/${worker.id}`); router.refresh(); }
            else throw new Error(result.error || '保存システムエラーが発生しました');
        } catch (e: any) {
            setToastError(`保存に失敗しました: ${e.message}`);
            setTimeout(() => setToastError(null), 5000);
        } finally { setIsSubmitting(false); }
    };

    const inputCls = (name: string) => {
        const base = 'w-full bg-transparent focus:bg-slate-50 border-none rounded-lg px-3 py-1.5 text-[13px] outline-none text-slate-800 transition-all focus:ring-1 focus:ring-[#24b47e]/30';
        return highlightedFields.includes(name) ? base + ' bg-emerald-50 !text-emerald-700 font-bold ring-1 ring-emerald-200' : base;
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative">

            {/* Toast */}
            {toastError && (
                <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3">
                    <div className="flex items-center gap-3 bg-white border border-red-200 shadow-xl px-4 py-3 rounded-2xl text-red-700">
                        <X className="w-4 h-4 text-red-400 shrink-0 cursor-pointer" onClick={() => setToastError(null)} />
                        <span className="text-[13px] font-bold">{toastError}</span>
                    </div>
                </div>
            )}

            {/* ── Top Bar ── */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href={`/workers/${worker.id}`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                        <ArrowLeft size={18} strokeWidth={2} />
                    </Link>
                    <div className="w-px h-5 bg-slate-200" />
                    <div>
                        <h2 className="text-[15px] font-bold text-slate-900 leading-tight tracking-tight">
                            実習生 編集
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {worker.full_name_romaji || 'Unnamed'}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles size={9} /> AI Workspace
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/workers/${worker.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded-lg hover:bg-slate-50 transition-colors">
                        キャンセル
                    </Link>
                    <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[12px] font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm">
                        {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {isSubmitting ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT: Form */}
                <div className="flex-1 h-full overflow-y-auto p-6 no-scrollbar pb-24">
                    <div className="space-y-5 max-w-2xl mx-auto">

                        {/* 基本情報 */}
                        <SectionCard icon={<User size={13} />} iconColor="text-emerald-400" title="基本情報">
                            <FormRow label="氏名（ローマ字）" required>
                                <input name="full_name_romaji" value={formData.full_name_romaji} onChange={handleInputChange}
                                    className={inputCls('full_name_romaji')} placeholder="例: NGUYEN VAN A" />
                            </FormRow>
                            <FormRow label="氏名（カナ）">
                                <input name="full_name_kana" value={formData.full_name_kana} onChange={handleInputChange}
                                    className={inputCls('full_name_kana')} placeholder="例: グエン ヴァン ア" />
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
                                        <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="radio" name="has_spouse" value={v} checked={formData.has_spouse === v}
                                                onChange={handleInputChange} className="accent-emerald-600 w-3.5 h-3.5" />
                                            <span className="text-[13px] text-slate-700 font-medium">{l}</span>
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
                                <input name="birthplace" value={formData.birthplace} onChange={handleInputChange} className={inputCls('birthplace')} placeholder="例: ハノイ市" />
                            </FormRow>
                            <FormRow label="社宅住所">
                                <input name="address" value={formData.address} onChange={handleInputChange} className={inputCls('address')} placeholder="例: 東京都新宿区..." />
                            </FormRow>
                            <FormRow label="日本の居住地" isLast>
                                <input name="japan_residence" value={formData.japan_residence} onChange={handleInputChange} className={inputCls('japan_residence')} placeholder="例: 東京都新宿区大久保1-1-1" />
                            </FormRow>
                        </SectionCard>

                        {/* 管理情報 */}
                        <SectionCard icon={<Briefcase size={13} />} iconColor="text-blue-400" title="管理情報">
                            <FormRow label="配属先企業">
                                <select name="company_id" value={formData.company_id} onChange={handleInputChange} className={inputCls('company_id') + ' appearance-none'}>
                                    <option value="">未配属</option>
                                    {companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                                </select>
                            </FormRow>
                            <FormRow label="職種区分">
                                <input name="industry_field" value={formData.industry_field} onChange={handleInputChange} className={inputCls('industry_field')} placeholder="例: 溶接、建設" />
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
                                </select>
                            </FormRow>
                            <FormRow label="送出機関" isLast>
                                <input name="sending_org" value={formData.sending_org} onChange={handleInputChange} className={inputCls('sending_org')} placeholder="例: VINAJAPAN JSC" />
                            </FormRow>
                        </SectionCard>

                        {/* 証明書・期限 */}
                        <SectionCard icon={<IdCard size={13} />} iconColor="text-violet-400" title="証明書・期限">
                            <FormRow label="入国期生">
                                <input name="entry_batch" value={formData.entry_batch} onChange={handleInputChange} className={inputCls('entry_batch')} placeholder="例: 第15期生" />
                            </FormRow>
                            <FormRow label="入国日">
                                <input name="entry_date" type="date" value={formData.entry_date} onChange={handleInputChange} className={inputCls('entry_date')} />
                            </FormRow>
                            <FormRow label="在留資格">
                                <input name="visa_status" value={formData.visa_status} onChange={handleInputChange} className={inputCls('visa_status')} placeholder="例: 技能実習第1号イ" />
                            </FormRow>
                            <FormRow label="保険期限">
                                <input name="insurance_exp" type="date" value={formData.insurance_exp} onChange={handleInputChange} className={inputCls('insurance_exp')} />
                            </FormRow>
                            <FormRow label="在留カード番号">
                                <input name="zairyu_no" value={formData.zairyu_no} onChange={handleInputChange} className={inputCls('zairyu_no')} maxLength={12} placeholder="例: AB12345678CD" />
                            </FormRow>
                            <FormRow label="在留期限">
                                <input name="zairyu_exp" type="date" value={formData.zairyu_exp} onChange={handleInputChange} className={inputCls('zairyu_exp')} />
                            </FormRow>
                            <FormRow label="パスポート番号">
                                <input name="passport_no" value={formData.passport_no} onChange={handleInputChange} className={inputCls('passport_no')} placeholder="例: C1234567" />
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

                        {/* 備考 */}
                        <div className="bg-white border border-slate-200 overflow-hidden rounded-2xl shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-700 bg-slate-800">
                                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">備考・特記事項</h3>
                            </div>
                            <div className="px-5 py-3">
                                <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows={4}
                                    placeholder="実習生に関する特記事項やメモを自由に入力してください..."
                                    className="w-full bg-transparent focus:bg-slate-50 border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 text-[13px] outline-none text-slate-800 transition-all resize-y min-h-[90px] focus:ring-1 focus:ring-[#24b47e]/20" />
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT: Documents */}
                <div className="w-[300px] shrink-0 h-full flex flex-col bg-white border-l border-slate-200">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-800">
                        <div className="flex items-center gap-2">
                            <UploadCloud size={15} className="text-blue-400" />
                            <h3 className="text-[13px] font-bold text-white">書類関係</h3>
                        </div>
                        {Object.values(files).reduce((a, arr) => a + arr.length, 0) > 0 && (
                            <span className="bg-white/10 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/10">
                                {Object.values(files).reduce((a, arr) => a + arr.length, 0)} 件
                            </span>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-24 space-y-5 bg-slate-50/40">

                        {/* 1. Staging */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">1. ファイルを追加</p>
                            <div
                                className={`cursor-pointer w-full h-[110px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-3 transition-all
                                    ${stagedFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-white hover:border-slate-500 hover:bg-slate-50'}`}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleMainFileDrop}
                                onClick={() => mainFileInputRef.current?.click()}
                            >
                                <input type="file" className="hidden" ref={mainFileInputRef} onChange={handleMainFileSelect} />
                                {stagedFile ? (
                                    <div className="flex flex-col items-center">
                                        <FileText size={28} className="text-emerald-500 mb-1.5" />
                                        <div className="text-[12px] font-bold text-emerald-700 text-center truncate w-full px-2">{stagedFile.name}</div>
                                        <div className="text-[9px] text-emerald-500 mt-1 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">受信済み</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <UploadCloud size={24} className="text-slate-400 mb-1.5" />
                                        <div className="text-[12px] font-bold text-slate-600">ドロップまたはクリック</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">PDF / 画像 対応</div>
                                    </div>
                                )}
                            </div>

                            {stagedFile && (
                                <div className="mt-2.5 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">カテゴリー指定</label>
                                    <select value={stagedTargetDoc} onChange={e => setStagedTargetDoc(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#24b47e] rounded-lg pl-3 pr-2 py-2 text-[12px] mb-2.5 font-medium outline-none appearance-none cursor-pointer">
                                        <option value="">-- 種類を選択 --</option>
                                        {allDocTypes.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.label}{files[d.id]?.length > 0 ? ` (${files[d.id].length}件)` : ''}
                                            </option>
                                        ))}
                                        <option value="new_custom">➕ 新規カテゴリー</option>
                                    </select>
                                    {stagedTargetDoc === 'new_custom' && (
                                        <input type="text" placeholder="カテゴリー名..." value={newCustomCategory} onChange={e => setNewCustomCategory(e.target.value)}
                                            className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-lg px-3 py-2 text-[12px] mb-2.5 outline-none" />
                                    )}
                                    <button type="button" onClick={stageToStorage}
                                        disabled={!stagedTargetDoc || (stagedTargetDoc === 'new_custom' && !newCustomCategory.trim())}
                                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[12px] font-bold rounded-lg transition-colors">
                                        ストレージへ保存
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 2. Storage */}
                        <div>
                            <div className="flex items-center justify-between mb-2 px-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. ストレージ</p>
                            </div>
                            <div className="space-y-2 min-h-[120px] rounded-xl border border-slate-200 bg-white p-2">
                                {Object.keys(files).length === 0 && !isScanning && (
                                    <div className="h-[100px] flex flex-col items-center justify-center text-center">
                                        <FileText size={22} className="text-slate-200 mb-1.5" />
                                        <span className="text-[11px] text-slate-300 font-medium">空のストレージです</span>
                                    </div>
                                )}
                                {allDocTypes.map(doc => {
                                    const arr = files[doc.id] || [];
                                    const scanning = isScanning === doc.id;
                                    if (arr.length === 0 && !scanning) return null;
                                    return (
                                        <React.Fragment key={doc.id}>
                                            {arr.map((f, idx) => (
                                                <div key={f.id} className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between group animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white border border-slate-200 text-slate-500">
                                                            {doc.id === 'avatar' ? <ImageIcon size={13} /> : <FileText size={13} />}
                                                        </div>
                                                        <div className="truncate flex-1">
                                                            <div className="text-[11px] font-bold text-slate-700 truncate">{doc.label}{arr.length > 1 ? ` #${idx + 1}` : ''}</div>
                                                            <div className="text-[9px] text-slate-400 font-mono truncate">{f.file.name}</div>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => removeFromStorage(doc.id, f.id)}
                                                        className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0 ml-1">
                                                        <X size={11} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            ))}
                                            {scanning && (
                                                <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-500 shrink-0">
                                                        <Loader2 size={13} className="animate-spin" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] font-bold text-emerald-700">{doc.label}</div>
                                                        <div className="text-[9px] text-emerald-500 font-bold flex items-center gap-1">
                                                            <Sparkles size={8} /> AIスキャン中...
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}