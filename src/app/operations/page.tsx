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

    const { data: userProfile } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single()

    const { workers, companies, staff } = await getOperationsData()

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden selection:bg-primary-700/20">
            <Sidebar active="operations" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="" role={userProfile?.role} />
                <main className="flex-1 overflow-hidden relative bg-gray-100">
                    <OperationsClient
                        initialWorkers={workers}
                        companies={companies}
                        staff={staff}
                        tenantId={userProfile?.tenant_id || ''}
                    />
                </main>
            </div>
        </div>
    )
}
