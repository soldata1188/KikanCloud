"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, Bot } from 'lucide-react';

interface AIChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

export default function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'assistant', content: 'こんにちは！KikanCloudのアシスタントです。何かお手伝いできることはありますか？' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userMsg.content })
            });

            const data = await res.json();

            if (res.ok && data.reply) {
                const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'エラーが発生しました。もう一度お試しください。' };
                setMessages(prev => [...prev, errorMsg]);
            }
        } catch (error) {
            const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '通信エラーが発生しました。' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-[400px] bg-white border-l border-gray-350 shadow-none z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="h-16 border-b border-gray-350 flex items-center justify-between px-5 shrink-0 bg-white">
                    <div className="flex items-center gap-2 text-gray-800">
                        <Sparkles className="text-primary-600" size={20} />
                        <h2 className="font-bold text-[15px]">AIアシスタント (Beta)</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                                    <Bot size={18} className="text-primary-600" />
                                </div>
                            )}

                            <div
                                className={`px-5 py-3 text-[14px] leading-relaxed whitespace-pre-wrap max-w-[85%] ${msg.role === 'user'
                                    ? 'bg-primary-600 text-white rounded-[32px] rounded-tr-sm'
                                    : 'bg-gray-50 text-gray-900 border border-gray-350 rounded-[32px] rounded-tl-sm'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                                <Bot size={18} className="text-primary-600" />
                            </div>
                            <div className="px-5 py-3 bg-gray-50 border border-gray-350 rounded-[32px] rounded-tl-sm flex items-center gap-2 text-gray-500 text-[14px]">
                                <Loader2 size={16} className="animate-spin" />
                                <span>AIが入力中...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-350 bg-white shrink-0">
                    <div className="relative flex items-end">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="AIに質問を入力..."
                            disabled={isLoading}
                            className="w-full min-h-[44px] max-h-32 resize-none bg-white border border-gray-350 focus:border-primary-500 rounded-[32px] py-3 pl-5 pr-12 text-[14px] outline-none transition-colors text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
                            rows={1}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-1.5 bottom-1.5 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={16} className="translate-x-px translate-y-px" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
