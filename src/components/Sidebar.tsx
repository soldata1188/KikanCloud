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
        <aside className="shrink-0 h-screen w-16 md:w-[68px] bg-[#fbfcfd] border-r border-gray-350 flex flex-col py-6 z-50 relative">
            <div className="w-full flex justify-center mt-[-8px] transition-all duration-300">
                <SidebarAvatar userProfile={userProfile} />
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-4 w-full">
                {NAV_ITEMS.map((item) => {
                    const isActive = active === item.id;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group relative items-center justify-center w-full h-12 hover:bg-gray-50 transition-colors ${['dashboard', 'b2b-chat', 'chat'].includes(item.id)
                                    ? 'flex'
                                    : 'hidden md:flex'
                                }`}
                        >
                            {/* Left-Border Accent for Active State */}
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#24b47e]" />
                            )}

                            {/* Icon Container */}
                            <div
                                className={`flex items-center justify-center shrink-0 transition-colors duration-200 ${isActive ? "text-[#24b47e]" : "text-[#878787]"}`}
                            >
                                <Icon strokeWidth={isActive ? 2 : 1.5} className="w-6 h-6" />
                            </div>

                            {/* Tooltip Text */}
                            <span
                                className="absolute left-full ml-2 px-2 py-1.5 bg-[#24b47e] text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-none pointer-events-none flex items-center"
                            >
                                <span className="absolute -left-1 w-2 h-2 bg-[#24b47e] rotate-45 rounded-sm"></span>
                                <span className="relative z-10">{item.name}</span>
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className="w-full flex flex-col items-center gap-2 pt-4 mt-auto">
                <div className="w-full flex justify-center mb-2">
                    <SidebarLogo />
                </div>
                <form action={logout} className="w-full">
                    <button
                        type="submit"
                        className="group relative flex items-center justify-center w-full h-12 hover:bg-[#fce8e6] transition-colors"
                    >
                        <div className="flex items-center justify-center shrink-0 transition-colors duration-200 text-[#878787] group-hover:text-[#d93025]">
                            <LogOut strokeWidth={1.5} className="w-6 h-6" />
                        </div>
                        {/* Tooltip Text */}
                        <span
                            className="absolute left-full ml-2 px-2 py-1.5 bg-[#24b47e] text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-none pointer-events-none flex items-center"
                        >
                            <span className="absolute -left-1 w-2 h-2 bg-[#24b47e] rotate-45 rounded-sm"></span>
                            <span className="relative z-10">ログアウト</span>
                        </span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
