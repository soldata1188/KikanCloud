'use client'
import { useState } from 'react'
import { Grid3X3, Sparkles, LogOut, User, Settings } from 'lucide-react'
import AIChatSidebar from '@/components/ai/AIChatSidebar'
import { GlobalSearch } from './GlobalSearch'
import { logout } from '@/app/login/actions'
import Link from 'next/link'

export function TopNav({ title, role }: { title: string, role?: string }) {
    const [isAIChatOpen, setIsAIChatOpen] = useState(false)

    return (
        <>
            <header className="h-[42px] bg-white/70 backdrop-blur-md text-slate-900 flex items-center justify-between px-4 shrink-0 z-0 w-full border-b border-slate-200 sticky top-0">
                {/* Left: app icon + org name + current page */}
                <div className="flex items-center gap-3 relative z-10">
                    <span className="font-black text-[13px] tracking-tight hidden sm:block text-blue-600">KikanCloud</span>
                    <span className="text-gray-200 hidden sm:block text-xs font-light">/</span>
                    <span className="text-gray-900 font-bold text-[12px] hidden sm:block tracking-tight">{title || 'ホーム'}</span>
                </div>

                {/* Right: AI + サポート + avatar */}
                <div className="flex items-center gap-6 text-[12px] font-medium relative z-10">
                    <div className="hidden sm:block">
                        <GlobalSearch />
                    </div>
                    <button
                        onClick={() => setIsAIChatOpen(true)}
                        className="text-gray-600 hover:text-blue-600 transition-all flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100/80 border border-transparent hover:border-blue-200 group"
                        title="AIアシスタント"
                    >
                        <Sparkles size={14} className="text-gray-400 group-hover:text-blue-600 group-hover:animate-pulse" />
                        <span className="hidden md:block text-[10px] font-black uppercase tracking-wider">AI Assistant</span>
                    </button>

                    {/* User Avatar with Dropdown */}
                    <div className="relative group/avatar">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[11px] cursor-pointer shrink-0 border-2 border-white group-hover/avatar:scale-105 transition-all">
                            {role ? role.charAt(0).toUpperCase() : 'U'}
                        </div>

                        {/* Popover Dropdown */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all duration-200 origin-top-right scale-95 group-hover/avatar:scale-100 z-[200]">
                            <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signed in as</p>
                                <p className="text-[12px] font-bold text-slate-700 truncate">{role || 'User'}</p>
                            </div>

                            <Link href="/settings" className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-600 transition-colors">
                                <Settings size={14} />
                                <span>Settings</span>
                            </Link>

                            <button
                                onClick={async () => {
                                    if (window.confirm('Logout?')) {
                                        await logout();
                                    }
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-red-50 text-red-600 transition-colors text-left"
                            >
                                <LogOut size={14} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <AIChatSidebar isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
        </>
    )
}