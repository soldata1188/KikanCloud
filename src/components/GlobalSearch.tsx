'use client'
import { useState, useEffect, useTransition, useRef } from 'react'
import { Search, Users, Building2, Loader2, X, ArrowRight } from 'lucide-react'
import { globalSearch } from '@/app/actions/search'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function GlobalSearch({ variant = 'dark' }: { variant?: 'light' | 'dark' }) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<{ workers: any[], companies: any[] }>({ workers: [], companies: [] })
    const [isPending, startTransition] = useTransition()
    const inputRef = useRef<HTMLInputElement>(null)
    const isLight = variant === 'light'

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setIsOpen((open) => !open); }
            if (e.key === 'Escape') setIsOpen(false)
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    useEffect(() => {
        if (isOpen) { setTimeout(() => inputRef.current?.focus(), 100); document.body.style.overflow = 'hidden' }
        else { document.body.style.overflow = 'unset'; setQuery(''); setResults({ workers: [], companies: [] }) }
    }, [isOpen])

    useEffect(() => {
        if (query.length >= 2) {
            startTransition(async () => {
                const res = await globalSearch(query)
                setResults(res)
            })
        } else {
            setResults({ workers: [], companies: [] })
        }
    }, [query])

    return (
        <>
            <div onClick={() => setIsOpen(true)} className="relative hidden md:block group cursor-pointer w-full max-w-[280px]">
                <div
                    className={`relative w-full h-9 rounded-[32px] flex items-center border transition-all ${isLight
                        ? 'bg-gray-100 border-gray-200 group-hover:bg-gray-200'
                        : 'bg-white/20 border-white/20 group-hover:bg-white/30 group-hover:border-white/30'
                    }`}
                >
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-gray-400 group-hover:text-gray-600' : 'text-white/80'}`} size={14} />
                    <span className={`pl-8 pr-14 text-[12px] truncate ${isLight ? 'text-gray-500' : 'text-white/80'}`}>労働者名、企業名で検索...</span>
                    <span className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[9px] font-mono ${isLight ? 'text-gray-400' : 'text-white/60'}`}>
                        <kbd className="rounded border border-white/30 bg-white/15 px-1 py-0.5">⌘</kbd>
                        <kbd className="rounded border border-white/30 bg-white/15 px-1 py-0.5">K</kbd>
                    </span>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-[#1f1f1f]/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)}>
                    <div className="w-full max-w-[600px] bg-white rounded-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center px-4 border-b border-[#ededed] relative">
                            <Search size={18} className="text-[#878787] shrink-0" />
                            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="実習生名、在留カード番号、または受入企業名..." className="w-full h-14 bg-transparent border-none outline-none px-3 text-base text-[#1f1f1f] placeholder:text-[#a0a0a0] font-sans" />
                            {isPending && <Loader2 size={16} className="animate-spin text-[#24b47e] absolute right-12" />}
                            <button onClick={() => setIsOpen(false)} className="p-1 text-[#878787] hover:bg-[#fbfcfd] rounded-md transition-colors"><X size={16} /></button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-2 bg-[#fbfcfd]">
                            {query.length < 2 && <div className="px-4 py-8 text-center text-[#878787] text-sm">全体検索には2文字以上入力してください...</div>}
                            {query.length >= 2 && results.workers.length === 0 && results.companies.length === 0 && !isPending && (
                                <div className="px-4 py-8 text-center text-[#878787] text-sm">
                                    検索結果が見つかりません: "{query}"
                                </div>
                            )}

                            {(results.workers.length > 0 || results.companies.length > 0) && (
                                <div className="space-y-4 p-2">
                                     {results.workers.length > 0 && (
                                        <div>
                                            <div className="px-3 py-1.5 text-xs font-bold text-[#878787] uppercase tracking-widest flex items-center gap-1.5"><Users size={12} /> 実習生 ({results.workers.length})</div>
                                            {results.workers.map(w => (
                                                <Link key={w.id} href={`/workers/${w.id}`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all">
                                                    <div className="flex-1"><div className="text-sm font-bold text-[#1f1f1f] group-hover:text-[#24b47e] transition-colors">{w.full_name_romaji}</div><div className="text-xs text-[#878787] font-mono mt-0.5">{w.residence_card_number || 'N/A'}</div></div>
                                                    <ArrowRight size={14} className="text-[#878787] opacity-0 group-hover:opacity-100 group-hover:text-[#24b47e] transition-all -translate-x-2 group-hover:translate-x-0" />
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                    {results.companies.length > 0 && (
                                        <div>
                                            <div className="px-3 py-1.5 text-xs font-bold text-[#878787] uppercase tracking-widest flex items-center gap-1.5"><Building2 size={12} /> 受入企業 ({results.companies.length})</div>
                                            {results.companies.map(c => (
                                                <Link key={c.id} href={`/companies/${c.id}`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all">
                                                    <div className="flex-1"><div className="text-sm font-bold text-[#1f1f1f] group-hover:text-[#24b47e] transition-colors">{c.name_jp}</div></div>
                                                    <ArrowRight size={14} className="text-[#878787] opacity-0 group-hover:opacity-100 group-hover:text-[#24b47e] transition-all -translate-x-2 group-hover:translate-x-0" />
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="bg-white border-t border-[#ededed] px-4 py-2 flex items-center justify-between text-xs text-[#878787] font-medium">
                            <span><kbd className="bg-white border border-[#ededed] px-1.5 py-0.5 rounded mr-1">ESC</kbd> で閉じる</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
