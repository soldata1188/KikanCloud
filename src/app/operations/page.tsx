import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import OperationsClient from './OperationsClient'
import { getOperationsData } from './actions'

export const dynamic = 'force-dynamic';

export default async function OperationsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    // Fetch primary data for Tabs
    const { workers, companies, visas, exams, transfers } = await getOperationsData()

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-gray-900 overflow-hidden selection:bg-primary-700/20">
            <Sidebar active="operations" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="業務管理 (Operations)" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="w-full mx-auto">
                        <OperationsClient
                            initialWorkers={workers}
                            companies={companies}
                            initialVisas={visas}
                            initialExams={exams}
                            initialTransfers={transfers}
                        />
                    </div>
                </main>
            </div>
        </div>
    )
}
