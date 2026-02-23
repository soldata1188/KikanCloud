import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    Building2,
    ShieldCheck,
    GitMerge,
    Map,
    Settings,
    LogOut,
    Sparkles,
    MessageSquare,
    ClipboardList,
    Route,
    Landmark,
} from "lucide-react";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarAvatar } from "./SidebarAvatar";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

const NAV_ITEMS = [
    { id: "dashboard", name: "ホーム", href: "/", icon: LayoutDashboard },
    { id: "b2b-chat", name: "企業連絡", href: "/b2b-chat", icon: MessageSquare },
    { id: "operations", name: "業務管理", href: "/operations", icon: ClipboardList },
    { id: "workers", name: "実習生一覧", href: "/workers", icon: Users },
    {
        id: "companies",
        name: "受入企業一覧",
        href: "/companies",
        icon: Building2,
    },
    {
        id: "audits",
        name: "監査・訪問",
        href: "/audits",
        icon: ShieldCheck,
    },
    { id: "workflows", name: "業務フロー", href: "/workflows", icon: GitMerge },
    { id: "routing", name: "ルート最適化", href: "/routing", icon: Map },
    { id: "roadmap", name: "制度ロードマップ", href: "/roadmap", icon: Route },
    // { id: "organization", name: "機関情報", href: "/organization", icon: Landmark },
    { id: "chat", name: "AIチャット", href: "/chat", icon: Sparkles },
    // { id: "settings", name: "設定", href: "/settings", icon: Settings },
];

export async function Sidebar({ active }: { active: string }) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    let userRole = "staff";
    let userProfile = null;
    if (user) {
        const { data } = await supabase
            .from("users")
            .select("full_name, role")
            .eq("id", user.id)
            .single();
        userRole = data?.role || "staff";
        userProfile = data;
    }

    return (
        <aside className="shrink-0 h-screen w-16 md:w-[180px] bg-[#fbfcfd] border-r border-gray-350 flex flex-col py-6 z-50 relative transition-all duration-300">
            {/* Top section with Avatar Workspace */}
            <div className="w-full flex items-center justify-center md:justify-start md:px-4 mt-[-8px] mb-4 transition-all duration-300 gap-3">
                <div className="shrink-0 flex items-center justify-center w-full md:w-auto">
                    <SidebarAvatar userProfile={userProfile} />
                </div>
                {/* Desktop-only Username Display */}
                <div className="hidden md:flex flex-col flex-1 min-w-0 pr-2 pb-5">
                    <span className="text-[14px] font-bold text-[#1f1f1f] truncate leading-tight">
                        {userProfile?.full_name || 'Hồ sơ người dùng'}
                    </span>
                    <span className="text-[12px] text-[#878787] font-mono uppercase truncate mt-0.5">
                        {userRole === 'staff' ? 'QUẢN LÝ' : userRole}
                    </span>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-2 w-full px-0 md:px-3">
                {NAV_ITEMS.map((item) => {
                    const isActive = active === item.id;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group relative items-center justify-center md:justify-start w-full md:px-3 h-12 md:h-11 md:rounded-[8px] hover:bg-gray-100 transition-colors ${['dashboard', 'b2b-chat', 'chat'].includes(item.id)
                                ? 'flex'
                                : 'hidden md:flex'
                                } ${isActive && 'md:bg-primary-50 md:hover:bg-primary-50'}`}
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
                            <span
                                className={`hidden md:block ml-3.5 text-[13px] font-bold transition-colors duration-200 ${isActive ? "text-[#1a8b60]" : "text-[#5e5e5e] group-hover:text-[#1f1f1f]"
                                    } flex-1 truncate`}
                            >
                                {item.name}
                            </span>

                            {/* Tooltip Text (Mobile only) */}
                            <span
                                className="md:hidden absolute left-full ml-2 px-2 py-1.5 bg-[#24b47e] text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-none pointer-events-none flex items-center"
                            >
                                <span className="absolute -left-1 w-2 h-2 bg-[#24b47e] rotate-45 rounded-sm"></span>
                                <span className="relative z-10">{item.name}</span>
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div className="w-full flex flex-col items-center md:items-start gap-2 pt-4 mt-auto px-0 md:px-3">
                <div className="w-full flex justify-center md:justify-start md:px-4 mb-2 shrink-0">
                    <SidebarLogo />
                </div>

                <form action={logout} className="w-full">
                    <button
                        type="submit"
                        className="group relative flex items-center justify-center md:justify-start w-full md:px-3 h-12 md:h-11 md:rounded-[8px] md:hover:bg-[#fce8e6] hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center justify-center shrink-0 transition-colors duration-200 text-[#737373] group-hover:text-[#d93025]">
                            <LogOut strokeWidth={1.75} className="w-[22px] h-[22px]" />
                        </div>

                        {/* Label Text (Desktop only) */}
                        <span className="hidden md:block ml-3.5 text-[13px] font-bold text-[#5e5e5e] group-hover:text-[#d93025] transition-colors duration-200">
                            ログアウト
                        </span>

                        {/* Tooltip Text (Mobile only) */}
                        <span
                            className="md:hidden absolute left-full ml-2 px-2 py-1.5 bg-[#d93025] text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-none pointer-events-none flex items-center"
                        >
                            <span className="absolute -left-1 w-2 h-2 bg-[#d93025] rotate-45 rounded-sm"></span>
                            <span className="relative z-10">ログアウト</span>
                        </span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
