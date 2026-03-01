import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { redirect } from 'next/navigation'
import EditCompanyClient from './EditCompanyClient'

export default async function EditCompanyPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', params.id)
        .single()

    if (error || !company) redirect('/companies')

    return (
        <div className="flex h-screen bg-white font-sans overflow-hidden selection:bg-emerald-500/20">
            <Sidebar active="companies" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="受入企业 編集" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto relative bg-slate-50">
                    <EditCompanyClient company={company} />
                </main>
            </div>
        </div>
    )
}
