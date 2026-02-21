'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, Sparkles, Briefcase, Building2, CalendarCheck, Landmark, Settings, CalendarDays } from 'lucide-react'
import { logout } from '@/app/login/actions'

export function Sidebar({ active }: { active?: 'dashboard' | 'workers' | 'companies' | 'audits' | 'procedures' | 'settings' | 'schedule' }) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <aside className={`${isExpanded ? 'w-[240px]' : 'w-[68px]'} flex flex-col items-center py-4 shrink-0 bg-[#e3e8ef] z-20 shadow-[1px_0_10px_rgba(0,0,0,0.02)] border-r border-[#e1e5ea]/50 transition-all duration-300 relative`}>
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-12 h-12 flex items-center justify-center rounded-[32px] hover:bg-black/5 transition-colors text-[#444746] mb-4 shrink-0"><Menu size={24} strokeWidth={1.5} /></button>

            <div className="flex flex-col gap-2 w-full px-2 overflow-y-auto overflow-x-hidden no-scrollbar">
                <Link href="/" className={`h-12 flex items-center ${isExpanded ? 'px-4 rounded-full justify-start' : 'justify-center w-12 rounded-[32px] mx-auto'} transition-colors ${active === 'dashboard' ? 'bg-[#e8def8] text-[#1d192b]' : 'hover:bg-black/5 text-[#444746]'}`} title={!isExpanded ? "ダッシュボード" : ""}>
                    <Sparkles size={20} className="shrink-0" strokeWidth={active === 'dashboard' ? 2 : 1.5} />
                    {isExpanded && <span className="ml-4 font-medium text-sm whitespace-nowrap">ダッシュボード</span>}
                </Link>
                <Link href="/schedule" className={`h-12 flex items-center ${isExpanded ? 'px-4 rounded-full justify-start' : 'justify-center w-12 rounded-[32px] mx-auto'} transition-colors ${active === 'schedule' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-black/5 text-[#444746]'}`} title={!isExpanded ? "スケジュール" : ""}>
                    <CalendarDays size={20} className="shrink-0" strokeWidth={active === 'schedule' ? 2 : 1.5} />
                    {isExpanded && <span className="ml-4 font-medium text-sm whitespace-nowrap">スケジュール</span>}
                </Link>
                <Link href="/workers" className={`h-12 flex items-center ${isExpanded ? 'px-4 rounded-full justify-start' : 'justify-center w-12 rounded-[32px] mx-auto'} transition-colors ${active === 'workers' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-black/5 text-[#444746]'}`} title={!isExpanded ? "外国人材管理" : ""}>
                    <Briefcase size={20} className="shrink-0" strokeWidth={active === 'workers' ? 2 : 1.5} />
                    {isExpanded && <span className="ml-4 font-medium text-sm whitespace-nowrap">外国人材管理</span>}
                </Link>
                <Link href="/companies" className={`h-12 flex items-center ${isExpanded ? 'px-4 rounded-full justify-start' : 'justify-center w-12 rounded-[32px] mx-auto'} transition-colors ${active === 'companies' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-black/5 text-[#444746]'}`} title={!isExpanded ? "受入企業管理" : ""}>
                    <Building2 size={20} className="shrink-0" strokeWidth={active === 'companies' ? 2 : 1.5} />
                    {isExpanded && <span className="ml-4 font-medium text-sm whitespace-nowrap">受入企業管理</span>}
                </Link>
                <Link href="/audits" className={`h-12 flex items-center ${isExpanded ? 'px-4 rounded-full justify-start' : 'justify-center w-12 rounded-[32px] mx-auto'} transition-colors ${active === 'audits' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-black/5 text-[#444746]'}`} title={!isExpanded ? "監査・定期訪問" : ""}>
                    <CalendarCheck size={20} className="shrink-0" strokeWidth={active === 'audits' ? 2 : 1.5} />
                    {isExpanded && <span className="ml-4 font-medium text-sm whitespace-nowrap">監査・定期訪問</span>}
                </Link>
                <Link href="/procedures" className={`h-12 flex items-center ${isExpanded ? 'px-4 rounded-full justify-start' : 'justify-center w-12 rounded-[32px] mx-auto'} transition-colors ${active === 'procedures' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-black/5 text-[#444746]'}`} title={!isExpanded ? "申請・手続管理" : ""}>
                    <Landmark size={20} className="shrink-0" strokeWidth={active === 'procedures' ? 2 : 1.5} />
                    {isExpanded && <span className="ml-4 font-medium text-sm whitespace-nowrap">申請・手続管理</span>}
                </Link>
            </div>

            <div className="mt-auto flex flex-col gap-4 w-full px-2">
                <form action={logout}>
                    <button type="submit" className={`h-12 flex items-center ${isExpanded ? 'px-4 rounded-full justify-start w-full' : 'justify-center w-12 rounded-[32px] mx-auto'} hover:bg-black/5 transition-colors text-[#444746]`} title={!isExpanded ? "ログアウト" : ""}>
                        <Settings size={22} className="shrink-0" strokeWidth={1.5} />
                        {isExpanded && <span className="ml-4 font-medium text-sm whitespace-nowrap">ログアウト</span>}
                    </button>
                </form>
            </div>
        </aside>
    )
}
