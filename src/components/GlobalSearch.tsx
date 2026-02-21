'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Search, Loader2, Building2, User, X } from 'lucide-react'
import { searchGlobal } from '@/app/actions/search'
import { useRouter } from 'next/navigation'

export function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<{ workers: any[], companies: any[] }>({ workers: [], companies: [] })
    const [isPending, startTransition] = useTransition()
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(true)
            }
            if (e.key === 'Escape') {
                setIsOpen(false)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            setTimeout(() => inputRef.current?.focus(), 100)
        } else {
            document.body.style.overflow = 'unset'
            setQuery('')
            setResults({ workers: [], companies: [] })
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) {
                startTransition(async () => {
                    const res = await searchGlobal(query)
                    setResults(res)
                })
            } else {
                setResults({ workers: [], companies: [] })
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (url: string) => {
        setIsOpen(false)
        router.push(url)
    }

    return (
        <>
            <div className="relative hidden md:block group cursor-pointer" onClick={() => setIsOpen(true)}>
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#878787] group-hover:text-[#1f1f1f] transition-colors" size={14} />
                <div className="h-[30px] w-52 bg-[#fbfcfd] border border-[#ededed] group-hover:border-[#878787] rounded-md pl-8 pr-12 flex items-center text-xs text-[#878787] transition-all">
                    検索...
                </div>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[#878787] text-[10px] font-mono">
                    <span className="border border-[#ededed] bg-white rounded px-1 shadow-sm">⌘</span><span className="border border-[#ededed] bg-white rounded px-1 shadow-sm">K</span>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-center items-start pt-[10vh] px-4 sm:px-6 bg-[#1f1f1f]/40 backdrop-blur-sm transition-colors duration-300" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}>
                    <div className="bg-white w-full max-w-[600px] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200">
                        <div className="flex items-center px-4 py-3 border-b border-[#ededed] gap-3">
                            <Search className="text-[#878787]" size={20} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="外国人材、受入企業を検索..."
                                className="flex-1 bg-transparent text-[15px] text-[#1f1f1f] outline-none placeholder:text-[#878787]"
                            />
                            {isPending ? <Loader2 size={18} className="text-[#878787] animate-spin" /> :
                                <button onClick={() => setIsOpen(false)} className="text-[#878787] hover:bg-[#fbfcfd] hover:text-[#1f1f1f] p-1 rounded-md transition-colors"><X size={18} /></button>}
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto w-full p-2 no-scrollbar">
                            {query.length > 0 && query.length < 2 && (
                                <div className="py-8 text-center text-[13px] text-[#878787]">
                                    2文字以上入力してください...
                                </div>
                            )}
                            {query.length >= 2 && results.workers.length === 0 && results.companies.length === 0 && !isPending && (
                                <div className="py-8 text-center text-[13px] text-[#878787]">
                                    「{query}」に一致する結果は見つかりませんでした。
                                </div>
                            )}

                            {(results.workers.length > 0 || results.companies.length > 0) && (
                                <div className="flex flex-col gap-4 py-2">
                                    {results.workers.length > 0 && (
                                        <div>
                                            <div className="px-3 py-1.5 text-[11px] font-bold text-[#878787] uppercase tracking-wider flex items-center gap-1.5">
                                                <User size={12} /> 外国人材 (Workers)
                                            </div>
                                            <div className="flex flex-col">
                                                {results.workers.map(w => (
                                                    <button key={w.id} onClick={() => handleSelect(`/workers/${w.id}`)} className="flex items-center justify-between w-full text-left px-4 py-2.5 rounded-md hover:bg-[#fbfcfd] group transition-colors">
                                                        <div>
                                                            <div className="text-[13px] font-medium text-[#1f1f1f] group-hover:text-[#24b47e] transition-colors">{w.full_name_romaji}</div>
                                                        </div>
                                                        <div className="text-[11px] text-[#878787] font-mono tracking-wider">{(w.companies as any)?.name_jp || '未設定'}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {results.workers.length > 0 && results.companies.length > 0 && <div className="h-px w-full bg-[#ededed] my-1"></div>}

                                    {results.companies.length > 0 && (
                                        <div>
                                            <div className="px-3 py-1.5 text-[11px] font-bold text-[#878787] uppercase tracking-wider flex items-center gap-1.5">
                                                <Building2 size={12} /> 受入企業 (Companies)
                                            </div>
                                            <div className="flex flex-col">
                                                {results.companies.map(c => (
                                                    <button key={c.id} onClick={() => handleSelect(`/companies/${c.id}/edit`)} className="flex items-center justify-between w-full text-left px-4 py-2.5 rounded-md hover:bg-[#fbfcfd] group transition-colors">
                                                        <div>
                                                            <div className="text-[13px] font-medium text-[#1f1f1f] group-hover:text-[#24b47e] transition-colors">{c.name_jp}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="px-4 py-3 bg-[#fbfcfd] border-t border-[#ededed] flex justify-between items-center text-[10px] text-[#878787] font-medium">
                            <span className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 rounded bg-white border border-[#ededed] shadow-sm font-mono leading-none">ESC</span> to cancel
                            </span>
                            <span className="flex items-center gap-1">
                                Search provided by <span className="font-bold text-[#24b47e]">KikanCloud AI</span>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
