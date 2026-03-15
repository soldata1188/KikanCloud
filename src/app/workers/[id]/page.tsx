import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkerDetailClient from './WorkerDetailClient'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'

export default async function WorkerDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    const { data: worker, error } = await supabase
        .from('workers')
        .select('*, companies(name_jp)')
        .eq('id', params.id)
        .single();

    if (error || !worker) redirect('/workers')

    // Fetch documents
    const { data: docs } = await supabase.storage
        .from('worker_documents')
        .list(`${worker.tenant_id}/${worker.id}`);

    const documents = docs?.filter(d => d.name !== '.emptyFolderPlaceholder').map(doc => {
        const { data } = supabase.storage.from('worker_documents').getPublicUrl(`${worker.tenant_id}/${worker.id}/${doc.name}`);
        return {
            name: doc.name,
            url: data.publicUrl,
            created_at: doc.created_at
        };
    }) || [];

    return (
        <div className="flex h-screen font-sans text-gray-900 overflow-hidden selection:bg-emerald-500/20">
            <Sidebar active="workers" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto relative">
                    <WorkerDetailClient worker={worker} documents={documents} />
                </main>
            </div>
        </div>
    );
}
