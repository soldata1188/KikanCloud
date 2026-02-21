import { Search, HelpCircle } from 'lucide-react'
import { Logo } from './Logo'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'
import { createClient } from '@/lib/supabase/server'

export async function TopNav({ title, role }: { title: string, role?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let userProfile = null
    if (user) {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
        userProfile = data
    }

    const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'User'
    const email = userProfile?.email || user?.email || ''
    const avatarUrl = userProfile?.avatar_url

    return (
        <header className="h-14 bg-white border-b border-[#ededed] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0 w-full">
            <div className="flex items-center gap-2 text-[13px]">
                <Logo className="w-5 h-5 shrink-0" />
                <span className="text-[#878787]">/</span>
                <span className="font-medium text-[#1f1f1f]">KikanCloud</span>
                <span className="px-1.5 py-0.5 rounded border border-[#ededed] text-[10px] font-mono text-[#878787] uppercase tracking-wider ml-1 bg-[#fbfcfd]">FREE</span>
                <span className="text-[#878787] ml-1">/</span>
                <span className="text-[#1f1f1f]">{title}</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:block text-[13px] text-[#878787] hover:text-[#1f1f1f] cursor-pointer transition-colors mr-2">フィードバック</div>
                <div className="relative hidden md:block group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#878787] group-focus-within:text-[#1f1f1f] transition-colors" size={14} />
                    <input type="text" placeholder="検索..." className="h-[30px] w-52 bg-[#fbfcfd] border border-[#ededed] rounded-md pl-8 pr-12 text-xs outline-none focus:border-[#878787] focus:bg-white transition-all text-[#1f1f1f] placeholder:text-[#878787]" />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[#878787] text-[10px] font-mono">
                        <span className="border border-[#ededed] bg-white rounded px-1 shadow-sm">⌘</span><span className="border border-[#ededed] bg-white rounded px-1 shadow-sm">K</span>
                    </div>
                </div>
                <div title="ヘルプ"><HelpCircle size={18} className="text-[#878787] hover:text-[#1f1f1f] cursor-pointer transition-colors" strokeWidth={1.5} /></div>
                {role && <NotificationBell role={role} />}
                <UserMenu displayName={displayName} email={email} role={role} avatarUrl={avatarUrl} />
            </div>
        </header>
    )
}
