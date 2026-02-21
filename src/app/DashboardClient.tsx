'use client'
import { useState, useEffect, useTransition } from 'react'
import { Sparkles, Send, Loader2, ArrowRight, Users, Building2, AlertTriangle, CheckCircle2, RotateCcw, Clock } from 'lucide-react'
import { getDashboardAIBriefing, chatWithDashboardAI } from './actions/dashboardAi'
import Link from 'next/link'

export default function DashboardClient({ userName, role, systemData }: { userName: string, role: string, systemData: any }) {
    const [aiData, setAiData] = useState<any>(null)
    const [userInput, setUserInput] = useState('')
    const [aiReply, setAiReply] = useState('')
    const [isPendingChat, startChat] = useTransition()
    const [timeGreeting, setTimeGreeting] = useState('')

    useEffect(() => {
        // Đặt lời chào Local Time
        const h = new Date().getHours()
        if (h >= 5 && h < 11) setTimeGreeting(`${userName}さん、おはようございます！☀️`)
        else if (h >= 11 && h < 17) setTimeGreeting(`${userName}さん、お疲れ様です！💼`)
        else setTimeGreeting(`${userName}さん、夜遅くまでお疲れ様です！🌙`)

        getDashboardAIBriefing(userName, role, systemData).then(res => { if (res.success && res.data) setAiData(res.data) })
    }, [userName, role, systemData])

    const handleChat = (e: React.FormEvent) => {
        e.preventDefault(); if (!userInput.trim()) return;
        const input = userInput; setUserInput(''); setAiReply('AIが思考中...');
        startChat(async () => { const res = await chatWithDashboardAI(userName, input); if (res.success) setAiReply(res.text || ''); })
    }

    return (
        <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-700 pb-10">

            {/* 1. KHOANG CHAT AI CÁ NHÂN HÓA */}
            <section className="bg-white border border-[#ededed] rounded-[24px] p-8 md:p-10 shadow-sm relative overflow-hidden group">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-bl from-[#24b47e]/10 via-[#24b47e]/5 to-transparent rounded-full blur-3xl pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
                <div className="relative z-10 w-full max-w-3xl">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-full bg-[#fbfcfd] border border-[#ededed] flex items-center justify-center shadow-sm"><Sparkles size={16} className="text-[#24b47e]" /></div>
                        <span className="text-[10px] font-bold text-[#878787] uppercase tracking-widest">KikanCloud AI Copilot</span>
                    </div>

                    <h1 className="text-3xl md:text-[34px] font-black text-[#1f1f1f] leading-tight tracking-tight mb-3">
                        {timeGreeting || `${userName}さん、お疲れ様です！`}
                    </h1>

                    {!aiData ? (
                        <p className="text-[14px] text-[#24b47e] font-bold mb-8 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> リアルタイムデータを分析中... (Analyzing Live Data...)</p>
                    ) : (
                        <p className="text-[14px] text-[#666666] font-medium mb-8 max-w-xl">{aiData.question}</p>
                    )}

                    <div className="relative w-full max-w-xl transition-all duration-500">
                        {aiReply ? (
                            <div className="bg-white border border-[#24b47e]/30 p-5 rounded-xl text-[13px] text-[#444746] leading-relaxed flex gap-3 items-start shadow-sm fade-in relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#24b47e]"></div>
                                <Sparkles size={16} className="text-[#24b47e] shrink-0 mt-0.5" />
                                <div className="w-full">
                                    <p className="font-medium">{aiReply}</p>
                                    <div className="flex justify-end mt-3 pt-3 border-t border-[#ededed]">
                                        <button onClick={() => setAiReply('')} className="text-[11px] font-bold text-[#878787] hover:text-[#1f1f1f] transition-colors bg-[#fbfcfd] border border-[#ededed] px-3 py-1.5 rounded-md flex items-center gap-1.5"><RotateCcw size={12} /> リセット (Reset)</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleChat} className="relative shadow-sm group">
                                <Sparkles size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#878787] group-focus-within:text-[#24b47e] transition-colors" />
                                <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="例：今日は監査手続きに集中したいです..." className="w-full h-12 pl-11 pr-14 bg-[#fbfcfd] border border-[#ededed] rounded-xl text-[13px] outline-none focus:bg-white focus:border-[#24b47e] focus:ring-4 focus:ring-[#24b47e]/10 transition-all text-[#1f1f1f] placeholder:text-[#a0a0a0]" />
                                <button type="submit" disabled={isPendingChat || !userInput.trim()} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[#878787] hover:text-[#24b47e] hover:bg-[#24b47e]/10 rounded-lg transition-colors disabled:opacity-50">
                                    {isPendingChat ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* 2. KHỐI THẺ AI PHÂN TÍCH (LEFT-BORDER ACCENT) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-[16px] font-semibold text-[#444746] mb-4 tracking-tight">AI Task Suggestion</h3>
                    <div className="bg-white border border-[#ededed] rounded-xl p-6 shadow-sm min-h-[150px] flex flex-col justify-center">
                        {!aiData ? (
                            <div className="animate-pulse space-y-3 py-1"><div className="h-2 bg-[#fbfcfd] rounded w-1/4"></div><div className="h-2 bg-[#fbfcfd] rounded w-full"></div><div className="h-2 bg-[#fbfcfd] rounded w-5/6"></div></div>
                        ) : (
                            <div className="relative pl-5 py-0.5">
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1e8e3e] rounded-full"></div>
                                <span className="text-[12px] font-bold text-[#1e8e3e] uppercase tracking-wide block mb-2">{aiData.tip?.label || 'TIP'}</span>
                                <p className="text-[14px] text-[#444746] leading-[1.7]">
                                    <strong className="font-semibold text-[#1f1f1f]">{aiData.tip?.title} </strong> <br />
                                    {aiData.tip?.content}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-[16px] font-semibold text-[#444746] mb-4 tracking-tight">System Alerts</h3>
                    <div className={`${aiData?.alert?.hasDanger ? 'bg-[#fff9f9] border-[#fce8e6]' : 'bg-white border-[#ededed]'} border rounded-xl p-6 shadow-sm min-h-[150px] flex flex-col justify-between relative overflow-hidden transition-colors duration-500`}>
                        {!aiData ? (
                            <div className="animate-pulse space-y-3 py-1"><div className="h-2 bg-[#fbfcfd] rounded w-1/4"></div><div className="h-2 bg-[#fbfcfd] rounded w-full"></div></div>
                        ) : (
                            <>
                                <div className="relative pl-5 py-0.5 mb-4 z-10">
                                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-full ${aiData.alert?.hasDanger ? 'bg-[#d93025]' : 'bg-[#24b47e]'}`}></div>
                                    <span className={`text-[12px] font-bold uppercase tracking-wide block mb-2 flex items-center gap-1.5 ${aiData.alert?.hasDanger ? 'text-[#d93025]' : 'text-[#24b47e]'}`}>
                                        {aiData.alert?.hasDanger ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />} {aiData.alert?.label || 'NOTICE'}
                                    </span>
                                    <p className="text-[14px] text-[#444746] leading-relaxed">
                                        <strong className="font-semibold text-[#1f1f1f]">{aiData.alert?.title} </strong><br />
                                        {aiData.alert?.content}
                                    </p>
                                </div>
                                {aiData.alert?.hasDanger && (
                                    <Link href="/audits" className="text-[11px] font-bold text-[#1f1f1f] hover:text-[#d93025] flex items-center gap-1.5 transition-colors group w-fit uppercase tracking-widest mt-auto pl-5 z-10">
                                        Review Pending Tasks <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* 3. KHỐI THỐNG KÊ DATA */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#ededed] rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm"><Users size={20} className="text-[#878787]" /><div><p className="text-[10px] font-bold text-[#878787] uppercase tracking-widest">Workers</p><p className="text-2xl font-black text-[#1f1f1f] font-mono">{systemData.stats.workers}</p></div></div>
                <div className="bg-white border border-[#ededed] rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm"><Building2 size={20} className="text-[#878787]" /><div><p className="text-[10px] font-bold text-[#878787] uppercase tracking-widest">Companies</p><p className="text-2xl font-black text-[#1f1f1f] font-mono">{systemData.stats.companies}</p></div></div>
                <div className="bg-white border border-[#ededed] rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm"><Clock size={20} className="text-[#878787]" /><div><p className="text-[10px] font-bold text-[#878787] uppercase tracking-widest">Pending Audits</p><p className="text-2xl font-black text-[#1f1f1f] font-mono">{systemData.stats.audits}</p></div></div>
                <div className={`${systemData.stats.audits > 0 ? 'bg-[#fff9f9] border-[#fce8e6]' : 'bg-[#fbfcfd] border-[#ededed]'} border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm relative overflow-hidden group`}>
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${systemData.stats.audits > 0 ? 'bg-[#d93025]' : 'bg-[#24b47e]'}`}></div>
                    {systemData.stats.audits > 0 ? <AlertTriangle size={20} className="text-[#d93025] group-hover:scale-110 transition-transform" /> : <CheckCircle2 size={20} className="text-[#24b47e] group-hover:scale-110 transition-transform" />}
                    <div><p className={`text-[10px] font-bold uppercase tracking-widest ${systemData.stats.audits > 0 ? 'text-[#d93025]' : 'text-[#24b47e]'}`}>System Status</p><p className="text-lg font-black text-[#1f1f1f]">{systemData.stats.audits > 0 ? 'Action Needed' : 'Optimal'}</p></div>
                </div>
            </section>
        </div>
    )
}
