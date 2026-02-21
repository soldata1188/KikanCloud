'use client'
import { useState, useEffect } from 'react'
import { HelpCircle, Clock } from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'
import { createClient } from '@/lib/supabase/server'

export function TopNav({ title, role, userProfileStr }: { title: string, role?: string, userProfileStr?: string }) {
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
    const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'User'
    const email = userProfile?.email || ''
    const avatarUrl = userProfile?.avatar_url

    const [timeStr, setTimeStr] = useState('')
    const [dateStr, setDateStr] = useState('')

    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            const days = ['日', '月', '火', '水', '木', '金', '土']
            setDateStr(`${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} (${days[now.getDay()]})`)
            setTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
        }
        updateTime()
        const timer = setInterval(updateTime, 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0 w-full">
            <div className="flex items-center gap-2 text-[13px]">
                <span className="font-medium text-[#1f1f1f]">KikanCloud</span>
                <span className="text-[#878787]">/</span>
                <span className="text-[#1f1f1f]">{title}</span>
            </div>

            <div className="flex items-center gap-4">
                {timeStr && (
                    <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-[#fbfcfd] border border-gray-200 rounded-md shadow-sm select-none hover:border-[#878787] transition-colors">
                        <Clock size={14} className="text-[#24b47e]" />
                        <span className="text-[11px] font-bold text-[#878787] uppercase tracking-widest">{dateStr}</span>
                        <span className="text-gray-200">|</span>
                        <span className="text-[13px] font-black text-[#1f1f1f] font-mono tabular-nums tracking-tight">{timeStr}</span>
                        <span className="text-[9px] font-bold text-[#24b47e] bg-[#24b47e]/10 border border-[#24b47e]/20 px-1.5 py-0.5 rounded ml-0.5">JST</span>
                    </div>
                )}
                <div className="w-px h-5 bg-gray-200 hidden md:block mx-1"></div>

                <div title="ヘルプ"><HelpCircle size={18} className="text-[#878787] hover:text-[#1f1f1f] cursor-pointer transition-colors" strokeWidth={1.5} /></div>
                {role && <NotificationBell role={role} />}
                <UserMenu displayName={displayName} email={email} role={role} avatarUrl={avatarUrl} />
            </div>
        </header>
    )
}
