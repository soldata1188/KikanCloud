import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

import OperationsClient from './OperationsClient'
import { getOperationsData } from './actions'

export const dynamic = 'force-dynamic';

export default async function OperationsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    // Fetch primary data for Tabs
    const { workers, companies, visas, exams, transfers, staff } = await getOperationsData()

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden selection:bg-primary-700/20">
            <Sidebar active="operations" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <main className="flex-1 overflow-hidden relative bg-[#F0F2F5]">
                    <OperationsClient
                        initialWorkers={workers}
                        companies={companies}
                        initialVisas={visas}
                        initialExams={exams}
                        initialTransfers={transfers}
                        staff={staff}
                    />
                </main>
            </div>
        </div>
    )
}
