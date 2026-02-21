'use client'
import { useState } from 'react'
import { Logo } from './Logo'
import { BrandModal } from './BrandModal'

export function SidebarLogo() {
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsBrandModalOpen(true)}
                className="w-8 h-8 rounded-md mb-6 hover:bg-[#ededed] transition-colors flex items-center justify-center p-0.5 focus:outline-none"
                title="About KikanCloud"
            >
                <Logo className="w-6 h-6 shrink-0" variant="color" />
            </button>
            <BrandModal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} />
        </>
    )
}
