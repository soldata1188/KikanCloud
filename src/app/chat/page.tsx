import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import ChatClient from './ChatClient'

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden">
            <Sidebar active="chat" />
            <ChatClient />
        </div>
    )
}
