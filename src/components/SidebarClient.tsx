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

function GraduationIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
    )
}

function CarIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <path d="M16 8h4l3 5v3h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
    )
}

const NAV_MAIN: NavItem[] = [
    { id: "dashboard",  name: "ホーム",       href: "/",           icon: LayoutDashboard },
    { id: "operations", name: "業務管理",     href: "/operations", icon: ClipboardList   },
    { id: "workers",    name: "人材管理",     href: "/workers",    icon: Users           },
    { id: "companies",  name: "受入企業",     href: "/companies",  icon: Building2       },
];

const NAV_SECONDARY: NavItem[] = [
    { id: "audits",    name: "監査・訪問",    href: "/audits",    icon: ShieldCheck      },
    { id: "kentei",    name: "検定業務",      href: "/kentei",    icon: GraduationIcon  },
    { id: "transfer",  name: "送迎・帰国",    href: "/transfer",  icon: CarIcon         },
    { id: "routing",   name: "位置情報",      href: "/routing",   icon: Map             },
    { id: "chat",      name: "AIチャット",    href: "/chat",      icon: MessageSquare   },
    { id: "settings",  name: "設定",          href: "/settings",  icon: Settings        },
];


type NavIconComponent = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>

interface NavItem {
    id: string
    name: string
    href: string
    icon: NavIconComponent
}

interface SidebarClientProps {
    active: string;
    userRole: string;
    userProfile: { full_name?: string; avatar_url?: string } | null;
}

function NavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            aria-label={item.name}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 ${
                isActive
                    ? "bg-[var(--sidebar-item-active)] text-white font-medium"
                    : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-white font-normal"
            }`}
        >
            <Icon
                size={16}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? "text-white shrink-0" : "text-[var(--sidebar-text-muted)] shrink-0"}
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
                <div className="h-px bg-[var(--sidebar-border)] mx-3 my-2" />

                {NAV_SECONDARY.map((item) => (
                    <NavItem key={item.id} item={item} isActive={active === item.id} />
                ))}
            </nav>

            {/* ── User footer ─────────────────────────────────────── */}
            <div className="px-3 py-3 border-t border-[var(--sidebar-border)]">
                <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--sidebar-item-hover)] transition-colors cursor-default">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold bg-[var(--sidebar-avatar-bg)] text-white">
                        {userProfile?.full_name?.charAt(0)?.toUpperCase() ?? <User size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium truncate leading-none text-white">
                            {userProfile?.full_name || "ユーザー"}
                        </p>
                        <p className="text-[10px] truncate leading-none mt-0.5 capitalize text-[var(--sidebar-text-muted)]">
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
                    background: "var(--sidebar-bg)",
                    borderRight: "none",
                    boxShadow: mobileMenuOpen ? "4px 0 24px rgba(0,0,0,0.25)" : undefined,
                }}
            >
                {sidebarContent}
            </aside>

        </>
    );
}
