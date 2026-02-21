'use client'
import { HelpCircle } from 'lucide-react'
import { GlobalSearch } from './GlobalSearch'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'
import { createClient } from '@/lib/supabase/server'

export function TopNav({ title, role, userProfileStr }: { title: string, role?: string, userProfileStr?: string }) {
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
    const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'User'
    const email = userProfile?.email || ''
    const avatarUrl = userProfile?.avatar_url

    return (
        <header className="h-14 bg-white border-b border-[#ededed] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0 w-full">
            <div className="flex items-center gap-2 text-[13px]">
                <span className="font-medium text-[#1f1f1f]">KikanCloud</span>
                <span className="text-[#878787]">/</span>
                <span className="text-[#1f1f1f]">{title}</span>
            </div>

            <div className="flex items-center gap-4">
                <GlobalSearch />
                <div title="ヘルプ"><HelpCircle size={18} className="text-[#878787] hover:text-[#1f1f1f] cursor-pointer transition-colors" strokeWidth={1.5} /></div>
                {role && <NotificationBell role={role} />}
                <UserMenu displayName={displayName} email={email} role={role} avatarUrl={avatarUrl} />
            </div>
        </header>
    )
}
