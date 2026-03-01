import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

import WorkersListClient from './WorkersListClient'

export const dynamic = 'force-dynamic';

export default async function WorkersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
    const { data: workers } = await supabase.from('workers').select('*, companies(name_jp)').eq('is_deleted', false).order('created_at', { ascending: false })

    const next90Days = new Date();
    next90Days.setDate(next90Days.getDate() + 90);
    const next90DaysStr = next90Days.toISOString().split('T')[0];

    return (
        <div className="flex h-screen font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workers" />
            <div className="flex-1 flex flex-col relative min-w-0">

                <main className="flex-1 overflow-y-auto relative">
                    {/* Micro-Dot Grid Overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.08] z-0"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #0067b8 1px, transparent 0)', backgroundSize: '32px 32px' }} />

                    <div className="w-full min-h-full relative z-10">
                        <WorkersListClient initialWorkers={workers || []} role={userProfile?.role || 'staff'} next90DaysStr={next90DaysStr} />
                    </div>
                </main>
            </div>
        </div>
    )
}
