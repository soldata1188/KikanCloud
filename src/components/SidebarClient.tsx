"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard, Users, Building2, ShieldCheck, GitMerge,
    Map, Sparkles, MessageSquare, ClipboardList, Route,
    MoreHorizontal, X, ChevronRight, Settings,
} from "lucide-react";
import { SidebarAvatar } from "./SidebarAvatar";

const ALL_NAV_ITEMS = [
    { id: "dashboard", name: "ホーム", href: "/", icon: LayoutDashboard },
    { id: "operations", name: "業務管理", href: "/operations", icon: ClipboardList },
    { id: "workers", name: "外国人材", href: "/workers", icon: Users },
    { id: "companies", name: "受入企業", href: "/companies", icon: Building2 },
    { id: "audits", name: "監査・訪問", href: "/audits", icon: ShieldCheck },
    { id: "workflows", name: "業務フロー", href: "/workflows", icon: GitMerge },
    { id: "routing", name: "位置情報マップ", href: "/routing", icon: Map },
    { id: "roadmap", name: "制度ロードマップ", href: "/roadmap", icon: Route },
    { id: "chat", name: "AIチャット", href: "/chat", icon: Sparkles },
    { id: "b2b-chat", name: "企業連絡", href: "/b2b-chat", icon: MessageSquare },
];

const BOTTOM_PRIMARY = ["dashboard", "workers", "companies", "operations"];

interface SidebarClientProps {
    active: string;
    userRole: string;
    userProfile: { full_name?: string; avatar_url?: string } | null;
}

export function SidebarClient({ active, userRole, userProfile }: SidebarClientProps) {
    const [moreOpen, setMoreOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => { setMoreOpen(false); }, [pathname]);

    const primaryItems = ALL_NAV_ITEMS.filter(i => BOTTOM_PRIMARY.includes(i.id));
    const moreItems = ALL_NAV_ITEMS.filter(i => !BOTTOM_PRIMARY.includes(i.id));

    return (
        <>
            {/* ══════════════════════════════════════════════════
                DESKTOP SIDEBAR — Tech-Infused Enterprise Theme
            ══════════════════════════════════════════════════ */}
            <aside className="hidden md:flex w-52 shrink-0 h-full flex-col bg-[#00213d] border-r border-[#00335c] overflow-y-auto relative shadow-2xl">
                {/* Tech Pattern Overlay - High Visibility (White) */}
                <div className="absolute inset-0 pointer-events-none opacity-15"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />

                {/* User / Org header */}
                <Link href="/settings" className="p-5 block hover:bg-[#00315c] transition-all border-b border-[#00335c] group relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0067b8] text-white flex items-center justify-center text-[13px] font-bold shadow-lg shrink-0 border-2 border-[#00335c] group-hover:scale-105 transition-transform">
                            {userProfile?.full_name?.charAt(0) || "SC"}
                        </div>
                        <div className="min-w-0">
                            <div className="font-bold text-[14px] text-white truncate group-hover:text-blue-300 transition-colors">
                                {userProfile?.full_name || "ソリューション協同組合"}
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Nav */}
                <nav className="flex-1 py-4 px-2.5 space-y-1 relative z-10">
                    {ALL_NAV_ITEMS.map((item) => {
                        const isActive = active === item.id;
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}
                                className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-md text-[13px] transition-all duration-200
                                    ${isActive
                                        ? 'bg-[#0067b8] text-white shadow-lg shadow-blue-900/40 font-bold border border-white/10'
                                        : 'text-blue-100/60 font-medium hover:bg-[#00315c] hover:text-white'}`}
                            >
                                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-blue-400 group-hover:text-blue-200'}`} />
                                <span>{item.name}</span>
                                {isActive && (
                                    <div className="absolute right-2 w-1 h-3 bg-white/40 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* ══════════════════════════════════════════════════
                MOBILE BOTTOM NAV BAR
            ══════════════════════════════════════════════════ */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[200] bg-white border-t border-gray-200"
                style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="flex items-stretch justify-around h-14">
                    {primaryItems.map(item => {
                        const isActive = active === item.id;
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}
                                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 flex-1
                                    ${isActive ? 'text-[#0067b8]' : 'text-gray-400 hover:text-gray-600'}`}>
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-[9px] font-bold truncate ${isActive ? 'text-[#0067b8]' : 'text-gray-400'}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                    <button onClick={() => setMoreOpen(true)}
                        className={`flex flex-col items-center justify-center gap-0.5 py-2 flex-1 ${moreOpen ? 'text-[#0067b8]' : 'text-gray-400'}`}>
                        <MoreHorizontal size={20} strokeWidth={2} />
                        <span className="text-[9px] font-bold text-gray-400">もっと</span>
                    </button>
                </div>
            </nav>

            {/* ── Mobile More drawer ──────────────────────────── */}
            {moreOpen && (
                <div className="md:hidden fixed inset-0 z-[300] bg-black/30 backdrop-blur-sm"
                    onClick={() => setMoreOpen(false)} />
            )}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[400] bg-white rounded-t-2xl transition-transform duration-300 ease-out
                ${moreOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>
                <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <SidebarAvatar userProfile={userProfile} />
                        <div>
                            <p className="text-[13px] font-bold text-gray-800">{userProfile?.full_name || 'User'}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{userRole}</p>
                        </div>
                    </div>
                    <button onClick={() => setMoreOpen(false)}
                        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all">
                        <X size={15} />
                    </button>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                    {moreItems.map(item => {
                        const isActive = active === item.id;
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}
                                className={`flex items-center gap-3 p-3 rounded-sm border transition-all
                                    ${isActive
                                        ? 'bg-[#0067b8] text-white border-[#0067b8]'
                                        : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-gray-100'}`}>
                                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[12px] font-bold leading-tight">{item.name}</span>
                                {!isActive && <ChevronRight size={11} className="ml-auto text-gray-300" />}
                            </Link>
                        );
                    })}
                </div>
                <div className="h-4" />
            </div>
        </>
    );
}
