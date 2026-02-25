'use client'
import { useState, useEffect, useTransition, useRef } from 'react'
import { Sparkles, ArrowUp, Loader2, MapPin, User, Users, Building2, PlaneLanding, UserMinus, Bell, TrendingUp, ChevronRight, Activity, ClipboardList } from 'lucide-react'
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
        let initialGreeting = 'お疲れ様です。エグゼクティブ・アシスタントとして、本日の業務を全力でサポートいたします。'
        if (h >= 5 && h < 11) initialGreeting = 'おはようございます。洗練された一日となりますよう、サポートを開始いたします。'
        else if (h >= 11 && h < 17) initialGreeting = 'お疲れ様です。午後の重要案件に向けた準備を整えましょう。'
        setMessages([{ id: 'msg-0', role: 'model', text: initialGreeting }])

        return () => clearInterval(timer)
    }, [])

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

    const formatDate = (date: Date) => {
        const days = ['日', '月', '火', '水', '木', '金', '土']
        return `${date.getFullYear()}年 ${date.getMonth() + 1}月 ${date.getDate()}日 (${days[date.getDay()]})`
    }

    const formatTime = (date: Date) => {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
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

    if (!currentTime) return null;

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 px-4 sm:px-6 lg:px-8">

            {/* Header Section: Original Mesh Gradient */}
            <div className="relative group overflow-hidden rounded-[32px] bg-slate-900 border border-white/5 shadow-2xl">
                {/* Decorative Mesh Gradient Background */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] rounded-full bg-emerald-500/30 blur-[120px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] rounded-full bg-blue-500/20 blur-[120px]" />
                </div>

                <div className="relative p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase">KikanCloud Performance</span>
                            <div className="h-1 w-1 rounded-full bg-white/20" />
                            <span className="text-white/40 text-xs font-medium">{formatDate(currentTime)}</span>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-4xl lg:text-6xl font-light text-white leading-tight tracking-tight">
                                <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">{userName}</span> 様、
                                <br />本日の業務概要です
                            </h1>
                            <p className="text-white/50 text-lg max-w-2xl font-light leading-relaxed">
                                信頼と革新のパートナーとして、あなたの意思決定を高度なAI技術で支えます。
                                現時点で <span className="text-emerald-400 font-semibold underline decoration-emerald-400/30 underline-offset-4">{dashboardData.alerts.length}件</span> の優先事項があります。
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2">
                            <Link href="/operations" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all duration-300 flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]">
                                <ClipboardList size={20} strokeWidth={3} />
                                業務管理を確認
                            </Link>
                            <button onClick={() => chatInputRef.current?.focus()} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all duration-300 flex items-center gap-3 border border-white/10 backdrop-blur-md">
                                <Sparkles size={20} className="text-emerald-400" />
                                AIへ状況を確認
                            </button>
                        </div>
                    </div>

                    <div className="relative shrink-0 flex flex-col items-center">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full" />
                        <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[48px] shadow-2xl flex flex-col items-center justify-center text-center">
                            <h2 className="text-7xl font-bold text-white tracking-tighter tabular-nums drop-shadow-lg">{formatTime(currentTime)}</h2>
                            <div className="h-px w-12 bg-white/20 my-6" />
                            <div className="space-y-1">
                                <p className="text-white/60 text-sm font-medium flex items-center justify-center gap-2">
                                    <MapPin size={14} className="text-emerald-400" /> Sakai, Osaka
                                </p>
                                <p className="text-white/40 text-[11px] tracking-widest uppercase font-bold">Local Time</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Metrics: White Luxury Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { label: '総実習生数', val: dashboardData.stats.totalWorkers, unit: '名', icon: <Users size={24} />, trend: '+4.2%', color: 'emerald' },
                    { label: '受入企業数', val: dashboardData.stats.totalCompanies, unit: '社', icon: <Building2 size={24} />, trend: '+1.5%', color: 'blue' },
                    { label: '入国対応中', val: dashboardData.stats.enteringWorkers, unit: '名', icon: <PlaneLanding size={24} />, trend: 'Stable', color: 'purple' },
                    { label: '失踪・帰国', val: dashboardData.stats.missingWorkers, unit: '名', icon: <UserMinus size={24} />, trend: '0.0%', color: 'rose' },
                ].map((stat) => (
                    <div key={stat.label} className="group relative bg-white border border-slate-200 p-8 rounded-[38px] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-50 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className="relative space-y-5">
                            <div className="flex justify-between items-start">
                                <div className={`p-4 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300`}>
                                    {stat.icon}
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-600`}>{stat.trend}</span>
                            </div>
                            <div>
                                <h3 className="text-4xl font-extrabold text-slate-900 flex items-baseline gap-1">
                                    {stat.val}<span className="text-sm font-medium text-slate-400">{stat.unit}</span>
                                </h3>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1.5">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Center */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                {/* Premium Alerts Table */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                <Bell className="text-emerald-500" size={20} />
                                優先対応事項
                            </h3>
                            <p className="text-slate-400 text-sm">更新期限が迫っている重要な書類をリストアップしています</p>
                        </div>
                        <Link href="/operations" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                            詳細を見る <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest font-extrabold">
                                <tr>
                                    <th className="px-8 py-4">対象者</th>
                                    <th className="px-8 py-4">所属先</th>
                                    <th className="px-8 py-4 text-center">ステータス</th>
                                    <th className="px-8 py-4 text-right">残り日数</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {dashboardData.alerts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <Activity size={40} />
                                                <p className="text-sm font-bold">すべての要件はクリアされています</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    dashboardData.alerts.slice(0, 5).map((alert: any) => (
                                        <tr key={alert.id} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                        {alert.name.charAt(0)}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{alert.name}</p>
                                                        <p className="text-[11px] text-slate-400 uppercase font-bold tracking-tighter">{alert.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm text-slate-600">{alert.company || '未配属'}</p>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${alert.daysLeft <= 30 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    Critical
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="space-y-0.5">
                                                    <p className={`text-base font-black ${alert.daysLeft <= 30 ? 'text-rose-600' : 'text-amber-600'}`}>{alert.daysLeft}d</p>
                                                    <p className="text-[10px] text-slate-400 font-medium font-mono">{new Date(alert.expDate).toLocaleDateString('ja-JP')}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Distribution Chart Card */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[40px] shadow-2xl p-8 flex flex-col space-y-8">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <TrendingUp className="text-emerald-400" size={20} />
                            国籍別分布
                        </h3>
                        <p className="text-white/40 text-sm font-light leading-relaxed">多様性は我々の強みです。現在の主要な国籍分布状況を示します。</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-8">
                        {dashboardData.nationalities.length === 0 ? (
                            <div className="text-center text-white/20 text-sm py-12">No data recorded</div>
                        ) : (
                            dashboardData.nationalities.map((nat: any, index: number) => {
                                const colors = ['bg-emerald-400', 'bg-blue-400', 'bg-amber-400', 'bg-purple-400']
                                return (
                                    <div key={nat.name} className="group cursor-default">
                                        <div className="flex justify-between items-end mb-3">
                                            <div className="space-y-0.5">
                                                <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest group-hover:text-white transition-colors">National Group</span>
                                                <p className="text-white font-bold text-base">{nat.name}</p>
                                            </div>
                                            <div className="flex items-center gap-3 transition-transform group-hover:scale-105 origin-right">
                                                <div className="text-right">
                                                    <span className="block text-2xl font-black text-white leading-none">{nat.percentage}<span className="text-xs font-medium text-white/30 ml-0.5">%</span></span>
                                                    <span className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-tighter">{nat.count} 名</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-white/5 h-1.5 rounded-full border border-white/5 overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 group-hover:brightness-125 ${colors[index % colors.length]}`} style={{ width: `${nat.percentage}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    <button className="w-full py-4 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest border border-white/10 rounded-2xl transition-all duration-300 hover:bg-white/5">
                        全データを確認
                    </button>
                </div>

                {/* Top Industries Table Card */}
                <div className="lg:col-span-full bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                <Activity className="text-blue-500" size={20} />
                                主要職種トップ5
                            </h3>
                            <p className="text-slate-400 text-sm">現在稼働している上位5つの職種区分です</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest font-extrabold">
                                <tr>
                                    <th className="px-8 py-4">職種区分 / Industry Field</th>
                                    <th className="px-8 py-4 text-right">実習生数</th>
                                    <th className="px-8 py-4 text-right">構成比</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {dashboardData.industries.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-12 text-center text-slate-300 font-medium">職種データがありません</td>
                                    </tr>
                                ) : (
                                    dashboardData.industries.map((ind: any, idx: number) => (
                                        <tr key={ind.name} className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <span className="w-6 text-xs font-black text-slate-200 group-hover:text-blue-500 transition-colors">0{idx + 1}</span>
                                                    <span className="text-sm font-bold text-slate-700">{ind.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-slate-900">{ind.count} <span className="text-[10px] text-slate-400 font-medium">名</span></td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className="text-xs font-bold text-slate-500">{Math.round((ind.count / (dashboardData.stats.totalWorkers || 1)) * 100)}%</span>
                                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(ind.count / (dashboardData.stats.totalWorkers || 1)) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* AI Assistant: Executive Intelligence AI */}
            <div className="group relative bg-white border border-slate-200 rounded-[48px] shadow-2xl overflow-hidden flex flex-col h-[500px] transform hover:-translate-y-1 transition-all duration-500">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-blue-500" />

                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[22px] bg-slate-900 flex items-center justify-center text-emerald-400 shadow-xl group-hover:rotate-12 transition-transform duration-500">
                            <Sparkles size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-lg tracking-tight">Executive Intelligence AI</h3>
                            <p className="text-emerald-600 text-[11px] font-black uppercase tracking-[0.2em]">Always at your command</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-white custom-scrollbar bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] [background-position:0_0]">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
                            {msg.role === 'model' && (
                                <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-lg">
                                    <Sparkles size={18} className="text-emerald-400" />
                                </div>
                            )}
                            <div className={`max-w-[85%] rounded-[30px] px-6 py-4 text-sm leading-relaxed shadow-sm border ${msg.role === 'user' ? 'bg-emerald-500 text-white border-emerald-400 rounded-tr-none font-medium' : 'bg-white border-slate-100 text-slate-800 rounded-tl-none font-medium'}`}>
                                {msg.isTyping ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : <div className="whitespace-pre-wrap">{msg.text}</div>}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-md">
                                    <User size={18} className="text-slate-400" />
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100">
                    <form onSubmit={handleChat} className="relative flex items-center">
                        <textarea
                            ref={chatInputRef}
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                            disabled={isPendingChat}
                            placeholder="AIエグゼクティブ・アシスタントに要件を指令..."
                            className="w-full bg-white border-none focus:ring-0 rounded-[28px] pl-6 pr-14 py-4 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.05)] outline-none resize-none h-[56px] overflow-hidden transition-all placeholder:text-slate-300 font-medium"
                            rows={1}
                        />
                        <button type="submit" disabled={isPendingChat || !userInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-slate-900 hover:bg-emerald-500 hover:scale-105 active:scale-95 text-white rounded-2xl transition-all shadow-xl disabled:opacity-50">
                            <ArrowUp size={20} strokeWidth={3} />
                        </button>
                    </form>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    )
}
