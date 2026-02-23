"use client";

import React, { useState, useEffect } from "react";
import { Cloud } from "lucide-react";


export default function GreetingBanner({ displayName }: { displayName: string }) {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [briefing, setBriefing] = useState<string>("");
    const [loadingBriefing, setLoadingBriefing] = useState<boolean>(true);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        let isMounted = true;
        let hasFetched = false;

        const fetchBriefing = async () => {
            if (hasFetched) return;
            hasFetched = true;

            const hours = new Date().getHours();
            let fallback = "お疲れ様です。";
            if (hours >= 5 && hours < 11) fallback = "おはようございます。今日も一日頑張りましょう。";
            else if (hours >= 11 && hours < 18) fallback = "お疲れ様です。午後の業務も頑張りましょう。";
            else fallback = "夜遅くまでお疲れ様です。";

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const res = await fetch("/api/ai/briefing", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setBriefing(data.reply || fallback);
                } else {
                    if (isMounted) setBriefing(fallback);
                }
            } catch (err) {
                if (isMounted) setBriefing(fallback);
            } finally {
                if (isMounted) setLoadingBriefing(false);
            }
        };

        fetchBriefing();

        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, []);

    if (!currentTime) return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 opacity-50">
            <div className="flex items-start gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                        こんにちは、{displayName}さん！
                    </h1>
                    <div className="h-5 w-64 bg-gray-200 rounded-full mt-3 animate-pulse"></div>
                </div>
            </div>
        </div>
    );

    const timeStr = currentTime.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    const dateStr = `${currentTime.getFullYear()}年${currentTime.getMonth() + 1}月${currentTime.getDate()}日 (${days[currentTime.getDay()]})`;

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-2">
            {/* Left Box: AI Greeting */}
            <div className="flex items-start gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                        こんにちは、{displayName}さん！
                    </h1>
                    {loadingBriefing ? (
                        <div className="h-5 w-72 bg-gray-200 rounded-full mt-3 animate-pulse"></div>
                    ) : (
                        <p className="text-gray-600 font-medium mt-2 leading-relaxed text-lg max-w-3xl">{briefing}</p>
                    )}
                </div>
            </div>

            {/* Right Box: Weather and Date */}
            <div className="flex flex-row md:flex-col items-center justify-end gap-4 md:gap-1 text-right shrink-0">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100">
                    <Cloud className="text-blue-500" size={20} />
                    <div className="text-left">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">大阪府堺市</div>
                        <div className="font-extrabold text-lg text-gray-900 leading-none">12°C <span className="text-sm text-gray-400 font-medium">晴れ</span></div>
                    </div>
                </div>

                <div className="px-4 py-2 flex flex-col items-end justify-center rounded-2xl">
                    <div className="text-3xl font-extrabold text-gray-900 tracking-tighter tabular-nums leading-none">
                        {timeStr}
                    </div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                        {dateStr}
                    </div>
                </div>
            </div>
        </div>
    );
}
