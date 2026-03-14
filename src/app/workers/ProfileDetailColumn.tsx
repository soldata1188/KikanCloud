'use client'
// Trigger redeploy for i18n verification

import React, { useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    User, Shield, CreditCard, Calendar, MapPin, Briefcase, FileText,
    CheckCircle2, BookOpen, Heart, Droplets, Globe, Home, ClipboardList,
    GraduationCap, MessageSquare, Flag, Building2, Camera, Loader2
} from 'lucide-react';

interface Worker {
    id: string;
    full_name_romaji: string;
    full_name_kana: string;
    company_id?: string;
    companies?: { name_jp: string };
    // Status
    status: string;
    // Personal
    dob?: string;
    gender?: string;
    blood_type?: string;
    nationality?: string;
    birthplace?: string;
    has_spouse?: boolean;
    address?: string;
    japan_residence?: string;
    avatar_url?: string | null;
    // Employment
    system_type?: string;
    industry_field?: string;
    japanese_level?: string;
    sending_org?: string;
    // Entry
    entry_batch?: string;
    entry_date?: string;
    // Visa / Residency
    visa_status?: string;
    zairyu_exp?: string;
    residence_card_exp_date?: string;
    // Documents
    passport_no?: string;
    passport_exp?: string;
    passport_exp_date?: string;
    cert_no?: string;
    cert_start_date?: string;
    cert_end_date?: string;
    insurance_exp?: string;
    // Exams
    exam_academic?: string;
    exam_practical?: string;
    exam_witness?: string;
    // Remarks
    remarks?: string;
}

interface ProfileDetailColumnProps {
    workers: Worker[];
    onUpdate: (id: string, field: string, value: string) => void;
    onBulkUpdate: () => void;
    batchForm: any;
    setBatchForm: (form: any) => void;
    companies?: { id: string, name_jp: string }[];
}

// ── Helpers ──────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    working: { label: '就業中', cls: 'bg-emerald-100 text-emerald-700' },
    standby: { label: '対応中', cls: 'bg-blue-100 text-blue-700' },
    waiting: { label: '未入国', cls: 'bg-gray-100 text-gray-600' },
    missing: { label: '失踪', cls: 'bg-rose-100 text-rose-700' },
    returned: { label: '帰国', cls: 'bg-amber-100 text-amber-700' },
    transferred: { label: '転籍済', cls: 'bg-purple-100 text-purple-700' },
};
const SYSTEM_MAP: Record<string, string> = {
    ginou_jisshu: '技能実習',
    ikusei_shuro: '育成就労',
    tokuteigino: '特定技能',
};
const GENDER_MAP: Record<string, string> = { male: '男性', female: '女性', other: 'その他' };

function fmt(d?: string | null) {
    if (!d || d === '---') return '---';
    return d.replace(/-/g, '/');
}
function daysLeft(dateStr?: string | null): number | null {
    if (!dateStr || dateStr === '---') return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function expiryColor(d?: string | null) {
    const n = daysLeft(d);
    if (n === null) return 'text-gray-800';
    if (n <= 30) return 'text-rose-600 font-normal underline decoration-rose-200';
    if (n <= 90) return 'text-amber-600 font-normal';
    return 'text-gray-800';
}

// ── Sub-components ────────────────────────────────────────
function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 border-b ${color.includes('blue') ? color.replace('blue', 'emerald') : color}`}>
            <span className="opacity-70 scale-95">{icon}</span>
            <span className="text-[10px] font-normal uppercase tracking-[0.1em] text-emerald-800">{label}</span>
        </div>
    );
}

function Row({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
    return (
        <div className="flex items-center px-4 py-1.5 border-b border-gray-50 last:border-0 hover:bg-emerald-50/10 transition-colors">
            <span className="text-[10px] font-normal text-gray-400 shrink-0 w-[130px] uppercase tracking-tighter">{label}</span>
            <span className={`text-[12px] font-normal flex-1 ${valueClass || 'text-gray-800'}`}>{value || '---'}</span>
        </div>
    );
}

function ExpiryRow({ label, value }: { label: string; value?: string | null }) {
    const n = daysLeft(value);
    const badge = n !== null && n <= 90 ? (
        <span className={`ml-2 text-xs font-bold px-1 py-0.5 rounded shadow-sm ${n <= 30 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-100 text-amber-700'}`}>
            {n <= 0 ? '期限切れ' : `${n}日`}
        </span>
    ) : null;
    return (
        <div className="flex items-center px-4 py-1.5 border-b border-gray-50 last:border-0 hover:bg-emerald-50/10 transition-colors">
            <span className="text-[10px] font-normal text-gray-400 shrink-0 w-[130px] uppercase tracking-tighter">{label}</span>
            <span className={`text-[12px] font-mono ${expiryColor(value)} flex-1 flex items-center font-normal`}>
                {fmt(value)}{badge}
            </span>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────
export default function ProfileDetailColumn({ workers, onUpdate, onBulkUpdate, batchForm, setBatchForm, companies = [] }: ProfileDetailColumnProps) {
    const isBulkMode = workers.length > 1;
    const worker = workers[0];
    const [isEditing, setIsEditing] = React.useState(false);
    const [editForm, setEditForm] = React.useState<Partial<Worker>>({});
    const [uploading, setUploading] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (worker) {
            setEditForm(worker);
            setPreviewUrl(null);
            setSelectedFile(null);
        }
        setIsEditing(false);
    }, [worker]);

    const handleSave = async () => {
        if (!worker) return;
        setUploading(true);
        let finalAvatarUrl = editForm.avatar_url || worker.avatar_url;

        try {
            // 1. Upload file if selected
            if (selectedFile) {
                const supabase = createClient();
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `workers/${fileName}`;

                const { data, error } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, selectedFile);

                if (error) throw error;

                if (data) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(data.path);
                    finalAvatarUrl = publicUrl;
                }
            }

            // 2. Perform updates
            const updatesMap = { ...editForm, avatar_url: finalAvatarUrl };

            const keys = Object.keys(updatesMap) as (keyof Worker)[];
            for (const key of keys) {
                const newVal = (updatesMap as any)[key];
                const oldVal = (worker as any)[key];
                if (newVal !== oldVal && key !== 'id' && key !== 'companies') {
                    await onUpdate(worker.id, key as string, String(newVal || ''));
                }
            }

            setIsEditing(false);
            setPreviewUrl(null);
            setSelectedFile(null);
        } catch (error) {
            console.error('Error saving worker:', error);
            alert('保存に失敗しました。');
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        if (worker) setEditForm(worker);
        setIsEditing(false);
    };

    const renderField = (label: string, field: keyof Worker, type: string = 'text', options: Record<string, string> = {}) => {
        const val = isEditing ? (editForm[field] as string || '') : (worker?.[field] as string || '');
        if (!isEditing) {
            let displayVal = val;
            if (type === 'select' && options[val]) displayVal = options[val];
            if (type === 'date') displayVal = fmt(val);
            if (field === 'has_spouse') displayVal = val === true as any ? '有' : val === false as any ? '無' : '---';
            return <Row label={label} value={displayVal} />;
        }
        return (
            <div className="flex items-center px-4 py-1 border-b border-gray-50 last:border-0 bg-white">
                <span className="text-[10px] font-normal text-gray-400 shrink-0 w-[130px] uppercase tracking-tighter">{label}</span>
                {type === 'select' ? (
                    <select
                        value={String(val)}
                        onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value }))}
                        className="flex-1 h-7 px-2 bg-gray-50 border border-gray-200 rounded text-[12px] font-normal text-gray-800 outline-none focus:border-emerald-500 transition-all"
                    >
                        <option value="">---</option>
                        {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                ) : type === 'textarea' ? (
                    <textarea
                        value={String(val)}
                        onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                        className="flex-1 min-h-[60px] p-2 bg-gray-50 border border-gray-200 rounded text-[12px] font-normal text-gray-800 outline-none focus:border-emerald-500 transition-all"
                    />
                ) : (
                    <input
                        type={type}
                        value={String(val)}
                        onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                        className="flex-1 h-7 px-2 bg-gray-50 border border-gray-200 rounded text-[12px] font-normal text-gray-800 outline-none focus:border-emerald-500 transition-all"
                    />
                )}
            </div>
        );
    };

    const renderExpiryField = (label: string, field: keyof Worker) => {
        const val = isEditing ? (editForm[field] as string || '') : (worker?.[field] as string || '');
        if (!isEditing) return <ExpiryRow label={label} value={val} />;
        return (
            <div className="flex items-center px-4 py-1 border-b border-gray-50 last:border-0 bg-white">
                <span className="text-[10px] font-normal text-gray-400 shrink-0 w-[130px] uppercase tracking-tighter">{label}</span>
                <input
                    type="date"
                    value={val}
                    onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                    className="flex-1 h-7 px-2 bg-gray-50 border border-gray-200 rounded text-[12px] font-normal text-gray-800 outline-none focus:border-emerald-500 transition-all"
                />
            </div>
        );
    };

    // Empty state
    if (workers.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 p-8 text-center bg-white">
                <User size={40} className="mb-4 opacity-20" />
                <p className="text-[14px] font-normal text-gray-400 uppercase tracking-widest">人材を選択してください</p>
                <p className="text-[11px] text-gray-300 mt-2">左のリストから詳細を確認したい人を選択します</p>
            </div>
        );
    }

    // Bulk mode
    if (isBulkMode) {
        return (
            <div className="h-full flex flex-col bg-slate-50/80 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-normal text-[14px]">{workers.length}</div>
                        <div>
                            <h3 className="text-[16px] font-normal text-gray-900 uppercase">一括操作</h3>
                            <p className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">Bulk Operations</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
                        <p className="text-[13px] font-normal text-gray-500 px-5 py-3 border-b border-gray-50 uppercase tracking-tight bg-slate-50/50">変更したい項目のみ入力してください</p>
                        <div className="p-5 grid grid-cols-2 gap-x-5 gap-y-3.5">
                            {[
                                { label: 'ステータス', field: 'worker_status', type: 'select', options: [['', '変更なし'], ['working', '就業中'], ['standby', '対応中'], ['waiting', '未入国'], ['missing', '失踪'], ['returned', '帰国']] },
                                { label: '国籍', field: 'nationality', type: 'text', placeholder: '例: ベトナム' },
                                { label: '制度区分', field: 'system_type', type: 'select', options: [['', '変更なし'], ['ginou_jisshu', '技能実習'], ['ikusei_shuro', '育成就労'], ['tokuteigino', '特定技能']] },
                                { label: '職種区分', field: 'industry_field', type: 'text', placeholder: '例: 建設' },
                                { label: '日本語レベル', field: 'japanese_level', type: 'text', placeholder: '例: N3' },
                                { label: '送出機関', field: 'sending_org', type: 'text', placeholder: '例: ABC Company' },
                                { label: '入国期生', field: 'entry_batch', type: 'text', placeholder: '例: 2024-01' },
                                { label: '入国日', field: 'entry_date', type: 'date', placeholder: '' },
                                { label: '在留資格', field: 'visa_status', type: 'text', placeholder: '例: 育成就労' },
                                { label: '在留期限', field: 'zairyu_exp', type: 'date', placeholder: '' },
                                { label: '認定開始日', field: 'cert_start_date', type: 'date', placeholder: '' },
                                { label: '認定終了日', field: 'cert_end_date', type: 'date', placeholder: '' },
                                { label: '保険期限', field: 'insurance_exp', type: 'date', placeholder: '' },
                            ].map(({ label, field, type, options, placeholder }: any) => (
                                <div key={field}>
                                    <label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest mb-1 block">{label}</label>
                                    {type === 'select' ? (
                                        <select value={batchForm[field]} onChange={e => setBatchForm({ ...batchForm, [field]: e.target.value })}
                                            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[15px] font-normal outline-none focus:border-blue-500 transition-all shadow-sm">
                                            {options.map(([v, l]: string[]) => <option key={v} value={v}>{l}</option>)}
                                        </select>
                                    ) : (
                                        <input type={type} value={batchForm[field]} placeholder={placeholder}
                                            onChange={e => setBatchForm({ ...batchForm, [field]: e.target.value })}
                                            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[15px] font-normal outline-none focus:border-blue-500 transition-all shadow-sm" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white border-t border-gray-200 shrink-0">
                    <button onClick={onBulkUpdate}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-md font-black text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95">
                        <CheckCircle2 size={18} />
                        {workers.length} 名分を一括保存
                    </button>
                </div>
            </div>
        );
    }

    // Single worker
    const statusInfo = STATUS_MAP[worker.status] ?? { label: worker.status, cls: 'bg-gray-100 text-gray-600' };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">

            {/* ── Header ── */}
            <div className="px-5 py-2.5 bg-white border-b border-gray-300 shrink-0 z-10">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative group w-12 h-12 rounded-xl border-2 border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                            {(worker.avatar_url || previewUrl || editForm.avatar_url) ? (
                                <img
                                    src={previewUrl || (isEditing ? (editForm.avatar_url || '') : (worker.avatar_url || ''))}
                                    className="w-full h-full object-cover"
                                    alt=""
                                />
                            ) : (
                                <User size={28} className="text-gray-200" />
                            )}

                            {isEditing && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 text-white transition-colors"
                                        title="写真をアップロード"
                                    >
                                        <Camera size={18} />
                                    </button>
                                </div>
                            )}

                            {uploading && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20">
                                    <Loader2 size={24} className="text-blue-600 animate-spin" />
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setSelectedFile(file);
                                        const url = URL.createObjectURL(file);
                                        setPreviewUrl(url);
                                    }
                                }}
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editForm.full_name_romaji || ''}
                                        onChange={e => setEditForm({ ...editForm, full_name_romaji: e.target.value })}
                                        className="h-8 px-2 border border-gray-200 rounded text-[14px] font-black outline-none focus:border-blue-500 bg-white"
                                        placeholder="ROMAJI NAME"
                                    />
                                ) : (
                                    <h2 className="text-lg font-normal text-gray-900 uppercase tracking-tight leading-none">{worker.full_name_romaji || '---'}</h2>
                                )}
                                {isEditing ? (
                                    <select
                                        value={editForm.status || 'working'}
                                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                        className="h-7 px-2 border border-gray-200 rounded text-[11px] font-black outline-none focus:border-blue-500 bg-white text-gray-800 cursor-pointer"
                                    >
                                        {Object.entries(STATUS_MAP).map(([key, info]) => (
                                            <option key={key} value={key}>{info.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${statusInfo.cls}`}>{statusInfo.label}</span>
                                )}
                            </div>

                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.full_name_kana || ''}
                                    onChange={e => setEditForm({ ...editForm, full_name_kana: e.target.value })}
                                    className="h-6 mt-1.5 px-1 border border-gray-200 rounded text-[11px] font-normal outline-none focus:border-blue-500 w-full max-w-[200px]"
                                    placeholder="カナ名"
                                />
                            ) : (
                                <p className="text-sm text-gray-400 font-normal mt-2">{worker.full_name_kana || '---'}</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Edit Actions */}
                    <div className="flex flex-col gap-2 shrink-0 ml-4">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-normal transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                編集する
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 flex-col">
                                <button
                                    onClick={handleSave}
                                    disabled={uploading}
                                    className="w-full h-9 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-md text-xs font-normal transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                >
                                    {uploading && <Loader2 size={14} className="animate-spin" />}
                                    保存する
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="w-full h-8 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-md text-[11px] font-normal transition-all active:scale-95 shadow-sm"
                                >
                                    キャンセル
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto thin-scrollbar px-6 py-3">
                <div className="max-w-2xl mx-auto flex flex-col space-y-4">

                    {/* 1. 基本情報 */}
                    <section className="space-y-1">
                        <SectionHeader icon={<User size={14} className="text-emerald-600" />} label="プロフィール・住所" color="text-emerald-900 mb-2 border-b-0" />
                        <div className="space-y-0 text-gray-800">
                            {renderField("生年月日", "dob", "date")}
                            {renderField("性別", "gender", "select", { male: '男性', female: '女性', other: 'その他' })}
                            {renderField("血液型", "blood_type", "select", { A: 'A型', B: 'B型', O: 'O型', AB: 'AB型' })}
                            {renderField("国籍", "nationality")}
                            {renderField("出身地", "birthplace")}
                            {renderField("配偶者", "has_spouse", "select", { true: '有', false: '無' })}
                            {renderField("送出機関", "sending_org")}
                            {renderField("社宅住所", "japan_residence")}
                        </div>
                    </section>

                    {/* 2. 契約・雇用情報 */}
                    <section className="space-y-1">
                        <SectionHeader icon={<Briefcase size={14} className="text-emerald-600" />} label="契約・雇用情報" color="text-emerald-900 mb-2 border-b-0" />
                        <div className="space-y-0 text-gray-800">
                            {renderField("受入企業", "company_id", "select", companies.reduce((acc, c) => ({ ...acc, [c.id]: c.name_jp }), {}))}
                            {renderField("制度区分", "system_type", "select", { ginou_jisshu: '技能実習', ikusei_shuro: '育成就労', tokuteigino: '特定技能' })}
                            {renderField("職種区分", "industry_field")}
                            {renderField("日本語レベル", "japanese_level")}
                        </div>
                    </section>

                    {/* 3. 入国・在留管理 */}
                    <section className="space-y-1">
                        <SectionHeader icon={<Globe size={14} className="text-emerald-600" />} label="入国・在留管理" color="text-emerald-900 mb-2 border-b-0" />
                        <div className="space-y-0 text-gray-800">
                            {renderField("入国期生", "entry_batch")}
                            {renderField("入国日", "entry_date", "date")}
                            {!isEditing && worker.entry_date && (
                                <Row
                                    label="在日期間"
                                    value={`${Math.floor((Date.now() - new Date(worker.entry_date).getTime()) / 86400000)}日`}
                                    valueClass="text-emerald-700 font-mono font-normal"
                                />
                            )}
                            {renderField("在留資格", "visa_status")}
                            {renderExpiryField("在留期限", "zairyu_exp")}
                        </div>
                    </section>

                    <section>
                        <SectionHeader icon={<CreditCard size={14} className="text-emerald-600" />} label="重要書類・認定" color="text-emerald-900 border-b-0" />
                        <div className="space-y-0 text-gray-800">
                            {renderField("パスポート番号", "passport_no")}
                            {renderExpiryField("パスポート期限", "passport_exp")}
                            {renderField("認定開始日", "cert_start_date", "date")}
                            {renderExpiryField("認定終了日", "cert_end_date")}
                            {renderExpiryField("保険期限", "insurance_exp")}
                        </div>
                    </section>

                    {/* 6. 備考 */}
                    <section className="space-y-1">
                        <SectionHeader icon={<MessageSquare size={14} className="text-emerald-600" />} label="備考・フィードバック" color="text-emerald-900 mb-2 border-b-0" />
                        <div className="mt-2 min-h-[100px]">
                            {isEditing ? (
                                <textarea
                                    value={editForm.remarks || ''}
                                    onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                                    className="w-full min-h-[120px] p-4 bg-slate-50 border border-gray-100 rounded-xl text-[12px] font-normal outline-none focus:border-emerald-500 transition-all text-gray-700"
                                    placeholder="備考・メモを入力..."
                                />
                            ) : worker.remarks ? (
                                <div className="p-4 bg-slate-50/50 rounded-xl border border-gray-50">
                                    <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">{worker.remarks}</p>
                                </div>
                            ) : (
                                <p className="text-[11px] text-gray-300 italic px-1">備考なし</p>
                            )}
                        </div>
                    </section>

                </div>
                <div className="h-20" />
            </div>
        </div>
    );
}
