"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    Building2,
    ShieldCheck,
    GitMerge,
    Map,
    Sparkles,
    MessageSquare,
    ClipboardList,
    Route
} from "lucide-react";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarAvatar } from "./SidebarAvatar";

const NAV_ITEMS = [
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
];

interface SidebarClientProps {
    active: string;
    userRole: string;
    userProfile: {
        full_name?: string;
        avatar_url?: string;
    } | null;
}

export function SidebarClient({ active, userRole, userProfile }: SidebarClientProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="w-12 shrink-0 h-screen relative z-[100]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <aside
                className={`absolute top-0 left-0 h-full bg-[#fbfcfd] border-r border-gray-350 flex flex-col pt-3 pb-6 transition-all duration-300 ease-in-out shadow-2xl ${isHovered ? 'w-[240px]' : 'w-12'}`}
            >
                {/* Top section with Avatar Workspace */}
                <div className={`w-full flex items-center mb-8 px-2 transition-all duration-300 ${isHovered ? 'justify-start px-4' : 'justify-center'}`}>
                    <div className="shrink-0 w-8 h-8 flex items-center justify-center">
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

                {/* Navigation Menu */}
                <nav className="flex-1 flex flex-col gap-1 w-full px-1 overflow-y-auto no-scrollbar">
                    {NAV_ITEMS.map((item) => {
                        const isActive = active === item.id;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative flex items-center h-10 rounded-[10px] transition-all duration-300 ${['dashboard', 'b2b-chat', 'chat'].includes(item.id)
                                    ? 'flex'
                                    : 'hidden md:flex'
                                    } ${isActive
                                        ? 'bg-[#24b47e] text-white shadow-[0_8px_16px_rgba(36,180,126,0.2)]'
                                        : 'hover:bg-gray-100 text-[#737373] hover:text-[#1f1f1f]'}`}
                            >
                                {/* Icon Container */}
                                <div
                                    className={`w-10 flex items-center justify-center shrink-0 transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                                >
                                    <Icon strokeWidth={isActive ? 2.5 : 2} className="w-[18px] h-[18px]" />
                                </div>

                                {/* Label text visible only on hover */}
                                {isHovered && (
                                    <span className="ml-2 text-[13px] font-bold whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                                        {item.name}
                                    </span>
                                )}

                                {/* Simple Hover Label - Shown only when NOT expanded */}
                                {!isHovered && (
                                    <div
                                        className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap z-[110] shadow-sm pointer-events-none"
                                    >
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div className={`w-full shrink-0 flex flex-col items-center mt-auto pb-8 px-2 transition-all duration-300 ${isHovered ? 'items-start px-4' : 'items-center'}`}>
                    <div className={`transition-all duration-500 scale-[0.4] opacity-20 hover:opacity-100 ${isHovered ? 'ml-[-15px] scale-50 opacity-40' : ''}`}>
                        <SidebarLogo />
                    </div>
                </div>
            </aside>
        </div>
    );
}
