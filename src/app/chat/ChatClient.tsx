'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, ArrowUp, User, MessageSquare, Trash2, Search, Plus } from 'lucide-react'

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

const QUICK_PROMPTS = [
    '📋 今月期限切れのビザ一覧',
    '⚠️ 未提出の監査報告を確認',
    '📊 今週の業務サマリー',
    '🔍 書類が不足している労働者',
]

// Group sessions by date label
function getDateLabel(ms: number): string {
    const now = new Date()
    const d = new Date(ms)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterdayStart = todayStart - 86400000
    const weekStart = todayStart - 6 * 86400000
    if (ms >= todayStart) return '今日'
    if (ms >= yesterdayStart) return '昨日'
    if (ms >= weekStart) return '今週'
    return 'それ以前'
}

function formatTime(ms: number): string {
    const now = new Date()
    const d = new Date(ms)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterdayStart = todayStart - 86400000
    if (ms >= todayStart) return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    const days = ['日', '月', '火', '水', '木', '金', '土']
    if (ms >= yesterdayStart) return '昨日'
    if (ms >= todayStart - 6 * 86400000) return days[d.getDay()] + '曜日'
    return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
}

// ── Data Card types ───────────────────────────────────────────────
type DataCardRow = { name: string; sub?: string; badge: string; urgency: 'red' | 'amber' | 'blue' | 'green' }
type DataCardData = { title: string; rows: DataCardRow[] }

const BADGE_CLASSES: Record<string, string> = {
    red:   'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    blue:  'bg-[#e6f1fb] text-[#0067b8]',
    green: 'bg-green-100 text-green-600',
}

function DataCard({ data }: { data: DataCardData }) {
    return (
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-[10px] mt-[10px]">
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-[.3px] mb-2">{data.title}</div>
            {data.rows.map((row, i) => (
                <div key={i} className={`flex items-center justify-between py-[5px] text-[12px] text-[#0f172a] ${i < data.rows.length - 1 ? 'border-b border-[#f1f5f9]' : ''}`}>
                    <div className="flex flex-col">
                        <span>{row.name}</span>
                        {row.sub && <span className="text-[10px] text-[#94a3b8] mt-[1px]">{row.sub}</span>}
                    </div>
                    <span className={`text-[10px] px-2 py-[2px] rounded-[10px] font-semibold whitespace-nowrap ml-3 ${BADGE_CLASSES[row.urgency] ?? BADGE_CLASSES.blue}`}>
                        {row.badge}
                    </span>
                </div>
            ))}
        </div>
    )
}

// ── Message content renderer ───────────────────────────────────────
// Parses **bold**, [DATACARD]json[/DATACARD] blocks, and line breaks
function renderMessageContent(content: string) {
    const parts: React.ReactNode[] = []
    // Split on DATACARD blocks
    const chunks = content.split(/\[DATACARD\]([\s\S]*?)\[\/DATACARD\]/g)
    chunks.forEach((chunk, i) => {
        if (i % 2 === 1) {
            // This is a DATACARD JSON block
            try {
                const data: DataCardData = JSON.parse(chunk.trim())
                parts.push(<DataCard key={i} data={data} />)
            } catch {
                // Ignore malformed JSON
            }
        } else if (chunk) {
            // Regular text — render **bold** and newlines
            const lines = chunk.split('\n')
            lines.forEach((line, li) => {
                const segments = line.split(/(\*\*[^*]+\*\*)/g)
                const rendered = segments.map((seg, si) => {
                    if (seg.startsWith('**') && seg.endsWith('**')) {
                        return <strong key={si}>{seg.slice(2, -2)}</strong>
                    }
                    return seg
                })
                parts.push(<span key={`${i}-${li}`}>{rendered}</span>)
                if (li < lines.length - 1) parts.push(<br key={`br-${i}-${li}`} />)
            })
        }
    })
    return <>{parts}</>
}

const TypingIndicator = () => (
    <div className="flex items-start gap-[10px]">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-[#0067b8] to-[#004a8c] flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(0,103,184,.25)]">
            <Sparkles size={14} className="text-white" />
        </div>
        <div className="bg-white border border-gray-200 px-4 py-3 flex items-center gap-1 shadow-[0_1px_3px_rgba(0,0,0,.08)]"
            style={{ borderRadius: '2px 12px 12px 12px' }}>
            <div className="w-[6px] h-[6px] bg-gray-400 rounded-full" style={{ animation: 'bounce .9s infinite' }}></div>
            <div className="w-[6px] h-[6px] bg-gray-400 rounded-full" style={{ animation: 'bounce .9s .15s infinite' }}></div>
            <div className="w-[6px] h-[6px] bg-gray-400 rounded-full" style={{ animation: 'bounce .9s .3s infinite' }}></div>
        </div>
    </div>
)

interface ChatClientProps {
    workerCount: number
    companyCount: number
}

export default function ChatClient({ workerCount, companyCount }: ChatClientProps) {
    const [isTyping, setIsTyping] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [isClient, setIsClient] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    const createNewSession = useCallback(() => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: '新しいチャット',
            messages: [{
                id: 'welcome',
                role: 'ai',
                content: `こんにちは！KikanCloud AIアシスタントです。\n現在 ${workerCount}名の労働者データと${companyCount}社の企業情報を参照できます。\n\n在留資格の期限確認、監査状況の把握、書類チェックなど、業務に関することは何でもお気軽にご質問ください。`
            }],
            updatedAt: Date.now()
        }
        setSessions(prev => [newSession, ...prev])
        setCurrentSessionId(newSession.id)
    }, [workerCount, companyCount])

    useEffect(() => {
        setIsClient(true)
        const saved = localStorage.getItem('kikan_ai_chats')
        if (saved) {
            try {
                const parsed: ChatSession[] = JSON.parse(saved)
                const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
                const now = Date.now()
                const validSessions = parsed.filter(s => (now - s.updatedAt) < thirtyDaysMs)
                if (validSessions.length > 0) {
                    validSessions.sort((a, b) => b.updatedAt - a.updatedAt)
                    setSessions(validSessions)
                    setCurrentSessionId(validSessions[0].id)
                } else {
                    createNewSession()
                }
            } catch {
                createNewSession()
            }
        } else {
            createNewSession()
        }
    }, [createNewSession])

    useEffect(() => {
        if (isClient && sessions.length > 0) {
            localStorage.setItem('kikan_ai_chats', JSON.stringify(sessions))
        }
    }, [sessions, isClient])

    const currentSession = sessions.find(s => s.id === currentSessionId)
    const messages = currentSession?.messages || []

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    const handleSend = async (text?: string) => {
        const content = text ?? inputValue
        if (!content.trim() || !currentSessionId) return

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content }
        const currentRefMessages = [...messages]

        setSessions(prev =>
            prev.map(s => {
                if (s.id === currentSessionId) {
                    const newMessages = [...s.messages, userMsg]
                    const title = s.messages.length === 1 ? content.slice(0, 25) + (content.length > 25 ? '...' : '') : s.title
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
                .map(m => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.content }] }))

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: content, context: chatHistory })
            })

            if (!res.ok) throw new Error('API Error')
            const data = await res.json()

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
        } catch {
            setSessions(prev =>
                prev.map(s => {
                    if (s.id === currentSessionId) {
                        return {
                            ...s,
                            messages: [...s.messages, { id: Date.now().toString(), role: 'ai', content: 'AIサーバー接続エラーが発生しました。設定を確認して再試行してください。' }],
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
            e.preventDefault()
            handleSend()
        }
    }

    const clearCurrentChat = () => {
        if (confirm('現在のチャット履歴を削除しますか？')) {
            setSessions(prev =>
                prev.map(s => {
                    if (s.id === currentSessionId) {
                        return {
                            ...s,
                            messages: [{ id: Date.now().toString(), role: 'ai', content: 'チャット履歴を削除しました。本日はどのようなご用件でしょうか？' }],
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
                const next = prev.filter(s => s.id !== id)
                if (next.length === 0) setTimeout(() => createNewSession(), 0)
                else if (currentSessionId === id) setCurrentSessionId(next[0].id)
                return next
            })
        }
    }

    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Group sessions by date label
    const groupedSessions = filteredSessions.reduce<{ label: string; sessions: ChatSession[] }[]>((acc, s) => {
        const label = getDateLabel(s.updatedAt)
        const existing = acc.find(g => g.label === label)
        if (existing) existing.sessions.push(s)
        else acc.push({ label, sessions: [s] })
        return acc
    }, [])

    if (!isClient) return null

    return (
        <main className="flex-1 flex overflow-hidden">
            {/* ── Chat History Panel (260px) ── */}
            <div className="w-[260px] bg-white border-r border-[#e2e8f0] flex flex-col shrink-0">

                {/* Panel Header */}
                <div className="px-[14px] py-3 border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-[6px] text-[13px] font-semibold text-[#0f172a]">
                        <MessageSquare size={14} strokeWidth={2} />
                        チャット履歴
                    </div>
                    <button
                        onClick={createNewSession}
                        title="新しいチャット"
                        className="w-[28px] h-[28px] rounded-[8px] bg-[#0067b8] hover:bg-[#004a8c] flex items-center justify-center shrink-0 transition-all hover:scale-105"
                    >
                        <Plus size={14} strokeWidth={2.5} className="text-white" />
                    </button>
                </div>

                {/* Quick Prompts */}
                <div className="px-3 py-[10px] border-b border-[#e2e8f0] shrink-0">
                    <div className="text-[10px] font-semibold text-[#94a3b8] tracking-[.4px] mb-[6px]">よく使う質問</div>
                    <div className="flex flex-col gap-1">
                        {QUICK_PROMPTS.map(p => (
                            <button
                                key={p}
                                onClick={() => handleSend(p)}
                                className="px-[10px] py-[6px] rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] text-[11px] text-[#475569] text-left leading-[1.4] transition-all hover:bg-[#e6f1fb] hover:border-[#0067b8] hover:text-[#0067b8]"
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search */}
                <div className="px-3 py-2 border-b border-[#e2e8f0] shrink-0">
                    <div className="relative">
                        <Search size={12} className="absolute left-[9px] top-[10px] text-[#94a3b8]" />
                        <input
                            type="text"
                            placeholder="チャットを検索..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full h-[32px] border border-[#e2e8f0] rounded-[8px] pl-[30px] pr-[10px] text-[12px] text-[#0f172a] bg-[#f8fafc] outline-none focus:border-[#0067b8] focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto px-2 py-2">
                    {groupedSessions.length === 0 && (
                        <p className="text-center text-[11px] text-[#94a3b8] mt-6">履歴が見つかりません</p>
                    )}
                    {groupedSessions.map(group => (
                        <div key={group.label}>
                            <div className="text-[10px] font-semibold text-[#94a3b8] px-[6px] py-2 tracking-[.3px]">
                                {group.label}
                            </div>
                            {group.sessions.map(session => {
                                const isActive = session.id === currentSessionId
                                const lastMsg = session.messages[session.messages.length - 1]
                                return (
                                    <div
                                        key={session.id}
                                        onClick={() => setCurrentSessionId(session.id)}
                                        className={`relative px-[10px] py-2 rounded-[8px] cursor-pointer transition-all mb-0.5 group ${isActive ? 'bg-[#e6f1fb]' : 'hover:bg-[#f8fafc]'}`}
                                    >
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`text-[12px] font-medium truncate flex-1 ${isActive ? 'text-[#0067b8]' : 'text-[#0f172a]'}`}>
                                                {session.title}
                                            </span>
                                            <span className="text-[9px] px-[6px] py-[1px] rounded-[8px] bg-[#e6f1fb] text-[#0067b8] font-semibold shrink-0 ml-1">
                                                AI
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-[#94a3b8] truncate pr-4">
                                            {lastMsg?.content.replace(/\n/g, ' ')}
                                        </div>
                                        <div className="text-[10px] text-[#94a3b8] mt-0.5">
                                            {formatTime(session.updatedAt)}
                                        </div>
                                        {/* Delete button */}
                                        <button
                                            onClick={e => deleteSession(e, session.id)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-[4px] hidden group-hover:flex items-center justify-center text-[#94a3b8] hover:bg-red-100 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>

                {/* Footer note */}
                <div className="px-3 py-2 border-t border-[#e2e8f0] shrink-0">
                    <p className="text-[10px] text-[#94a3b8] text-center">※ 履歴は30日間保存されます</p>
                </div>
            </div>

            {/* ── Chat Main (flex-1) ── */}
            <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
                {/* Chat Header */}
                <div className="h-[56px] bg-white border-b border-[#e2e8f0] px-5 flex items-center justify-between shrink-0 shadow-[0_1px_0_#e2e8f0]">
                    <div className="flex items-center gap-3">
                        <div className="w-[38px] h-[38px] rounded-[10px] bg-gradient-to-br from-[#0067b8] to-[#004a8c] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,103,184,.3)]">
                            <Sparkles size={17} className="text-white" />
                        </div>
                        <div>
                            <div className="text-[14px] font-semibold text-[#0f172a]">KikanCloud AI アシスタント</div>
                            <div className="flex items-center gap-[5px] text-[11px] text-[#16a34a]">
                                <span className="w-[6px] h-[6px] rounded-full bg-[#16a34a] shrink-0" style={{ animation: 'pulse 2s infinite' }} />
                                オンライン · Gemini 2.5 Flash
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-[6px]">
                        <button className="h-[30px] px-[10px] rounded-[8px] border border-[#e2e8f0] bg-white text-[11px] text-[#475569] flex items-center gap-1 transition-all hover:border-[#0067b8] hover:text-[#0067b8] hover:bg-[#e6f1fb]">
                            エクスポート
                        </button>
                        <button
                            onClick={clearCurrentChat}
                            className="h-[30px] px-[10px] rounded-[8px] border border-[#e2e8f0] bg-white text-[11px] text-[#475569] flex items-center gap-1 transition-all hover:border-red-400 hover:text-red-500 hover:bg-red-50"
                        >
                            <Trash2 size={11} />
                            クリア
                        </button>
                    </div>
                </div>

                {/* Context Bar */}
                <div className="bg-[#e6f1fb] border-b border-[#bfdbfe] px-5 py-[7px] flex items-center gap-2 shrink-0 flex-wrap">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0067b8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span className="text-[11px] text-[#0067b8] font-medium whitespace-nowrap">AIコンテキスト：</span>
                    <div className="flex gap-[5px] flex-wrap">
                        <span className="bg-[#0067b8] text-white border border-[#0067b8] rounded-[20px] px-[10px] py-[2px] text-[11px]">👥 {workerCount}名の労働者</span>
                        <span className="bg-[#0067b8] text-white border border-[#0067b8] rounded-[20px] px-[10px] py-[2px] text-[11px]">🏢 {companyCount}社の企業</span>
                        <span className="bg-white text-[#0067b8] border border-[#bfdbfe] rounded-[20px] px-[10px] py-[2px] text-[11px] cursor-pointer transition-all hover:bg-[#0067b8] hover:text-white hover:border-[#0067b8]">📋 監査データ</span>
                        <span className="bg-white text-[#0067b8] border border-[#bfdbfe] rounded-[20px] px-[10px] py-[2px] text-[11px] cursor-pointer transition-all hover:bg-[#0067b8] hover:text-white hover:border-[#0067b8]">📄 書類情報</span>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-[18px]">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex gap-[10px] items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            style={{ animation: 'fadeUp .25s ease' }}
                        >
                            {/* Avatar */}
                            <div className={`w-[34px] h-[34px] rounded-[10px] shrink-0 flex items-center justify-center text-[12px] font-semibold ${msg.role === 'ai'
                                ? 'bg-gradient-to-br from-[#0067b8] to-[#004a8c] text-white shadow-[0_2px_6px_rgba(0,103,184,.25)]'
                                : 'bg-[#f1f5f9] text-[#475569]'
                            }`}>
                                {msg.role === 'ai' ? <Sparkles size={14} className="text-white" /> : <User size={14} />}
                            </div>
                            {/* Bubble */}
                            <div className="max-w-[68%]">
                                <div
                                    className={`px-[15px] py-3 text-[13px] leading-[1.75] whitespace-pre-wrap ${msg.role === 'ai'
                                        ? 'bg-white border border-[#e2e8f0] text-[#0f172a] shadow-[0_1px_3px_rgba(0,0,0,.08)]'
                                        : 'bg-[#0067b8] text-white'
                                    }`}
                                    style={{ borderRadius: msg.role === 'ai' ? '2px 12px 12px 12px' : '12px 2px 12px 12px' }}
                                >
                                    {msg.role === 'ai' ? renderMessageContent(msg.content) : msg.content}
                                </div>
                                <div className={`text-[10px] text-[#94a3b8] mt-[5px] ${msg.role === 'user' ? 'text-right' : ''}`}>
                                    {formatTime(msg.id === 'welcome' ? Date.now() : parseInt(msg.id) || Date.now())}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="px-5 pt-[14px] pb-4 bg-white border-t border-[#e2e8f0] shrink-0">
                    <div className="bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] rounded-[12px] px-[14px] py-[10px] transition-all focus-within:border-[#0067b8] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(0,103,184,.08)]">
                        {/* Tool buttons */}
                        <div className="flex items-center gap-[6px] mb-2 flex-wrap">
                            {['📎 ファイル添付', '🔍 データ検索', '📊 レポート生成'].map(label => (
                                <button key={label} className="h-[24px] px-2 rounded-[6px] border border-[#e2e8f0] bg-white text-[11px] text-[#475569] flex items-center gap-[3px] transition-all shadow-[0_1px_3px_rgba(0,0,0,.08)] hover:border-[#0067b8] hover:text-[#0067b8] hover:bg-[#e6f1fb]">
                                    {label}
                                </button>
                            ))}
                        </div>
                        {/* Textarea + Send */}
                        <div className="flex items-end gap-[10px]">
                            <textarea
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isTyping}
                                placeholder="AIにメッセージを送信... (Enterで送信, Shift+Enterで改行)"
                                className="flex-1 border-none bg-transparent text-[13px] text-[#0f172a] resize-none outline-none disabled:opacity-50 placeholder:text-[#94a3b8] leading-[1.65]"
                                style={{ minHeight: '22px', maxHeight: '140px' }}
                                rows={1}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!inputValue.trim() || isTyping}
                                className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0 transition-all ${inputValue.trim() && !isTyping
                                    ? 'bg-[#0067b8] hover:bg-[#004a8c] shadow-[0_2px_6px_rgba(0,103,184,.3)] hover:scale-[1.08] hover:shadow-[0_4px_12px_rgba(0,103,184,.4)]'
                                    : 'bg-[#e2e8f0] cursor-not-allowed'
                                }`}
                            >
                                <ArrowUp size={16} strokeWidth={2.5} className={inputValue.trim() && !isTyping ? 'text-white' : 'text-[#94a3b8]'} />
                            </button>
                        </div>
                    </div>
                    <p className="text-[10px] text-[#94a3b8] text-center mt-2">
                        Enterで送信 · Shift+Enterで改行 · AIの回答は参考情報です
                    </p>
                </div>
            </div>
        </main>
    )
}
