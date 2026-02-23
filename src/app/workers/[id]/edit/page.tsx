import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import EditWorkerClient from './EditWorkerClient'

export default async function EditWorkerPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: worker, error } = await supabase
        .from('workers')
        .select('*')
        .eq('id', params.id)
        .single()

    if (error || !worker) {
        redirect('/workers')
    }

    // Fetch companies for the dropdown
    const { data: companies } = await supabase
        .from('companies')
        .select('id, name_jp')
        .eq('is_deleted', false)
        .order('name_jp')

    return (
        <div className="flex h-screen bg-[#f3f4f6] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-hidden">
                <EditWorkerClient companies={companies || []} worker={worker} />
            </main>
        </div>
    )
}
