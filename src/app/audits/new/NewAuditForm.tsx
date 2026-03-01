'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarCheck, CheckCircle2, Clock, Building2, User, FileText } from 'lucide-react'
import { createAudit } from '../actions'
import { useFormStatus } from 'react-dom'

const FormRow = ({ label, required, children, isLast = false }: {
    label: string; required?: boolean; children: React.ReactNode; isLast?: boolean
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

const SectionCard = ({ icon, title, children }: {
    icon: React.ReactNode; title: string; children: React.ReactNode
}) => (
    <div className="bg-white border border-gray-200 overflow-hidden rounded-md">
        <div className="px-5 py-2.5 border-b border-[#005a9e] flex items-center gap-2.5 bg-[#0067b8]">
            <span className="text-white">{icon}</span>
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex flex-col">{children}</div>
    </div>
);

interface Props {
    companies: { id: string; name_jp: string }[]
    defaultCompanyId: string
    defaultMonth: string
    defaultPicName: string
    userRole: string
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending || disabled}
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#0067b8] hover:bg-[#005a9e] text-white font-bold rounded-md transition-all text-[13px] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
        >
            {pending ? (
                <><Clock size={15} className="animate-spin" /> 保存中...</>
            ) : (
                <><CheckCircle2 size={15} /> 記録を保存</>
            )}
        </button>
    )
}

export function NewAuditForm({ companies, defaultCompanyId, defaultMonth, defaultPicName }: Props) {
    const [status, setStatus] = useState<'planned' | 'completed'>('planned')

    // Derive default scheduled date from month param
    const today = new Date().toISOString().split('T')[0]
    const defaultDate = defaultMonth ? `${defaultMonth}-01` : today

    const inputCls = 'w-full bg-white/50 focus:bg-white border border-gray-300 focus:border-[#0067b8] rounded px-3 py-1.5 text-[13px] font-bold outline-none text-gray-900 transition-all placeholder:text-gray-300 placeholder:font-normal';

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 relative overflow-hidden">
            {/* ── Top Bar ── */}
            <div className="flex items-center justify-between px-6 h-[57px] border-b border-gray-200 bg-white shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <Link href="/audits"
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 border border-transparent">
                        <ArrowLeft size={18} strokeWidth={2} />
                    </Link>
                    <div className="w-px h-5 bg-gray-200" />
                    <div>
                        <h2 className="text-[15px] font-bold text-gray-900 leading-tight tracking-tight uppercase">監査・訪問 スケジュールの追加</h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/audits"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-[11px] font-bold rounded-md hover:bg-gray-50 transition-colors">
                        キャンセル
                    </Link>
                    <form action={createAudit}>
                        {/* Hidden Inputs for Form Data used in redirect etc if needed, but the form wraps the whole sections below */}
                    </form>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                <form action={createAudit} className="w-full max-w-[1200px] mx-auto p-8 space-y-8">

                    {/* ── ステータス選択 ── */}
                    <SectionCard icon={<CheckCircle2 size={14} />} title="初期ステータス">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setStatus('planned')}
                                className={`relative flex items-center gap-4 p-4 rounded border-2 transition-all duration-200
                                    ${status === 'planned'
                                        ? 'border-[#0067b8] bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded flex items-center justify-center ${status === 'planned' ? 'bg-[#0067b8]' : 'bg-gray-100'}`}>
                                    <Clock size={18} className={status === 'planned' ? 'text-white' : 'text-gray-400'} />
                                </div>
                                <div className="text-left">
                                    <div className={`font-bold text-[14px] ${status === 'planned' ? 'text-blue-900' : 'text-gray-600'}`}>予定（実施前）</div>
                                    <div className="text-[11px] text-gray-400 font-medium">訪問予定をカレンダーに登録します</div>
                                </div>
                                {status === 'planned' && <div className="absolute top-2 right-2 w-4 h-4 bg-[#0067b8] rounded-full flex items-center justify-center"><CheckCircle2 size={10} className="text-white" strokeWidth={3} /></div>}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatus('completed')}
                                className={`relative flex items-center gap-4 p-4 rounded border-2 transition-all duration-200
                                    ${status === 'completed'
                                        ? 'border-emerald-600 bg-emerald-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded flex items-center justify-center ${status === 'completed' ? 'bg-emerald-600' : 'bg-gray-100'}`}>
                                    <CheckCircle2 size={18} className={status === 'completed' ? 'text-white' : 'text-gray-400'} />
                                </div>
                                <div className="text-left">
                                    <div className={`font-bold text-[14px] ${status === 'completed' ? 'text-emerald-900' : 'text-gray-600'}`}>完了（実績入力）</div>
                                    <div className="text-[11px] text-gray-400 font-medium">実施済みの内容を記録として保存します</div>
                                </div>
                                {status === 'completed' && <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center"><CheckCircle2 size={10} className="text-white" strokeWidth={3} /></div>}
                            </button>
                        </div>
                        <input type="hidden" name="status" value={status} />
                    </SectionCard>

                    {/* ── 基本情報 ── */}
                    <SectionCard icon={<Building2 size={14} />} title="基本情報">
                        <FormRow label="対象企業" required>
                            <select name="company_id" required defaultValue={defaultCompanyId} className={inputCls}>
                                <option value="">企業を選択してください</option>
                                {companies.map((c: { id: string, name_jp: string }) => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                            </select>
                        </FormRow>
                        <FormRow label="種別" required>
                            <select name="audit_type" required defaultValue="homon" className={inputCls}>
                                <option value="homon">訪問 (毎月)</option>
                                <option value="kansa">監査 (3ヶ月)</option>
                                <option value="rinji">臨時対応・その他</option>
                            </select>
                        </FormRow>
                        <FormRow label="担当スタッフ">
                            <input name="pic_name" type="text" defaultValue={defaultPicName} placeholder="担当者氏名" className={inputCls} />
                        </FormRow>
                        <FormRow label="予定日" required>
                            <input name="scheduled_date" type="date" required defaultValue={defaultDate} className={inputCls} />
                        </FormRow>
                        {status === 'completed' && (
                            <FormRow label="実施日" required>
                                <input name="actual_date" type="date" required defaultValue={today} className={`${inputCls} bg-emerald-50/50 border-emerald-200 focus:border-emerald-600`} />
                            </FormRow>
                        )}
                        <FormRow label="備考・メモ" isLast>
                            <textarea name="notes" rows={4} placeholder="特記事項・訪問時のメモを入力..." className={`${inputCls} py-2.5 resize-none`} />
                        </FormRow>
                    </SectionCard>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Link href="/audits" className="px-8 py-2.5 bg-white border border-gray-300 text-gray-700 text-[13px] font-bold rounded-md hover:bg-gray-50 transition-all">
                            キャンセル
                        </Link>
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </div>
    )
}
