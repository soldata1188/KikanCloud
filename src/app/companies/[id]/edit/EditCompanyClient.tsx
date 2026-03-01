'use client'

import React, { useState, useRef, useTransition } from 'react';
import { ArrowLeft, UploadCloud, FileText, Loader2, X, Building2, MapPin, Users, Briefcase, Save, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateCompany } from '../../actions';

const COMPANY_DOC_TYPES = [
    { id: 'kigyo_shashin', label: '企業写真' },
    { id: 'tokibohon', label: '登記謄本' },
    { id: 'kensetsu_kyoka', label: '建設許可' },
    { id: 'shataku_madorizu', label: '社宅間取図' },
    { id: 'koshu_shuryosho', label: '講習終了証' },
    { id: 'ccus_id', label: 'CCUS事業者ID' },
];

// ── Section card ──────────────────────────────────────────────
const SectionCard = ({ icon, title, children }: {
    icon: React.ReactNode; title: string; children: React.ReactNode;
}) => (
    <div className="bg-white border border-gray-200 overflow-hidden rounded-md shadow-sm">
        <div className="px-5 py-2.5 border-b border-[#005a9e] flex items-center gap-2.5 bg-[#0067b8]">
            <span className="text-white">{icon}</span>
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex flex-col">{children}</div>
    </div>
);

// ── Form row ──────────────────────────────────────────────────
const FormRow = ({ label, required, children, isLast = false }: {
    label: string; required?: boolean; children: React.ReactNode; isLast?: boolean;
}) => (
    <div className={`flex flex-col sm:flex-row ${!isLast ? 'border-b border-gray-100' : ''} hover:bg-gray-50/50 transition-colors group`}>
        <div className="w-full sm:w-[160px] lg:w-[180px] px-5 py-3 flex items-start border-b sm:border-b-0 sm:border-r border-gray-100 shrink-0 bg-gray-50/30 group-hover:bg-gray-100/30 transition-colors">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 flex flex-wrap items-center gap-1">
                {label}
                {required && <span className="text-rose-500 font-black">*</span>}
            </label>
        </div>
        <div className="flex-1 px-5 py-3 flex items-center min-h-[44px]">
            <div className="w-full">{children}</div>
        </div>
    </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EditCompanyClient({ company }: { company: any }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [toastError, setToastError] = useState<string | null>(null);

    // ── Form fields ──
    const [form, setForm] = useState({
        name_jp: company.name_jp || '',
        name_kana: company.name_kana || '',
        name_romaji: company.name_romaji || '',
        corporate_number: company.corporate_number || '',
        industry: company.industry || '',
        accepted_occupations: company.accepted_occupations || '',
        employee_count: company.employee_count?.toString() || '',
        postal_code: company.postal_code || '',
        phone: company.phone || '',
        address: company.address || '',
        pic_name: company.pic_name || '',
        email: company.email || '',
        representative: company.representative || '',
        representative_romaji: company.representative_romaji || '',
        manager_name: company.manager_name || '',
        training_date: company.training_date || '',
        life_advisor: company.life_advisor || '',
        tech_advisor: company.tech_advisor || '',
        labor_insurance_number: company.labor_insurance_number || '',
        employment_insurance_number: company.employment_insurance_number || '',
        acceptance_notification_number: company.acceptance_notification_number || '',
        acceptance_notification_date: company.acceptance_notification_date || '',
        general_supervision_fee: company.general_supervision_fee?.toString() || '',
        category_3_supervision_fee: company.category_3_supervision_fee?.toString() || '',
        support_fee: company.support_fee?.toString() || '',
        remarks: company.remarks || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'corporate_number') {
            setForm(prev => ({ ...prev, [name]: value.replace(/\D/g, '') }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    // ── Document panel ──
    const [files, setFiles] = useState<Record<string, { id: string; file: File; timestamp: string }[]>>({});
    const [customDocTypes, setCustomDocTypes] = useState<{ id: string; label: string }[]>([]);
    const [newCustomCategory, setNewCustomCategory] = useState('');
    const [stagedFile, setStagedFile] = useState<File | null>(null);
    const [stagedTargetDoc, setStagedTargetDoc] = useState('');
    const mainFileInputRef = useRef<HTMLInputElement>(null);

    const allDocTypes = [...COMPANY_DOC_TYPES, ...customDocTypes];

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) { setStagedFile(f); setStagedTargetDoc(''); }
    };
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) { setStagedFile(f); setStagedTargetDoc(''); }
    };

    const stageToStorage = () => {
        if (!stagedFile || !stagedTargetDoc) return;
        let finalId = stagedTargetDoc;
        if (stagedTargetDoc === 'new_custom' && newCustomCategory.trim()) {
            finalId = `custom_${Date.now()}`;
            setCustomDocTypes(prev => [...prev, { id: finalId, label: newCustomCategory.trim() }]);
            setNewCustomCategory('');
        }
        const timestamp = new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        setFiles(prev => ({ ...prev, [finalId]: [...(prev[finalId] || []), { id: Math.random().toString(36).slice(7), file: stagedFile, timestamp }] }));
        setStagedFile(null); setStagedTargetDoc('');
    };

    const removeFile = (docId: string, fileId: string) => {
        setFiles(prev => {
            const n = { ...prev };
            n[docId] = n[docId].filter(f => f.id !== fileId);
            if (n[docId].length === 0) delete n[docId];
            return n;
        });
    };

    // ── Submit ──
    const handleSubmit = () => {
        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append('id', company.id);
                Object.entries(form).forEach(([k, v]) => formData.append(k, v));
                Object.entries(files).forEach(([docId, arr]) =>
                    arr.forEach(f => formData.append(`file_${docId}`, f.file))
                );
                await updateCompany(formData);
                router.push(`/companies/${company.id}`);
                router.refresh();
            } catch (e: any) {
                setToastError(`保存に失敗しました: ${e.message}`);
                setTimeout(() => setToastError(null), 5000);
            }
        });
    };

    const inputCls = 'w-full bg-white/50 focus:bg-white border border-gray-200 focus:border-[#0067b8] rounded px-3 py-1.5 text-[13px] font-bold outline-none text-gray-900 transition-all placeholder:text-gray-300 placeholder:font-normal';

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 relative overflow-hidden">

            {/* Toast */}
            {toastError && (
                <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3">
                    <div className="flex items-center gap-3 bg-white border border-red-200 shadow-xl px-4 py-3 rounded-md text-red-700">
                        <X className="w-4 h-4 text-red-400 shrink-0 cursor-pointer" onClick={() => setToastError(null)} />
                        <span className="text-[13px] font-bold">{toastError}</span>
                    </div>
                </div>
            )}

            {/* ── Top Bar ── */}
            <div className="flex items-center justify-between px-6 h-[57px] border-b border-gray-200 bg-white shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <Link href={`/companies/${company.id}`}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 border border-transparent">
                        <ArrowLeft size={18} strokeWidth={2} />
                    </Link>
                    <div className="w-px h-5 bg-gray-200" />
                    <div>
                        <h2 className="text-[15px] font-bold text-gray-900 leading-tight tracking-tight uppercase">受入企業 編集</h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/companies/${company.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-[11px] font-bold rounded-md hover:bg-gray-50 transition-colors">
                        キャンセル
                    </Link>
                    <button type="button" onClick={handleSubmit} disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0067b8] hover:bg-[#005a9e] text-white text-[11px] font-bold rounded-md transition-colors disabled:opacity-50 shadow-sm uppercase tracking-widest">
                        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {isPending ? '保存中...' : '記録を保存'}
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 flex flex-row overflow-hidden bg-gray-50">

                {/* LEFT: Form */}
                <div className="flex-1 h-full overflow-y-auto no-scrollbar pb-32">
                    <div className="w-full max-w-[1200px] mx-auto p-8 space-y-8">

                        {/* 法人基本情報 */}
                        <SectionCard icon={<Building2 size={13} />} title="法人基本情報">
                            <FormRow label="企業名" required>
                                <input name="name_jp" value={form.name_jp} onChange={handleChange} className={inputCls} placeholder="例：株式会社ミライ" />
                            </FormRow>
                            <FormRow label="フリガナ">
                                <input name="name_kana" value={form.name_kana} onChange={handleChange} className={inputCls} placeholder="例：カブシキガイシャミライ" />
                            </FormRow>
                            <FormRow label="ローマ字">
                                <input name="name_romaji" value={form.name_romaji} onChange={handleChange} className={inputCls + ' uppercase'} placeholder="例：MIRAI CO., LTD" />
                            </FormRow>
                            <FormRow label="法人番号（13桁）">
                                <input name="corporate_number" value={form.corporate_number} onChange={handleChange} className={inputCls + ' font-mono'} maxLength={13} placeholder="例：1234567890123" />
                            </FormRow>
                            <FormRow label="業種">
                                <input name="industry" value={form.industry} onChange={handleChange} list="industry-dl" className={inputCls} placeholder="例：製造業、建設業..." />
                                <datalist id="industry-dl">
                                    <option value="建設業" /><option value="製造業" /><option value="農業" /><option value="食品製造業" />
                                </datalist>
                            </FormRow>
                            <FormRow label="受入職種">
                                <input name="accepted_occupations" value={form.accepted_occupations} onChange={handleChange} className={inputCls} placeholder="例：機械加工、溶接..." />
                            </FormRow>
                            <FormRow label="従業員数" isLast>
                                <input name="employee_count" value={form.employee_count} onChange={handleChange} type="number" className={inputCls} placeholder="例：50" />
                            </FormRow>
                        </SectionCard>

                        {/* 連絡先・所在地 */}
                        <SectionCard icon={<MapPin size={13} />} title="連絡先・所在地">
                            <FormRow label="郵便番号">
                                <input name="postal_code" value={form.postal_code} onChange={handleChange} className={inputCls} placeholder="例：160-0022" />
                            </FormRow>
                            <FormRow label="電話番号">
                                <input name="phone" value={form.phone} onChange={handleChange} className={inputCls + ' font-mono'} placeholder="例：03-1234-5678" />
                            </FormRow>
                            <FormRow label="所在地（住所）">
                                <input name="address" value={form.address} onChange={handleChange} className={inputCls} placeholder="例：東京都新宿区新宿1-1-1" />
                            </FormRow>
                            <FormRow label="連絡・実習担当者">
                                <input name="pic_name" value={form.pic_name} onChange={handleChange} className={inputCls} placeholder="例：鈴木 一郎" />
                            </FormRow>
                            <FormRow label="メールアドレス" isLast>
                                <input name="email" value={form.email} onChange={handleChange} type="email" className={inputCls + ' font-mono'} placeholder="例：example@domain.com" />
                            </FormRow>
                        </SectionCard>

                        {/* 担当者情報 */}
                        <SectionCard icon={<Users size={13} />} title="担当者情報（監査用）">
                            <FormRow label="代表者名">
                                <input name="representative" value={form.representative} onChange={handleChange} className={inputCls} placeholder="例：山田 太郎" />
                            </FormRow>
                            <FormRow label="代表者（ローマ字）">
                                <input name="representative_romaji" value={form.representative_romaji} onChange={handleChange} className={inputCls + ' uppercase'} placeholder="例：YAMADA TARO" />
                            </FormRow>
                            <FormRow label="責任者">
                                <input name="manager_name" value={form.manager_name} onChange={handleChange} className={inputCls} placeholder="例：田中 健太" />
                            </FormRow>
                            <FormRow label="講習受講日">
                                <input name="training_date" value={form.training_date} onChange={handleChange} type="date" className={inputCls} />
                            </FormRow>
                            <FormRow label="生活指導員">
                                <input name="life_advisor" value={form.life_advisor} onChange={handleChange} className={inputCls} placeholder="例：佐藤 花子" />
                            </FormRow>
                            <FormRow label="技能指導員" isLast>
                                <input name="tech_advisor" value={form.tech_advisor} onChange={handleChange} className={inputCls} placeholder="例：高橋 次郎" />
                            </FormRow>
                        </SectionCard>

                        {/* 保険・登録・費用 */}
                        <SectionCard icon={<Briefcase size={13} />} title="保険・登録・費用情報">
                            <FormRow label="労働保険番号">
                                <input name="labor_insurance_number" value={form.labor_insurance_number} onChange={handleChange} className={inputCls + ' font-mono'} placeholder="例：12-345-678901-234" />
                            </FormRow>
                            <FormRow label="雇用保険番号">
                                <input name="employment_insurance_number" value={form.employment_insurance_number} onChange={handleChange} className={inputCls + ' font-mono'} placeholder="例：1234-567890-1" />
                            </FormRow>
                            <FormRow label="受理届出番号">
                                <input name="acceptance_notification_number" value={form.acceptance_notification_number} onChange={handleChange} className={inputCls + ' font-mono'} placeholder="例：2023-12345" />
                            </FormRow>
                            <FormRow label="受理届出日">
                                <input name="acceptance_notification_date" value={form.acceptance_notification_date} onChange={handleChange} type="date" className={inputCls} />
                            </FormRow>
                            <FormRow label="一般監理費（円）">
                                <input name="general_supervision_fee" value={form.general_supervision_fee} onChange={handleChange} type="number" className={inputCls} placeholder="例：30000" />
                            </FormRow>
                            <FormRow label="3号監理費（円）">
                                <input name="category_3_supervision_fee" value={form.category_3_supervision_fee} onChange={handleChange} type="number" className={inputCls} placeholder="例：20000" />
                            </FormRow>
                            <FormRow label="支援料（円）" isLast>
                                <input name="support_fee" value={form.support_fee} onChange={handleChange} type="number" className={inputCls} placeholder="例：25000" />
                            </FormRow>
                        </SectionCard>

                        {/* 備考 */}
                        <SectionCard icon={<FileText size={13} />} title="備考・特記事項">
                            <div className="px-5 py-3">
                                <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={4}
                                    placeholder="企業に関する特記事項やメモを自由に入力してください..."
                                    className="w-full bg-white/50 focus:bg-white border border-gray-200 focus:border-[#0067b8] rounded px-3 py-2.5 text-[13px] font-bold outline-none text-gray-900 transition-all resize-y min-h-[90px] placeholder:text-gray-300 placeholder:font-normal" />
                            </div>
                        </SectionCard>

                    </div>
                </div>

                {/* RIGHT: Document Panel */}
                <div className="w-[300px] shrink-0 h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#005a9e] flex items-center justify-between bg-[#0067b8]">
                        <div className="flex items-center gap-2">
                            <UploadCloud size={15} className="text-white" />
                            <h3 className="text-[13px] font-black text-white uppercase tracking-widest">書類関係</h3>
                        </div>
                        {Object.values(files).reduce((a, arr) => a + arr.length, 0) > 0 && (
                            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-black border border-white/20">
                                {Object.values(files).reduce((a, arr) => a + arr.length, 0)}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-24 space-y-6 bg-gray-50/30">

                        {/* 1. Staging */}
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">1. ファイルを追加</p>
                            <div
                                className={`cursor-pointer w-full h-[110px] border-2 border-dashed rounded-md flex flex-col items-center justify-center p-3 transition-all
                                    ${stagedFile ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white hover:border-[#0067b8] hover:bg-gray-50'}`}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleFileDrop}
                                onClick={() => mainFileInputRef.current?.click()}
                            >
                                <input type="file" className="hidden" ref={mainFileInputRef} onChange={handleFileSelect} />
                                {stagedFile ? (
                                    <div className="flex flex-col items-center">
                                        <FileText size={28} className="text-emerald-500 mb-1.5" />
                                        <div className="text-[12px] font-black text-emerald-700 text-center truncate w-full px-2 uppercase tracking-tight">{stagedFile.name}</div>
                                        <div className="text-[9px] text-white mt-1 font-black bg-emerald-500 px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">受信済み</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <UploadCloud size={24} className="text-gray-300 mb-1.5" />
                                        <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">ドロップまたはクリック</div>
                                        <div className="text-[9px] text-gray-300 mt-1 font-bold uppercase">PDF / IMAGE Format</div>
                                    </div>
                                )}
                            </div>

                            {stagedFile && (
                                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-md shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">カテゴリー指定</label>
                                    <div className="relative">
                                        <select value={stagedTargetDoc} onChange={e => setStagedTargetDoc(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 focus:border-[#0067b8] rounded pl-3 pr-8 py-2 text-[12px] mb-3 font-bold outline-none appearance-none cursor-pointer transition-colors text-gray-900">
                                            <option value="">-- 種類を選択 --</option>
                                            {allDocTypes.map(d => (
                                                <option key={d.id} value={d.id}>
                                                    {d.label}{files[d.id]?.length > 0 ? ` (${files[d.id].length}件)` : ''}
                                                </option>
                                            ))}
                                            <option value="new_custom">➕ 新規カテゴリー</option>
                                        </select>
                                    </div>
                                    {stagedTargetDoc === 'new_custom' && (
                                        <input type="text" placeholder="カテゴリー名..." value={newCustomCategory} onChange={e => setNewCustomCategory(e.target.value)}
                                            className="w-full bg-white border border-gray-200 focus:border-[#0067b8] rounded px-3 py-2 text-[12px] mb-3 font-bold outline-none" />
                                    )}
                                    <button type="button" onClick={stageToStorage}
                                        disabled={!stagedTargetDoc || (stagedTargetDoc === 'new_custom' && !newCustomCategory.trim())}
                                        className="w-full py-2 bg-[#0067b8] hover:bg-[#005a9e] disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed text-white text-[11px] font-black rounded-md transition-all uppercase tracking-widest shadow-sm">
                                        ストレージへ保存
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 2. Storage */}
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">2. ストレージ</p>
                            <div className="space-y-2.5 min-h-[140px] rounded-md border border-gray-200 bg-white p-3 shadow-inner overflow-hidden">
                                {Object.keys(files).length === 0 && (
                                    <div className="h-[100px] flex flex-col items-center justify-center text-center">
                                        <FileText size={22} className="text-gray-100 mb-1.5" />
                                        <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">空のストレージです</span>
                                    </div>
                                )}
                                {allDocTypes.map(doc => {
                                    const arr = files[doc.id] || [];
                                    if (arr.length === 0) return null;
                                    return (
                                        <React.Fragment key={doc.id}>
                                            {arr.map((f, idx) => (
                                                <div key={f.id} className="p-2.5 bg-gray-50 border border-gray-100 rounded-md flex items-center justify-between group animate-in fade-in zoom-in-95 duration-200 hover:border-[#0067b8] transition-colors">
                                                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                                        <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-white border border-gray-200 text-gray-400 group-hover:bg-[#0067b8] group-hover:text-white group-hover:border-[#0067b8] transition-all shadow-sm">
                                                            {doc.id === 'kigyo_shashin' ? <ImageIcon size={14} /> : <FileText size={14} />}
                                                        </div>
                                                        <div className="truncate flex-1">
                                                            <div className="text-[11px] font-black text-gray-700 truncate uppercase tracking-tight">{doc.label}{arr.length > 1 ? ` #${idx + 1}` : ''}</div>
                                                            <div className="text-[9px] text-gray-400 font-mono truncate">{f.file.name}</div>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => removeFile(doc.id, f.id)}
                                                        className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-white hover:bg-rose-500 transition-all opacity-0 group-hover:opacity-100 shrink-0 ml-1.5 border border-transparent hover:shadow-md">
                                                        <X size={12} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            ))}
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
