'use client'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { GlobalSearch } from './GlobalSearch'
import AIChatSidebar from '@/components/ai/AIChatSidebar'

export function TopNav({ title, role }: { title: string, role?: string }) {
    const [isAIChatOpen, setIsAIChatOpen] = useState(false)

    return (
        <>
            <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-5 sticky top-0 z-40 shrink-0 w-full">
                {/* Left: breadcrumb (hidden on mobile) / page title (mobile) */}
                <div className="flex items-center gap-2 min-w-0">
                    {/* Desktop: KikanCloud / Title */}
                    <div className="hidden sm:flex items-center gap-1.5 text-[13px] font-sans">
                        <span className="font-medium text-slate-500">KikanCloud</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-800 font-bold">{title}</span>
                    </div>
                    {/* Mobile: just the title, prominent */}
                    <span className="sm:hidden text-[15px] font-black text-slate-800 truncate">{title}</span>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2">
                    {/* Search — hidden on small mobile, shown on sm+ */}
                    <div className="hidden sm:block">
                        <GlobalSearch />
                    </div>

                    {/* AI chat button */}
                    <button
                        onClick={() => setIsAIChatOpen(true)}
                        className="cursor-pointer p-2 rounded-xl transition-colors border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 active:scale-95"
                        title="AIアシスタント"
                    >
                        <Sparkles size={16} className="text-[#24b47e]" />
                    </button>
                </div>
            </header>

            <AIChatSidebar isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
        </>
    )
}