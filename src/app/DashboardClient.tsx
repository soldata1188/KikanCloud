'use client'
import { useState, useEffect } from 'react'
import { Sparkles, Loader2, ArrowRight, Users, Building2, AlertTriangle, CheckCircle2, Clock, Activity } from 'lucide-react'
import { getDashboardAIBriefing } from './actions/dashboardAi'
import Link from 'next/link'

export default function DashboardClient({ userName, role, systemData }: { userName: string, role: string, systemData: any }) {
    const [aiData, setAiData] = useState<any>(null)
    const [timeGreeting, setTimeGreeting] = useState('')

    useEffect(() => {
        const h = new Date().getHours()
        if (h >= 5 && h < 11) setTimeGreeting(`${userName}さん、おはようございます！☀️`)
        else if (h >= 11 && h < 17) setTimeGreeting(`${userName}さん、お疲れ様です！💼`)
        else setTimeGreeting(`${userName}さん、夜遅くまでお疲れ様です！🌙`)

        getDashboardAIBriefing(userName, role, systemData).then(res => {
            if (res.success && res.data) {
                setAiData(res.data)
            }
        })
    }, [userName, role, systemData])

    return (
        <div className="max-w-[1400px] mx-auto p-6 md:p-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold text-[#198f63] bg-[#e8f5f0] px-2.5 py-1 rounded-md tracking-widest uppercase flex items-center gap-1.5 border border-[#24b47e]/20">
                            <Sparkles size={12} />
                            KikanCloud AI Dashboard
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#1f1f1f] leading-tight tracking-tight">
                        {timeGreeting || `${userName}さん、お疲れ様です！`}
                    </h1>
                </div>
                {!aiData && (
                    <div className="text-[12px] font-bold text-[#24b47e] bg-[#e8f5f0] px-3 py-1.5 rounded-lg flex items-center gap-2 w-fit">
                        <Loader2 size={14} className="animate-spin" /> AIインサイト同期中...
                    </div>
                )}
            </header>

            {/* Quick Stats Grid */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center group hover:border-[#24b47e]/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-500 group-hover:scale-110 transition-transform">
                        <Users size={20} />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">外国人材</p>
                    <p className="text-3xl font-black text-[#1f1f1f] font-mono">{systemData.stats.workers}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center group hover:border-[#24b47e]/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3 text-indigo-500 group-hover:scale-110 transition-transform">
                        <Building2 size={20} />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">受入企業</p>
                    <p className="text-3xl font-black text-[#1f1f1f] font-mono">{systemData.stats.companies}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center group hover:border-[#24b47e]/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3 text-orange-500 group-hover:scale-110 transition-transform">
                        <Clock size={20} />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">監査予定</p>
                    <p className="text-3xl font-black text-[#1f1f1f] font-mono">{systemData.stats.audits}</p>
                </div>

                <div className="bg-gradient-to-br from-[#f2fcf7] to-[#e6f4ed] p-5 rounded-2xl border border-[#24b47e]/20 shadow-[0_4px_20px_rgba(36,180,126,0.08)] flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                        {systemData.stats.audits > 0 ? (
                            <AlertTriangle size={20} className="text-[#d93025] animate-pulse" />
                        ) : (
                            <CheckCircle2 size={20} className="text-[#24b47e]" />
                        )}
                    </div>
                    <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${systemData.stats.audits > 0 ? 'text-[#d93025]' : 'text-[#198f63]'}`}>システム状態</p>
                    <p className={`text-xl font-black ${systemData.stats.audits > 0 ? 'text-[#d93025]' : 'text-[#13734e]'}`}>
                        {systemData.stats.audits > 0 ? '対応が必要' : '最適'}
                    </p>
                </div>
            </section>

            {/* AI Insights and Alerts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                {/* Left Column: AI Task Suggestions */}
                <section className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-6 px-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#24b47e] to-[#4ade80] flex items-center justify-center text-white shadow-sm">
                            <Sparkles size={16} />
                        </div>
                        <h2 className="text-xl font-bold text-[#1f1f1f] tracking-tight">AI 業務サマリー</h2>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-full relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(36,180,126,0.08)] transition-shadow duration-500 flex flex-col">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#24b47e]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none"></div>

                        {!aiData ? (
                            <div className="animate-pulse space-y-4 relative z-10">
                                <div className="h-4 bg-gray-100 rounded-md w-1/3 mb-6"></div>
                                <div className="h-3 bg-gray-100 rounded-md w-full"></div>
                                <div className="h-3 bg-gray-100 rounded-md w-5/6"></div>
                                <div className="h-3 bg-gray-100 rounded-md w-4/6"></div>
                            </div>
                        ) : (
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-4 inline-flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full bg-[#24b47e] animate-pulse"></span>
                                    <span className="text-xs font-bold text-[#24b47e] uppercase tracking-widest">{aiData.tip?.label || 'AI 分析完了'}</span>
                                </div>
                                <h3 className="text-xl font-black text-[#1f1f1f] mb-4 leading-snug">
                                    {aiData.tip?.title}
                                </h3>
                                <p className="text-[15px] text-[#444746] leading-relaxed whitespace-pre-wrap flex-1">
                                    {aiData.tip?.content}
                                </p>

                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <p className="text-sm font-semibold text-gray-800 mb-1">Omni-AI アシスタントへの相談</p>
                                    <p className="text-[13px] text-gray-500 mb-4">複雑な業務分析や翻訳、メール作成はサイドバーのAI機能をいつでもご利用ください。</p>
                                    <button onClick={() => {
                                        const sb = document.querySelector('button[title="AIアシスタント"]') as HTMLButtonElement;
                                        if (sb) sb.click();
                                    }} className="inline-flex items-center gap-2 text-sm font-bold text-[#24b47e] bg-[#e8f5f0] hover:bg-[#d1ebd8] px-4 py-2.5 rounded-xl transition-colors w-fit">
                                        <Sparkles size={16} /> AIチャットを開く
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Right Column: System Alerts */}
                <section className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-6 px-1">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shadow-sm">
                            <Activity size={16} />
                        </div>
                        <h2 className="text-xl font-bold text-[#1f1f1f] tracking-tight">システムアラート</h2>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-full flex flex-col group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow duration-500 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${aiData?.alert?.hasDanger ? 'from-red-500/5' : 'from-gray-500/5'} to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none`}></div>
                        {!aiData ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-4 bg-gray-100 rounded-md w-1/4 mb-6"></div>
                                <div className="h-3 bg-gray-100 rounded-md w-full"></div>
                                <div className="h-3 bg-gray-100 rounded-md w-3/4"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full relative z-10">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit mb-5 ${aiData.alert?.hasDanger ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {aiData.alert?.hasDanger ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                                    <span className="text-xs font-bold uppercase tracking-widest">{aiData.alert?.label || '通知'}</span>
                                </div>

                                <h3 className="text-xl font-black text-[#1f1f1f] mb-4 leading-snug">
                                    {aiData.alert?.title}
                                </h3>

                                <p className="text-[15px] text-[#444746] leading-relaxed mb-8 flex-1">
                                    {aiData.alert?.content}
                                </p>

                                {aiData.alert?.hasDanger ? (
                                    <Link href="/audits" className="mt-8 relative overflow-hidden group/btn inline-flex items-center gap-2 w-full justify-center bg-red-50 hover:bg-red-500 text-red-700 hover:text-white py-3.5 rounded-xl font-bold transition-all duration-300">
                                        <span className="relative z-10 flex items-center gap-2">保留中のタスクを確認 <ArrowRight size={16} className="group-hover/btn:translate-x-1 duration-300 transition-transform" /></span>
                                    </Link>
                                ) : (
                                    <div className="mt-8 pt-6 border-t border-gray-100">
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 bg-gray-50 px-4 py-2.5 rounded-xl">
                                            <CheckCircle2 size={16} /> 現在対応が必要なアラートはありません
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
