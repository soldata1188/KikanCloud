import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ScheduleClient from './ScheduleClient'

export const dynamic = 'force-dynamic'

export default async function SchedulePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="schedule" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="Schedule" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-[1400px] mx-auto h-full flex flex-col">
                        <ScheduleClient />
                    </div>
                </main>
            </div>
        </div>
    )
}
