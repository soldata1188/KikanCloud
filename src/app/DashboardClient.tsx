'use client'
import { useState, useEffect } from 'react'
import {
    Bell, TrendingUp, ChevronRight,
    Activity, ClipboardList, ShieldCheck, GitMerge, Map, Route,
    MessageSquare, LayoutGrid, Users, Building2, PlaneLanding, UserMinus, MapPin,
    Sparkles, User
} from 'lucide-react'
import Link from 'next/link'


export default function DashboardClient({ userName, dashboardData }: { userName: string, dashboardData: any }) {
    const [currentTime, setCurrentTime] = useState<Date | null>(null)

    useEffect(() => {
        setCurrentTime(new Date())
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])


    const formatDate = (date: Date) => {
        const days = ['日', '月', '火', '水', '木', '金', '土']
        return `${date.getFullYear()}年 ${date.getMonth() + 1}月 ${date.getDate()}日 (${days[date.getDay()]})`
    }

    const formatTime = (date: Date) => {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    if (!currentTime) return null;

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 px-4 sm:px-6 lg:px-8">

            {/* Header Section: Original Mesh Gradient */}
            <div className="relative group overflow-hidden rounded-[32px] bg-slate-900 border border-slate-800">
                {/* Decorative Mesh Gradient Background */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] rounded-full bg-emerald-500/30 blur-[120px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] rounded-full bg-blue-500/20 blur-[120px]" />
                </div>

                <div className="relative p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="px-4 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-widest uppercase border border-emerald-500/20">KikanCloud Performance</span>
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
                            <Link href="/operations" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all duration-300 flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]">
                                <ClipboardList size={20} strokeWidth={3} />
                                業務管理を確認
                            </Link>
                        </div>
                    </div>

                    <div className="relative shrink-0 flex flex-col items-center">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full" />
                        <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[48px] flex flex-col items-center justify-center text-center">
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


            {/* Quick Navigation Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <LayoutGrid className="text-emerald-500" size={20} />
                        クイックアクセス
                    </h3>
                    <p className="text-slate-400 text-sm font-medium">主要機能へ素早く移動できます</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { name: "業務管理", href: "/operations", icon: <ClipboardList size={22} />, desc: "スケジュール・タスク", color: "emerald" },
                        { name: "実習生一覧", href: "/workers", icon: <Users size={22} />, desc: "データベース管理", color: "blue" },
                        { name: "受入企業一覧", href: "/companies", icon: <Building2 size={22} />, desc: "取引先・機関連係", color: "indigo" },
                        { name: "監査・訪問", href: "/audits", icon: <ShieldCheck size={22} />, desc: "法令遵守・巡回指導", color: "purple" },
                        { name: "業務フロー", href: "/workflows", icon: <GitMerge size={22} />, desc: "ステータス管理", color: "amber" },
                        { name: "ルート最適化", href: "/routing", icon: <Map size={22} />, desc: "訪問経路自動選定", color: "emerald" },
                        { name: "制度ロードマップ", href: "/roadmap", icon: <Route size={22} />, desc: "法改正・対応計画", color: "blue" },
                        { name: "AIチャット", href: "/chat", icon: <Sparkles size={22} />, desc: "コンプライアンス相談", color: "emerald" },
                        { name: "企業連絡", href: "/b2b-chat", icon: <MessageSquare size={22} />, desc: "ダイレクトメッセージ", color: "rose" },
                        { name: "システム設定", href: "/settings", icon: <User size={22} />, desc: "アカウント・権限設定", color: "slate" },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group relative bg-white p-5 rounded-[28px] transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3 border border-slate-200"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-transparent group-hover:border-current
                                ${item.color === 'emerald' ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' : ''}
                                ${item.color === 'blue' ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' : ''}
                                ${item.color === 'indigo' ? 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white' : ''}
                                ${item.color === 'purple' ? 'bg-purple-50 text-purple-500 group-hover:bg-purple-500 group-hover:text-white' : ''}
                                ${item.color === 'amber' ? 'bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white' : ''}
                                ${item.color === 'rose' ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' : ''}
                                ${item.color === 'slate' ? 'bg-slate-50 text-slate-500 group-hover:bg-slate-500 group-hover:text-white' : ''}
                            `}>
                                {item.icon}
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[14px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{item.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium leading-none">{item.desc}</p>
                            </div>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center">
                                    <ChevronRight size={14} className="text-white" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Core Metrics: Grid with ultra-thin borders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { label: '総実習生数', val: dashboardData.stats.totalWorkers, unit: '名', icon: <Users size={24} />, trend: '+4.2%', color: 'emerald' },
                    { label: '受入企業数', val: dashboardData.stats.totalCompanies, unit: '社', icon: <Building2 size={24} />, trend: '+1.5%', color: 'blue' },
                    { label: '入国対応中', val: dashboardData.stats.enteringWorkers, unit: '名', icon: <PlaneLanding size={24} />, trend: 'Stable', color: 'purple' },
                    { label: '失踪・帰国', val: dashboardData.stats.missingWorkers, unit: '名', icon: <UserMinus size={24} />, trend: '0.0%', color: 'rose' },
                ].map((stat) => (
                    <div key={stat.label} className="group relative bg-white p-8 rounded-[38px] transition-all duration-500 hover:-translate-y-1 border border-slate-200">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-50 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className="relative space-y-5">
                            <div className="flex justify-between items-start">
                                <div className={`p-4 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 border border-slate-100`}>
                                    {stat.icon}
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100`}>{stat.trend}</span>
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

                {/* Flat Alerts Table */}
                <div className="lg:col-span-3 bg-white rounded-[40px] overflow-hidden flex flex-col border border-slate-200">
                    <div className="p-8 flex items-center justify-between border-b border-slate-100">
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
                            <thead className="text-slate-400 text-[10px] uppercase tracking-widest font-extrabold border-b border-slate-100/50 bg-slate-50/30">
                                <tr>
                                    <th className="px-8 py-4">対象者</th>
                                    <th className="px-8 py-4">所属先</th>
                                    <th className="px-8 py-4 text-center">ステータス</th>
                                    <th className="px-8 py-4 text-right">残り日数</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
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
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors border border-slate-200">
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
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${alert.daysLeft <= 30 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
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

                {/* Flat Distribution Chart Card */}
                <div className="lg:col-span-2 bg-slate-900 rounded-[40px] p-8 flex flex-col space-y-8 border border-slate-800 shadow-sm">
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
                                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                                            <div className={`h-full rounded-full transition-all duration-1000 group-hover:brightness-125 ${colors[index % colors.length]}`} style={{ width: `${nat.percentage}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    <button className="w-full py-4 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest bg-white/5 rounded-2xl transition-all duration-300 hover:bg-white/10 border border-white/5">
                        全データを確認
                    </button>
                </div>

                {/* Flat Top Industries Table Card */}
                <div className="lg:col-span-full bg-white rounded-[40px] overflow-hidden flex flex-col border border-slate-200">
                    <div className="p-8 flex items-center justify-between border-b border-slate-100">
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
                            <thead className="text-slate-400 text-[10px] uppercase tracking-widest font-extrabold border-b border-slate-100/50 bg-slate-50/30">
                                <tr>
                                    <th className="px-8 py-4">職種区分 / Industry Field</th>
                                    <th className="px-8 py-4 text-right">実習生数</th>
                                    <th className="px-8 py-4 text-right">構成比</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
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
                                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block border border-slate-100">
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
        </div>
    )
}
