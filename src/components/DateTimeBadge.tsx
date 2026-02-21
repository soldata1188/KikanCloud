'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export function DateTimeBadge() {
    const [timeStr, setTimeStr] = useState('')
    const [dateStr, setDateStr] = useState('')

    useEffect(() => {
        const updateTime = () => {
            const now = new Date()

            // Format: 2026年02月22日 (日)
            const dStr = now.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
            })

            // Format: 01:05
            const tStr = now.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
            })

            setDateStr(dStr)
            setTimeStr(tStr)
        }

        updateTime()
        const interval = setInterval(updateTime, 1000)
        return () => clearInterval(interval)
    }, [])

    // Suppress hydration mismatch by only rendering after client mount
    if (!dateStr) return <div className="h-[24px] mb-4"></div>

    return (
        <div className="inline-flex items-center gap-2.5 text-[14px] font-bold tracking-wider text-[#666666] mb-4">
            <Clock size={16} className="text-[#24b47e]" />
            <span>{dateStr}</span>
            <span className="text-[#a1a1aa] mx-1">|</span>
            <span className="text-[#1f1f1f]">{timeStr}</span>
        </div>
    )
}
