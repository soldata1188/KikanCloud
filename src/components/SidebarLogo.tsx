'use client'
import { useState } from 'react'
import { Logo } from './Logo'
import { BrandModal } from './BrandModal'

export function SidebarLogo() {
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)

    return (
        <>
            <div className="flex w-full items-center justify-center md:justify-start">
                <button
                    onClick={() => setIsBrandModalOpen(true)}
                    className="flex items-center gap-2.5 rounded-md hover:bg-gray-50 transition-colors focus:outline-none shrink-0 md:px-2 py-1.5 w-full justify-center md:justify-start"
                    title="About KikanCloud"
                >
                    <Logo className="w-7 h-7 shrink-0" variant="color" />
                    <span className="hidden md:flex items-center text-[17px] font-extrabold tracking-tight">
                        <span className="text-gray-800">Kikan</span>
                        <span className="text-[#24b47e]">Cloud</span>
                    </span>
                </button>
            </div>
            <BrandModal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} />
        </>
    )
}
