'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function MonthFilter({ defaultValue }: { defaultValue: string }) {
    const router = useRouter()
    return (
        <input
            type="month"
            name="month"
            defaultValue={defaultValue}
            onChange={(e) => {
                const params = new URLSearchParams(window.location.search)
                params.set('month', e.target.value)
                router.push(`/audits?${params.toString()}`)
            }}
            className="px-4 py-2.5 bg-white border border-[#e1e5ea] rounded-[32px] text-sm text-[#444746] outline-none cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
        />
    )
}
