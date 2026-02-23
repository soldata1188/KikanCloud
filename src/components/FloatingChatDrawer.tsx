'use client'
import { useState } from 'react'
import { MessageCircle, X, Send, UserCircle2 } from 'lucide-react'

export function FloatingChatDrawer() {
 const [isOpen, setIsOpen] = useState(false)
 const [message, setMessage] = useState('')

 const toggleChat = () => setIsOpen(!isOpen)

 return (
 <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
 {/* The Chat Drawer */}
 <div
 className={`
 mb-4 w-full sm:w-[350px] bg-white border border-gray-350 rounded-md overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right
 ${isOpen ? 'opacity-100 scale-100 h-[500px]' : 'opacity-0 scale-95 h-0 pointer-events-none'}
`}
 >
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-gray-350 bg-white shrink-0">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-md bg-[#24b47e]/10 flex items-center justify-center text-[#24b47e]">
 <UserCircle2 size={18} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-[#1f1f1f]">企業連絡チャット</h3>
 <p className="text-[10px] text-[#878787]">受入企業と直接連絡</p>
 </div>
 </div>
 <button
 onClick={toggleChat}
 className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <X size={18} />
 </button>
 </div>

 {/* Body - Messages Area */}
 <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
 <div className="flex items-start gap-2">
 <div className="w-7 h-7 rounded-md bg-white border border-gray-350 flex items-center justify-center shrink-0">
 <UserCircle2 size={14} className="text-gray-400"/>
 </div>
 <div className="bg-white border border-gray-350 text-[#1f1f1f] text-[13px] px-3 py-2 rounded-md rounded-tl-sm max-w-[85%]">
 こんにちは。システムに関するお問い合わせはこちらからどうぞ。
 </div>
 </div>
 <div className="flex items-start gap-2 flex-row-reverse">
 <div className="bg-[#24b47e] text-white text-[13px] px-3 py-2 rounded-md rounded-tr-sm max-w-[85%]">
 ありがとうございます。テストメッセージです。
 </div>
 </div>
 </div>

 {/* Footer - Input Area */}
 <div className="p-3 bg-white border-t border-gray-350 shrink-0">
 <form
 onSubmit={(e) => { e.preventDefault(); setMessage(''); }}
 className="flex items-center gap-2"
 >
 <input
 type="text"
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 placeholder="メッセージを入力..."
 className="flex-1 bg-gray-100 border-none focus:ring-1 focus:ring-[#24b47e] rounded-md px-3 py-2 text-[13px] text-[#1f1f1f] outline-none"
 />
 <button
 type="submit"
 disabled={!message.trim()}
 className="p-2 bg-[#24b47e] text-white rounded-md hover:bg-[#1e9a6a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
 >
 <Send size={16} className="-ml-0.5 mt-0.5"/>
 </button>
 </form>
 </div>
 </div>

 {/* Bubble Button */}
 <button
 onClick={toggleChat}
 className={`
 w-14 h-14 rounded-md flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95
 ${isOpen ? 'bg-gray-100 text-gray-500' : 'bg-[#24b47e] text-white hover:bg-[#1e9a6a]'}
`}
 >
 {isOpen ? <X size={24} /> : <MessageCircle size={26} />}
 </button>
 </div>
 )
}
