import Link from 'next/link'
import { Menu, Sparkles, Briefcase, Settings, MessageCircle } from 'lucide-react'
import { logout } from '@/app/login/actions'

export function ClientSidebar({ active }: { active: 'dashboard' | 'workers' | 'chat' }) {
    return (
        <aside className="w-[68px] flex flex-col items-center py-4 shrink-0 bg-teal-800 z-20 shadow-[1px_0_10px_rgba(0,0,0,0.02)] border-r border-teal-700/50">
 <button className="w-12 h-12 flex items-center justify-center rounded-[32px] hover:bg-white/10 transition-colors text-white mb-4"><Menu size={24} strokeWidth={1.5} /></button>
            <Link href="/portal" className={`w-12 h-12 flex items-center justify-center rounded-[32px] mb-2 transition-colors ${active === 'dashboard' ? 'bg-white text-teal-700 shadow-md' : 'text-teal-100 hover:bg-white/10'}`} title="ダッシュボード"><Sparkles size={20} strokeWidth={active === 'dashboard' ? 2 : 1.5} /></Link>
            <Link href="/portal/workers" className={`w-12 h-12 flex items-center justify-center rounded-[32px] mb-2 transition-colors ${active === 'workers' ? 'bg-white text-teal-700 shadow-md' : 'text-teal-100 hover:bg-white/10'}`} title="人材一覧"><Briefcase size={20} strokeWidth={active === 'workers' ? 2 : 1.5} /></Link>
            <Link href="/portal/chat" className={`w-12 h-12 flex items-center justify-center rounded-[32px] mb-2 transition-colors ${active === 'chat' ? 'bg-white text-teal-700 shadow-md' : 'text-teal-100 hover:bg-white/10'}`} title="連絡チャット"><MessageCircle size={20} strokeWidth={active === 'chat' ? 2 : 1.5} /></Link>
 <div className="mt-auto flex flex-col gap-4"><form action={logout}><button type="submit" className="w-12 h-12 flex items-center justify-center rounded-[32px] hover:bg-white/10 transition-colors text-white" title="ログアウト"><Settings size={22} strokeWidth={1.5} /></button></form></div>
        </aside>
    )
}
