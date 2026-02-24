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
    Route,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarAvatar } from "./SidebarAvatar";
import GlobalOmniSearch from "./dashboard/GlobalOmniSearch";

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
    userProfile: any;
}

export function SidebarClient({ active, userRole, userProfile }: SidebarClientProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <aside className={`shrink-0 h-screen bg-[#fbfcfd] border-r border-gray-350 flex flex-col py-6 relative transition-all duration-300 ${isExpanded ? 'w-16 md:w-[180px]' : 'w-16'}`}>

            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden md:flex absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-300 rounded-full items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-500 hover:bg-primary-50 transition-colors z-[60] shadow-sm"
            >
                {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>

            {/* Top section with Avatar Workspace */}
            <div className={`w-full flex items-center justify-center ${isExpanded ? 'md:justify-start md:px-4' : 'px-0'} mt-[-8px] mb-4 transition-all duration-300 gap-3`}>
                <div className={`shrink-0 flex items-center justify-center ${isExpanded ? 'w-full md:w-auto' : 'w-12 h-12'}`}>
                    <SidebarAvatar userProfile={userProfile} />
                </div>
                {/* Desktop-only Username Display */}
                {isExpanded && (
                    <div className="hidden md:flex flex-col flex-1 min-w-0 pr-2 pb-5">
                        <span className="text-[14px] font-bold text-[#1f1f1f] truncate leading-tight">
                            {userProfile?.full_name || 'Hồ sơ người dùng'}
                        </span>
                        <span className="text-[12px] text-[#878787] font-mono uppercase truncate mt-0.5">
                            {userRole === 'staff' ? 'QUẢN LÝ' : userRole}
                        </span>
                    </div>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className={`flex flex-col gap-2 w-full ${isExpanded ? 'px-0 md:px-3' : 'px-0 items-center'}`}>
                {NAV_ITEMS.map((item) => {
                    const isActive = active === item.id;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={!isExpanded ? item.name : undefined}
                            className={`group relative items-center justify-center ${isExpanded ? 'md:justify-start w-full md:px-3' : 'w-12 px-0'} h-12 md:h-11 md:rounded-[8px] hover:bg-gray-100 transition-colors ${['dashboard', 'b2b-chat', 'chat'].includes(item.id)
                                ? 'flex'
                                : 'hidden md:flex'
                                } ${isActive && 'bg-primary-50/50 md:bg-primary-50 md:hover:bg-primary-50'}`}
                        >
                            {/* Left-Border Accent for Active State (Mobile only) */}
                            {isActive && (
                                <div className="md:hidden absolute left-0 top-0 bottom-0 w-[4px] bg-[#24b47e]" />
                            )}

                            {/* Icon Container */}
                            <div
                                className={`flex items-center justify-center shrink-0 transition-colors duration-200 ${isActive ? "text-[#24b47e]" : "text-[#737373] group-hover:text-[#1f1f1f]"
                                    }`}
                            >
                                <Icon strokeWidth={isActive ? 2 : 1.75} className="w-[22px] h-[22px]" />
                            </div>

                            {/* Label Text (Desktop only) */}
                            {isExpanded && (
                                <span
                                    className={`hidden md:block ml-3.5 text-[13px] font-bold transition-colors duration-200 ${isActive ? "text-[#1a8b60]" : "text-[#5e5e5e] group-hover:text-[#1f1f1f]"
                                        } flex-1 truncate`}
                                >
                                    {item.name}
                                </span>
                            )}

                            {/* Tooltip Text (Mobile or Collapsed) */}
                            <span
                                className={`${isExpanded ? 'md:hidden' : 'hidden md:flex'} absolute left-full ml-2 px-2 py-1.5 bg-[#24b47e] text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-none pointer-events-none items-center`}
                            >
                                <span className="absolute -left-1 w-2 h-2 bg-[#24b47e] rotate-45 rounded-sm"></span>
                                <span className="relative z-10">{item.name}</span>
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div className={`w-full shrink-0 mt-auto pb-4 ${isExpanded ? 'px-2' : 'px-0 flex flex-col items-center'}`}>
                {isExpanded && (
                    <div className="hidden md:block mb-4 px-1">
                        <GlobalOmniSearch compact={true} />
                    </div>
                )}
                <div className={`${isExpanded ? 'px-0' : 'scale-50 origin-bottom'}`}>
                    <SidebarLogo />
                </div>
            </div>
        </aside>
    );
}
