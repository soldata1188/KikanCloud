'use client'
import { useState } from 'react'
import { Logo } from './Logo'
import { BrandModal } from './BrandModal'

export function SidebarLogo() {
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)

    return (
        <>
            <div className="flex w-full items-center justify-start px-3 mb-6">
                <button
                    onClick={() => setIsBrandModalOpen(true)}
                    className="w-8 h-8 rounded-md hover:bg-[#1a2b32] transition-colors flex items-center justify-center p-0.5 focus:outline-none shrink-0"
                    title="About KikanCloud"
                >
                    <Logo className="w-6 h-6 shrink-0" variant="color" />
                </button>
                <div className="ml-3 font-semibold text-base tracking-tight text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 pointer-events-none">
                    KikanCloud
                </div>
            </div>
            <BrandModal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} />
        </>
    )
}
