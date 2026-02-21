'use client'
import { useState, useEffect, useTransition, useRef } from 'react'
import { Sparkles, Send, Loader2, ArrowRight, Users, Building2, AlertTriangle, CheckCircle2, User, Clock, RotateCcw } from 'lucide-react'
import { getDashboardAIBriefing, chatWithOmniAI } from './actions/dashboardAi'
import Link from 'next/link'
import { AnimatedLogo } from '@/components/AnimatedLogo'

type Message = { id: string; role: 'user' | 'model'; text: string; isTyping?: boolean }

export default function DashboardClient({ userName, role, systemData }: { userName: string, role: string, systemData: any }) {
    const [aiData, setAiData] = useState<any>(null)
    const [userInput, setUserInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isPendingChat, startChat] = useTransition()
    const [timeGreeting, setTimeGreeting] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const h = new Date().getHours()
        if (h >= 5 && h < 11) setTimeGreeting(`${userName}さん、おはようございます！☀️`)
        else if (h >= 11 && h < 17) setTimeGreeting(`${userName}さん、お疲れ様です！💼`)
        else setTimeGreeting(`${userName}さん、夜遅くまでお疲れ様です！🌙`)

        getDashboardAIBriefing(userName, role, systemData).then(res => {
            if (res.success && res.data) {
                setAiData(res.data)
                // Tin nhắn chào mừng đầu tiên của Bot
                setMessages([{ id: 'msg-0', role: 'model', text: res.data.question }])
            }
        })
    }, [userName, role, systemData])

    // Tự động cuộn xuống cuối khi có tin nhắn mới
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

    const handleChat = (e?: React.FormEvent) => {
        e?.preventDefault(); if (!userInput.trim() || isPendingChat) return;

        const input = userInput;
        setUserInput('');

        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        const typingMsg: Message = { id: 'typing', role: 'model', text: '', isTyping: true };

        setMessages(prev => [...prev, newUserMsg, typingMsg]);

        startChat(async () => {
            // Chuyển đổi format history cho Gemini API (Loại bỏ tin nhắn chào mừng đầu tiên để tránh lỗi rule của Gemini)
            const historyForApi = messages.filter(m => !m.isTyping && m.id !== 'msg-0').map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const res = await chatWithOmniAI(historyForApi, input, userName, systemData);

            setMessages(prev => prev.filter(m => m.id !== 'typing').concat({
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: res.success ? (res.text || '') : 'エラーが発生しました。'
            }));
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); }
    }

    const resetChat = () => {
        if (aiData) {
            setMessages([{ id: Date.now().toString(), role: 'model', text: aiData.question }]);
        }
    }

    return (
        <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-700 pb-10">

            {/* 1. KHOANG CHAT AI CÁ NHÂN HÓA (OMNI-CHANNEL BOT) - INFINITY FEEL */}
            <section className="relative flex flex-col h-[650px] lg:h-[750px] -mx-6 md:-mx-10 px-6 md:px-10 mb-8">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#24b47e]/10 via-[#24b47e]/5 to-transparent rounded-bl-full pointer-events-none blur-3xl opacity-50"></div>

                {/* Header Khoang Chat */}
                <div className="pt-2 pb-4 shrink-0 relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#878787] uppercase tracking-widest bg-white/50 px-2 py-0.5 rounded-full backdrop-blur-sm -ml-1">AI-Channel</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {!aiData && <div className="text-[11px] font-bold text-[#24b47e] bg-[#24b47e]/10 px-2 py-1 rounded-full flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Syncing Live Data</div>}
                            {aiData && (
                                <button onClick={resetChat} title="Reset Chat" className="text-[11px] font-bold text-[#878787] hover:text-[#1f1f1f] bg-white/50 border border-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md hover:bg-white/80">
                                    <RotateCcw size={12} /> リセット
                                </button>
                            )}
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-[34px] font-black text-[#1f1f1f] leading-tight tracking-tight pl-1 mix-blend-multiply">
                        {timeGreeting || `${userName}さん、お疲れ様です！`}
                    </h1>
                </div>

                {/* Khu vực cuộn tin nhắn */}
                <div className="flex-1 overflow-y-auto py-6 space-y-6 relative z-10 scrollbar-none">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 border-b border-black/[0.04] pb-6 last:border-0 last:pb-0`}>
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5 scale-[0.9] origin-top"><AnimatedLogo logoOnly /></div>
                            )}

                            <div className={`max-w-[85%] md:max-w-[75%] px-2 md:px-4 py-1 text-[14.5px] leading-relaxed relative overflow-hidden flex flex-col justify-center ${msg.role === 'user' ? 'text-[#1f1f1f] font-medium' : 'text-[#444746]'}`}>
                                {msg.role === 'model' && <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#24b47e] rounded-full opacity-0"></div>}

                                {msg.isTyping ? (
                                    <div className="flex items-center gap-1.5 h-6 pl-2">
                                        <span className="w-1.5 h-1.5 bg-[#24b47e]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-[#24b47e]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-[#24b47e]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 flex items-center justify-center shrink-0 shadow-sm mt-0.5"><User size={14} className="text-[#878787]" /></div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Khung Input Nhập liệu */}
                <div className="pt-4 pb-2 shrink-0 relative z-10">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#fbfcfd] to-transparent pointer-events-none -bottom-10 h-32"></div>
                    <form onSubmit={handleChat} className="relative max-w-4xl mx-auto flex items-end gap-3 bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-2 md:p-2.5 focus-within:bg-white/90 focus-within:shadow-md transition-all shadow-sm">
                        <textarea
                            value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={handleKeyDown} disabled={isPendingChat || !aiData}
                            placeholder="質問、翻訳、メール作成など、何でも聞いてください... (Shift+Enter to newline)"
                            className="flex-1 max-h-24 min-h-[40px] bg-transparent border-none outline-none resize-none py-2 md:py-2.5 px-4 text-[14px] text-[#1f1f1f] placeholder:text-[#a0a0a0] leading-relaxed disabled:opacity-50"
                            rows={1}
                        />
                        <button type="submit" disabled={isPendingChat || !userInput.trim()} className="w-11 h-11 shrink-0 flex items-center justify-center bg-[#1f1f1f] text-white hover:bg-[#24b47e] hover:shadow-lg hover:-translate-y-0.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:bg-[#e0e0e0] disabled:text-[#878787] disabled:shadow-none disabled:transform-none mb-0.5">
                            {isPendingChat ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                        </button>
                    </form>
                </div>
            </section>

            {/* 2. KHỐI THẺ AI PHÂN TÍCH VÀ SYSTEM ALERTS (GIỮ NGUYÊN) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-[16px] font-semibold text-[#444746] mb-4 tracking-tight">AI Task Suggestion</h3>
                    <div className="bg-white border border-[#ededed] rounded-xl p-6 shadow-sm min-h-[150px] flex flex-col justify-center hover:shadow-md transition-shadow">
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
                    <div className={`${aiData?.alert?.hasDanger ? 'bg-[#fff9f9] border-[#fce8e6]' : 'bg-white border-[#ededed]'} border rounded-xl p-6 shadow-sm min-h-[150px] flex flex-col justify-between relative overflow-hidden transition-colors duration-500 hover:shadow-md`}>
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
