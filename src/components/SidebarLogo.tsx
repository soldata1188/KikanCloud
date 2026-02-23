'use client'
import { useState } from 'react'
import { BrandModal } from './BrandModal'

export function SidebarLogo() {
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)

    return (
        <>
            <div className="flex w-full items-center justify-center">
                <button
                    onClick={() => setIsBrandModalOpen(true)}
                    className="flex flex-col items-center justify-center cursor-pointer group focus:outline-none p-2 rounded-xl hover:bg-gray-50/50 transition-colors"
                    title="About KikanCloud"
                >
                    <span className="hidden md:flex items-center text-[15px] font-extrabold tracking-tight select-none transform transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">
                        <span className="text-gray-800">Kikan</span>
                        <span className="text-[#24b47e]">Cloud</span>
                    </span>
                    <span className="md:hidden flex items-center text-[12px] font-extrabold tracking-tight select-none transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5">
                        <span className="text-[#24b47e]">KC</span>
                    </span>

                    {/* Small underline/dot effect on hover */}
                    <span className="h-[3px] w-6 bg-gradient-to-r from-[#24b47e] to-[#1a8b60] rounded-full mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-x-0 group-hover:scale-x-100"></span>
                </button>
            </div>
            <BrandModal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} />
        </>
    )
}
