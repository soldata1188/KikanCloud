'use client'
import { useState, useEffect } from 'react'
import {
    ChevronRight, ClipboardList, ShieldCheck, Map, Route,
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
        <div className="w-full h-full space-y-8 pb-20 px-8 pt-8 anim-page overflow-y-auto thin-scrollbar bg-white">

            {/* Header Area */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-normal text-gray-950 tracking-tight">
                    ホーム
                </h1>
                <p className="text-sm text-gray-500 font-normal">
                    こんにちは、{userName}様。本日のアクションと最近の活動を確認しましょう。
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Quick Access Card */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="app-card overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="text-emerald-600" size={18} />
                                <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">クイックアクセス</h2>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={18} /></button>
                        </div>

                        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { id: "operations", name: "業務管理", href: "/operations", icon: <ClipboardList size={22} /> },
                                { id: "workers", name: "外国人材", href: "/workers", icon: <Users size={22} /> },
                                { id: "companies", name: "受入企業", href: "/companies", icon: <Building2 size={22} /> },
                                { id: "audits", name: "監査・訪問", href: "/audits", icon: <ShieldCheck size={22} /> },
                                { id: "routing", name: "位置情報マップ", href: "/routing", icon: <Map size={22} /> },
                                { id: "settings", name: "システム設定", href: "/settings", icon: <Settings size={22} /> },
                            ].map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="p-4 rounded-xl hover:bg-emerald-50 transition-all duration-300 flex flex-col items-center text-center gap-3 group border border-transparent hover:border-emerald-100 shadow-sm hover:shadow-md hover:-translate-y-1"
                                >
                                    <div className={`w-14 h-14 rounded-2xl bg-white text-emerald-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border border-gray-100 group-hover:border-emerald-200`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[12px] font-bold text-gray-950 leading-tight uppercase tracking-tight">
                                        {item.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Secondary Actions Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="app-card p-6 space-y-4 hover:shadow-md transition-shadow group border-l-4 border-l-orange-500">
                            <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">今月の巡回報告</h3>
                            <p className="text-sm text-gray-500 leading-relaxed font-normal">
                                未提出の定期訪問報告書が <span className="text-orange-600 font-normal underline">4件</span> あります。
                            </p>
                            <Link href="/audits" className="inline-flex items-center gap-2 text-sm font-normal text-emerald-600 hover:text-emerald-700 pt-2">
                                報告書を作成する
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="app-card p-6 space-y-4 hover:shadow-md transition-shadow group border-l-4 border-l-emerald-600">
                            <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">特定技能求人</h3>
                            <p className="text-sm text-gray-500 leading-relaxed font-normal">
                                新しい特定技能求人依頼が届いています。内容を確認してください。
                            </p>
                            <Link href="/operations" className="inline-flex items-center gap-2 text-sm font-normal text-emerald-600 hover:text-emerald-700 pt-2">
                                詳細を確認
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Column - Secondary Info Card */}
                <div className="space-y-8">
                    <section className="app-card overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
                            <Activity className="text-gray-400" size={18} />
                            <h2 className="text-base font-bold text-gray-900">最近の活動</h2>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {(!dashboardData?.alerts || dashboardData.alerts.length === 0) ? (
                                <div className="py-12 text-center text-gray-400 text-sm">新しい活動はありません。</div>
                            ) : (
                                dashboardData.alerts.slice(0, 5).map((alert: any) => (
                                    <div key={alert.id} className="p-4 hover:bg-emerald-50/20 transition-colors group cursor-pointer">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${alert.daysLeft <= 30 ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`} />
                                            <div className="space-y-1 flex-1">
                                                <p className="text-sm font-normal text-gray-900 group-hover:text-emerald-600 transition-colors leading-snug">
                                                    {alert.type}: {alert.name}
                                                </p>
                                                <p className="text-[11px] text-gray-400 font-normal uppercase tracking-wider">
                                                    {alert.company || '企業不明'} • 期限まで {alert.daysLeft} 日
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <Link href="/operations" className="block text-center py-4 text-xs font-normal text-gray-400 hover:text-emerald-600 transition-colors border-t border-gray-50 uppercase tracking-widest">
                            すべての活動を見る
                        </Link>
                    </section>

                </div>
            </div>
        </div>
    )
}
