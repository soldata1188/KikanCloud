'use client'
import { Search, HelpCircle, User, Hexagon } from 'lucide-react'
import { NotificationBell } from './NotificationBell'

export function TopNav({ title, role }: { title: string, role?: string }) {
    return (
        <header className="h-14 bg-white border-b border-[#ededed] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0 w-full">
            <div className="flex items-center gap-2 text-[13px]">
                <div className="w-5 h-5 flex items-center justify-center bg-[#24b47e] text-white rounded"><Hexagon size={12} fill="currentColor" strokeWidth={0} /></div>
                <span className="text-[#878787]">/</span>
                <span className="font-medium text-[#1f1f1f]">KikanCloud</span>
                <span className="px-1.5 py-0.5 rounded border border-[#ededed] text-[10px] font-mono text-[#878787] uppercase tracking-wider ml-1 bg-[#fbfcfd]">FREE</span>
                <span className="text-[#878787] ml-1">/</span>
                <span className="text-[#1f1f1f]">{title}</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:block text-[13px] text-[#878787] hover:text-[#1f1f1f] cursor-pointer transition-colors mr-2">Feedback</div>
                <div className="relative hidden md:block group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#878787] group-focus-within:text-[#1f1f1f] transition-colors" size={14} />
                    <input type="text" placeholder="Search..." className="h-[30px] w-52 bg-[#fbfcfd] border border-[#ededed] rounded-md pl-8 pr-12 text-xs outline-none focus:border-[#878787] focus:bg-white transition-all text-[#1f1f1f] placeholder:text-[#878787]" />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[#878787] text-[10px] font-mono">
                        <span className="border border-[#ededed] bg-white rounded px-1 shadow-sm">⌘</span><span className="border border-[#ededed] bg-white rounded px-1 shadow-sm">K</span>
                    </div>
                </div>
                <HelpCircle size={18} className="text-[#878787] hover:text-[#1f1f1f] cursor-pointer transition-colors" strokeWidth={1.5} />
                {role && <NotificationBell role={role} />}
                <div className="w-7 h-7 rounded-full bg-[#fbfcfd] border border-[#ededed] text-[#878787] flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-[#fbfcfd]"><User size={14} /></div>
            </div>
        </header>
    )
}
