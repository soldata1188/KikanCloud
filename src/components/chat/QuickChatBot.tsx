"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const AnimatedSmile = () => (
    <svg viewBox="0 0 100 100" className="w-16 h-16 text-yellow-400 drop-shadow-sm transition-transform hover:scale-110 duration-300">
        <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes wink-chat {
                0%, 90%, 100% { transform: scaleY(1); }
                95% { transform: scaleY(0.1); }
            }
            .animate-wink-chat {
                animation: wink-chat 4s infinite;
                transform-origin: 35px 40px;
            }
            .animate-wink-right-chat {
                animation: wink-chat 4s infinite;
                transform-origin: 65px 40px;
            }
        `}} />
        <g>
            <circle cx="50" cy="50" r="45" fill="currentColor" />
            <circle cx="35" cy="40" r="7" fill="#1f2937" className="animate-wink-chat" />
            <circle cx="65" cy="40" r="7" fill="#1f2937" className="animate-wink-right-chat" />
            <path d="M 30 58 Q 50 80 70 58" fill="none" stroke="#1f2937" strokeWidth="7" strokeLinecap="round" />
            <circle cx="23" cy="52" r="7" fill="#ef4444" opacity="0.3" className="animate-wink-chat" />
            <circle cx="77" cy="52" r="7" fill="#ef4444" opacity="0.3" className="animate-wink-right-chat" />
        </g>
    </svg>
);

interface Message {
    role: "user" | "ai";
    content: string;
}

export function QuickChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        setInput("");

        // Add user message to state
        setMessages((prev) => [...prev, { role: "user", content: userText }]);
        setIsLoading(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userText }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [...prev, { role: "ai", content: data.reply || "エラーが発生しました。" }]);
            } else {
                setMessages((prev) => [...prev, { role: "ai", content: "エラーが発生しました。もう一度お試しください。" }]);
            }
        } catch (err) {
            console.error(err);
            setMessages((prev) => [...prev, { role: "ai", content: "通信エラーが発生しました。" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (pathname === '/') return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {isOpen && (
                <div className="w-80 sm:w-96 h-[400px] mb-4 bg-white border border-gray-350 shadow-none flex flex-col pointer-events-auto rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-350">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-[#24b47e]" />
                            <h3 className="font-bold text-[13px] text-gray-900">KikanCloud AI アシスタント</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-white" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 text-xs mt-4">
                                ご質問を入力してください。
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`max-w-[85%] px-4 py-2.5 text-[13px] break-words ${msg.role === "user"
                                    ? "self-end bg-gray-100 text-gray-800 rounded-[32px] rounded-br-sm border border-gray-200"
                                    : "self-start bg-[#24b47e]/10 text-gray-900 rounded-[32px] rounded-bl-sm border border-[#24b47e]/20"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="self-start px-4 py-2.5 text-[13px] bg-[#24b47e]/10 text-gray-900 rounded-[32px] rounded-bl-sm border border-[#24b47e]/20 flex items-center gap-2">
                                <span className="animate-pulse">考え中...</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-white border-t border-gray-350 flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="質問を入力..."
                            className="flex-1 text-[13px] border border-gray-350 rounded-[32px] px-4 py-2 outline-none focus:border-[#24b47e] transition-colors"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="bg-[#24b47e] hover:bg-[#1e9a6a] text-white px-4 py-2 rounded-[32px] text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                        >
                            <Send size={14} />
                            送信
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto focus:outline-none"
            >
                <AnimatedSmile />
            </button>
        </div>
    );
}
