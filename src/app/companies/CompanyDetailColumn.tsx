'use client'

import React, { useState, useEffect } from 'react';
import { Building2, Edit, MapPin, Users, Briefcase, AlignLeft, Save, X, Loader2 } from 'lucide-react';
import { updateCompany } from './actions';

interface Company {
    id: string;
    name_jp: string;
    name_kana?: string;
    name_romaji?: string;
    status?: string | null;
    corporate_number?: string;
    acceptance_notification_number?: string;
    representative?: string;
    representative_romaji?: string;
    manager_name?: string;
    pic_name?: string;
    life_advisor?: string;
    tech_advisor?: string;
    postal_code?: string;
    address?: string;
    phone?: string;
    email?: string;
    industry?: string;
    accepted_occupations?: string;
    employee_count?: number;
    active_worker_count?: number;
    training_date?: string;
    remarks?: string;
}

interface CompanyDetailColumnProps {
    companies: Company[];
}

// ── Sub-components ────────────────────────────────────────────────
const LABEL_CLS = "text-[11px] font-semibold text-gray-400 shrink-0 w-[130px] uppercase tracking-tight";
const VALUE_CLS = "text-[13px] font-normal flex-1";
const INPUT_EDIT_CLS = "flex-1 h-8 px-2 bg-gray-50 border border-gray-200 rounded-md text-[13px] font-normal text-gray-800 outline-none focus:border-[#0067b8] transition-colors";

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-slate-50">
            <span className="text-[#0067b8] opacity-70">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0067b8]">{label}</span>
        </div>
    );
}

interface RowProps {
    label: string;
    name: string;
    value: any;
    isEditing: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    type?: string;
    placeholder?: string;
    valueClass?: string;
}

function Row({ label, name, value, isEditing, onChange, type = 'text', placeholder, valueClass }: RowProps) {
    if (isEditing) {
        return (
            <div className="flex items-center px-4 py-1.5 border-b border-gray-50 bg-white">
                <span className={LABEL_CLS}>{label}</span>
                <input
                    name={name}
                    type={type}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={INPUT_EDIT_CLS}
                />
            </div>
        );
    }

    return (
        <div className="flex items-center px-4 py-1.5 border-b border-gray-50 last:border-0 hover:bg-blue-50/10 transition-colors">
            <span className={LABEL_CLS}>{label}</span>
            <span className={`${VALUE_CLS} ${valueClass || 'text-gray-800'}`}>{value || '---'}</span>
        </div>
    );
}

export default function CompanyDetailColumn({ companies }: CompanyDetailColumnProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Company>>({});
    const [isSaving, setIsSaving] = useState(false);

    const c = companies[0];

    useEffect(() => {
        setIsEditing(false);
        if (c) {
            setEditData(c);
        }
    }, [c?.id]);

    if (companies.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 p-8 text-center bg-white">
                <Building2 size={40} className="mb-4 opacity-20" />
                <p className="text-[14px] font-normal text-gray-400 uppercase tracking-widest">企業を選択してください</p>
                <p className="text-[11px] text-gray-300 mt-2">左のリストから詳細を確認したい企業を選択します</p>
            </div>
        );
    }

    if (companies.length > 1) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 p-8 text-center bg-white">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-100">
                    <span className="text-[20px] font-normal text-emerald-600">{companies.length}</span>
                </div>
                <p className="text-[14px] font-normal text-gray-400 uppercase tracking-widest">{companies.length} 社を選択中</p>
                <p className="text-[11px] text-gray-300 mt-2">詳細を見るには1社のみ選択してください</p>
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setEditData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            Object.entries(editData).forEach(([key, val]) => {
                if (val !== undefined && val !== null) {
                    formData.append(key, val.toString());
                }
            });
            formData.set('id', c.id);
            await updateCompany(formData);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update company:', error);
            alert('保存に失敗しました。');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden relative">

            {/* ── Header ── */}
            <div className="px-5 py-2.5 border-b border-gray-300 shrink-0 sticky top-0 z-20 bg-white">
                <div className="flex items-start justify-between max-w-2xl mx-auto w-full">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl border-2 border-gray-100 bg-gray-50 flex items-center justify-center shrink-0 text-emerald-600">
                            <Building2 size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                {isEditing ? (
                                    <input
                                        name="name_jp"
                                        value={editData.name_jp || ''}
                                        onChange={handleInputChange}
                                        className="text-[16px] font-normal text-gray-900 border-b border-emerald-500 outline-none w-full bg-transparent p-0"
                                        placeholder="企業名を入力"
                                    />
                                ) : (
                                    <>
                                        <h2 className="text-[16px] font-normal text-gray-900 tracking-tight leading-none truncate uppercase">{c.name_jp || '---'}</h2>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                                                ${(c.active_worker_count || 0) > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}
                                            `}>
                                            {c.active_worker_count! > 0 ? '受入中' : '未受入'}
                                        </span>
                                    </>
                                )}
                            </div>

                            {isEditing ? (
                                <input
                                    name="name_romaji"
                                    value={editData.name_romaji || ''}
                                    onChange={handleInputChange}
                                    className="text-[10px] text-gray-400 font-normal uppercase tracking-wide w-full mt-1 border-b border-gray-100 outline-none bg-transparent"
                                    placeholder="ROMAN NAME"
                                />
                            ) : (
                                <p className="text-[11px] text-gray-400 font-normal uppercase tracking-wider truncate mt-1.5">{c.name_romaji || '---'}</p>
                            )}
                        </div>
                    </div>

                    <div className="shrink-0 ml-4 flex gap-2">
                        {!isEditing ? (
                            <button
                                onClick={() => { setIsEditing(true); setEditData(c); }}
                                className="h-8 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-normal transition-all flex items-center gap-1.5 active:scale-95 uppercase tracking-widest shadow-sm"
                            >
                                <Edit size={13} />
                                編集する
                            </button>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-normal transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 uppercase tracking-widest shadow-sm"
                                >
                                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                    保存する
                                </button>
                                <button
                                    onClick={() => { setIsEditing(false); setEditData(c); }}
                                    className="h-7 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-md text-[11px] font-normal transition-all uppercase tracking-widest shadow-sm"
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

                    {/* 1. 企業情報・連絡先 */}
                    <section className="space-y-1">
                        <SectionHeader icon={<Building2 size={14} />} label="企業情報・連絡先" />
                        <div className="space-y-0 text-gray-800">
                            <Row label="企業名" name="name_jp" value={isEditing ? editData.name_jp : c.name_jp} isEditing={isEditing} onChange={handleInputChange} />
                            <Row label="フリガナ" name="name_kana" value={isEditing ? editData.name_kana : c.name_kana} isEditing={isEditing} onChange={handleInputChange} />
                            <Row label="ローマ字" name="name_romaji" value={isEditing ? editData.name_romaji : c.name_romaji} isEditing={isEditing} onChange={handleInputChange} valueClass="font-normal uppercase tracking-wide" />
                            <Row label="法人番号(13桁)" name="corporate_number" value={isEditing ? editData.corporate_number : c.corporate_number} isEditing={isEditing} onChange={handleInputChange} valueClass="font-mono text-gray-600" />
                            <Row label="受理届出番号" name="acceptance_notification_number" value={isEditing ? editData.acceptance_notification_number : c.acceptance_notification_number} isEditing={isEditing} onChange={handleInputChange} valueClass="font-mono text-gray-600" />
                            <Row label="所在地（住所）" name="address" value={isEditing ? editData.address : c.address} isEditing={isEditing} onChange={handleInputChange} />
                            <Row label="電話番号" name="phone" value={isEditing ? editData.phone : c.phone} isEditing={isEditing} onChange={handleInputChange} valueClass="font-mono text-gray-600" />
                            <Row label="メールアドレス" name="email" value={isEditing ? editData.email : c.email} isEditing={isEditing} onChange={handleInputChange} />
                            <Row label="担当者" name="pic_name" value={isEditing ? editData.pic_name : c.pic_name} isEditing={isEditing} onChange={handleInputChange} />
                        </div>
                    </section>

                    {/* 2. 役員・業種・受入 */}
                    <section className="space-y-1">
                        <SectionHeader icon={<Briefcase size={14} />} label="役員・業種・受入" />
                        <div className="space-y-0 text-gray-800">
                            <Row label="代表者名" name="representative" value={isEditing ? editData.representative : c.representative} isEditing={isEditing} onChange={handleInputChange} />
                            <Row label="代表者ローマ字" name="representative_romaji" value={isEditing ? editData.representative_romaji : c.representative_romaji} isEditing={isEditing} onChange={handleInputChange} />
                            <Row label="責任者" name="manager_name" value={isEditing ? editData.manager_name : c.manager_name} isEditing={isEditing} onChange={handleInputChange} />
                            <Row label="講習受講日" name="training_date" type="date" value={isEditing ? editData.training_date : (c.training_date ? c.training_date.replace(/-/g, '/') : null)} isEditing={isEditing} onChange={handleInputChange} valueClass="font-mono" />
                            <Row label="生活指導員" name="life_advisor" value={isEditing ? editData.life_advisor : c.life_advisor} isEditing={isEditing} onChange={handleInputChange} />
                            <Row label="技能指導員" name="tech_advisor" value={isEditing ? editData.tech_advisor : c.tech_advisor} isEditing={isEditing} onChange={handleInputChange} />
                            <Row label="業種" name="industry" value={isEditing ? editData.industry : c.industry} isEditing={isEditing} onChange={handleInputChange} />
                            <Row label="受入職種" name="accepted_occupations" value={isEditing ? editData.accepted_occupations : c.accepted_occupations} isEditing={isEditing} onChange={handleInputChange} />
                            <Row label="従業員数" name="employee_count" type="number" value={isEditing ? editData.employee_count : (c.employee_count ? `${c.employee_count} 名` : null)} isEditing={isEditing} onChange={handleInputChange} />
                            {!isEditing && (
                                <Row label="受入実習生" name="active_worker_count" value={c.active_worker_count ? `${c.active_worker_count} 名` : '0 名'} isEditing={false} onChange={() => { }} valueClass={c.active_worker_count! > 0 ? 'text-emerald-600' : ''} />
                            )}
                        </div>
                    </section>

                    {/* 3. 備考 */}
                    <section className="space-y-1">
                        <SectionHeader icon={<AlignLeft size={14} />} label="備考・メモ" />
                        <div className="mt-2 min-h-[80px]">
                            {isEditing ? (
                                <textarea
                                    name="remarks"
                                    value={editData.remarks || ''}
                                    onChange={handleInputChange}
                                    className="w-full min-h-[100px] p-4 bg-slate-50 border border-gray-100 rounded-lg text-sm font-normal outline-none focus:border-[#0067b8] transition-all text-gray-700"
                                    placeholder="備考・メモを入力..."
                                />
                            ) : c.remarks ? (
                                <div className="p-4 bg-slate-50/50 rounded-lg border border-gray-50">
                                    <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{c.remarks}</p>
                                </div>
                            ) : (
                                <p className="text-[12px] text-gray-300 italic px-1">備考なし</p>
                            )}
                        </div>
                    </section>

                </div>
                <div className="h-20" />
            </div>
        </div>
    );
}
