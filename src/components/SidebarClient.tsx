"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard, Users, Building2, ShieldCheck,
    Map, Sparkles, ClipboardList,
    Settings, LogOut, X, ChevronRight, User
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleToggle = () => setMobileMenuOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', handleToggle);
        return () => window.removeEventListener('toggle-sidebar', handleToggle);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const orgInitial = userProfile?.full_name?.charAt(0) ?? "K";

    return (
        <>
            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[140] md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-[150] w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Nút đóng Sidebar trên Mobile */}
                <button
                    className="md:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <i className="fas fa-times text-lg"></i>
                </button>

                {/* Sidebar Header / Org Info */}
                <div className="p-6 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {orgInitial}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight">Solution</p>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Cooperative</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {ALL_NAV_ITEMS.map((item) => {
                        const isActive = active === item.id;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${isActive
                                    ? "bg-blue-50 text-blue-700 shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                    }`}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Info */}
                <div className="p-4 border-t border-gray-50">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <User size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{userProfile?.full_name || 'User'}</p>
                            <p className="text-[10px] text-gray-400 truncate uppercase">{userRole}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
