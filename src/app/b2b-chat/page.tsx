import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import B2BChatClient from './B2BChatClient'

export const dynamic = 'force-dynamic';

export default async function B2BChatPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden">
            <Sidebar active="b2b-chat" />
            <div className="flex-1 flex overflow-hidden min-w-0">
                <B2BChatClient />
            </div>
        </div>
    )
}
