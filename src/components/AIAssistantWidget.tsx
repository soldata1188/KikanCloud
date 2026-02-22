'use client'
import { useState } from 'react'
import { Bot, Sparkles, X, Send, Trash2, User } from 'lucide-react'

type Message = {
    id: string
    role: 'ai' | 'user'
    content: string
}

const TypingIndicator = () => (
    <div className="flex items-center gap-2 max-w-[85%]">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={14} className="text-white" />
        </div>
        <div className="bg-gray-100 border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center space-x-1.5 w-fit h-[38px]">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
    </div>
)

export function AIAssistantWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'ai',
            content: 'こんにちは！KikanCloudのAIアシスタントです。本日はどのようなご用件でしょうか？'
        }
    ])

    const toggleChat = () => setIsOpen(!isOpen)

    const clearChat = () => {
        setMessages([
            {
                id: Date.now().toString(),
                role: 'ai',
                content: 'チャット履歴を削除しました。こんにちは！KikanCloudのAIアシスタントです。本日はどのようなご用件でしょうか？'
            }
        ])
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim()) return

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue }
        setMessages(prev => [...prev, userMsg])
        setInputValue('')

        // Bật trạng thái AI đang gõ
        setIsTyping(true)

        try {
            // Định dạng lại lịch sử chat để gửi cho API (Loại bỏ câu chào mặc định ban đầu)
            const chatHistory = [...messages, userMsg]
                .filter(m => m.id !== 'welcome')
                .map(m => ({
                    role: m.role === 'ai' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }))

            // Gọi API Backend (Internal Route)
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            })

            if (!res.ok) throw new Error('API Error')

            const data = await res.json()

            // Nhận kết quả và chèn tin nhắn của AI vào giao diện
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
            // Tắt hiệu ứng đánh máy
            setIsTyping(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            <div
                className={`
                    mb-4 w-full sm:w-[360px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right
                    ${isOpen ? 'opacity-100 scale-100 translate-y-0 h-[550px]' : 'opacity-0 scale-95 translate-y-4 h-0 pointer-events-none'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-2xl text-white shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-bold leading-none mb-1">KikanCloud AI</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                <span className="text-[11px] text-indigo-100">Online</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={clearChat}
                            title="履歴を削除"
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-indigo-100 hover:text-white"
                        >
                            <Trash2 size={16} />
                        </button>
                        <button
                            onClick={toggleChat}
                            title="最小化"
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-indigo-100 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body - Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                        >
                            {msg.role === 'ai' && (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                            )}
                            {msg.role === 'user' && (
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                                    <User size={14} className="text-gray-500" />
                                </div>
                            )}
                            <div
                                className={`text-[13px] px-3.5 py-2.5 shadow-sm leading-relaxed
                                    ${msg.role === 'user'
                                        ? 'bg-[#24b47e] text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-white border border-gray-100 text-[#1f1f1f] rounded-2xl rounded-tl-sm'
                                    }
                                `}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTyping && <TypingIndicator />}
                </div>

                {/* Footer - Input Area */}
                <div className="p-3 bg-white border-t border-gray-100 rounded-b-2xl shrink-0">
                    <form onSubmit={handleSend} className="flex items-center gap-2 relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isTyping}
                            placeholder="KikanCloud AI に質問する..."
                            className="flex-1 bg-gray-50 border border-gray-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-full pl-4 pr-11 py-2.5 text-[13px] text-[#1f1f1f] outline-none transition-all disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isTyping}
                            className={`absolute right-1.5 p-1.5 rounded-full transition-all duration-200
                                ${inputValue.trim() && !isTyping
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                            `}
                        >
                            <Send size={16} className="ml-0.5" />
                        </button>
                    </form>
                    <div className="text-center mt-2">
                        <span className="text-[9px] text-gray-400">AIは不正確な情報を生成する可能性があります。</span>
                    </div>
                </div>
            </div>

            {/* Bubble Button */}
            <button
                onClick={toggleChat}
                className={`
                    w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:scale-105 active:scale-95 group relative
                    ${isOpen ? 'bg-indigo-600 text-white rotate-90' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 text-white rotate-0'}
                `}
            >
                {isOpen ? (
                    <X size={24} className="transition-transform duration-300" />
                ) : (
                    <>
                        <Sparkles size={24} className="transition-transform duration-300 group-hover:scale-110" />
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span>
                        </span>
                    </>
                )}
            </button>
        </div>
    )
}
