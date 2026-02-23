import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkerDetailClient from './WorkerDetailClient'
import { Sidebar } from '@/components/Sidebar'

export default async function WorkerDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

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
        <div className="flex h-screen bg-[#f8fcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workers" />
            <WorkerDetailClient worker={worker} documents={documents} />
        </div>
    );
}
