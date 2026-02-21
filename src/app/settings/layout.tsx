import { Sidebar } from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/UserMenu'
import Link from 'next/link'
import { User, Settings as SettingsIcon } from 'lucide-react'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role, avatar_url').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'

    return (
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="settings" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-white z-10 transition-colors">
                    <h1 className="text-[22px] font-normal text-[#1f1f1f] tracking-tight">KikanCloud</h1>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:flex px-3 py-1 bg-white rounded-md text-[11px] font-semibold text-[#1f1f1f] tracking-wider">ULTRA</span>
                        <UserMenu displayName={displayName} email={user.email || ''} role={userProfile?.role} avatarUrl={userProfile?.avatar_url} />
                    </div>
                </header>

                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[1000px] mx-auto mt-4 md:mt-8">
                    <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f] mb-8 pl-2">設定</h2>

                    <div className="flex flex-col md:flex-row gap-8">
                        <aside className="w-full md:w-64 shrink-0">
                            <nav className="flex flex-col gap-2">
                                <Link href="/settings/profile" className="flex items-center gap-3 px-4 py-3 bg-white rounded-md text-[#1f1f1f] hover:bg-gray-50 font-medium transition-colors">
                                    <User size={20} className="text-[#24b47e]" />
                                    プロフィール設定
                                </Link>
                                <Link href="/settings/system" className="flex items-center gap-3 px-4 py-3 bg-white rounded-md text-[#1f1f1f] hover:bg-gray-50 font-medium transition-colors">
                                    <SettingsIcon size={20} className="text-orange-500" />
                                    システム設定
                                </Link>
                            </nav>
                        </aside>

                        <div className="flex-1 bg-white rounded-md p-8 min-h-[500px]">
                            {children}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
