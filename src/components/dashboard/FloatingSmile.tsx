'use client';

import { useState, useEffect } from 'react';

export default function FloatingSmile() {
    const [position, setPosition] = useState({ left: 50, bottom: 15 });
    const [showMessage, setShowMessage] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Initialize random position strictly on client-side to prevent hydration mismatch
        setPosition({
            left: Math.random() * 80 + 10, // 10% to 90%
            bottom: Math.random() * 25 + 5 // 5% to 30%
        });
        setMounted(true);

        const interval = setInterval(() => {
            setPosition({
                left: Math.random() * 90, // 0% to 90%
                bottom: Math.random() * 35 + 5 // 5% to 40%
            });
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    const handleClick = () => {
        setShowMessage(true);
        setTimeout(() => {
            setShowMessage(false);
        }, 3000);
    };

    if (!mounted) return null;

    return (
        <div
            className="fixed z-40 transition-all duration-[6000ms] ease-in-out cursor-pointer hover:scale-110 flex flex-col items-center justify-center transform-gpu"
            style={{ left: `${position.left}%`, bottom: `${position.bottom}%` }}
            onClick={handleClick}
        >
            {showMessage && (
                <div className="absolute -top-12 whitespace-nowrap bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 shadow-none animate-in fade-in zoom-in duration-200">
                    お疲れ様です！✨
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-gray-300 rotate-45" />
                </div>
            )}
            <span className="text-[75px] text-yellow-400 shadow-none select-none leading-none">
                🙂
            </span>
        </div>
    );
}
