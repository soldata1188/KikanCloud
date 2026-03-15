"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    Building2,
    ShieldCheck,
    Map,
    ClipboardList,
    Settings,
    MessageSquare,
    User,
} from "lucide-react";

const NAV_MAIN = [
    { id: "dashboard",  name: "ホーム",       href: "/",           icon: LayoutDashboard },
    { id: "operations", name: "業務管理",     href: "/operations", icon: ClipboardList   },
    { id: "workers",    name: "人材管理",     href: "/workers",    icon: Users           },
    { id: "companies",  name: "受入企業",     href: "/companies",  icon: Building2       },
];

const NAV_SECONDARY = [
    { id: "audits",     name: "監査・訪問",   href: "/audits",     icon: ShieldCheck     },
    { id: "routing",    name: "位置情報",     href: "/routing",    icon: Map             },
    { id: "chat",       name: "AIチャット",   href: "/chat",       icon: MessageSquare   },
    { id: "settings",   name: "設定",         href: "/settings",   icon: Settings        },
];

const NAV_MOBILE = [...NAV_MAIN, ...NAV_SECONDARY].slice(0, 6);

interface SidebarClientProps {
    active: string;
    userRole: string;
    userProfile: { full_name?: string; avatar_url?: string } | null;
}

function NavItem({ item, isActive }: { item: typeof NAV_MAIN[0]; isActive: boolean }) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 ${
                isActive
                    ? "bg-[#1e293b] text-white font-medium"
                    : "text-[#94a3b8] hover:bg-[#172033] hover:text-white font-normal"
            }`}
        >
            <Icon
                size={16}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? "text-white shrink-0" : "text-[#64748b] shrink-0"}
            />
            <span className="truncate">{item.name}</span>
        </Link>
    );
}

export function SidebarClient({ active, userRole, userProfile }: SidebarClientProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleToggle = () => setMobileMenuOpen((prev) => !prev);
        window.addEventListener("toggle-sidebar", handleToggle);
        return () => window.removeEventListener("toggle-sidebar", handleToggle);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const sidebarContent = (
        <div className="flex flex-col h-full overflow-hidden">
            {/* ── Nav ─────────────────────────────────────────────── */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto thin-scrollbar">
                {NAV_MAIN.map((item) => (
                    <NavItem key={item.id} item={item} isActive={active === item.id} />
                ))}

                {/* Divider */}
                <div className="h-px bg-[#1e293b] mx-3 my-2" />

                {NAV_SECONDARY.map((item) => (
                    <NavItem key={item.id} item={item} isActive={active === item.id} />
                ))}
            </nav>

            {/* ── User footer ─────────────────────────────────────── */}
            <div className="px-3 py-3 border-t border-[#1e293b]">
                <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#172033] transition-colors cursor-default">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold bg-[#2d3f5e] text-white">
                        {userProfile?.full_name?.charAt(0)?.toUpperCase() ?? <User size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium truncate leading-none text-white">
                            {userProfile?.full_name || "ユーザー"}
                        </p>
                        <p className="text-[10px] truncate leading-none mt-0.5 capitalize text-[#64748b]">
                            {userRole}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[140] md:hidden anim-fade"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden
                />
            )}

            {/* Desktop: padding-top = header-height để nội dung sidebar không bị menubar che */}
            <aside
                className={`fixed inset-y-0 left-0 z-[150] flex flex-col shrink-0 transform transition-transform duration-300 ease-out md:relative md:translate-x-0 md:shadow-none md:pt-[var(--header-height)] ${
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                style={{
                    width: "var(--sidebar-width)",
                    background: "#0f172a",
                    borderRight: "none",
                    boxShadow: mobileMenuOpen ? "4px 0 24px rgba(0,0,0,0.25)" : undefined,
                }}
            >
                {sidebarContent}
            </aside>

            {/* Mobile bottom bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 bg-[#0f172a] z-[100] md:hidden flex items-center justify-around px-1"
                style={{
                    height: "var(--mobile-nav-h)",
                    borderTop: "1px solid #1e293b",
                    paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
                }}
            >
                {NAV_MOBILE.map((item) => {
                    const isActive = active === item.id;
                    const Icon = item.icon;
                    const label =
                        item.name === "位置情報" ? "マップ" :
                        item.name === "監査・訪問" ? "監査" :
                        item.name === "AIチャット" ? "AI" :
                        item.name.length > 4 ? item.name.slice(0, 4) : item.name;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all ${
                                isActive ? "text-white" : "text-[#64748b] active:bg-[#1e293b]"
                            }`}
                        >
                            <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                                isActive ? "bg-[#1e293b]" : ""
                            }`}>
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </span>
                            <span className={`text-[10px] font-medium truncate ${isActive ? "text-white" : "text-[#64748b]"}`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
