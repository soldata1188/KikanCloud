import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Users, FileText, Hexagon, MessageSquare } from 'lucide-react'
import PortalHeaderClient from './PortalHeaderClient'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role, full_name, company_id, companies(name_jp)').eq('id', user.id).single()

    // Block union staff from accessing the portal (They use the main dashboard)
    if (userProfile?.role === 'admin' || userProfile?.role === 'staff') redirect('/')

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden selection:bg-[#0067b8]/20">
            {/* MINIMALIST SIDEBAR FOR CLIENTS (Trust Blue Accent) */}
            <aside className="w-[68px] md:w-[240px] bg-white border-r border-gray-200 flex flex-col h-full shrink-0 z-20">
                <div className="h-14 flex items-center justify-center md:justify-start md:px-6 border-b border-gray-200">
                    <div className="w-6 h-6 bg-[#0067b8] rounded flex items-center justify-center text-white"><Hexagon size={14} /></div>
                    <span className="ml-2 font-bold text-[14px] hidden md:block tracking-tight text-gray-900">KikanCloud <span className="text-gray-500 font-medium text-[11px] ml-1">PORTAL</span></span>
                </div>
                <div className="p-3 flex flex-col gap-1 mt-4">
                    <Link href="/portal" className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-900 rounded-md shadow-sm group">
                        <Building2 size={16} className="text-[#0067b8]" />
                        <span className="text-[13px] font-bold hidden md:block">マイページ (Home)</span>
                    </Link>
                    <Link href="/portal/chat" className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-[#0067b8] rounded-md transition-colors group">
                        <MessageSquare size={16} className="group-hover:text-[#0067b8]" />
                        <span className="text-[13px] font-medium hidden md:block">メッセージ (Chat)</span>
                    </Link>
                    <div className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors cursor-not-allowed opacity-60">
                        <Users size={16} />
                        <span className="text-[13px] font-medium hidden md:block">外国人材 (Workers)</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors cursor-not-allowed opacity-60">
                        <FileText size={16} />
                        <span className="text-[13px] font-medium hidden md:block">書類センター (Docs)</span>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col relative min-w-0">
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
                    <div className="flex items-center gap-2 text-[13px]">
                        <span className="text-gray-500 hidden sm:inline">受入企業ポータル</span>
                        <span className="text-gray-500 hidden sm:inline">/</span>
                        <span className="font-bold text-[#0067b8]">{(userProfile as any)?.companies?.name_jp || '受入企業様'}</span>
                    </div>
                    <PortalHeaderClient userProfile={userProfile} />
                </header>
                <main className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    )
}