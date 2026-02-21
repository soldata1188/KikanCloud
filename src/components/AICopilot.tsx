'use client'

import { useState } from 'react'
import { Sparkles, Search } from 'lucide-react'

export function AICopilot() {
    const [query, setQuery] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        // MVP: Just alert the query for now. Later can connect to Server Action
        alert(`AIコパイロットへ送信: ${query}`)
        setQuery('')
    }

    return (
        <form onSubmit={handleSubmit} className="relative group w-full max-w-3xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Sparkles size={18} className="text-[#a1a1aa] group-focus-within:text-[#24b47e] transition-colors" />
            </div>

            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="例：今日は在留更新の手続きに集中したいです / 少し疲れています..."
                className="w-full pl-11 pr-[120px] py-3.5 bg-white border border-gray-200 rounded-[16px] text-[15px] text-[#1f1f1f] placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#24b47e] focus:ring-4 focus:ring-[#24b47e]/10 transition-all shadow-sm"
            />

            <button
                type="submit"
                disabled={!query.trim()}
                className="absolute inset-y-2 right-2 flex items-center gap-1.5 px-3 bg-[#24b47e] text-white rounded-xl text-[12px] font-bold tracking-wider opacity-90 hover:opacity-100 disabled:opacity-50 disabled:bg-gray-300 transition-all shadow-sm"
            >
                <Search size={14} /> AIモード
            </button>
        </form>
    )
}
