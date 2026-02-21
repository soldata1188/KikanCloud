import Link from 'next/link'
import { Home, Users, Building2, Landmark, Clock, ShieldAlert, LogOut, Settings, Calendar } from 'lucide-react'
import { SidebarLogo } from './SidebarLogo'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'

export async function Sidebar({ active }: { active: string }) {
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    let userRole = 'staff'; if (user) { const { data } = await supabase.from('users').select('role').eq('id', user.id).single(); userRole = data?.role || 'staff'; }

    const navItems = [
        { id: 'dashboard', icon: Home, href: '/', title: 'ダッシュボード' },
        { id: 'workers', icon: Users, href: '/workers', title: '外国人材管理' },
        { id: 'companies', icon: Building2, href: '/companies', title: '受入企業管理' },
        { id: 'procedures', icon: Landmark, href: '/procedures', title: '行政手続 (入管・機構)' },
        { id: 'schedule', icon: Calendar, href: '/schedule', title: 'スケジュール' },
        { id: 'audits', icon: Clock, href: '/audits', title: '監査・訪問・面談' },
    ]

    return (
        <aside className="group w-14 hover:w-64 h-screen bg-[#fbfcfd] border-r border-[#ededed] flex flex-col py-4 shrink-0 z-50 transition-all duration-300 ease-in-out absolute md:relative overflow-hidden">
            <SidebarLogo />

            <nav className="flex-1 w-full flex flex-col gap-2 px-2 mt-4">
                {navItems.map(item => (
                    <Link key={item.id} href={item.href} className={`flex items-center gap-3 px-2 h-10 rounded-md transition-colors whitespace-nowrap overflow-hidden ${active === item.id ? 'bg-[#ededed] text-[#1f1f1f]' : 'text-[#878787] hover:bg-[#f4f5f7] hover:text-[#1f1f1f]'}`}>
                        <div className="flex items-center justify-center min-w-[24px]">
                            <item.icon size={18} strokeWidth={active === item.id ? 2 : 1.5} />
                        </div>
                        <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">{item.title}</span>
                    </Link>
                ))}
                {userRole === 'admin' && (
                    <>
                        <div className="w-full h-px bg-[#ededed] my-2"></div>
                        <Link href="/accounts" className={`flex items-center gap-3 px-2 h-10 rounded-md transition-colors whitespace-nowrap overflow-hidden ${active === 'accounts' ? 'bg-[#ededed] text-[#1f1f1f]' : 'text-[#878787] hover:bg-[#f4f5f7] hover:text-[#1f1f1f]'}`}>
                            <div className="flex items-center justify-center min-w-[24px]">
                                <ShieldAlert size={18} strokeWidth={active === 'accounts' ? 2 : 1.5} />
                            </div>
                            <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">アカウント管理</span>
                        </Link>
                    </>
                )}
            </nav>

            <div className="w-full flex flex-col gap-2 px-2 pt-4 mt-auto">
                <button className="flex items-center gap-3 px-2 h-10 rounded-md text-[#878787] hover:bg-[#ededed] hover:text-[#1f1f1f] transition-colors whitespace-nowrap overflow-hidden">
                    <div className="flex items-center justify-center min-w-[24px]">
                        <Settings size={18} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">設定</span>
                </button>
                <form action={logout} className="w-full">
                    <button type="submit" className="w-full flex items-center gap-3 px-2 h-10 rounded-md text-[#878787] hover:bg-red-50 hover:text-red-600 transition-colors whitespace-nowrap overflow-hidden">
                        <div className="flex items-center justify-center min-w-[24px]">
                            <LogOut size={18} strokeWidth={1.5} className="ml-0.5" />
                        </div>
                        <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">ログアウト</span>
                    </button>
                </form>
            </div>
        </aside>
    )
}
