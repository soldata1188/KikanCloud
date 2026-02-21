import Link from 'next/link'
import { Home, Users, Building2, Landmark, Clock, ShieldAlert, LogOut, Settings, Hexagon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'

export async function Sidebar({ active }: { active: string }) {
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    let userRole = 'staff'; if (user) { const { data } = await supabase.from('users').select('role').eq('id', user.id).single(); userRole = data?.role || 'staff'; }

    const navItems = [
        { id: 'dashboard', icon: Home, href: '/' },
        { id: 'workers', icon: Users, href: '/workers' },
        { id: 'companies', icon: Building2, href: '/companies' },
        { id: 'procedures', icon: Landmark, href: '/procedures' },
        { id: 'audits', icon: Clock, href: '/audits' },
    ]

    return (
        <aside className="w-14 h-screen bg-[#fbfcfd] border-r border-[#ededed] flex flex-col items-center py-4 shrink-0 z-50">
            <Link href="/" className="w-8 h-8 rounded-md bg-[#1f1f1f] flex items-center justify-center text-white mb-6 shadow-sm hover:opacity-80 transition-opacity">
                <Hexagon size={18} fill="currentColor" strokeWidth={0} />
            </Link>

            <nav className="flex-1 w-full flex flex-col items-center gap-2 px-2">
                {navItems.map(item => (
                    <Link key={item.id} href={item.href} title={item.id} className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${active === item.id ? 'bg-[#ededed] text-[#1f1f1f]' : 'text-[#878787] hover:bg-[#f4f5f7] hover:text-[#1f1f1f]'}`}>
                        <item.icon size={18} strokeWidth={active === item.id ? 2 : 1.5} />
                    </Link>
                ))}
                {userRole === 'admin' && (
                    <>
                        <div className="w-6 h-px bg-[#ededed] my-2"></div>
                        <Link href="/accounts" title="IAM Roles" className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${active === 'accounts' ? 'bg-[#ededed] text-[#1f1f1f]' : 'text-[#878787] hover:bg-[#f4f5f7] hover:text-[#1f1f1f]'}`}>
                            <ShieldAlert size={18} strokeWidth={active === 'accounts' ? 2 : 1.5} />
                        </Link>
                    </>
                )}
            </nav>

            <div className="w-full flex flex-col items-center gap-2 px-2 pt-4 mt-auto">
                <button title="Settings" className="w-10 h-10 flex items-center justify-center rounded-md text-[#878787] hover:bg-[#ededed] hover:text-[#1f1f1f] transition-colors"><Settings size={18} strokeWidth={1.5} /></button>
                <form action={logout} className="w-full flex justify-center">
                    <button type="submit" title="Logout" className="w-10 h-10 flex items-center justify-center rounded-md text-[#878787] hover:bg-red-50 hover:text-red-600 transition-colors"><LogOut size={18} strokeWidth={1.5} className="ml-1" /></button>
                </form>
            </div>
        </aside>
    )
}
