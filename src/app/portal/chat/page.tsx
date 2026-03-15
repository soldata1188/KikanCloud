import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
        <div className="w-full max-w-[1200px] mx-auto h-[calc(100vh-140px)] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50 shrink-0">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                    <MessageCircle className="text-[#0067b8]" size={24} /> 監理団体とのメッセージ (Chat)
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1 ml-9">
                    監理団体の担当者と直接メッセージのやり取りができます。
                </p>
            </div>
            <div className="flex-1 flex flex-col bg-gray-50 relative overflow-hidden">
                {userProfile.role === 'company_admin' || userProfile.role === 'company_client' ? (
                    <div className="flex-1 absolute inset-0 overflow-y-auto w-full h-full p-0 flex flex-col pt-0">
                        <ChatBox companyId={userProfile.company_id} currentUserId={user.id} messages={messages || []} sourcePath="/portal/chat" isClient={true} />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white/50 m-4 border border-gray-200 rounded-2xl">
                        <p className="font-bold text-gray-900 text-base">閲覧専用アカウントです</p>
                        <p className="text-sm mt-1">メッセージの送信権限がありません。</p>
                    </div>
                )}
            </div>
        </div>
    )
}
