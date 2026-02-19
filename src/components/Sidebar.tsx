import Link from 'next/link'
import { LayoutDashboard, Users, Building2, LogOut } from 'lucide-react'
import { logout } from '@/app/login/actions'

export function Sidebar({ active }: { active: 'dashboard' | 'workers' | 'companies' }) {
    return (
        <aside className="w-20 bg-[#f0f4f9] flex flex-col items-center py-6 border-r border-[#e1e5ea] z-20">
            <div className="mb-8">
                <div className="w-10 h-10 bg-[#4285F4] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
                    K
                </div>
            </div>

            <nav className="flex-1 flex flex-col gap-2 w-full px-2">
                <Link href="/" className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 transition-colors ${active === 'dashboard' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-black/5 text-[#444746]'}`} title="ダッシュボード">
                    <LayoutDashboard size={20} strokeWidth={active === 'dashboard' ? 2 : 1.5} />
                </Link>

                <Link href="/workers" className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 transition-colors ${active === 'workers' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-black/5 text-[#444746]'}`} title="外国人材管理">
                    <Users size={20} strokeWidth={active === 'workers' ? 2 : 1.5} />
                </Link>

                <Link href="/companies" className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 transition-colors ${active === 'companies' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-black/5 text-[#444746]'}`} title="受入企業管理">
                    <Building2 size={20} strokeWidth={active === 'companies' ? 2 : 1.5} />
                </Link>
            </nav>

            <form action={logout}>
                <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#444746] hover:bg-black/5 transition-colors" title="ログアウト">
                    <LogOut size={18} strokeWidth={1.5} />
                </button>
            </form>
        </aside>
    )
}
