import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import ChatClient from './ChatClient'

export const metadata = { title: 'AIチャット' }

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [{ data: userProfile }, { count: workerCount }, { count: companyCount }] = await Promise.all([
        supabase.from('users').select('full_name, role').eq('id', user.id).single(),
        supabase.from('workers').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
        supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    ])

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            <Sidebar active="chat" />
            <div className="flex-1 flex flex-col min-w-0">
                <TopNav role={userProfile?.role} />
                <ChatClient
                    workerCount={workerCount ?? 0}
                    companyCount={companyCount ?? 0}
                />
            </div>
        </div>
    )
}
