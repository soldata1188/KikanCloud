'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarCheck, CheckCircle2, Clock, Building2, User, FileText } from 'lucide-react'
import { createAudit } from '../actions'
import { useFormStatus } from 'react-dom'

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending || disabled}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#24b47e] hover:bg-[#1e9a6a] text-white font-bold rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
            {pending ? (
                <><Clock size={15} className="animate-spin" /> 保存中...</>
            ) : (
                <><CheckCircle2 size={15} /> 保存する</>
            )}
        </button>
    )
}

interface Props {
    companies: { id: string; name_jp: string }[]
    defaultCompanyId: string
    defaultMonth: string
    defaultPicName: string
    userRole: string
}

export function NewAuditForm({ companies, defaultCompanyId, defaultMonth, defaultPicName }: Props) {
    const [status, setStatus] = useState<'planned' | 'completed'>('planned')

    // Derive default scheduled date from month param
    const today = new Date().toISOString().split('T')[0]
    const defaultDate = defaultMonth ? `${defaultMonth}-01` : today

    return (
        <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[720px] mx-auto mt-4 md:mt-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/audits" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600">
                    <ArrowLeft size={20} strokeWidth={2} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">スケジュールの追加</h1>
                    <p className="text-sm text-slate-400 mt-0.5">監査・訪問指導の予定または実績を登録します</p>
                </div>
            </div>

            <form action={createAudit} className="flex flex-col gap-5">

                {/* ── ステータス選択 (一番上に大きく表示) ── */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 size={16} className="text-slate-400" />
                        <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">初期ステータス</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {/* 予定 */}
                        <button
                            type="button"
                            onClick={() => setStatus('planned')}
                            className={`relative flex flex-col items-center gap-2.5 py-5 px-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                                ${status === 'planned'
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${status === 'planned' ? 'bg-blue-500' : 'bg-slate-100'}`}>
                                <CalendarCheck size={22} className={status === 'planned' ? 'text-white' : 'text-slate-400'} />
                            </div>
                            <div className="text-center">
                                <div className={`font-bold text-[15px] ${status === 'planned' ? 'text-blue-700' : 'text-slate-600'}`}>予定</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">未実施の予定を登録</div>
                            </div>
                            {status === 'planned' && (
                                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
                                </div>
                            )}
                        </button>

                        {/* 完了 */}
                        <button
                            type="button"
                            onClick={() => setStatus('completed')}
                            className={`relative flex flex-col items-center gap-2.5 py-5 px-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                                ${status === 'completed'
                                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${status === 'completed' ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                                <CheckCircle2 size={22} className={status === 'completed' ? 'text-white' : 'text-slate-400'} />
                            </div>
                            <div className="text-center">
                                <div className={`font-bold text-[15px] ${status === 'completed' ? 'text-emerald-700' : 'text-slate-600'}`}>完了</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">実施済みの記録を登録</div>
                            </div>
                            {status === 'completed' && (
                                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    </div>
                    {/* Hidden input */}
                    <input type="hidden" name="status" value={status} />
                </div>

                {/* ── 基本情報 ── */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <Building2 size={16} className="text-slate-400" />
                        <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">基本情報</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* 対象企業 */}
                        <div className="md:col-span-2">
                            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                対象企業 <span className="text-red-400">*</span>
                            </label>
                            <select
                                name="company_id"
                                required
                                defaultValue={defaultCompanyId}
                                className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-4 py-3 outline-none appearance-none cursor-pointer text-slate-800 font-medium transition-all text-sm"
                            >
                                <option value="">選択してください</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                            </select>
                        </div>

                        {/* 種別 */}
                        <div>
                            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                種別 <span className="text-red-400">*</span>
                            </label>
                            <select
                                name="audit_type"
                                required
                                defaultValue="homon"
                                className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-4 py-3 outline-none appearance-none cursor-pointer text-slate-800 font-medium transition-all text-sm"
                            >
                                <option value="homon">訪問 (毎月)</option>
                                <option value="kansa">監査 (3ヶ月)</option>
                                <option value="rinji">臨時対応・その他</option>
                            </select>
                        </div>

                        {/* 担当スタッフ */}
                        <div>
                            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                担当スタッフ
                            </label>
                            <input
                                name="pic_name"
                                type="text"
                                defaultValue={defaultPicName}
                                placeholder="担当者名"
                                className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-4 py-3 outline-none text-slate-800 font-medium transition-all text-sm placeholder:text-slate-300"
                            />
                        </div>

                        {/* 予定日 */}
                        <div>
                            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                予定日 <span className="text-red-400">*</span>
                            </label>
                            <input
                                name="scheduled_date"
                                type="date"
                                required
                                defaultValue={defaultDate}
                                className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-4 py-3 outline-none text-slate-800 font-medium transition-all text-sm"
                            />
                        </div>

                        {/* 実施日 (完了時のみ) */}
                        {status === 'completed' && (
                            <div>
                                <label className="block text-[12px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">
                                    実施日 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="actual_date"
                                    type="date"
                                    required
                                    defaultValue={today}
                                    className="w-full bg-emerald-50 border border-emerald-200 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none text-slate-800 font-medium transition-all text-sm"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── メモ ── */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <FileText size={16} className="text-slate-400" />
                        <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">特記事項・メモ</h2>
                    </div>
                    <textarea
                        name="notes"
                        rows={4}
                        placeholder="例：社長と面談予定。資料持参のこと。"
                        className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-4 py-3 outline-none text-slate-800 transition-all resize-none text-sm placeholder:text-slate-300"
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 pb-8">
                    <Link href="/audits" className="px-5 py-2.5 text-slate-500 hover:text-slate-800 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm">
                        キャンセル
                    </Link>
                    <SubmitButton />
                </div>
            </form>
        </div>
    )
}
