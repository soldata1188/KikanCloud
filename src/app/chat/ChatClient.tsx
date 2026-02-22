'use client'
import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, User, MessageSquarePlus, Trash2, Search, Settings } from 'lucide-react'

type Message = {
    id: string
    role: 'ai' | 'user'
    content: string
}

const TypingIndicator = () => (
    <div className="flex items-center gap-2 max-w-[85%] self-start">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
            <Sparkles size={16} className="text-white" />
        </div>
        <div className="bg-white border border-gray-200 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-1.5 h-[48px] w-fit">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
    </div>
)

export default function ChatClient() {
    const [isTyping, setIsTyping] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'ai',
            content: 'こんにちは！KikanCloudのAIアシスタントです。\nどのようなご用件でしょうか？サポートが必要な内容を入力してください。'
        }
    ])
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!inputValue.trim()) return

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue }
        setMessages(prev => [...prev, userMsg])
        setInputValue('')

        setIsTyping(true)

        try {
            const chatHistory = [...messages, userMsg]
                .filter(m => m.id !== 'welcome')
                .map(m => ({
                    role: m.role === 'ai' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }))

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            })

            if (!res.ok) throw new Error('API Error')

            const data = await res.json()

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'ai',
                content: data.reply || '申し訳ありませんが、このメッセージを処理できません。'
            }])
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'ai',
                content: 'AIサーバー接続エラー（またはGEMINI_API_KEY未設定）が発生しました。設定を確認して再試行してください！'
            }])
        } finally {
            setIsTyping(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        if (confirm('チャット履歴を削除しますか？')) {
            setMessages([
                {
                    id: Date.now().toString(),
                    role: 'ai',
                    content: 'チャット履歴を削除しました。こんにちは！KikanCloudのAIアシスタントです。本日はどのようなご用件でしょうか？'
                }
            ])
        }
    }

    return (
        <main className="flex-1 flex overflow-hidden bg-white">
            {/* Left Column: Chat History Menu */}
            <div className="w-[300px] bg-[#fbfcfd] border-r border-[#e5e7eb] flex flex-col shrink-0">
                <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
                    <h2 className="font-bold text-[#1f1f1f] flex items-center gap-2">
                        <MessageSquarePlus size={18} className="text-[#24b47e]" />
                        チャット履歴
                    </h2>
                </div>
                <div className="p-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
                        <input
                            type="text"
                            placeholder="検索..."
                            className="w-full pl-9 pr-3 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] outline-none transition-shadow text-[#1f1f1f] placeholder:text-[#878787]"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <button className="w-full text-left p-3 rounded-lg bg-[#e8f5f0] border border-[#24b47e]/30 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-[#1f1f1f] truncate">現在のセッション</span>
                            <span className="text-[10px] text-[#24b47e] shrink-0 font-medium">Now</span>
                        </div>
                        <p className="text-xs text-[#878787] truncate">KikanCloud AIとのチャット</p>
                    </button>
                    {/* Fake old histories */}
                    <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors border border-transparent">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#1f1f1f] truncate">ビザ更新についての相談</span>
                            <span className="text-[10px] text-[#878787] shrink-0">昨日</span>
                        </div>
                        <p className="text-xs text-[#878787] truncate">AI: 更新手続きには以下の書類が...</p>
                    </button>
                </div>
                <div className="p-4 border-t border-[#e5e7eb] mt-auto">
                    <button className="w-full flex items-center gap-2 text-sm text-[#878787] hover:text-[#1f1f1f] transition-colors p-2 rounded-lg hover:bg-gray-100">
                        <Settings size={18} />
                        AI 設定
                    </button>
                </div>
            </div>

            {/* Right Column: Main Chat Window */}
            <div className="flex-1 flex flex-col bg-white relative">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-[#e5e7eb] bg-white z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[#1f1f1f] leading-none mb-1">KikanCloud AI</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs text-gray-500">オンライン</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={clearChat}
                        className="px-3 py-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium border border-red-100"
                    >
                        <Trash2 size={16} />
                        クリア
                    </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-start gap-4 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                        >
                            {msg.role === 'ai' && (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                                    <Sparkles size={16} className="text-white" />
                                </div>
                            )}
                            {msg.role === 'user' && (
                                <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 shadow-sm mt-1">
                                    <User size={18} className="text-gray-500" />
                                </div>
                            )}
                            <div
                                className={`text-[15px] px-6 py-4 shadow-sm leading-relaxed whitespace-pre-wrap
                                    ${msg.role === 'user'
                                        ? 'bg-[#24b47e] text-white rounded-3xl rounded-tr-sm'
                                        : 'bg-white border border-[#e5e7eb] text-[#1f1f1f] rounded-3xl rounded-tl-sm'
                                    }
                                `}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Footer */}
                <div className="p-4 md:p-6 bg-white border-t border-[#e5e7eb] shrink-0">
                    <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2.5 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all shadow-sm">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isTyping}
                            placeholder="AIにメッセージを送信... (Enterで送信, Shift+Enterで改行)"
                            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none px-3 py-2.5 text-[15px] text-[#1f1f1f] outline-none disabled:opacity-50"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isTyping}
                            className={`p-3.5 rounded-xl shrink-0 transition-all duration-200 shadow-sm mb-0.5
                                ${inputValue.trim() && !isTyping
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:opacity-90 hover:scale-[1.02] active:scale-95'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                            `}
                        >
                            <Send size={18} className="translate-x-0.5" />
                        </button>
                    </div>
                    <div className="text-center mt-3">
                        <span className="text-[12px] text-gray-400 tracking-wide">KikanCloud AI は不正確な情報を生成する可能性があります。重要な情報は必ず確認してください。</span>
                    </div>
                </div>
            </div>
        </main>
    )
}
