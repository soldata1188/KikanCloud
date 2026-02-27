"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard, Users, Building2, ShieldCheck, GitMerge,
    Map, Sparkles, MessageSquare, ClipboardList, Route,
    MoreHorizontal, X, ChevronRight, Settings,
} from "lucide-react";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarAvatar } from "./SidebarAvatar";

// ── Nav item definitions ────────────────────────────────────────
const ALL_NAV_ITEMS = [
    { id: "dashboard", name: "ホーム", href: "/", icon: LayoutDashboard },
    { id: "operations", name: "業務管理", href: "/operations", icon: ClipboardList },
    { id: "workers", name: "実習生一覧", href: "/workers", icon: Users },
    { id: "companies", name: "受入企業一覧", href: "/companies", icon: Building2 },
    { id: "audits", name: "監査・訪問", href: "/audits", icon: ShieldCheck },
    { id: "workflows", name: "業務フロー", href: "/workflows", icon: GitMerge },
    { id: "routing", name: "ルート最適化", href: "/routing", icon: Map },
    { id: "roadmap", name: "制度ロードマップ", href: "/roadmap", icon: Route },
    { id: "chat", name: "AIチャット", href: "/chat", icon: Sparkles },
    { id: "b2b-chat", name: "企業連絡", href: "/b2b-chat", icon: MessageSquare },
    { id: "settings", name: "システム設定", href: "/settings", icon: Settings },
];

// Bottom bar shows 4 primary items + "More" button
const BOTTOM_PRIMARY = ["dashboard", "workers", "companies", "operations"];

interface SidebarClientProps {
    active: string;
    userRole: string;
    userProfile: { full_name?: string; avatar_url?: string } | null;
}

export function SidebarClient({ active, userRole, userProfile }: SidebarClientProps) {
    // Desktop sidebar
    const [isHovered, setIsHovered] = useState(false);
    // Mobile More drawer
    const [moreOpen, setMoreOpen] = useState(false);
    const pathname = usePathname();

    // Close drawer on route change
    useEffect(() => { setMoreOpen(false); }, [pathname]);

    const primaryItems = ALL_NAV_ITEMS.filter(i => BOTTOM_PRIMARY.includes(i.id));
    const moreItems = ALL_NAV_ITEMS.filter(i => !BOTTOM_PRIMARY.includes(i.id));

    return (
        <>
            {/* ══════════════════════════════════════════════════
                DESKTOP SIDEBAR (hidden on mobile)
            ══════════════════════════════════════════════════ */}
            <div
                className="hidden md:block w-[72px] shrink-0 h-screen relative z-[100]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <aside className={`absolute top-0 left-0 h-full bg-[#f1f5f9] border-r border-slate-200 flex flex-col pt-4 pb-6 transition-all duration-300 ease-in-out ${isHovered ? 'w-[280px]' : 'w-[72px]'}`}>
                    {/* Avatar / User */}
                    <div className={`w-full flex items-center mb-10 transition-all duration-300 ${isHovered ? 'justify-start px-5' : 'justify-center'}`}>
                        <div className="shrink-0 w-11 h-11 flex items-center justify-center">
                            <SidebarAvatar userProfile={userProfile} />
                        </div>
                        {isHovered && (
                            <div className="ml-3 flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-sm font-bold text-[#1f1f1f] truncate">
                                    {userProfile?.full_name || "Guest User"}
                                </span>
                                <span className="text-[10px] text-[#737373] font-medium uppercase tracking-wider">
                                    {userRole || "Administrator"}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 flex flex-col gap-2 w-full px-0 overflow-y-auto no-scrollbar items-center">
                        {ALL_NAV_ITEMS.map((item) => {
                            const isActive = active === item.id;
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href}
                                    className={`group relative flex items-center h-11 transition-all duration-300 rounded-full
                                        ${isHovered ? 'w-[calc(100%-24px)] px-4' : 'w-14 justify-center'}
                                        ${isActive ? 'bg-[#24b47e] text-white shadow-[0_8px_20px_rgba(36,180,126,0.3)]'
                                            : 'hover:bg-black/5 text-[#737373] hover:text-[#1f1f1f]'}`}
                                >
                                    <div className={`flex items-center justify-center shrink-0 transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                                        <Icon strokeWidth={isActive ? 2.5 : 2} className="w-[20px] h-[20px]" />
                                    </div>
                                    {isHovered && (
                                        <span className="ml-3 text-[14px] font-bold whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                                            {item.name}
                                        </span>
                                    )}
                                    {!isHovered && (
                                        <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap z-[110] shadow-sm pointer-events-none">
                                            {item.name}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>
            </div>

            {/* ══════════════════════════════════════════════════
                MOBILE BOTTOM NAV BAR (hidden on md+)
            ══════════════════════════════════════════════════ */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[200] bg-white border-t border-slate-200"
                style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="flex items-stretch justify-around h-16">
                    {primaryItems.map(item => {
                        const isActive = active === item.id;
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}
                                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-full transition-all duration-200 min-w-0 flex-1
                                    ${isActive ? 'text-[#24b47e]' : 'text-slate-400 hover:text-slate-600'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-[#24b47e]/10 shadow-inner shadow-emerald-500/10' : ''}`}>
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`text-[9px] font-bold truncate ${isActive ? 'text-[#24b47e]' : 'text-slate-400'}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}

                    {/* More button */}
                    <button onClick={() => setMoreOpen(true)}
                        className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200 flex-1 ${moreOpen ? 'text-[#24b47e]' : 'text-slate-400 active:text-slate-600'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${moreOpen ? 'bg-[#24b47e]/10 shadow-inner shadow-emerald-500/10' : ''}`}>
                            <MoreHorizontal size={21} strokeWidth={2} />
                        </div>
                        <span className="text-[9px] font-bold tracking-tight text-slate-400">もっと</span>
                    </button>
                </div>
            </nav>

            {/* ══════════════════════════════════════════════════
                MOBILE: Slide-up "More" drawer
            ══════════════════════════════════════════════════ */}
            {/* Backdrop */}
            {moreOpen && (
                <div className="md:hidden fixed inset-0 z-[300] bg-black/30 backdrop-blur-sm"
                    onClick={() => setMoreOpen(false)}
                />
            )}
            {/* Drawer */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[400] bg-white rounded-t-3xl transition-transform duration-300 ease-out
                ${moreOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.12)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-slate-200 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <SidebarAvatar userProfile={userProfile} />
                        <div>
                            <p className="text-[13px] font-bold text-slate-800">{userProfile?.full_name || 'User'}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{userRole}</p>
                        </div>
                    </div>
                    <button onClick={() => setMoreOpen(false)}
                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 shadow-sm transition-all">
                        <X size={16} />
                    </button>
                </div>

                {/* More nav items */}
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                    {moreItems.map(item => {
                        const isActive = active === item.id;
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}
                                className={`flex items-center gap-3 p-4 rounded-[32px] border transition-all
                                    ${isActive
                                        ? 'bg-[#24b47e] text-white border-[#24b47e] shadow-lg shadow-emerald-500/25'
                                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200 hover:bg-slate-100'}`}>
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[12px] font-bold leading-tight">{item.name}</span>
                                {!isActive && <ChevronRight size={12} className="ml-auto text-slate-300" />}
                            </Link>
                        );
                    })}
                </div>

                {/* Extra padding so content clears bottom bar */}
                <div className="h-4" />
            </div>
        </>
    );
}
