'use client'
import { useState, useRef, useEffect, useTransition } from 'react'
import { sendChatMessage } from '@/app/portal/actions'
import { Send, UserCircle2, Building2 } from 'lucide-react'

export function ChatBox({ companyId, currentUserId, messages, sourcePath, isClient }: { companyId: string, currentUserId: string, messages: any[], sourcePath: string, isClient: boolean }) {
 const [content, setContent] = useState('')
 const [isPending, startTransition] = useTransition()
 const endRef = useRef<HTMLDivElement>(null)

 useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

 const handleSend = (e: React.FormEvent) => {
 e.preventDefault()
 if (!content.trim() || isPending) return
 const msg = content; setContent('')
 startTransition(() => { sendChatMessage(companyId, msg, sourcePath) })
 }

 return (
 <div className="flex flex-col h-[550px] bg-white rounded-md border border-gray-350 overflow-hidden">
 <div className={`p-4 border-b border-gray-350 flex items-center gap-3 ${isClient ? 'bg-primary-700 text-white' : 'bg-white text-[#1f1f1f]'}`}>
 <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${isClient ? 'bg-white/20' : 'bg-white text-[#24b47e]'}`}>
 {isClient ? <UserCircle2 size={24} /> : <Building2 size={24} />}
 </div>
 <div>
 <h3 className="font-bold text-sm">{isClient ? '監理団体 連絡窓口' : '企業とのチャット'}</h3>
 <p className="text-[11px] opacity-80">メッセージは履歴として保存されます</p>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
 {messages.map((msg: any) => {
 const isMe = msg.sender_id === currentUserId
 const isClientMsg = msg.sender_role === 'company_client'
 return (
 <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
 <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${isClientMsg ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-[#24b47e]'}`}>
 {isClientMsg ? <Building2 size={14} /> : <UserCircle2 size={14} />}
 </div>
 <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
 <span className="text-[10px] text-[#878787] mb-1 px-1">{msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
 <div className={`px-4 py-3 rounded-md text-[14px] whitespace-pre-wrap ${isMe ? (isClient ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-[#24b47e] text-white rounded-tr-sm') : 'bg-white border border-gray-350 text-[#1f1f1f] rounded-tl-sm'}`}>
 {msg.content}
 </div>
 </div>
 </div>
 )
 })}
 <div ref={endRef} />
 </div>

 <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-350 flex items-center gap-3">
 <input type="text"value={content} onChange={e => setContent(e.target.value)} placeholder="メッセージを入力..."className={`flex-1 bg-white border border-gray-350 rounded-md px-5 py-3 text-sm outline-none transition-colors ${isClient ? 'focus:border-gray-350' : 'focus:border-[#24b47e]'}`} disabled={isPending} />
 <button type="submit"disabled={!content.trim() || isPending} className={`w-12 h-12 flex items-center justify-center rounded-md text-white shrink-0 disabled:opacity-50 ${isClient ? 'bg-primary-600 hover:bg-primary-700' : 'bg-[#24b47e] hover:bg-[#1e9a6a]'}`}><Send size={18} className="ml-0.5"/></button>
 </form>
 </div>
 )
}
