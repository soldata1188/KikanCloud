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
                className={`fixed inset-y-0 left-0 z-[150] w-[200px] bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
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
                <div className="p-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                            {orgInitial}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 leading-tight truncate">Solution</p>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest truncate">Cooperative</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-2 py-4 space-y-0.5">
                    {ALL_NAV_ITEMS.map((item) => {
                        const isActive = active === item.id;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-sm font-bold transition-all ${isActive
                                    ? "bg-blue-50 text-blue-700 shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                    }`}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="truncate">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Info */}
                <div className="p-3 border-t border-gray-50 bg-gray-50/30">
                    <div className="flex items-center gap-3 px-1 py-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            <User size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{userProfile?.full_name || 'User'}</p>
                            <p className="text-xs text-gray-400 font-bold truncate uppercase">{userRole}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t border-gray-200 z-[100] md:hidden px-4 flex items-center justify-around pb-safe">
                {ALL_NAV_ITEMS.map((item) => {
                    const isActive = active === item.id;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-all ${isActive ? "text-blue-600 scale-110" : "text-gray-400"
                                }`}
                        >
                            <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-blue-50" : ""}`}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-tight ${isActive ? "opacity-100" : "opacity-60"}`}>
                                {item.name === "位置情報マップ" ? "マップ" : item.name === "監査・訪問" ? "監査" : item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
