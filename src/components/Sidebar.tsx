import Link from 'next/link'
import { Menu, Sparkles, Briefcase, Building2, Settings } from 'lucide-react'
import { logout } from '@/app/login/actions'

export function Sidebar({ active }: { active: 'dashboard' | 'workers' | 'companies' }) {
    return (
        <aside className="w-[68px] flex flex-col items-center py-4 shrink-0 bg-[#f0f4f9] z-20">
            <button className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-[#444746] mb-4">
                <Menu size={24} strokeWidth={1.5} />
            </button>
            <Link href="/" className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 transition-colors ${active === 'dashboard' ? 'bg-[#e8def8] text-[#1d192b]' : 'hover:bg-black/5 text-[#444746]'}`} title="ダッシュボード">
                <Sparkles size={20} strokeWidth={active === 'dashboard' ? 2 : 1.5} />
            </Link>
            <Link href="/workers" className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 transition-colors ${active === 'workers' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-black/5 text-[#444746]'}`} title="外国人材管理">
                <Briefcase size={20} strokeWidth={active === 'workers' ? 2 : 1.5} />
            </Link>
            <button className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 transition-colors ${active === 'companies' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-black/5 text-[#444746]'}`} title="受入企業 (Comming Soon)">
                <Building2 size={20} strokeWidth={active === 'companies' ? 2 : 1.5} />
            </button>
            <div className="mt-auto flex flex-col gap-4">
                <form action={logout}>
                    <button type="submit" className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-[#444746]" title="ログアウト">
                        <Settings size={22} strokeWidth={1.5} />
                    </button>
                </form>
            </div>
        </aside>
    )
}
