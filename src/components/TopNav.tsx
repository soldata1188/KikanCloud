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
        <header className="h-12 bg-[#0067b8] text-white flex items-center justify-between px-4 shrink-0 z-[100] shadow-sm sticky top-0">
            <div className="flex items-center gap-4">
                {/* Nút Hamburger chỉ hiện trên Mobile */}
                <button
                    className="md:hidden p-1 opacity-80 hover:opacity-100 transition-opacity"
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('toggle-sidebar'));
                    }}
                >
                    <i className="fas fa-bars text-lg"></i>
                </button>
                {/* Icon lưới chỉ hiện trên Desktop */}
                <i className="fas fa-th text-lg opacity-80 cursor-pointer hover:opacity-100 hidden md:block"></i>
                <span className="font-bold text-sm tracking-wide">Solution Cooperative</span>
            </div>

            <div className="flex items-center gap-6 text-sm font-medium relative z-10">
                <div className="hidden sm:block">
                    <GlobalSearch />
                </div>
                {/* User Avatar with Dropdown */}
                <div className="relative group/avatar">
                    <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs cursor-pointer shrink-0 border border-white/30 group-hover/avatar:scale-105 transition-all">
                        {role ? role.charAt(0).toUpperCase() : 'U'}
                    </div>

                    {/* Popover Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all duration-200 origin-top-right scale-95 group-hover/avatar:scale-100 z-[200]">
                        <div className="px-4 py-2 border-b border-slate-50 mb-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">現在のユーザー</p>
                            <p className="text-sm font-medium text-slate-700 truncate">{role || 'ユーザー'}</p>
                        </div>

                        <Link href="/settings" className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-600 transition-colors">
                            <Settings size={14} />
                            <span>設定</span>
                        </Link>

                        <button
                            onClick={async () => {
                                if (window.confirm('ログアウトしますか？')) {
                                    await logout();
                                }
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-red-50 text-red-600 transition-colors text-left"
                        >
                            <LogOut size={14} />
                            <span>ログアウト</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}