'use client'
import { useState, useRef, useEffect } from 'react'
import { LogOut, Settings, UserCircle2, Landmark } from 'lucide-react'
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
        <div className="relative flex w-full justify-center mb-6" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#24b47e] to-[#1a8b60] text-white flex items-center justify-center font-bold text-[15px] shadow-sm hover:shadow-md hover:ring-2 hover:ring-[#24b47e] hover:ring-offset-2 transition-all focus:outline-none"
            >
                {initials}
            </button>

            {isOpen && (
                <div className="absolute left-16 top-0 w-56 bg-white rounded-lg shadow-xl border border-gray-350 overflow-hidden z-[100] animate-in slide-in-from-left-2 fade-in duration-200">
                    <div className="px-4 py-3 border-b border-[#ededed] bg-gray-50 flex flex-col gap-0.5">
                        <p className="text-[13px] font-bold text-[#1f1f1f] truncate leading-tight">{userProfile?.full_name || 'User'}</p>
                        <p className="text-[11px] text-[#878787] font-mono truncate leading-tight">{userProfile?.role}</p>
                    </div>

                    <div className="p-1.5 flex flex-col gap-0.5">
                        <Link href="/settings" className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] font-medium text-[#1f1f1f] hover:bg-gray-100 rounded-md transition-colors" onClick={() => setIsOpen(false)}>
                            <Settings size={15} className="text-[#878787]" /> システム設定
                        </Link>
                        <Link href="/settings?tab=account" className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] font-medium text-[#1f1f1f] hover:bg-gray-100 rounded-md transition-colors" onClick={() => setIsOpen(false)}>
                            <UserCircle2 size={15} className="text-[#878787]" /> プロフィール変更
                        </Link>
                        {userProfile?.role !== 'worker' && (
                            <Link href="/organization" className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] font-medium text-[#1f1f1f] hover:bg-gray-100 rounded-md transition-colors" onClick={() => setIsOpen(false)}>
                                <Landmark size={15} className="text-[#878787]" /> 機関・企業情報
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
