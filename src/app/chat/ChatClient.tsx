'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Send, User, MessageSquarePlus, Trash2, Search, Settings, Plus } from 'lucide-react'

type Message = {
 id: string
 role: 'ai' | 'user'
 content: string
}

type ChatSession = {
 id: string
 title: string
 messages: Message[]
 updatedAt: number
}

const TypingIndicator = () => (
 <div className="flex items-center gap-2 max-w-[85%] self-start">
 <div className="w-9 h-9 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-1">
 <Sparkles size={16} className="text-white"/>
 </div>
 <div className="bg-white border border-gray-350 px-5 py-4 rounded-md rounded-tl-sm flex items-center space-x-1.5 h-[48px] w-fit">
 <div className="w-1.5 h-1.5 bg-gray-400 rounded-md animate-bounce"style={{ animationDelay: '0ms' }}></div>
 <div className="w-1.5 h-1.5 bg-gray-400 rounded-md animate-bounce"style={{ animationDelay: '150ms' }}></div>
 <div className="w-1.5 h-1.5 bg-gray-400 rounded-md animate-bounce"style={{ animationDelay: '300ms' }}></div>
 </div>
 </div>
)

export default function ChatClient() {
 const [isTyping, setIsTyping] = useState(false)
 const [inputValue, setInputValue] = useState('')
 const [searchQuery, setSearchQuery] = useState('')

 // Session State
 const [sessions, setSessions] = useState<ChatSession[]>([])
 const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
 const [isClient, setIsClient] = useState(false) // hydration fix

 const messagesEndRef = useRef<HTMLDivElement>(null)

 // Helper functions
 const createNewSession = useCallback(() => {
 const newSession: ChatSession = {
 id: Date.now().toString(),
 title: '新しいチャット',
 messages: [{
 id: 'welcome',
 role: 'ai',
 content: 'こんにちは！KikanCloudのAIアシスタントです。\nどのようなご用件でしょうか？サポートが必要な内容を入力してください。'
 }],
 updatedAt: Date.now()
 }
 setSessions(prev => [newSession, ...prev])
 setCurrentSessionId(newSession.id)
 }, [])

 // Initialize & Load from localStorage with 30-day retention policy
 useEffect(() => {
 setIsClient(true)
 const saved = localStorage.getItem('kikan_ai_chats')
 if (saved) {
 try {
 const parsed: ChatSession[] = JSON.parse(saved)
 const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
 const now = Date.now()
 // Auto-delete sessions older than 30 days
 const validSessions = parsed.filter(s => (now - s.updatedAt) < thirtyDaysMs)

 if (validSessions.length > 0) {
 // Sort descending
 validSessions.sort((a, b) => b.updatedAt - a.updatedAt)
 setSessions(validSessions)
 setCurrentSessionId(validSessions[0].id)
 } else {
 createNewSession()
 }
 } catch (error) {
 console.error("Error parsing chat history", error)
 createNewSession()
 }
 } else {
 createNewSession()
 }
 }, [createNewSession])

 // Save to localStorage when sessions change
 useEffect(() => {
 if (isClient && sessions.length > 0) {
 localStorage.setItem('kikan_ai_chats', JSON.stringify(sessions))
 }
 }, [sessions, isClient])

 const currentSession = sessions.find(s => s.id === currentSessionId)
 const messages = currentSession?.messages || []

 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
 }

 useEffect(() => {
 scrollToBottom()
 }, [messages, isTyping])

 const handleSend = async (e?: React.FormEvent) => {
 if (e) e.preventDefault()
 if (!inputValue.trim() || !currentSessionId) return

 const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue }
 const currentRefMessages = [...messages]

 // Update user message first
 setSessions(prev =>
 prev.map(s => {
 if (s.id === currentSessionId) {
 const newMessages = [...s.messages, userMsg];
 // Update title if it's the very first user message
 const title = s.messages.length === 1 ? inputValue.slice(0, 25) + (inputValue.length > 25 ? '...' : '') : s.title;
 return { ...s, messages: newMessages, title, updatedAt: Date.now() }
 }
 return s
 }).sort((a, b) => b.updatedAt - a.updatedAt)
 )

 setInputValue('')
 setIsTyping(true)

 try {
 const chatHistory = [...currentRefMessages, userMsg]
 .filter(m => m.id !== 'welcome' && !m.content.includes('AIサーバー接続エラー'))
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

 // Update AI reply
 setSessions(prev =>
 prev.map(s => {
 if (s.id === currentSessionId) {
 return {
 ...s,
 messages: [...s.messages, { id: Date.now().toString(), role: 'ai', content: data.reply || '申し訳ありませんが、このメッセージを処理できません。' }],
 updatedAt: Date.now()
 }
 }
 return s
 })
 )
 } catch (error) {
 console.error('Chat error:', error)
 setSessions(prev =>
 prev.map(s => {
 if (s.id === currentSessionId) {
 return {
 ...s,
 messages: [...s.messages, { id: Date.now().toString(), role: 'ai', content: 'AIサーバー接続エラー（またはGEMINI_API_KEY未設定）が発生しました。設定を確認して再試行してください！' }],
 updatedAt: Date.now()
 }
 }
 return s
 })
 )
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

 const clearCurrentChat = () => {
 if (confirm('現在のチャット履歴を削除しますか？')) {
 setSessions(prev =>
 prev.map(s => {
 if (s.id === currentSessionId) {
 return {
 ...s,
 messages: [{
 id: Date.now().toString(),
 role: 'ai',
 content: 'チャット履歴を削除しました。こんにちは！KikanCloudのAIアシスタントです。本日はどのようなご用件でしょうか？'
 }],
 updatedAt: Date.now()
 }
 }
 return s
 })
 )
 }
 }

 const deleteSession = (e: React.MouseEvent, id: string) => {
 e.stopPropagation()
 if (confirm('このチャットを完全に削除しますか？')) {
 setSessions(prev => {
 const nextSessions = prev.filter(s => s.id !== id)
 if (nextSessions.length === 0) {
 setTimeout(() => createNewSession(), 0)
 } else if (currentSessionId === id && nextSessions.length > 0) {
 setCurrentSessionId(nextSessions[0].id)
 }
 return nextSessions
 })
 }
 }

 const filteredSessions = sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))

 const formatDate = (ms: number) => {
 const date = new Date(ms);
 return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
 }

 if (!isClient) return null // handle hydration

 return (
 <main className="flex-1 flex overflow-hidden bg-white">
 {/* Left Column: Chat History Menu */}
 <div className="w-[300px] bg-[#fbfcfd] border-r border-[#e5e7eb] flex flex-col shrink-0">
 <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
 <h2 className="font-bold text-[#1f1f1f] flex items-center gap-2">
 <MessageSquarePlus size={18} className="text-[#24b47e]"/>
 チャット履歴
 </h2>
 <button
 onClick={createNewSession}
 className="p-1.5 bg-[#24b47e]/10 text-[#24b47e] hover:bg-[#24b47e]/20 rounded-md transition-colors"
 title="新しいチャット"
 >
 <Plus size={18} />
 </button>
 </div>
 <div className="p-3">
 <button
 onClick={createNewSession}
 className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-[#24b47e] text-[#24b47e] font-medium text-sm rounded-lg hover:bg-[#e8f5f0] transition-colors mb-3"
 >
 <Plus size={16} /> 新しいチャット
 </button>
 <div className="relative">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]"/>
 <input
 type="text"
 placeholder="検索..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-3 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e] outline-none transition- text-[#1f1f1f] placeholder:text-[#878787]"
 />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-2 space-y-1">
 {filteredSessions.map(session => (
 <button
 key={session.id}
 onClick={() => setCurrentSessionId(session.id)}
 className={`w-full text-left p-3 rounded-lg transition-colors border group relative
 ${currentSessionId === session.id
 ? 'bg-[#e8f5f0] border-[#24b47e]/30'
 : 'hover:bg-gray-100 border-gray-350'}
`}
 >
 <div className="flex items-center justify-between mb-1 pr-6">
 <span className={`text-sm ${currentSessionId === session.id ? 'font-semibold text-[#1f1f1f]' : 'font-medium text-[#1f1f1f]'} truncate`}>
 {session.title}
 </span>
 <span className={`text-[10px] shrink-0 ${currentSessionId === session.id ? 'text-[#24b47e] font-medium' : 'text-[#878787]'}`}>
 {formatDate(session.updatedAt)}
 </span>
 </div>
 <p className="text-xs text-[#878787] truncate pr-6">
 {session.messages[session.messages.length - 1].content.replace(/\n/g, ' ')}
 </p>
 {/* Delete specific session button */}
 <div
 onClick={(e) => deleteSession(e, session.id)}
 className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-md transition-all
 ${currentSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
`}
 title="このチャットを削除"
 >
 <Trash2 size={14} />
 </div>
 </button>
 ))}
 {filteredSessions.length === 0 && (
 <div className="text-center p-4 text-xs text-gray-400">
 履歴が見つかりません
 </div>
 )}
 </div>
 <div className="p-4 border-t border-[#e5e7eb] mt-auto">
 <button className="w-full flex items-center gap-2 text-sm text-[#878787] hover:text-[#1f1f1f] transition-colors p-2 rounded-lg hover:bg-gray-100">
 <Settings size={18} />
 AI 設定
 </button>
 <p className="text-[10px] text-gray-400 text-center mt-2">※ 履歴は30日間保存されます</p>
 </div>
 </div>

 {/* Right Column: Main Chat Window */}
 <div className="flex-1 flex flex-col bg-white relative">
 {/* Header */}
 <div className="h-16 flex items-center justify-between px-6 border-b border-[#e5e7eb] bg-white z-10 shrink-0">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
 <Sparkles size={18} className="text-white"/>
 </div>
 <div>
 <h3 className="text-base font-bold text-[#1f1f1f] leading-none mb-1">
 {currentSession?.title || 'KikanCloud AI'}
 </h3>
 <div className="flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-md bg-primary-500 animate-pulse"></span>
 <span className="text-xs text-gray-500">オンライン</span>
 </div>
 </div>
 </div>
 <button
 onClick={clearCurrentChat}
 className="px-3 py-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium border border-red-100"
 >
 <Trash2 size={14} />
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
 <div className="w-9 h-9 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-1">
 <Sparkles size={16} className="text-white"/>
 </div>
 )}
 {msg.role === 'user' && (
 <div className="w-9 h-9 rounded-md bg-gray-100 border border-gray-350 flex items-center justify-center shrink-0 mt-1">
 <User size={18} className="text-gray-500"/>
 </div>
 )}
 <div
 className={`text-[15px] px-6 py-4 leading-relaxed whitespace-pre-wrap
 ${msg.role === 'user'
 ? 'bg-[#24b47e] text-white rounded-md rounded-tr-sm'
 : 'bg-white border border-[#e5e7eb] text-[#1f1f1f] rounded-md rounded-tl-sm'
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
 <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-white border border-gray-350 rounded-[32px] p-2 focus-within:ring-2 focus-within:ring-[#24b47e]/20 focus-within:border-[#24b47e] transition-all">
 <textarea
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 onKeyDown={handleKeyDown}
 disabled={isTyping}
 placeholder="AIにメッセージを送信... (Enterで送信, Shift+Enterで改行)"
 className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none px-4 py-3 text-[15px] text-[#1f1f1f] outline-none disabled:opacity-50"
 rows={1}
 />
 <button
 onClick={handleSend}
 disabled={!inputValue.trim() || isTyping}
 className={`p-3.5 rounded-[24px] shrink-0 transition-all duration-200 ${inputValue.trim() && !isTyping
 ? 'bg-[#24b47e] text-white hover:opacity-90 hover:scale-[1.02] active:scale-95'
 : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
`}
 >
 <Send size={18} className="translate-x-0.5"/>
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
