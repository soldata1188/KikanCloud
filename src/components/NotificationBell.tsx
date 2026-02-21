'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCircle2 } from 'lucide-react'
import { getUnreadNotifications, markNotificationAsRead } from '@/app/actions/operations'
import { useRouter } from 'next/navigation'

export function NotificationBell({ role, companyId }: { role: string, companyId?: string | null }) {
    const [notifications, setNotifications] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchNotifs = async () => { const data = await getUnreadNotifications(role, companyId); setNotifications(data); }
        fetchNotifs(); const interval = setInterval(fetchNotifs, 5000)

        const handleClickOutside = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false) }
        document.addEventListener('mousedown', handleClickOutside)
        return () => { clearInterval(interval); document.removeEventListener('mousedown', handleClickOutside) }
    }, [role, companyId])

    const handleRead = async (id: string, url: string) => {
        setIsOpen(false); await markNotificationAsRead(id); setNotifications(prev => prev.filter(n => n.id !== id)); router.push(url);
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#ededed] transition-colors text-[#878787] hover:text-[#1f1f1f]">
                <Bell size={18} strokeWidth={1.5} className={notifications.length > 0 ? "animate-pulse text-[#24b47e]" : ""} />
                {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">{notifications.length}</span>}
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-[#e1e5ea] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-sm text-[#1f1f1f]">お知らせ (通知)</h3><span className="text-xs text-gray-500">{notifications.length}件の未読</span>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-400 flex flex-col items-center"><CheckCircle2 size={32} className="mb-2 text-green-300 opacity-50" />新しい通知はありません</div>
                        ) : notifications.map(n => (
                            <button key={n.id} onClick={() => handleRead(n.id, n.link_url)} className="w-full text-left px-4 py-3 hover:bg-blue-50/50 transition-colors flex flex-col gap-1 bg-blue-50/10">
                                <p className="text-sm font-bold text-[#1f1f1f]">{n.title}</p>
                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{n.content}</p>
                                <p className="text-[10px] text-[#4285F4] mt-1">{new Date(n.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
