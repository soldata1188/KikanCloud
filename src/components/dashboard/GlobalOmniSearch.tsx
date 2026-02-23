"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, User, Building2, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { globalOmniSearch, SearchResult } from "@/app/dashboard/searchAction";

export default function GlobalOmniSearch({ compact = false }: { compact?: boolean }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Handle click outside to close dropdown
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const data = await globalOmniSearch(query);
                setResults(data);
            } catch (err) {
                console.error(err);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const getIcon = (type: string) => {
        switch (type) {
            case "worker": return <User className="text-blue-500" size={18} />;
            case "company": return <Building2 className="text-green-500" size={18} />;
            case "chat": return <MessageSquare className="text-orange-500" size={18} />;
            default: return <Search className="text-gray-400" size={18} />;
        }
    };

    return (
        <div ref={wrapperRef} className={`relative w-full z-40 ${compact ? 'mx-0 mb-4' : 'max-w-3xl mx-auto mt-24 mb-8'}`}>
            <div className={`relative flex items-center bg-white border transition-all duration-300 rounded-[32px] overflow-hidden ${isFocused ? 'border-[#24b47e]' : 'border-gray-350'}`}>
                <div className={`${compact ? 'pl-3 pr-2' : 'pl-5 pr-3'} text-gray-400`}>
                    <Search size={compact ? 16 : 22} />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className={`flex-1 ${compact ? 'py-1.5 text-sm' : 'py-2.5 text-base sm:text-lg'} bg-transparent outline-none text-gray-900 font-medium`}
                />
                <div className={`${compact ? 'pr-3 w-8' : 'pr-6 w-12'} flex justify-center`}>
                    {isLoading && <Loader2 className="animate-spin text-[#24b47e]" size={compact ? 16 : 22} />}
                    {!isLoading && query && (
                        <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-700 transition-colors bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">×</button>
                    )}
                </div>
            </div>

            {/* Results Dropdown */}
            {isFocused && query.trim() !== "" && (
                <div className={`absolute left-0 right-0 ${compact ? 'bottom-[calc(100%+8px)] w-[260px]' : 'top-full mt-3 w-full'} bg-white border border-gray-200 rounded-[32px] shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50`}>
                    {results.length === 0 && !isLoading ? (
                        <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                            <Search size={32} className="opacity-20 mb-3" />
                            <p>「{query}」に一致する結果は見つかりませんでした。</p>
                        </div>
                    ) : (
                        <ul className="max-h-[360px] overflow-y-auto w-full">
                            {results.map((item, idx) => (
                                <li key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                                    <Link href={item.link} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 gap-3 group">
                                        <div className="flex items-start sm:items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 shrink-0 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center group-hover:bg-white group-hover:border-[#24b47e]/50 group-hover:shadow-sm transition-all duration-300">
                                                {getIcon(item.type)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`font-bold text-gray-900 truncate ${compact ? 'text-[13px]' : 'text-[15px]'}`}>{item.title}</span>
                                                <span className={`text-gray-500 font-medium truncate mt-0.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>{item.subtitle}</span>
                                            </div>
                                        </div>
                                        <div className="hidden sm:flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#24b47e] group-hover:text-white transition-colors duration-300 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                                            <ArrowRight size={16} />
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
