'use client'

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UploadCloud, FileText, Loader2, Image as ImageIcon, X, User, Shield, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface WorkerData {
    full_name_romaji: string;
    full_name_kana: string;
    dob: string;
    gender: string;
    blood_type: string;
    nationality: string;
    address: string;
    company_id: string;
    industry_field: string;
    sending_org: string;
    system_type: string;
    status: string;
    entry_batch: string;
    entry_date: string;
    insurance_exp: string;
    visa_status: string;
    zairyu_exp: string;
    passport_no: string;
    passport_exp: string;
    cert_no: string;
    cert_start_date: string;
    cert_end_date: string;
    remarks: string;
    has_spouse: string;
    birthplace: string;
    japan_residence: string;
}

const initialWorkerData: WorkerData = {
    full_name_romaji: '', full_name_kana: '', dob: '', gender: '', blood_type: '',
    nationality: 'ベトナム', address: '', company_id: '', industry_field: '', sending_org: '',
    system_type: 'ikusei_shuro', status: 'waiting', entry_batch: '', entry_date: '', insurance_exp: '',
    visa_status: '', zairyu_exp: '', passport_no: '', passport_exp: '', cert_no: '', cert_start_date: '', cert_end_date: '',
    remarks: '', has_spouse: 'false', birthplace: '', japan_residence: ''
};

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
    { id: 'ccus', label: 'CCUSカード' }
];

const FormRow = ({ label, children, isLast = false }: { label: React.ReactNode, children: React.ReactNode, isLast?: boolean }) => (
    <div className={`flex items-center px-5 py-3 border-b border-gray-50 bg-white ${isLast ? 'border-0' : ''}`}>
        <span className="text-[12px] font-bold text-gray-400 shrink-0 w-[130px] uppercase tracking-tighter">{label}</span>
        <div className="flex-1 flex w-full">
            {children}
        </div>
    </div>
);

function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
    return (
        <div className={`flex items-center gap-2 px-5 py-3 border-b ${color}`}>
            <span className="opacity-60">{icon}</span>
            <span className="text-[11px] font-black uppercase tracking-[0.18em]">{label}</span>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function NewWorkerClient({ companies }: { companies: any[] }) {
    const router = useRouter();
    const [formData, setFormData] = useState<WorkerData>(initialWorkerData);
    const [files, setFiles] = useState<Record<string, { id: string, file: File, timestamp: string }[]>>({});
    const [customDocTypes, setCustomDocTypes] = useState<{ id: string, label: string }[]>([]);
    const [newCustomCategory, setNewCustomCategory] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastError, setToastError] = useState<string | null>(null);
    const [toastSuccess, setToastSuccess] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Document Kanban States
    const [stagedFile, setStagedFile] = useState<File | null>(null);
    const [stagedTargetDoc, setStagedTargetDoc] = useState<string>('');
    const mainFileInputRef = useRef<HTMLInputElement>(null);

    const allDocTypes = [...DOC_TYPES, ...customDocTypes];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleMainFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setStagedFile(droppedFile);
            setStagedTargetDoc('');
        }
    };

    const handleMainFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type) { // Ensuring it's a valid object
            setStagedFile(selectedFile);
            setStagedTargetDoc('');
        }
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
        // Rename if duplicate filename exists in other categories to avoid overwriting during save
        const existingNames = Object.values(files).flatMap(arr => arr.map(f => f.file.name));
        if (existingNames.includes(stagedFile.name)) {
            const nameParts = stagedFile.name.split('.');
            const ext = nameParts.length > 1 ? nameParts.pop() : '';
            const base = nameParts.join('.');
            const suffix = Math.floor(Math.random() * 1000);
            const newName = ext ? `${base}_${suffix}.${ext}` : `${base}_${suffix}`;
            finalFile = new File([stagedFile], newName, { type: stagedFile.type });
        }

        processFile(finalFile, finalTargetDoc);
        setStagedFile(null);
        setStagedTargetDoc('');
    };

    const removeFromStorage = (docId: string, fileId?: string) => {
        if (!fileId) return;
        setFiles(prev => {
            const newFiles = { ...prev };
            if (newFiles[docId]) {
                newFiles[docId] = newFiles[docId].filter(f => f.id !== fileId);
                if (newFiles[docId].length === 0) {
                    delete newFiles[docId];
                }
            }
            return newFiles;
        });
    };

    const processFile = async (file: File, docId: string) => {
        const fileId = Math.random().toString(36).substring(7);
        const currentTimestamp = new Date().toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        setFiles(prev => ({
            ...prev,
            [docId]: [...(prev[docId] || []), { id: fileId, file, timestamp: currentTimestamp }]
        }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.full_name_romaji.trim()) newErrors.full_name_romaji = '氏名(ローマ字)は必須です';
        if (!formData.dob) newErrors.dob = '生年月日は必須です';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) {
            setToastError("入力内容に不備があります。赤字の項目を確認してください。");
            setTimeout(() => setToastError(null), 3000);
            return;
        }

        setIsSubmitting(true);
        try {
            const formPayload = new FormData();
            Object.entries(formData).forEach(([key, val]) => {
                if (val) formPayload.append(key, val);
            });

            Object.entries(files).forEach(([docId, fileArr]) => {
                fileArr.forEach(f => {
                    formPayload.append(`file_${docId}`, f.file);
                });
            });

            const res = await fetch('/api/company_workers/create_with_files', {
                method: 'POST',
                body: formPayload
            });

            // Read JSON only once
            const result = await res.json().catch(() => ({ error: 'サーバーから応答がありません。' }));

            if (!res.ok || !result.success) {
                throw new Error(result.error || "保存システムエラーが発生いたしました。");
            }

            // ✅ Success: show green toast then redirect to /workers
            setToastSuccess("登録が完了しました。人材一覧へ戻ります...");
            router.refresh();
            setTimeout(() => {
                router.push('/workers');
            }, 800);

        } catch (error: unknown) {
            console.error("Submit error:", error);
            const msg = error instanceof Error ? error.message : '保存システムエラーが発生いたしました。'
            setToastError(`保存に失敗いたしました: ${msg}`);
            setTimeout(() => setToastError(null), 5000);
            setIsSubmitting(false);
        }
    };

    const inputClass = "flex-1 h-10 w-full px-3 bg-white border border-slate-200 rounded-md text-base font-medium text-gray-800 outline-none focus:border-[#0067b8] transition-colors";

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative anim-page">
            {/* ❌ Error Toast */}
            {toastError && (
                <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 px-5 py-3.5 rounded-[6px] text-red-700 shadow-lg">
                        <X className="w-4 h-4 text-red-500 shrink-0 cursor-pointer" onClick={() => setToastError(null)} />
                        <span className="text-sm font-bold">{toastError}</span>
                    </div>
                </div>
            )}
            {/* ✅ Success Toast */}
            {toastSuccess && (
                <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-5 py-3.5 rounded-[6px] text-emerald-700 shadow-lg">
                        <span className="text-lg">&#10003;</span>
                        <span className="text-sm font-bold">{toastSuccess}</span>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden justify-center bg-slate-50">
                {/* FORM CONTENT */}
                <div className="w-full max-w-[900px] h-full overflow-y-auto p-4 md:p-6 no-scrollbar pb-24 bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600">NEW WORKER</span>
                            <span className="text-[14px] font-black text-gray-900 tracking-tight">人材新規登録</span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2">
                            <Link
                                href="/workers"
                                className="w-full md:w-auto h-8 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-md text-[11px] font-bold transition-all flex items-center justify-center"
                            >
                                キャンセル
                            </Link>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full md:w-auto h-8 px-5 bg-[#0067b8] hover:bg-[#005a9e] text-white rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
                            >
                                {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                                {isSubmitting ? '登録中...' : '登録完了'}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full">

                        {/* --- Left Column --- */}
                        <div className="flex flex-col gap-2">
                            <div className="bg-white rounded border border-slate-200 overflow-hidden">
                                <SectionHeader icon={<User size={13} />} label="個人・雇用・住所" color="bg-[#0067b8] text-white" />
                                <FormRow label={<span>氏名(ローマ字)<span className="text-[10px] text-red-600 ml-1">必須</span></span>}>
                                    <div className="flex-1 flex flex-col w-full">
                                        <input name="full_name_romaji" value={formData.full_name_romaji} onChange={handleInputChange} className={`${inputClass} ${errors.full_name_romaji ? 'border-red-500 bg-red-50' : ''}`} placeholder="例: NGUYEN VAN A" />
                                        {errors.full_name_romaji && <span className="text-[11px] text-red-500 mt-1 ml-1">{errors.full_name_romaji}</span>}
                                    </div>
                                </FormRow>
                                <FormRow label="氏名（カナ）">
                                    <input name="full_name_kana" value={formData.full_name_kana} onChange={handleInputChange} className={inputClass} placeholder="例: グエン ヴァン ア" />
                                </FormRow>
                                <FormRow label={<span>生年月日<span className="text-[10px] text-red-600 ml-1">必須</span></span>}>
                                    <div className="flex-1 flex flex-col w-full">
                                        <input name="dob" type="date" value={formData.dob} onChange={handleInputChange} className={`${inputClass} ${errors.dob ? 'border-red-500 bg-red-50' : ''}`} />
                                        {errors.dob && <span className="text-[11px] text-red-500 mt-1 ml-1">{errors.dob}</span>}
                                    </div>
                                </FormRow>
                                <FormRow label="性別">
                                    <select name="gender" value={formData.gender} onChange={handleInputChange} className={inputClass}>
                                        <option value="">選択してください</option>
                                        <option value="male">男性</option>
                                        <option value="female">女性</option>
                                    </select>
                                </FormRow>
                                <FormRow label="血液型">
                                    <select name="blood_type" value={formData.blood_type} onChange={handleInputChange} className={inputClass}>
                                        <option value="">選択してください</option>
                                        <option value="A">A</option><option value="B">B</option><option value="O">O</option><option value="AB">AB</option>
                                    </select>
                                </FormRow>
                                <FormRow label="国籍">
                                    <select name="nationality" value={formData.nationality} onChange={handleInputChange} className={inputClass}>
                                        <option value="ベトナム">ベトナム</option>
                                        <option value="インドネシア">インドネシア</option>
                                        <option value="フィリピン">フィリピン</option>
                                        <option value="カンボジア">カンボジア</option>
                                    </select>
                                </FormRow>
                                <FormRow label="出身地">
                                    <input name="birthplace" value={formData.birthplace} onChange={handleInputChange} className={inputClass} placeholder="例: ハノイ市" />
                                </FormRow>
                                <FormRow label="配偶者">
                                    <select name="has_spouse" value={formData.has_spouse} onChange={handleInputChange} className={inputClass}>
                                        <option value="false">無</option>
                                        <option value="true">有</option>
                                    </select>
                                </FormRow>
                                <FormRow label="送出機関">
                                    <input name="sending_org" value={formData.sending_org} onChange={handleInputChange} className={inputClass} placeholder="例: VINAJAPAN JSC" />
                                </FormRow>
                                <FormRow label="配属先企業">
                                    <select name="company_id" value={formData.company_id} onChange={handleInputChange} className={inputClass}>
                                        <option value="">未配属</option>
                                        {companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                                    </select>
                                </FormRow>
                                <FormRow label="ステータス">
                                    <select name="status" value={formData.status} onChange={handleInputChange} className={inputClass}>
                                        <option value="waiting">未入国</option>
                                        <option value="standby">対応中</option>
                                        <option value="working">就業中</option>
                                        <option value="missing">失踪</option>
                                        <option value="returned">帰国</option>
                                        <option value="transferred">転籍済</option>
                                    </select>
                                </FormRow>
                                <FormRow label="社宅住所" isLast={true}>
                                    <input name="japan_residence" value={formData.japan_residence} onChange={handleInputChange} className={inputClass} placeholder="例: 東京都新宿区大久保1-1-1..." />
                                </FormRow>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="bg-white rounded border border-slate-200 overflow-hidden">
                                <SectionHeader icon={<Shield size={13} />} label="入国・在留・書類" color="bg-[#0067b8] text-white" />
                                <FormRow label="制度区分">
                                    <select name="system_type" value={formData.system_type} onChange={handleInputChange} className={inputClass}>
                                        <option value="ikusei_shuro">育成就労</option>
                                        <option value="tokuteigino">特定技能</option>
                                        <option value="ginou_jisshu">技能実習</option>
                                    </select>
                                </FormRow>
                                <FormRow label="職種区分">
                                    <input name="industry_field" value={formData.industry_field} onChange={handleInputChange} className={inputClass} placeholder="例: 溶接、建設" />
                                </FormRow>
                                <FormRow label="入国期生">
                                    <input name="entry_batch" value={formData.entry_batch} onChange={handleInputChange} className={inputClass} placeholder="例: 第15期生" />
                                </FormRow>
                                <FormRow label="入国日">
                                    <input name="entry_date" type="date" value={formData.entry_date} onChange={handleInputChange} className={inputClass} />
                                </FormRow>
                                <FormRow label="在留資格">
                                    <input name="visa_status" value={formData.visa_status} onChange={handleInputChange} className={inputClass} placeholder="例: 技能実習第1号イ" />
                                </FormRow>
                                <FormRow label="在留期限">
                                    <input name="zairyu_exp" type="date" value={formData.zairyu_exp} onChange={handleInputChange} className={inputClass} />
                                </FormRow>
                                <FormRow label="パスポート番号">
                                    <input name="passport_no" value={formData.passport_no} onChange={handleInputChange} className={inputClass} placeholder="例: C1234567" />
                                </FormRow>
                                <FormRow label="パスポート期限">
                                    <input name="passport_exp" type="date" value={formData.passport_exp} onChange={handleInputChange} className={inputClass} />
                                </FormRow>
                                <FormRow label="認定開始日">
                                    <input name="cert_start_date" type="date" value={formData.cert_start_date} onChange={handleInputChange} className={inputClass} />
                                </FormRow>
                                <FormRow label="認定終了日">
                                    <input name="cert_end_date" type="date" value={formData.cert_end_date} onChange={handleInputChange} className={inputClass} />
                                </FormRow>
                                <FormRow label="保険期限" isLast={true}>
                                    <input name="insurance_exp" type="date" value={formData.insurance_exp} onChange={handleInputChange} className={inputClass} />
                                </FormRow>
                            </div>
                        </div>

                        <div className="bg-white rounded border border-slate-200 overflow-hidden col-span-2">
                            <SectionHeader icon={<MessageSquare size={13} />} label="備考" color="bg-slate-50 text-slate-500" />
                            <div className="p-2 bg-white">
                                <textarea
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    className="w-full min-h-[120px] p-4 border border-slate-200 bg-white rounded-md text-base outline-none focus:border-[#0067b8] font-medium text-gray-800 transition-colors"
                                    placeholder="実習生に関する特記事項やメモ"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
