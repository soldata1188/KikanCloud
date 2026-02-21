'use client'
import { useRouter } from 'next/navigation'

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
            className="h-[32px] px-3 bg-white border border-gray-200 rounded-md text-[13px] text-[#1f1f1f] outline-none cursor-pointer hover:bg-gray-50 transition-colors"
        />
    )
}
