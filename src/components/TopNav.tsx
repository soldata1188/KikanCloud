'use client'
import { useState, useEffect } from 'react'
import { Bell, Sparkles, Clock } from 'lucide-react'
import { GlobalSearch } from './GlobalSearch'
import { usePathname } from 'next/navigation'
import AIChatSidebar from '@/components/ai/AIChatSidebar'

export function TopNav({ title, role }: { title: string, role?: string }) {
    const [isAIChatOpen, setIsAIChatOpen] = useState(false)
    const [timeStr, setTimeStr] = useState('')
    const [dateStr, setDateStr] = useState('')
    const pathname = usePathname()

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
        <>
            <header className="h-14 bg-[#fbfcfd] border-b border-gray-350 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0 w-full">
                <div className="flex items-center gap-2 text-[13px] font-sans pl-1">
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

                    {pathname !== '/' && (
                        <button
                            onClick={() => setIsAIChatOpen(true)}
                            className="relative cursor-pointer hover:bg-[#e8f5f0] p-1.5 rounded-md transition-colors border border-gray-350 bg-white"
                            title="AIアシスタント"
                        >
                            <Sparkles size={16} className="text-[#24b47e]" />
                        </button>
                    )}

                    <div className="relative cursor-pointer hover:bg-gray-50 p-1.5 rounded-md transition-colors border border-transparent">
                        <Bell size={16} className="text-[#878787]" />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#d93025] rounded-md border border-white"></span>
                    </div>


                </div>
            </header>

            <AIChatSidebar isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
        </>
    )
}