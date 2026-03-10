import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

import { CompaniesClient } from './CompaniesClient'

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile, error: profileError } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profileError || !userProfile) {
        // Safe fallback
    }

    if (userProfile?.role === 'company_admin' || userProfile?.role === 'company_user') redirect('/portal')

    const { data: companies, error: companiesError } = await supabase.from('companies').select('*, workers(id, status, is_deleted, visa_status, full_name_romaji, full_name_kana, avatar_url, entry_date, zairyu_exp)').eq('is_deleted', false).order('created_at', { ascending: false })

    if (companiesError) console.error('Error fetching companies:', companiesError);

    return (
        <div className="flex h-screen font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="companies" />
            <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                <CompaniesClient companies={companies || []} userRole={userProfile?.role || 'staff'} />
            </div>
        </div>
    )
}

