'use client'
import { useState, useEffect } from 'react'
import { User, Bell, LogOut, Clock, Hexagon, Settings } from 'lucide-react'
import { GlobalSearch } from './GlobalSearch'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Logo } from './Logo'
import { BrandModal } from './BrandModal'

export function TopNav({ title, role }: { title: string, role?: string }) {
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
    const [isAvatarOpen, setIsAvatarOpen] = useState(false)
    const [timeStr, setTimeStr] = useState('')
    const [dateStr, setDateStr] = useState('')
    const router = useRouter()

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

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <>
            <header className="h-14 bg-white border-b border-[#ededed] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0 w-full">
                <div className="flex items-center gap-2 text-[13px] font-sans">
                    <button onClick={() => setIsBrandModalOpen(true)} className="w-6 h-6 flex items-center justify-center text-[#24b47e] hover:scale-110 transition-transform cursor-pointer focus:outline-none" title="About KikanCloud">
                        <Logo className="w-5 h-5 shrink-0" />
                    </button>
                    <span className="text-[#878787] ml-1">/</span>
                    <span className="font-medium text-[#1f1f1f]">KikanCloud</span>
                    <span className="text-[#878787] ml-1">/</span>
                    <span className="text-[#1f1f1f] font-bold">{title}</span>
                </div>

                <div className="flex items-center gap-4">
                    {timeStr && (
                        <div className="hidden lg:flex items-center gap-2.5 select-none">
                            <Clock size={14} className="text-[#24b47e]" />
                            <span className="text-[11px] font-bold text-[#878787] uppercase tracking-widest">{dateStr}</span>
                            <span className="text-[#e0e0e0]">|</span>
                            <span className="text-[13px] font-black text-[#1f1f1f] font-mono tabular-nums tracking-tight">{timeStr}</span>
                        </div>
                    )}

                    <div className="w-px h-5 bg-[#ededed] hidden md:block mx-1"></div>

                    <GlobalSearch />

                    <div className="relative cursor-pointer hover:bg-gray-50 p-1.5 rounded-full transition-colors">
                        <Bell size={16} className="text-[#878787]" />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#d93025] rounded-full border border-white"></span>
                    </div>

                    <div className="relative">
                        <div onClick={() => setIsAvatarOpen(!isAvatarOpen)} className="w-8 h-8 rounded-full bg-[#fbfcfd] border border-[#ededed] text-[#878787] flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-gray-50 hover:text-[#1f1f1f] transition-colors shadow-sm"><User size={14} /></div>
                        {isAvatarOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsAvatarOpen(false)}></div>
                                <div className="absolute right-0 top-10 w-48 bg-white border border-[#ededed] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-2 border-b border-[#ededed] mb-1 bg-[#fbfcfd]">
                                        <p className="text-[10px] font-bold text-[#878787] uppercase tracking-widest">Signed in as</p>
                                        <p className="text-[12px] font-bold text-[#1f1f1f] truncate capitalize">{role?.replace('_', ' ') || 'User'}</p>
                                    </div>
                                    <button onClick={() => { setIsAvatarOpen(false); router.push('/accounts') }} className="w-full text-left px-4 py-2 text-[13px] font-medium text-[#444746] hover:bg-[#fbfcfd] hover:text-[#1f1f1f] flex items-center gap-2 transition-colors">
                                        <Settings size={14} /> Account Settings
                                    </button>
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-[#ededed] mt-1 pt-2">
                                        <LogOut size={14} /> サインアウト (Sign Out)
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>
            <BrandModal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} />
        </>
    )
}
