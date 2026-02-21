import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientSidebar } from '@/components/ClientSidebar'
import { MessageCircle } from 'lucide-react'
import { ChatBox } from '@/components/ChatBox'

export const dynamic = 'force-dynamic';

export default async function ClientChatPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
    if (!userProfile?.company_id) redirect('/')

    const { data: messages } = await supabase.from('messages').select('*').eq('company_id', userProfile.company_id).order('created_at', { ascending: true })

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden">
            <ClientSidebar active="chat" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar px-4 pb-12 w-full max-w-[800px] mx-auto mt-4 md:mt-8">
                <h2 className="text-[32px] font-bold tracking-tight text-teal-800 mb-6 flex items-center gap-3"><MessageCircle size={32} /> 連絡チャット</h2>
                {userProfile.role === 'company_admin' ? (
                    <ChatBox companyId={userProfile.company_id} currentUserId={user.id} messages={messages || []} sourcePath="/portal/chat" isClient={true} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#878787] bg-white/50 rounded-lg m-4 border border-[#ededed]"><p className="font-bold text-[#1f1f1f] text-base">閲覧専用アカウントです</p><p className="text-sm mt-1">メッセージの送信権限がありません。</p></div>
                )}
            </main>
        </div>
    )
}
