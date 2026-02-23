'use client'
import { useState, useEffect, useTransition, useRef } from 'react'
import { Sparkles, Send, Loader2, Plus, MapPin, User, Users, Building2, PlaneLanding, UserMinus } from 'lucide-react'
import { chatWithOmniAI } from './actions/dashboardAi'
import Link from 'next/link'

type Message = { id: string; role: 'user' | 'model'; text: string; isTyping?: boolean }

export default function DashboardClient({ userName, dashboardData }: { userName: string, dashboardData: any }) {
    const [currentTime, setCurrentTime] = useState<Date | null>(null)

    const [userInput, setUserInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isPendingChat, startChat] = useTransition()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatInputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        setCurrentTime(new Date())
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)

        // Initial AI Greeting
        const h = new Date().getHours()
        let initialGreeting = 'お疲れ様です。本日の業務サポートを開始します。'
        if (h >= 5 && h < 11) initialGreeting = 'おはようございます！本日の業務も頑張りましょう。'
        else if (h >= 11 && h < 17) initialGreeting = 'お疲れ様です！午後の業務サポートを開始します。'
        setMessages([{ id: 'msg-0', role: 'model', text: initialGreeting }])

        return () => clearInterval(timer)
    }, [])

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

    const formatDate = (date: Date) => {
        const days = ['日', '月', '火', '水', '木', '金', '土']
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${days[date.getDay()]}）`
    }

    const formatTime = (date: Date) => {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    const getHeroGreeting = (date: Date) => {
        const h = date.getHours()
        if (h >= 5 && h < 11) return 'おはようございます！今日も一日頑張りましょう。'
        if (h >= 11 && h < 17) return 'お疲れ様です！午後の業務も順調ですか？'
        return 'こんばんは！夜遅くまで本当にお疲れ様です。'
    }

    const handleMoodClick = (moodLabel: string) => {
        setUserInput(`今のコンディションは「${moodLabel}」です。本日の優先業務についてアドバイスをください。`)
        setTimeout(() => {
            chatInputRef.current?.focus()
            chatInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
    }

    const handleChat = (e?: React.FormEvent) => {
        e?.preventDefault(); if (!userInput.trim() || isPendingChat) return;
        const input = userInput; setUserInput('');
        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        const typingMsg: Message = { id: 'typing', role: 'model', text: '', isTyping: true };
        setMessages(prev => [...prev, newUserMsg, typingMsg]);

        startChat(async () => {
            const historyForApi = messages.filter(m => !m.isTyping && m.id !== 'msg-0').map(m => ({ role: m.role, parts: [{ text: m.text }] }));
            const res = await chatWithOmniAI(historyForApi, input, userName, dashboardData);
            setMessages(prev => prev.filter(m => m.id !== 'typing').concat({
                id: (Date.now() + 1).toString(), role: 'model', text: res.success ? (res.text || '') : 'システムエラーが発生しました。'
            }));
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); }
    }

    if (!currentTime) return null;

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700 pb-10">

            {/* 1. BUTTON ADD NEW */}
            <div className="flex justify-end">
                <Link href="/workers/new" className="px-5 py-2.5 bg-[#24b47e] text-white font-medium rounded hover:bg-[#1e8e3e] transition-colors flex items-center gap-2 text-[14px]">
                    <Plus size={18} /> 実習生を新規追加
                </Link>
            </div>

            {/* 2. HERO SECTION (HTML MOCKUP) */}
            <div className="bg-white border border-[#ededed] rounded flex flex-col md:flex-row overflow-hidden">
                <div className="p-8 border-b md:border-b-0 md:border-r border-[#ededed] flex flex-col items-center justify-center bg-white min-w-[280px]">
                    <p className="text-lg text-[#878787] font-medium mb-1 tracking-wide">{formatDate(currentTime)}</p>
                    <h2 className="text-7xl font-black text-[#1f1f1f] tracking-tighter tabular-nums">{formatTime(currentTime)}</h2>
                    <p className="text-sm text-[#878787] mt-3 flex items-center gap-1.5 font-medium">
                        <MapPin size={14} className="text-[#24b47e]" /> 大阪府堺市 (Sakai, Osaka)
                    </p>
                </div>

                <div className="p-8 flex-1 bg-[#e8f5e9]/50 flex flex-col justify-center">
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded bg-[#24b47e] flex items-center justify-center text-white shrink-0 shadow-sm">
                            <Sparkles size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#1f1f1f] mb-2">{getHeroGreeting(currentTime)}</h2>
                            <p className="text-[#444746] leading-relaxed mb-4 text-[14px]">
                                {userName}さん、日々の業務本当にお疲れ様です。<br />
                                急ぎの更新書類が <span className="text-[#d93025] font-bold">{dashboardData.alerts.length}件</span> ありますが、焦らず一つずつ片付けていきましょう。KikanCloud AIが全力でサポートします！
                            </p>

                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[13px] text-[#878787] flex items-center mr-1">今のコンディション：</span>
                                <button onClick={() => handleMoodClick('絶好調')} className="px-4 py-1.5 text-[13px] bg-white border border-[#ededed] rounded hover:bg-[#e8f5e9] hover:border-[#24b47e] hover:text-[#1e8e3e] transition-colors">😊 絶好調</button>
                                <button onClick={() => handleMoodClick('普通')} className="px-4 py-1.5 text-[13px] bg-white border border-[#ededed] rounded hover:bg-[#fbfcfd] hover:border-[#878787] hover:text-[#1f1f1f] transition-colors">😐 普通</button>
                                <button onClick={() => handleMoodClick('疲れ気味')} className="px-4 py-1.5 text-[13px] bg-white border border-[#ededed] rounded hover:bg-[#fff9f9] hover:border-[#fce8e6] hover:text-[#d93025] transition-colors">😩 疲れ気味</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-[#ededed] p-5 rounded"><p className="text-[13px] text-[#878787] mb-2 font-medium flex items-center gap-1.5"><Users size={16} /> 総実習生数</p><div className="flex items-baseline gap-2"><h3 className="text-3xl font-black text-[#1f1f1f]">{dashboardData.stats.totalWorkers}</h3><span className="text-[13px] text-[#878787]">名</span></div></div>
                <div className="bg-white border border-[#ededed] p-5 rounded"><p className="text-[13px] text-[#878787] mb-2 font-medium flex items-center gap-1.5"><Building2 size={16} /> 受入企業数</p><div className="flex items-baseline gap-2"><h3 className="text-3xl font-black text-[#1f1f1f]">{dashboardData.stats.totalCompanies}</h3><span className="text-[13px] text-[#878787]">社</span></div></div>
                <div className="bg-white border border-[#ededed] p-5 rounded"><p className="text-[13px] text-[#878787] mb-2 font-medium flex items-center gap-1.5"><PlaneLanding size={16} /> 入国対応中</p><div className="flex items-baseline gap-2"><h3 className="text-3xl font-black text-[#1f1f1f]">{dashboardData.stats.enteringWorkers}</h3><span className="text-[13px] text-[#878787]">名</span></div></div>
                <div className="bg-white border border-[#ededed] p-5 rounded"><p className="text-[13px] text-[#878787] mb-2 font-medium flex items-center gap-1.5"><UserMinus size={16} /> 失踪・帰国</p><div className="flex items-baseline gap-2"><h3 className="text-3xl font-black text-[#1f1f1f]">{dashboardData.stats.missingWorkers}</h3><span className="text-[13px] text-[#878787]">名</span></div></div>
            </div>

            {/* 4. ALERTS TABLE & CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Alerts Table */}
                <div className="lg:col-span-2 bg-white border border-[#ededed] rounded overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#ededed] bg-[#fbfcfd] flex justify-between items-center">
                        <h3 className="font-bold text-[#1f1f1f] text-[14px]">要対応アラート：更新期限が近い書類 <span className="text-[#d93025] font-normal text-[13px] ml-1">(90日以内)</span></h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[14px]">
                            <thead className="text-[#878787] bg-[#fbfcfd] border-b border-[#ededed]">
                                <tr>
                                    <th className="px-5 py-3 font-medium">氏名</th><th className="px-5 py-3 font-medium">企業</th><th className="px-5 py-3 font-medium">種類</th><th className="px-5 py-3 font-medium">期限</th><th className="px-5 py-3 font-medium">残り</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#ededed]">
                                {dashboardData.alerts.length === 0 ? (
                                    <tr><td colSpan={5} className="px-5 py-8 text-center text-[#878787]">アラートはありません。</td></tr>
                                ) : (
                                    dashboardData.alerts.map((alert: any) => (
                                        <tr key={alert.id} className={alert.daysLeft <= 30 ? 'bg-[#fff9f9]' : 'bg-[#fffcf0]/50'}>
                                            <td className={`px-5 py-3 font-bold ${alert.daysLeft <= 30 ? 'text-[#d93025]' : 'text-[#1f1f1f]'}`}>{alert.name}</td>
                                            <td className="px-5 py-3 text-[#444746]">{alert.company || '未配属'}</td>
                                            <td className="px-5 py-3"><span className="px-2 py-1 bg-white border border-[#ededed] text-[12px] rounded text-[#666666]">{alert.type}</span></td>
                                            <td className="px-5 py-3 text-[#444746] font-mono">{new Date(alert.expDate).toLocaleDateString('ja-JP')}</td>
                                            <td className={`px-5 py-3 font-bold ${alert.daysLeft <= 30 ? 'text-[#d93025]' : 'text-[#d97706]'}`}>あと{alert.daysLeft}日</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Nationalities Chart */}
                <div className="bg-white border border-[#ededed] rounded flex flex-col">
                    <div className="px-5 py-4 border-b border-[#ededed] bg-[#fbfcfd]">
                        <h3 className="font-bold text-[#1f1f1f] text-[14px]">国籍別分布</h3>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center gap-5">
                        {dashboardData.nationalities.length === 0 ? (
                            <div className="text-center text-[#878787] text-[13px] py-8">データがありません</div>
                        ) : (
                            dashboardData.nationalities.map((nat: any, index: number) => {
                                const colors = ['bg-[#24b47e]', 'bg-[#1a73e8]', 'bg-[#f59e0b]', 'bg-[#8b5cf6]']
                                return (
                                    <div key={nat.name}>
                                        <div className="flex justify-between text-[13px] mb-1.5"><span className="font-medium text-[#444746]">{nat.name}</span><span className="text-[#878787] font-mono">{nat.percentage}%</span></div>
                                        <div className="w-full bg-[#fbfcfd] h-2 rounded border border-[#ededed] overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${colors[index % colors.length]}`} style={{ width: `${nat.percentage}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* 5. OMNI-CHANNEL AI CHATBOT (GIỮ NGUYÊN) */}
            <div className="mt-8 bg-white border border-[#ededed] rounded shadow-sm relative overflow-hidden flex flex-col h-[400px]">
                <div className="px-6 py-4 border-b border-[#ededed] bg-[#fbfcfd] flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#24b47e]/10 flex items-center justify-center text-[#24b47e]"><Sparkles size={14} /></div>
                    <h3 className="font-bold text-[#1f1f1f] text-[14px]">KikanCloud AI アシスタント</h3>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-white/50">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-[#878787] opacity-60">
                            <Sparkles size={40} className="mb-4" />
                            <p className="text-[13px] font-bold">質問、翻訳、データ分析など、何でもサポートします。</p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded bg-[#24b47e] flex items-center justify-center shrink-0 mt-0.5"><Sparkles size={14} className="text-white" /></div>}
                            <div className={`max-w-[80%] rounded px-5 py-3.5 text-[14px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#1f1f1f] text-white rounded-tr-none' : 'bg-[#fbfcfd] border border-[#ededed] text-[#1f1f1f] rounded-tl-none'}`}>
                                {msg.isTyping ? <Loader2 size={16} className="animate-spin text-[#24b47e]" /> : <div className="whitespace-pre-wrap">{msg.text}</div>}
                            </div>
                            {msg.role === 'user' && <div className="w-8 h-8 rounded bg-white border border-[#ededed] flex items-center justify-center shrink-0 shadow-sm mt-0.5"><User size={14} className="text-[#878787]" /></div>}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-[#ededed] bg-white">
                    <form onSubmit={handleChat} className="relative flex items-center">
                        <textarea ref={chatInputRef} value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={handleKeyDown} disabled={isPendingChat} placeholder="AIに質問・指示を入力... (Shift+Enterで改行)" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:border-[#24b47e] rounded pl-4 pr-12 py-3 text-[14px] outline-none resize-none h-[46px] transition-colors" rows={1} />
                        <button type="submit" disabled={isPendingChat || !userInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#1f1f1f] hover:bg-[#24b47e] text-white rounded transition-colors disabled:opacity-50"><Send size={14} /></button>
                    </form>
                </div>
            </div>

        </div>
    )
}
