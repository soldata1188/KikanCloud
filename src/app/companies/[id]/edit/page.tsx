import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { redirect } from 'next/navigation'
import EditCompanyClient from './EditCompanyClient'

export default async function EditCompanyPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', params.id)
        .single()

    if (error || !company) redirect('/companies')

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden selection:bg-emerald-500/20">
            <Sidebar active="companies" />
            <main className="flex-1 flex flex-col relative overflow-hidden">
                <EditCompanyClient company={company} />
            </main>
        </div>
    )
}
