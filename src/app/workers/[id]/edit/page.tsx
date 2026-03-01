import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import EditWorkerClient from './EditWorkerClient'

export default async function EditWorkerPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

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
        <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workers" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="実習生 編集" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto relative bg-slate-50">
                    <EditWorkerClient companies={companies || []} worker={worker} />
                </main>
            </div>
        </div>
    );
}
