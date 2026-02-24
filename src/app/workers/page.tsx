import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import WorkersListClient from './WorkersListClient'

export const dynamic = 'force-dynamic';

export default async function WorkersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
    const { data: workers } = await supabase.from('workers').select('*, companies(name_jp)').eq('is_deleted', false).order('created_at', { ascending: false })

    return (
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workers" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="実習生一覧" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="w-full max-w-[1800px] mx-auto">

                        <WorkersListClient initialWorkers={workers || []} role={userProfile?.role || 'staff'} next90DaysStr={''} />
                    </div>
                </main>
            </div>
        </div>
    )
}
