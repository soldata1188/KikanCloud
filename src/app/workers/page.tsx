import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

import WorkersListClient from './WorkersListClient'

export const dynamic = 'force-dynamic';

export default async function WorkersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile, error: profileError } = await supabase.from('users').select('role').eq('id', user.id).single()
    const { data: workers, error: workersError } = await supabase.from('workers').select('*, companies(name_jp)').eq('is_deleted', false).order('created_at', { ascending: false })

    if (workersError) console.error('Error fetching workers:', workersError);

    const next90Days = new Date();
    next90Days.setDate(next90Days.getDate() + 90);
    const next90DaysStr = next90Days.toISOString().split('T')[0];

    return (
        <div className="flex h-screen font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workers" />
            <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                <WorkersListClient initialWorkers={workers || []} role={userProfile?.role || 'staff'} next90DaysStr={next90DaysStr} />
            </div>
        </div>
    )
}
