'use client'
import { useState } from 'react'
import { Logo } from './Logo'
import { BrandModal } from './BrandModal'

export function SidebarLogo() {
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)

    return (
        <>
            <div className="flex w-full items-center justify-center">
                <button
                    onClick={() => setIsBrandModalOpen(true)}
                    className="w-10 h-10 rounded-md hover:bg-white transition-colors flex items-center justify-center p-0.5 focus:outline-none shrink-0"
                    title="About KikanCloud"
                >
                    <Logo className="w-8 h-8 shrink-0" variant="color" />
                </button>
            </div>
            <BrandModal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} />
        </>
    )
}
