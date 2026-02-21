import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { redirect } from 'next/navigation'
import { CompaniesClient } from './CompaniesClient'

export const dynamic = 'force-dynamic';

export default async function CompaniesList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    const { data: companies } = await supabase.from('companies')
        .select('id, name_jp, name_romaji, corporate_number, address, representative, pic_name, workers(id, status, is_deleted)')
        .eq('is_deleted', false).order('created_at', { ascending: false })

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="companies" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="Companies" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-[1200px] mx-auto">
                        <h1 className="text-[28px] font-normal tracking-tight text-[#1f1f1f] mb-8">Companies Overview</h1>
                        <CompaniesClient companies={companies || []} userRole={userProfile?.role} />
                    </div>
                </main>
            </div>
        </div>
    )
}
