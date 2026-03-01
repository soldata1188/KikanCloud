'use client'
import { useState, useRef, useEffect } from 'react'
import { LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { logout } from '@/app/login/actions'

export function SidebarAvatar({ userProfile }: { userProfile: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const initials = userProfile?.full_name ? userProfile.full_name.substring(0, 1).toUpperCase() : 'U'

    return (
        <div className="relative flex items-center justify-center" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-11 h-11 rounded-full bg-[#0067b8] text-white flex items-center justify-center font-bold text-[16px] shadow-sm hover:shadow-lg hover:ring-2 hover:ring-[#0067b8] hover:ring-offset-2 transition-all focus:outline-none shrink-0"
            >
                {initials}
            </button>

            {isOpen && (
                <div className="absolute left-[80px] top-0 w-64 bg-white rounded-[24px] shadow-xl border border-slate-200 overflow-hidden z-[100] animate-in slide-in-from-left-2 fade-in duration-200">
                    <div className="px-4 py-3 border-b border-[#ededed] bg-gray-50 flex flex-col gap-0.5">
                        <p className="text-[13px] font-bold text-[#1f1f1f] truncate leading-tight">{userProfile?.full_name || 'User'}</p>
                        <p className="text-[11px] text-[#878787] font-mono truncate leading-tight">{userProfile?.role}</p>
                    </div>

                    <div className="p-1.5 flex flex-col gap-0.5">
                        <Link href="/settings" className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] font-medium text-[#1f1f1f] hover:bg-gray-100 rounded-md transition-colors" onClick={() => setIsOpen(false)}>
                            <Settings size={15} className="text-[#878787]" /> システム設定
                        </Link>
                        <div className="h-px bg-gray-100 my-1" />
                        <form action={logout} className="w-full">
                            <button
                                type="submit"
                                className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] font-medium text-[#d93025] hover:bg-red-50 rounded-md transition-colors text-left"
                            >
                                <LogOut size={15} /> ログアウト
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
