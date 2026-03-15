import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CompanyDetailClient from './CompanyDetailClient'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'

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

    // Fetch structured documents from db
    const { data: dbDocs } = await supabase
        .from('client_documents')
        .select('*')
        .eq('company_id', params.id)
        .eq('doc_category', 'general')
        .order('created_at', { ascending: false });

    const documents = dbDocs?.map(doc => {
        const { data } = supabase.storage.from('client_docs').getPublicUrl(doc.file_path);
        return {
            name: doc.file_name,
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
        <div className="flex h-screen font-sans text-gray-900 overflow-hidden selection:bg-emerald-500/20">
            <Sidebar active="companies" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto relative">
                    <CompanyDetailClient company={company} documents={documents} />
                </main>
            </div>
        </div>
    );
}
