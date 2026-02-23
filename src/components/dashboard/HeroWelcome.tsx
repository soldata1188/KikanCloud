'use client'

import { useState, useEffect } from 'react'
import { MapPin, Sparkles } from 'lucide-react'

export default function HeroWelcome() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null)
    const [briefing, setBriefing] = useState<string>('')
    const [loadingBriefing, setLoadingBriefing] = useState<boolean>(true)

    useEffect(() => {
        // Init time
        setCurrentTime(new Date())
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        // Fetch briefing
        let isMounted = true
        let hasFetched = false

        const fetchBriefing = async () => {
            if (hasFetched) return
            hasFetched = true

            const hours = new Date().getHours()
            let fallback = 'お疲れ様です。'
            if (hours >= 5 && hours < 11) fallback = 'おはようございます。今日も一日頑張りましょう。'
            else if (hours >= 11 && hours < 18) fallback = 'お疲れ様です。午後の業務も頑張りましょう。'
            else fallback = '夜遅くまでお疲れ様です。'

            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 15000)

                const res = await fetch('/api/ai/briefing', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal
                })
                clearTimeout(timeoutId)

                if (res.ok) {
                    const data = await res.json()
                    if (isMounted) {
                        setBriefing(data.reply || fallback)
                    }
                } else {
                    if (isMounted) setBriefing(fallback)
                }
            } catch (err) {
                if (isMounted) {
                    setBriefing(fallback)
                }
            } finally {
                if (isMounted) setLoadingBriefing(false)
            }
        }

        fetchBriefing()

        return () => {
            isMounted = false
            clearInterval(timer)
        }
    }, [])

    if (!currentTime) return <div className="min-h-[200px] border border-gray-300 bg-white" /> // Client side hydration placeholder

    const timeStr = currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    const days = ['日', '月', '火', '水', '木', '金', '土']
    const dateStr = `${currentTime.getFullYear()}年${currentTime.getMonth() + 1}月${currentTime.getDate()}日 (${days[currentTime.getDay()]})`

    return (
        <div className="flex flex-col md:flex-row w-full bg-white border-t-8 border-b-4 border-l border-r border-[#1f1f1f] shadow-none relative">
            {/* Top Newspaper Label */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 border border-[#1f1f1f]">
                <span className="font-serif text-sm font-bold tracking-[0.2em] text-[#1f1f1f]">THE KIKAN CLOUD TIMES</span>
            </div>

            {/* Left Column (35%) */}
            <div className="w-full md:w-[35%] p-8 md:p-10 flex flex-col items-center justify-center text-center space-y-6 bg-white relative">
                <div className="text-gray-900 font-serif font-bold tracking-widest text-sm uppercase flex items-center gap-4 w-full">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <span>{dateStr}</span>
                    <div className="h-px bg-gray-300 flex-1"></div>
                </div>

                <div className="text-6xl md:text-7xl lg:text-8xl font-serif font-black text-[#1f1f1f] tracking-tighter">
                    {timeStr}
                </div>

                <div className="flex items-center justify-center gap-1.5 text-gray-500 text-sm font-bold pt-2 uppercase tracking-widest font-serif">
                    <MapPin size={16} className="text-[#1f1f1f]" />
                    <span>大阪府堺市</span>
                </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px bg-[#1f1f1f] my-6"></div>
            <div className="md:hidden h-px bg-[#1f1f1f] mx-6"></div>

            {/* Right Column (65%) */}
            <div className="w-full md:w-[65%] p-8 md:p-10 bg-white flex flex-col justify-center text-left">
                <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1f1f1f] pb-3">
                    <Sparkles className="text-[#1f1f1f]" size={24} />
                    <h2 className="text-[#1f1f1f] font-serif font-bold text-2xl md:text-3xl tracking-wide">Daily Briefing</h2>
                </div>

                <div className="min-h-[100px] font-serif">
                    {loadingBriefing ? (
                        <div className="space-y-4 pt-2">
                            <div className="h-4 bg-gray-200 rounded-none w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded-none w-full animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded-none w-5/6 animate-pulse"></div>
                        </div>
                    ) : (
                        <p className="text-[#1f1f1f] text-lg md:text-xl leading-loose font-medium whitespace-pre-wrap">
                            {briefing}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
