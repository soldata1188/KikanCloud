'use client'

import React, { useState, useRef } from 'react';
import { ArrowLeft, UploadCloud, FileText, Loader2, Sparkles, Image as ImageIcon, X } from 'lucide-react';
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
    zairyu_no: string;
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
    visa_status: '', zairyu_no: '', zairyu_exp: '', passport_no: '', passport_exp: '', cert_no: '', cert_start_date: '', cert_end_date: '',
    remarks: '', has_spouse: 'false', birthplace: '', japan_residence: ''
};

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
    { id: 'ccus', label: 'CCUSカード', ai: false }
];

const FormRow = ({ label, children, isLast = false }: { label: React.ReactNode, children: React.ReactNode, isLast?: boolean }) => (
    <div className={`flex flex-col sm:flex-row ${!isLast ? 'border-b border-gray-200' : ''} hover:bg-gray-50/30 transition-colors`}>
        <div className="w-full sm:w-[140px] lg:w-[180px] bg-[#f8fcfd] px-4 py-1.5 flex items-center border-b sm:border-b-0 sm:border-r border-gray-200 shrink-0">
            <label className="text-[13px] font-bold text-[#1f1f1f]">{label}</label>
        </div>
        <div className="flex-1 px-4 py-1.5 flex items-center">
            <div className="w-full">
                {children}
            </div>
        </div>
    </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function NewWorkerClient({ companies }: { companies: any[] }) {
    const [formData, setFormData] = useState<WorkerData>(initialWorkerData);
    const [files, setFiles] = useState<Record<string, { id: string, file: File, timestamp: string }[]>>({});
    const [customDocTypes, setCustomDocTypes] = useState<{ id: string, label: string, ai: boolean }[]>([]);
    const [newCustomCategory, setNewCustomCategory] = useState<string>('');
    const [isScanning, setIsScanning] = useState<string | null>(null);
    const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastError, setToastError] = useState<string | null>(null);

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
            setCustomDocTypes(prev => [...prev, { id: newId, label: newCustomCategory.trim(), ai: false }]);
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

        // Auto trigger AI OCR for Zairyu Card and Passport
        if (docId === 'zairyu_card' || docId === 'passport') {
            await extractDataWithAI(file, docId);
        }
    };

    const extractDataWithAI = async (file: File, docId: string) => {
        setIsScanning(docId);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64str = (reader.result as string).split(',')[1];

                const res = await fetch('/api/ai/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ base64str, mimeType: file.type })
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.error || "AI extraction failed");
                }

                const result = await res.json();
                if (result.data) {
                    const newData: Partial<WorkerData> = {};
                    const fieldsToHighlight = [];

                    if (result.data.nameRomaji) { newData.full_name_romaji = result.data.nameRomaji; fieldsToHighlight.push('full_name_romaji'); }
                    if (result.data.nameKana) { newData.full_name_kana = result.data.nameKana; fieldsToHighlight.push('full_name_kana'); }
                    if (result.data.dob) { newData.dob = result.data.dob; fieldsToHighlight.push('dob'); }
                    if (result.data.gender) { newData.gender = result.data.gender.toLowerCase() === 'male' ? 'male' : 'female'; fieldsToHighlight.push('gender'); }
                    if (result.data.nationality) { newData.nationality = result.data.nationality; fieldsToHighlight.push('nationality'); }
                    if (result.data.zairyuStatus) { newData.visa_status = result.data.zairyuStatus; fieldsToHighlight.push('visa_status'); }
                    if (result.data.zairyuCardNumber) { newData.zairyu_no = result.data.zairyuCardNumber; fieldsToHighlight.push('zairyu_no'); }
                    if (result.data.zairyuExpiration) { newData.zairyu_exp = result.data.zairyuExpiration; fieldsToHighlight.push('zairyu_exp'); }
                    if (result.data.passportNumber) { newData.passport_no = result.data.passportNumber; fieldsToHighlight.push('passport_no'); }
                    if (result.data.passportExpiration) { newData.passport_exp = result.data.passportExpiration; fieldsToHighlight.push('passport_exp'); }

                    setFormData(prev => ({ ...prev, ...newData }));
                    setHighlightedFields(fieldsToHighlight);

                    setTimeout(() => setHighlightedFields([]), 2000);
                }
            };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'AIスキャンエラー'
            alert(`AIスキャンに失敗いたしました: ${msg}`);
        } finally {
            setIsScanning(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

            const result = await res.json();
            if (result.success) {
                window.location.href = `/workers/${result.workerId}`;
            } else {
                throw new Error(result.error || "保存システムエラーが発生いたしました。");
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : '保存システムエラーが発生いたしました。'
            setToastError(`保存に失敗いたしました: ${msg}`);
            setTimeout(() => setToastError(null), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInputClass = (name: string) => {
        const baseClass = "w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1 text-[13px] outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0";
        if (highlightedFields.includes(name)) {
            return baseClass + " bg-[#24b47e]/10 !text-[#24b47e] font-bold";
        }
        return baseClass;
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Red Toast Output */}
            {toastError && (
                <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
                    <div className="flex items-center gap-3 bg-red-50/95 backdrop-blur border border-red-200 shadow-lg px-5 py-3.5 rounded-2xl text-red-700">
                        <X className="w-5 h-5 text-red-500 shrink-0 cursor-pointer hover:bg-red-100 rounded-full" onClick={() => setToastError(null)} />
                        <span className="text-sm font-bold tracking-wide">{toastError}</span>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <Link href="/workers" className="w-10 h-10 flex items-center justify-center rounded-none hover:bg-gray-100 transition-colors text-[#1f1f1f]">
                        <ArrowLeft size={24} strokeWidth={1.5} />
                    </Link>
                    <h2 className="text-[24px] font-medium tracking-tight text-[#1f1f1f] flex items-center gap-2">
                        外国人材新規追加
                        <span className="text-xs bg-[#24b47e]/10 text-[#24b47e] px-2 py-1 rounded-none border border-[#24b47e]/20 flex items-center gap-1 font-bold">
                            <Sparkles size={12} /> AI ワークスペース
                        </span>
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/workers" className="px-5 py-2.5 text-[#1f1f1f] text-sm bg-white font-medium hover:bg-gray-50 rounded-none transition-colors border border-gray-300">
                        キャンセル
                    </Link>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 text-white text-sm bg-[#24b47e] hover:bg-[#1e9a6a] font-bold rounded-none transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        {isSubmitting ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT PANE: Form Data */}
                <div className="flex-1 h-full overflow-y-auto p-6 border-r border-gray-200 no-scrollbar pb-24">
                    <div className="space-y-6 max-w-3xl mx-auto">

                        <div className="bg-white rounded-none border border-[#c4c8cf] overflow-hidden mb-6">
                            <div className="px-6 py-4 border-b border-[#c4c8cf] bg-[#f8fcfd]/10">
                                <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">基本情報</h3>
                            </div>
                            <div className="flex flex-col">
                                <FormRow label={<span>氏名（ローマ字）<span className="text-[10px] text-red-600 ml-2">必須</span></span>}>
                                    <input name="full_name_romaji" value={formData.full_name_romaji} onChange={handleInputChange} className={getInputClass("full_name_romaji")} placeholder="例: NGUYEN VAN A" />
                                </FormRow>
                                <FormRow label="氏名（カナ）">
                                    <input name="full_name_kana" value={formData.full_name_kana} onChange={handleInputChange} className={getInputClass("full_name_kana")} placeholder="例: グエン ヴァン ア" />
                                </FormRow>
                                <FormRow label="生年月日">
                                    <input name="dob" type="date" value={formData.dob} onChange={handleInputChange} className={getInputClass("dob")} />
                                </FormRow>
                                <FormRow label="性別">
                                    <select name="gender" value={formData.gender} onChange={handleInputChange} className={getInputClass("gender") + " appearance-none"}>
                                        <option value="">選択してください</option>
                                        <option value="male">男性</option>
                                        <option value="female">女性</option>
                                    </select>
                                </FormRow>
                                <FormRow label="配偶者">
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="radio" name="has_spouse" value="true" checked={formData.has_spouse === 'true'} onChange={handleInputChange} className="accent-[#24b47e]" />
                                            <span className="text-[13px] text-[#1f1f1f]">有</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="radio" name="has_spouse" value="false" checked={formData.has_spouse === 'false'} onChange={handleInputChange} className="accent-[#24b47e]" />
                                            <span className="text-[13px] text-[#1f1f1f]">無</span>
                                        </label>
                                    </div>
                                </FormRow>
                                <FormRow label="血液型">
                                    <select name="blood_type" value={formData.blood_type} onChange={handleInputChange} className={getInputClass("blood_type") + " appearance-none"}>
                                        <option value="">選択してください</option>
                                        <option value="A">A</option><option value="B">B</option><option value="O">O</option><option value="AB">AB</option>
                                    </select>
                                </FormRow>
                                <FormRow label="国籍">
                                    <select name="nationality" value={formData.nationality} onChange={handleInputChange} className={getInputClass("nationality") + " appearance-none"}>
                                        <option value="ベトナム">ベトナム</option>
                                        <option value="インドネシア">インドネシア</option>
                                        <option value="フィリピン">フィリピン</option>
                                        <option value="カンボジア">カンボジア</option>
                                    </select>
                                </FormRow>
                                <FormRow label="本国の出生地">
                                    <input name="birthplace" value={formData.birthplace} onChange={handleInputChange} className={getInputClass("birthplace")} placeholder="例: ハノイ市" />
                                </FormRow>
                                <FormRow label="社宅住所">
                                    <input name="address" value={formData.address} onChange={handleInputChange} className={getInputClass("address")} placeholder="例: 東京都新宿区..." />
                                </FormRow>
                                <FormRow label="日本の居住地" isLast={true}>
                                    <input name="japan_residence" value={formData.japan_residence} onChange={handleInputChange} className={getInputClass("japan_residence")} placeholder="例: 東京都新宿区大久保1-1-1..." />
                                </FormRow>
                            </div>
                        </div>

                        <div className="bg-white rounded-none border border-[#c4c8cf] overflow-hidden mb-6">
                            <div className="px-6 py-4 border-b border-[#c4c8cf] bg-[#f8fcfd]/10">
                                <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">管理情報</h3>
                            </div>
                            <div className="flex flex-col">
                                <FormRow label="配属先企業">
                                    <select name="company_id" value={formData.company_id} onChange={handleInputChange} className={getInputClass("company_id") + " appearance-none"}>
                                        <option value="">未配属</option>
                                        {companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                                    </select>
                                </FormRow>
                                <FormRow label="職種区分">
                                    <input name="industry_field" value={formData.industry_field} onChange={handleInputChange} className={getInputClass("industry_field")} placeholder="例: 溶接、建設" />
                                </FormRow>
                                <FormRow label="制度区分">
                                    <select name="system_type" value={formData.system_type} onChange={handleInputChange} className={getInputClass("system_type") + " appearance-none"}>
                                        <option value="ikusei_shuro">育成就労</option>
                                        <option value="tokuteigino">特定技能</option>
                                        <option value="ginou_jisshu">技能実習</option>
                                    </select>
                                </FormRow>
                                <FormRow label="ステータス">
                                    <select name="status" value={formData.status} onChange={handleInputChange} className={getInputClass("status") + " appearance-none"}>
                                        <option value="waiting">未入国</option>
                                        <option value="standby">対応中</option>
                                        <option value="working">就業中</option>
                                        <option value="missing">失踪</option>
                                        <option value="returned">帰国</option>
                                    </select>
                                </FormRow>
                                <FormRow label="送出機関" isLast={true}>
                                    <input name="sending_org" value={formData.sending_org} onChange={handleInputChange} className={getInputClass("sending_org")} placeholder="例: VINAJAPAN JSC" />
                                </FormRow>
                            </div>
                        </div>

                        <div className="bg-white rounded-none border border-[#c4c8cf] overflow-hidden mb-6">
                            <div className="px-6 py-4 border-b border-[#c4c8cf] bg-[#f8fcfd]/10">
                                <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">期限・証明書</h3>
                            </div>
                            <div className="flex flex-col">
                                <FormRow label="入国期生">
                                    <input name="entry_batch" value={formData.entry_batch} onChange={handleInputChange} className={getInputClass("entry_batch")} placeholder="例: 第15期生" />
                                </FormRow>
                                <FormRow label="入国日">
                                    <input name="entry_date" type="date" value={formData.entry_date} onChange={handleInputChange} className={getInputClass("entry_date")} />
                                </FormRow>
                                <FormRow label="在留資格">
                                    <input name="visa_status" value={formData.visa_status} onChange={handleInputChange} className={getInputClass("visa_status")} placeholder="例: 技能実習第1号イ" />
                                </FormRow>
                                <FormRow label="保険期限">
                                    <input name="insurance_exp" type="date" value={formData.insurance_exp} onChange={handleInputChange} className={getInputClass("insurance_exp")} title="保険期限" />
                                </FormRow>
                                <FormRow label="在留カード番号">
                                    <input name="zairyu_no" value={formData.zairyu_no} onChange={handleInputChange} className={getInputClass("zairyu_no")} maxLength={12} placeholder="例: AB12345678CD" />
                                </FormRow>
                                <FormRow label="在留期限">
                                    <input name="zairyu_exp" type="date" value={formData.zairyu_exp} onChange={handleInputChange} className={getInputClass("zairyu_exp")} title="在留期限" />
                                </FormRow>
                                <FormRow label="パスポート番号">
                                    <input name="passport_no" value={formData.passport_no} onChange={handleInputChange} className={getInputClass("passport_no")} placeholder="例: C1234567" />
                                </FormRow>
                                <FormRow label="パスポート期限">
                                    <input name="passport_exp" type="date" value={formData.passport_exp} onChange={handleInputChange} className={getInputClass("passport_exp")} title="パスポート期限" />
                                </FormRow>
                                <FormRow label="認定番号">
                                    <input name="cert_no" value={formData.cert_no} onChange={handleInputChange} className={getInputClass("cert_no")} placeholder="認定番号" />
                                </FormRow>
                                <FormRow label="認定開始日">
                                    <input name="cert_start_date" type="date" value={formData.cert_start_date} onChange={handleInputChange} className={getInputClass("cert_start_date")} title="認定開始日" />
                                </FormRow>
                                <FormRow label="認定修了日" isLast={true}>
                                    <input name="cert_end_date" type="date" value={formData.cert_end_date} onChange={handleInputChange} className={getInputClass("cert_end_date")} title="認定修了日" />
                                </FormRow>
                            </div>
                        </div>

                        {/* SECTION: 備考・特記事項 */}
                        <div className="bg-white rounded-none border border-[#c4c8cf] overflow-hidden mb-6">
                            <div className="px-6 py-4 border-b border-[#c4c8cf] bg-[#f8fcfd]/10">
                                <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">備考・特記事項</h3>
                            </div>
                            <div className="flex flex-col">
                                <FormRow label="備考" isLast>
                                    <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows={5} placeholder="実習生に関する特記事項やメモを自由にご入力ください。" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-2 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0 resize-y min-h-[100px]" />
                                </FormRow>
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT PANE: Document Kanban Flow */}
                <div className="w-[300px] shrink-0 h-full flex flex-col bg-[#fafafa] border-l border-gray-200">

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white z-10">
                        <div className="flex items-center gap-1.5">
                            <UploadCloud size={18} className="text-[#1f1f1f]" />
                            <h3 className="text-[15px] font-bold text-[#1f1f1f]">書類関係</h3>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-24 space-y-6">

                        {/* 1. Staging Area */}
                        <div>
                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 pl-1">1. ステージングエリア</h4>
                            <div
                                className={`cursor-pointer w-full h-[120px] border-2 border-dashed rounded-[10px] flex flex-col items-center justify-center p-3 transition-all relative
                                    ${stagedFile ? 'border-[#24b47e] bg-[#24b47e]/5' : 'border-[#878787] bg-white hover:bg-gray-50 hover:border-[#1f1f1f]'}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleMainFileDrop}
                                onClick={() => mainFileInputRef.current?.click()}
                            >
                                <input type="file" className="hidden" ref={mainFileInputRef} onChange={handleMainFileSelect} />
                                {stagedFile ? (
                                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-200 w-full">
                                        <FileText size={32} className="text-[#24b47e] mb-1.5" />
                                        <div className="text-[13px] font-bold text-[#24b47e] text-center truncate w-full px-2" title={stagedFile.name}>{stagedFile.name}</div>
                                        <div className="text-[10px] text-[#24b47e]/80 mt-1 font-medium bg-[#24b47e]/10 px-2 py-0.5 rounded-none">ファイル受信済み</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center group">
                                        <UploadCloud size={28} className="text-gray-400 mb-2 group-hover:text-gray-600 transition-colors" />
                                        <div className="text-[13px] font-bold text-[#1f1f1f]">ここに書類をドロップ</div>
                                        <div className="text-[11px] text-gray-500 mt-0.5 font-medium">クリックまたはドラッグ＆ドロップ</div>
                                    </div>
                                )}
                            </div>

                            {/* Action Card: Slides down when file is staged */}
                            {stagedFile && (
                                <div className="mt-3 p-3 bg-white border border-[#24b47e]/30 rounded-[10px] animate-in slide-in-from-top-2 fade-in-50 duration-200 relative">
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">カテゴリー指定:</label>
                                    <select
                                        value={stagedTargetDoc}
                                        onChange={e => setStagedTargetDoc(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-300 focus:border-[#24b47e] focus:bg-white focus:ring-1 focus:ring-[#24b47e] focus:outline-none rounded-none pl-2.5 pr-8 py-2 text-xs mb-3 font-medium transition-colors cursor-pointer appearance-none"
                                    >
                                        <option value="">-- 書類の種類を選択してください --</option>
                                        {allDocTypes.map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.label} {files[doc.id] && files[doc.id].length > 0 ? `(${files[doc.id].length}件追加済み)` : ''}
                                            </option>
                                        ))}
                                        <option value="new_custom" className="font-bold text-[#24b47e]">➕ 新規カテゴリーを追加</option>
                                    </select>

                                    {stagedTargetDoc === 'new_custom' && (
                                        <input
                                            type="text"
                                            placeholder="カテゴリー名をご入力ください..."
                                            value={newCustomCategory}
                                            onChange={e => setNewCustomCategory(e.target.value)}
                                            className="w-full bg-white border border-gray-300 focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] focus:outline-none rounded-none pl-2.5 pr-2 py-2 text-xs mb-3 font-medium transition-colors"
                                        />
                                    )}

                                    <button
                                        type="button"
                                        onClick={stageToStorage}
                                        disabled={!stagedTargetDoc || (stagedTargetDoc === 'new_custom' && !newCustomCategory.trim())}
                                        className="w-full py-2 bg-[#1f1f1f] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-none hover:bg-black transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        ストレージへ保存 <ArrowLeft size={14} className="rotate-180" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 2. Storage Board */}
                        <div>
                            <div className="flex items-center justify-between mb-2.5 pl-1">
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">2. ストレージ（保管庫）</h4>
                                {Object.keys(files).length > 0 && (
                                    <span className="bg-gray-100 text-[#1f1f1f] px-1.5 py-0.5 rounded-none font-bold text-[10px]">
                                        {Object.values(files).reduce((acc, arr) => acc + arr.length, 0)} ファイル
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2.5 relative min-h-[140px] rounded-none border border-gray-100 bg-gray-50/50 p-2">
                                {Object.keys(files).length === 0 && !isScanning && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                        <FileText size={24} className="text-gray-300 mb-2" />
                                        <span className="text-[11px] text-gray-400 font-medium italic">ストレージは空です。<br />ここにファイルを分類してください。</span>
                                    </div>
                                )}

                                {allDocTypes.map(doc => {
                                    const fileArr = files[doc.id] || [];
                                    const scanning = isScanning === doc.id;

                                    if (fileArr.length === 0 && !scanning) return null;

                                    return (
                                        <React.Fragment key={doc.id}>
                                            {fileArr.map((f, idx) => (
                                                <div key={f.id} className="p-1.5 bg-white border border-[#e5e7eb] rounded-none flex items-center justify-between animate-in fade-in zoom-in-95 duration-200 group">
                                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                        <div className="w-7 h-7 rounded-none flex items-center justify-center shrink-0 bg-[#24b47e]/10 text-[#24b47e]">
                                                            {doc.id === 'avatar' ? <ImageIcon size={14} /> : <FileText size={14} />}
                                                        </div>
                                                        <div className="truncate flex-1">
                                                            <div className="text-xs font-bold text-[#1f1f1f] flex items-center gap-1.5 leading-none">
                                                                <span className="truncate">{doc.label} {fileArr.length > 1 ? `#${idx + 1}` : ''}</span>
                                                            </div>
                                                            <div className="flex flex-col mt-0.5">
                                                                <div className="text-[11px] text-gray-600 font-medium truncate leading-tight" title={f.file.name}>{f.file.name}</div>
                                                                <div className="text-[9px] text-gray-400 font-medium leading-none mt-0.5">保存日: {f.timestamp}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center ml-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromStorage(doc.id, f.id)}
                                                            className="w-6 h-6 flex items-center justify-center rounded-none text-gray-400 hover:text-white hover:bg-red-500 transition-colors"
                                                            title="ファイルを削除"
                                                        >
                                                            <X size={12} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {scanning && (
                                                <div className="p-1.5 bg-white border border-[#e5e7eb] rounded-none flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                        <div className="w-7 h-7 rounded-none flex items-center justify-center shrink-0 bg-gray-100 text-[#1f1f1f]">
                                                            {doc.id === 'avatar' ? <ImageIcon size={14} /> : <FileText size={14} />}
                                                        </div>
                                                        <div className="truncate flex-1">
                                                            <div className="text-xs font-bold text-[#1f1f1f] flex items-center gap-1.5 leading-none">
                                                                <span className="truncate">{doc.label}</span>
                                                            </div>
                                                            <div className="text-[10px] text-[#1f1f1f] flex items-center gap-1 mt-0.5 font-bold leading-none">
                                                                <Loader2 size={10} className="animate-spin" /> ✨ AIスキャン中...
                                                            </div>
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