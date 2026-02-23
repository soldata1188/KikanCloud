import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import NewWorkerClient from './NewWorkerClient'

export default async function NewWorkerPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: userProfile } = await supabase.from('users').select('full_name, role, avatar_url').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'

    // Fetch companies for the dropdown
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')

    return (
        <div className="flex h-screen bg-[#f3f4f6] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* The new AI Workspace component fills the rest of the screen */}
                <NewWorkerClient companies={companies || []} />
            </main>
        </div>
    )
}
