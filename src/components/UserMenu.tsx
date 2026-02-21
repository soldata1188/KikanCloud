'use client'

import { useState, useRef, useEffect } from 'react'
import { LogOut, User, Settings, CheckCircle2, Shield } from 'lucide-react'
import { logout } from '@/app/login/actions'
import Link from 'next/link'

export function UserMenu({ displayName, email, role, avatarUrl }: { displayName: string, email: string, role?: string, avatarUrl?: string | null }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLogoutPending, setIsLogoutPending] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-4 pr-1.5 py-1.5 bg-white rounded-md text-sm font-medium text-[#1f1f1f] hover:bg-[#fbfcfd] transition border border-[#ededed] cursor-pointer"
            >
                {displayName}
                {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-md object-cover" />
                ) : (
                    <div className="w-8 h-8 rounded-md bg-[#d81b60] text-white flex items-center justify-center text-xs font-bold">{displayName.charAt(0)}</div>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-[24px] shadow-sm border border-[#ededed] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-[#e1e5ea] bg-gradient-to-br from-[#f0f4f9] to-white">
                        <div className="flex items-center gap-3">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-md object-cover shrink-0 shadow-inner" />
                            ) : (
                                <div className="w-12 h-12 rounded-md bg-[#d81b60] text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-inner">
                                    {displayName.charAt(0)}
                                </div>
                            )}
                            <div className="overflow-hidden">
                                <p className="font-semibold text-[#1f1f1f] truncate text-base">{displayName}</p>
                                <p className="text-xs text-[#878787] truncate mt-0.5">{email}</p>
                            </div>
                        </div>
                        {role && (
                            <div className="mt-3 flex items-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${role === 'union_admin' || role === 'super_admin'
                                    ? 'bg-blue-100 text-[#1a73e8] border border-blue-200'
                                    : 'bg-green-100 text-green-700 border border-green-200'
                                    }`}>
                                    {role === 'super_admin' || role === 'union_admin' ? <Shield size={12} /> : <CheckCircle2 size={12} />}
                                    {role === 'super_admin' ? 'Super Admin' : role === 'union_admin' ? '管理者 (Admin)' : 'スタッフ (Staff)'}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="p-2 flex flex-col gap-1">
                        <Link
                            href="/settings/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-[#fbfcfd] text-sm font-medium text-[#1f1f1f] transition-colors text-left w-full"
                        >
                            <User size={18} className="text-[#878787]" />
                            プロフィール設定
                        </Link>
                        <Link
                            href="/settings/system"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-[#fbfcfd] text-sm font-medium text-[#1f1f1f] transition-colors text-left w-full"
                        >
                            <Settings size={18} className="text-[#878787]" />
                            システム設定
                        </Link>
                    </div>

                    <div className="p-2 border-t border-[#e1e5ea] bg-red-50/30">
                        <button
                            disabled={isLogoutPending}
                            onClick={async () => {
                                setIsLogoutPending(true)
                                await logout()
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-red-50 hover:text-red-700 text-sm font-bold text-red-600 transition-colors text-left w-full disabled:opacity-50"
                        >
                            <LogOut size={18} className="text-red-400" />
                            {isLogoutPending ? 'ログアウト中...' : 'ログアウト (Log Out)'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
