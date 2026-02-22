import Link from 'next/link'
import { LayoutDashboard, Users, Building2, ShieldCheck, GitMerge, Map, Settings, LogOut } from 'lucide-react'
import { SidebarLogo } from './SidebarLogo'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'

const NAV_ITEMS = [
    { id: "dashboard", name: "ダッシュボード", href: "/", icon: LayoutDashboard },
    { id: "workers", name: "外国人材管理", href: "/workers", icon: Users },
    { id: "companies", name: "受入企業管理", href: "/companies", icon: Building2 },
    { id: "audits", name: "監査・訪問・面談", href: "/audits", icon: ShieldCheck },
    { id: "workflows", name: "業務フロー", href: "/workflows", icon: GitMerge },
    { id: "routing", name: "ルート最適化", href: "/routing", icon: Map },
    { id: "settings", name: "設定", href: "/settings", icon: Settings },
];

export async function Sidebar({ active }: { active: string }) {
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    let userRole = 'staff'; if (user) { const { data } = await supabase.from('users').select('role').eq('id', user.id).single(); userRole = data?.role || 'staff'; }

    return (
        <aside className="group shrink-0 h-screen w-16 md:hover:w-64 transition-all duration-300 ease-in-out bg-[#fbfcfd] border-r border-gray-200 flex flex-col py-6 z-50 overflow-hidden relative">
            <div className="w-full flex justify-center mt-[-8px] transition-all duration-300">
                <SidebarLogo />
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
                            className="relative flex items-center justify-start w-full h-12 px-3 hover:bg-gray-50 transition-colors"
                        >
                            {/* Left-Border Accent cho Active State */}
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#24b47e]" />
                            )}

                            {/* Icon Container */}
                            <div className={`flex items-center justify-center shrink-0 w-10 transition-colors duration-200 ${isActive ? "text-[#24b47e]" : "text-[#878787]"}`}>
                                <Icon strokeWidth={isActive ? 2 : 1.5} className="w-6 h-6" />
                            </div>

                            {/* Menu Text */}
                            <span className={`ml-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 pointer-events-none text-sm font-medium ${isActive ? 'text-[#1f1f1f]' : 'text-[#878787]'}`}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}

                {userRole === 'admin' && (
                    <Link
                        href="/accounts"
                        className="relative flex items-center justify-start w-full h-12 px-3 hover:bg-gray-50 transition-colors"
                    >
                        {active === 'accounts' && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#24b47e]" />}
                        <div className={`flex items-center justify-center shrink-0 w-10 transition-colors duration-200 ${active === 'accounts' ? "text-[#24b47e]" : "text-[#878787]"}`}>
                            <ShieldCheck strokeWidth={active === 'accounts' ? 2 : 1.5} className="w-6 h-6" />
                        </div>
                        <span className={`ml-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 pointer-events-none text-sm font-medium ${active === 'accounts' ? 'text-[#1f1f1f]' : 'text-[#878787]'}`}>
                            アカウント管理
                        </span>
                    </Link>
                )}
            </nav>

            <div className="w-full flex flex-col gap-2 pt-4 mt-auto">
                <form action={logout} className="w-full">
                    <button type="submit" className="relative flex items-center justify-start w-full h-12 px-3 hover:bg-[#fce8e6] transition-colors group/btn">
                        <div className="flex items-center justify-center shrink-0 w-10 transition-colors duration-200 text-[#878787] group-hover/btn:text-[#d93025]">
                            <LogOut strokeWidth={1.5} className="w-6 h-6" />
                        </div>
                        <span className="ml-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 pointer-events-none text-sm font-medium text-[#878787] group-hover/btn:text-[#d93025]">
                            ログアウト
                        </span>
                    </button>
                </form>
            </div>
        </aside>
    )
}
