'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, BrainCircuit } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { logout } from '@/app/login/actions';
import Link from 'next/link';

export function TopNav({ title, role }: { title?: string; role?: string }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initial = role ? role.charAt(0).toUpperCase() : 'U';

    return (
        <>
            {/* Fixed full-width bar: tràn sát lề trái, không bị overflow parent cắt */}
            <header
                className="fixed top-0 left-0 right-0 flex items-center z-[160]"
                style={{ height: 'var(--header-height)', background: 'var(--brand-primary)' }}
            >
                <div className="flex items-center justify-between w-full min-w-0 gap-4 h-full">
            {/* ── Logo sát lề trái ─────────────────────────────────────── */}
            <Link href="/" className="flex flex-col leading-none shrink-0 select-none pl-4 md:pl-5">
                <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-en)' }}>
                    KikanCloud
                </span>
                <span className="text-[10px] font-normal text-white/80 tracking-[0.12em] mt-0.5 hidden sm:block" style={{ fontFamily: 'var(--font-jp)' }}>
                    基幹管理システム
                </span>
            </Link>

            {/* ── Phải: Hộp tìm kiếm sát nút AI概要 + Avatar ───────────────── */}
            <div className="flex-1 flex items-center justify-end gap-2 min-w-0 pr-3 md:pr-4">
                <div className="w-full max-w-[260px]">
                    <GlobalSearch variant="dark" />
                </div>
                <Link
                    href="/chat"
                    className="hidden sm:inline-flex items-center gap-2 h-9 pl-3 pr-4 rounded-[32px] bg-white/20 hover:bg-white/30 text-white text-[13px] font-medium transition-colors"
                >
                    <BrainCircuit size={16} className="text-white shrink-0" />
                    AI概要
                </Link>

                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setDropdownOpen((v) => !v)}
                        className="w-10 h-10 rounded-full bg-white/25 hover:bg-white/35 flex items-center justify-center font-bold text-white text-sm select-none transition-colors border border-white/20"
                        aria-expanded={dropdownOpen}
                    >
                        {initial}
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-[200] anim-dropdown">
                            <div className="px-4 py-2.5 border-b border-gray-100">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">アカウント</p>
                                <p className="text-[13px] font-semibold text-gray-900 truncate mt-0.5">{role || 'ユーザー'}</p>
                            </div>
                            <Link
                                href="/settings"
                                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => setDropdownOpen(false)}
                            >
                                <Settings size={14} className="text-gray-400" />
                                設定
                            </Link>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (window.confirm('ログアウトしますか？')) await logout();
                                    setDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors text-left"
                            >
                                <LogOut size={14} />
                                ログアウト
                            </button>
                        </div>
                    )}
                </div>
            </div>
            </div>
            </header>
            {/* Spacer giữ flow: main content không bị che dưới header fixed */}
            <div aria-hidden className="shrink-0" style={{ height: 'var(--header-height)' }} />
        </>
    );
}
