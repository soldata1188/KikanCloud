'use client'
import { useState, useEffect } from 'react'
import {
    ChevronRight, ClipboardList, ShieldCheck, GitMerge, Map, Route,
    MessageSquare, Users, Building2, Sparkles, Settings,
    Activity, MoreHorizontal
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
        <div className="max-w-[1400px] mx-auto space-y-12 pb-20 px-8 pt-8">

            {/* Greeting Section */}
            <div className="space-y-1">
                <h1 className="text-[28px] font-bold text-gray-900 leading-tight">
                    こんにちは、{userName}様
                </h1>
                <p className="text-[13px] text-gray-500 font-medium">
                    今日のおすすめのアクションと最近の活動です。
                </p>
            </div>

            {/* Quick Access Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-amber-500 fill-amber-500" size={16} />
                    <h2 className="text-[16px] font-bold text-gray-800">クイックアクセス</h2>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { id: "operations", name: "業務管理", href: "/operations", icon: <ClipboardList size={22} />, color: "bg-indigo-600" },
                        { id: "workers", name: "外国人材", href: "/workers", icon: <Users size={22} />, color: "bg-blue-600" },
                        { id: "companies", name: "受入企業", href: "/companies", icon: <Building2 size={22} />, color: "bg-emerald-600" },
                        { id: "audits", name: "監査・訪問", href: "/audits", icon: <ShieldCheck size={22} />, color: "bg-rose-600" },
                        { id: "workflows", name: "業務フロー", href: "/workflows", icon: <GitMerge size={22} />, color: "bg-orange-600" },
                        { id: "routing", name: "位置情報マップ", href: "/routing", icon: <Map size={22} />, color: "bg-cyan-600" },
                        { id: "roadmap", name: "制度ロードマップ", href: "/roadmap", icon: <Route size={22} />, color: "bg-violet-600" },
                        { id: "chat", name: "AIチャット", href: "/chat", icon: <Sparkles size={22} />, color: "bg-amber-600" },
                        { id: "b2b-chat", name: "企業連絡", href: "/b2b-chat", icon: <MessageSquare size={22} />, color: "bg-blue-500" },
                        { id: "settings", name: "設定", href: "/settings", icon: <Settings size={22} />, color: "bg-slate-500" },
                    ].map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center gap-4 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/0 to-gray-50/50 -rotate-45 translate-x-8 -translate-y-8" />
                            <div className={`w-14 h-14 rounded-2xl ${item.color} text-white flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-gray-200 group-hover:shadow-blue-200`}>
                                {item.icon}
                            </div>
                            <div className="space-y-1">
                                <span className="text-[13px] font-bold text-gray-800 group-hover:text-[#0067b8] transition-colors block leading-tight">
                                    {item.name}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Activity className="text-gray-400" size={16} />
                    <h2 className="text-[16px] font-bold text-gray-800 uppercase tracking-wider">最近の活動</h2>
                </div>

                <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {dashboardData.alerts.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 text-sm">現在、新しい活動はありません。</div>
                        ) : (
                            dashboardData.alerts.slice(0, 5).map((alert: any) => (
                                <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center border ${alert.daysLeft <= 30 ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                                            <ClipboardList size={18} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[14px] font-bold text-gray-900 group-hover:text-[#0067b8] transition-colors">{alert.type}: {alert.name}</p>
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-sm">
                                                    {alert.company}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-medium">{new Date(alert.expDate).toLocaleDateString()} • 期限まであと {alert.daysLeft} 日</p>
                                        </div>
                                    </div>
                                    <button className="text-gray-300 group-hover:text-gray-600 transition-colors">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-sm border border-gray-100 shadow-sm space-y-4 hover:border-blue-200 transition-colors">
                    <h3 className="text-[16px] font-bold text-gray-800">今月の巡回報告</h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed">
                        未提出の定期訪問報告書が <span className="text-orange-600 font-bold">4件</span> あります。期限内に作成してください。
                    </p>
                    <Link href="/audits" className="inline-flex items-center gap-2 text-[12px] font-bold text-[#0067b8] hover:underline pt-2 group">
                        報告書を作成する
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className={`p-8 rounded-sm border border-gray-100 bg-white shadow-sm space-y-4 hover:border-blue-200 transition-colors`}>
                    <h3 className="text-[16px] font-bold text-gray-800">新しい特定技能求人</h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed">
                        受入企業から新しい特定技能求人依頼が届いています。内容を確認してください。
                    </p>
                    <Link href="/operations" className="inline-flex items-center gap-2 text-[12px] font-bold text-[#0067b8] hover:underline pt-2 group">
                        本人を確認する
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

