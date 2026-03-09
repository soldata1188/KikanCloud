"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard, Users, Building2, ShieldCheck,
    Map, Sparkles, ClipboardList,
    Settings, LogOut, X, ChevronRight
} from "lucide-react";
import { logout } from "@/app/login/actions";
import { SidebarAvatar } from "./SidebarAvatar";

/* ─────────────────────────────────────────────
   NAV CONFIG
   ───────────────────────────────────────────── */
const ALL_NAV_ITEMS = [
    { id: "dashboard", name: "ホーム", href: "/", icon: LayoutDashboard },
    { id: "operations", name: "業務管理", href: "/operations", icon: ClipboardList },
    { id: "workers", name: "外国人材", href: "/workers", icon: Users },
    { id: "companies", name: "受入企業", href: "/companies", icon: Building2 },
    { id: "audits", name: "監査・訪問", href: "/audits", icon: ShieldCheck },
    { id: "routing", name: "位置情報マップ", href: "/routing", icon: Map },
    { id: "chat", name: "AIチャット", href: "/chat", icon: Sparkles },
];

const BOTTOM_PRIMARY = ["workers", "routing", "companies"];

interface SidebarClientProps {
    active: string;
    userRole: string;
    userProfile: { full_name?: string; avatar_url?: string } | null;
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export function SidebarClient({ active, userRole, userProfile }: SidebarClientProps) {
    const [expanded, setExpanded] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const pathname = usePathname();
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { setMoreOpen(false); }, [pathname]);

    /* Hover handlers — delay close to prevent flicker */
    const handleMouseEnter = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setExpanded(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        closeTimer.current = setTimeout(() => setExpanded(false), 80);
    }, []);

    const orgInitial = userProfile?.full_name?.charAt(0) ?? "K";

    const primaryItems = ALL_NAV_ITEMS.filter(i => BOTTOM_PRIMARY.includes(i.id));
    const moreItems = ALL_NAV_ITEMS.filter(i => !BOTTOM_PRIMARY.includes(i.id));

    return (
        <>
            {/* ══════════════════════════════════════════════════
                DESKTOP — Icon Rail + Hover Overlay Panel
            ══════════════════════════════════════════════════ */}
            <div
                className="hidden md:block"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* ── Rail (56px, always visible) ─────────────── */}
                <aside
                    className="hidden md:flex w-14 shrink-0 h-full flex-col items-center py-3 gap-1 relative z-[100]"
                    style={{
                        background: "linear-gradient(180deg, #1e3a5f 0%, #0f2645 100%)",
                        borderRight: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    {/* Org avatar */}
                    <Link
                        href="/settings"
                        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 shrink-0 transition-all duration-200 hover:scale-105"
                        style={{
                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            boxShadow: "0 2px 8px rgba(59,130,246,0.4)",
                        }}
                        title="設定"
                    >
                        <span className="text-white font-black text-[13px]">{orgInitial}</span>
                    </Link>

                    {/* Nav icons */}
                    <div className="flex-1 flex flex-col gap-0.5 w-full px-2">
                        {ALL_NAV_ITEMS.map((item) => {
                            const isActive = active === item.id;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative flex items-center justify-center w-full h-12 rounded-lg transition-all duration-150 group"
                                    style={{
                                        background: isActive
                                            ? "rgba(96,165,250,0.18)"
                                            : "transparent",
                                    }}
                                    title={item.name}
                                >
                                    {/* Active indicator bar */}
                                    {isActive && (
                                        <span
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                                            style={{ background: "#60a5fa" }}
                                        />
                                    )}
                                    <Icon
                                        size={20}
                                        strokeWidth={isActive ? 2.5 : 1.8}
                                        style={{
                                            color: isActive
                                                ? "#93c5fd"
                                                : "rgba(255,255,255,0.45)",
                                            transition: "color 150ms",
                                        }}
                                        className="group-hover:!text-white/80"
                                    />
                                </Link>
                            );
                        })}
                    </div>

                    {/* Bottom: Settings */}
                    <div className="flex flex-col gap-0.5 px-2 w-full pb-1">
                        <Link
                            href="/settings"
                            className="flex items-center justify-center w-full h-12 rounded-lg transition-all duration-150 hover:bg-white/10"
                            title="設定"
                        >
                            <Settings size={19} strokeWidth={1.8} style={{ color: "rgba(255,255,255,0.35)" }} className="hover:!text-white/70" />
                        </Link>
                        <button
                            onClick={async () => {
                                if (window.confirm("ログアウトしますか？")) await logout();
                            }}
                            className="flex items-center justify-center w-full h-12 rounded-lg transition-all duration-150 hover:bg-red-500/20 group"
                            title="ログアウト"
                        >
                            <LogOut size={19} strokeWidth={1.8} style={{ color: "rgba(255,255,255,0.35)" }} className="group-hover:!text-red-400" />
                        </button>
                    </div>
                </aside>

                {/* ── Expanded Flyout Panel (glassmorphism) ───── */}
                <div
                    className="hidden md:block fixed top-0 left-14 h-full z-[99] w-[160px] transition-all duration-200 ease-out"
                    style={{
                        opacity: expanded ? 1 : 0,
                        transform: expanded ? "translateX(0)" : "translateX(-8px)",
                        pointerEvents: expanded ? "auto" : "none",
                        background: "rgba(255,255,255,0.92)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        borderRight: "1px solid rgba(148,163,184,0.25)",
                        boxShadow: "8px 0 32px rgba(15,38,69,0.12)",
                    }}
                >
                    {/* Panel header */}
                    <div className="px-4 py-4 border-b border-slate-100">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            KikanCloud
                        </p>
                        <p className="text-[13px] font-bold text-slate-800 truncate mt-0.5">
                            {userProfile?.full_name ?? "ソリューション協同組合"}
                        </p>
                    </div>

                    {/* Panel nav items */}
                    <nav className="py-3 px-2 space-y-0.5">
                        {ALL_NAV_ITEMS.map((item) => {
                            const isActive = active === item.id;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-[13px] font-medium transition-all duration-150"
                                    style={{
                                        background: isActive ? "rgba(59,130,246,0.08)" : "transparent",
                                        color: isActive ? "#1d4ed8" : "#475569",
                                        fontWeight: isActive ? 700 : 500,
                                    }}
                                >
                                    <Icon
                                        size={18}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        style={{ color: isActive ? "#3b82f6" : "#94a3b8", flexShrink: 0 }}
                                    />
                                    <span className="truncate">{item.name}</span>
                                    {isActive && (
                                        <span
                                            className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                                            style={{ background: "#3b82f6" }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Panel footer */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-3 border-t border-slate-100 space-y-0.5">
                        <Link
                            href="/settings"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-100 transition-all"
                        >
                            <Settings size={15} strokeWidth={2} className="text-slate-400 shrink-0" />
                            設定
                        </Link>
                        <button
                            onClick={async () => {
                                if (window.confirm("ログアウトしますか？")) await logout();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-red-500 hover:bg-red-50 transition-all"
                        >
                            <LogOut size={15} strokeWidth={2} className="shrink-0" />
                            ログアウト
                        </button>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                MOBILE — Bottom Nav Bar (unchanged)
            ══════════════════════════════════════════════════ */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-[200] bg-white border-t border-gray-200"
                style={{ boxShadow: "0 -2px 8px rgba(0,0,0,0.06)", paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="flex items-stretch justify-around h-14">
                    {primaryItems.map((item) => {
                        const isActive = active === item.id;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 flex-1 ${isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-[9px] font-bold truncate ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setMoreOpen(true)}
                        className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 flex-1 text-gray-400"
                    >
                        <ChevronRight size={20} strokeWidth={2} />
                        <span className="text-[9px] font-bold">もっと</span>
                    </button>
                </div>
            </nav>

            {/* ── Mobile More drawer ──────────────────────────── */}
            {moreOpen && (
                <div
                    className="md:hidden fixed inset-0 z-[300] bg-black/30 backdrop-blur-sm"
                    onClick={() => setMoreOpen(false)}
                />
            )}
            <div
                className={`md:hidden fixed bottom-0 left-0 right-0 z-[400] bg-white rounded-t-2xl transition-transform duration-300 ease-out ${moreOpen ? "translate-y-0" : "translate-y-full"}`}
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>
                <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <SidebarAvatar userProfile={userProfile} />
                        <div>
                            <p className="text-[13px] font-bold text-gray-800">{userProfile?.full_name ?? "User"}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{userRole}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setMoreOpen(false)}
                        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
                    >
                        <X size={15} />
                    </button>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                    {moreItems.map((item) => {
                        const isActive = active === item.id;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isActive ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-gray-100"}`}
                            >
                                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[12px] font-bold leading-tight">{item.name}</span>
                                {!isActive && <ChevronRight size={11} className="ml-auto text-gray-300" />}
                            </Link>
                        );
                    })}
                </div>
                <div className="px-5 py-4 border-t border-gray-100">
                    <button
                        onClick={async () => {
                            if (window.confirm("ログアウトしますか？")) await logout();
                        }}
                        className="flex items-center gap-3 w-full p-3 rounded-xl bg-red-50 text-red-600 font-bold text-[13px] active:scale-95 transition-all"
                    >
                        <LogOut size={16} />
                        ログアウト
                    </button>
                </div>
                <div className="h-2" />
            </div>
        </>
    );
}
