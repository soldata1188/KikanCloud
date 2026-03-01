import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CompanyDetailClient from './CompanyDetailClient'
import { Sidebar } from '@/components/Sidebar'

export default async function CompanyDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error || !company) redirect('/companies')

    // Fetch documents
    const { data: docs } = await supabase.storage
        .from('company_documents')
        .list(`${company.tenant_id}/${company.id}`);

    const documents = docs?.filter(d => d.name !== '.emptyFolderPlaceholder').map(doc => {
        const { data } = supabase.storage.from('company_documents').getPublicUrl(`${company.tenant_id}/${company.id}/${doc.name}`);
        return {
            name: doc.name,
            url: data.publicUrl,
            created_at: doc.created_at
        };
    }) || [];

    // fetch workers to display
    const { data: workers } = await supabase
        .from('workers')
        .select('system_type, status, is_deleted')
        .eq('company_id', company.id)
        .eq('is_deleted', false);

    company.workers = workers || [];

    return (
        <div className="flex h-screen font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="companies" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <main className="flex-1 overflow-y-auto relative">
                    <CompanyDetailClient company={company} documents={documents} />
                </main>
            </div>
        </div>
    );
}
