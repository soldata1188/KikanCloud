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
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#1a73e8]/20">
            {/* MINIMALIST SIDEBAR FOR CLIENTS (Trust Blue Accent) */}
            <aside className="w-[68px] md:w-[240px] bg-white border-r border-[#ededed] flex flex-col h-full shrink-0 z-20">
                <div className="h-14 flex items-center justify-center md:justify-start md:px-6 border-b border-[#ededed]">
                    <div className="w-6 h-6 bg-[#1a73e8] rounded flex items-center justify-center text-white"><Hexagon size={14} /></div>
                    <span className="ml-2 font-bold text-[14px] hidden md:block tracking-tight text-[#1f1f1f]">KikanCloud <span className="text-[#878787] font-medium text-[11px] ml-1">PORTAL</span></span>
                </div>
                <div className="p-3 flex flex-col gap-1 mt-4">
                    <Link href="/portal" className="flex items-center gap-3 px-3 py-2 bg-[#fbfcfd] border border-[#ededed] text-[#1f1f1f] rounded-md shadow-sm group">
                        <Building2 size={16} className="text-[#1a73e8]" />
                        <span className="text-[13px] font-bold hidden md:block">マイページ (Home)</span>
                    </Link>
                    <Link href="/portal/chat" className="flex items-center gap-3 px-3 py-2 text-[#878787] hover:bg-[#fbfcfd] hover:text-[#1a73e8] rounded-md transition-colors group">
                        <MessageSquare size={16} className="group-hover:text-[#1a73e8]" />
                        <span className="text-[13px] font-medium hidden md:block">メッセージ (Chat)</span>
                    </Link>
                    <div className="flex items-center gap-3 px-3 py-2 text-[#878787] hover:bg-[#fbfcfd] hover:text-[#1f1f1f] rounded-md transition-colors cursor-not-allowed opacity-60">
                        <Users size={16} />
                        <span className="text-[13px] font-medium hidden md:block">実習生一覧 (Workers)</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-[#878787] hover:bg-[#fbfcfd] hover:text-[#1f1f1f] rounded-md transition-colors cursor-not-allowed opacity-60">
                        <FileText size={16} />
                        <span className="text-[13px] font-medium hidden md:block">書類センター (Docs)</span>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col relative min-w-0">
                <header className="h-14 bg-white border-b border-[#ededed] flex items-center justify-between px-6 shrink-0 z-10">
                    <div className="flex items-center gap-2 text-[13px]">
                        <span className="text-[#878787] hidden sm:inline">受入企業ポータル</span>
                        <span className="text-[#878787] hidden sm:inline">/</span>
                        <span className="font-bold text-[#1a73e8]">{(userProfile as any)?.companies?.name_jp || '受入企業様'}</span>
                    </div>
                    <PortalHeaderClient userProfile={userProfile} />
                </header>
                <main className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-[#fbfcfd]">
                    {children}
                </main>
            </div>
        </div>
    )
}