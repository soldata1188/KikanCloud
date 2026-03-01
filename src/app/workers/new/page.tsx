import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
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
        <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden selection:bg-emerald-500/20">
            <Sidebar active="workers" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="実習生 新規登録" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto relative bg-slate-50">
                    <NewWorkerClient companies={companies || []} />
                </main>
            </div>
        </div>
    )
}
