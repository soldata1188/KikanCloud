'use client'
import { useState } from 'react'
import { Bell, Sparkles } from 'lucide-react'
import { GlobalSearch } from './GlobalSearch'
import { usePathname } from 'next/navigation'
import AIChatSidebar from '@/components/ai/AIChatSidebar'

export function TopNav({ title, role }: { title: string, role?: string }) {
    const [isAIChatOpen, setIsAIChatOpen] = useState(false)
    const pathname = usePathname()
    return (
        <>
            <header className="h-10 bg-[#fbfcfd] border-b border-gray-350 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0 w-full">
                <div className="flex items-center gap-2 text-[13px] font-sans pl-1">
                    <span className="font-medium text-[#1f1f1f]">KikanCloud</span>
                    <span className="text-[#878787] ml-1">/</span>
                    <span className="text-[#1f1f1f] font-bold">{title}</span>
                </div>

                <div className="flex items-center gap-4">
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