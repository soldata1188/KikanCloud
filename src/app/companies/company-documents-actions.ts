'use server';

import { createClient } from '@/lib/supabase/server';

export async function saveCompanyDocumentRecord(data: {
    companyId: string;
    docType: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    contentType: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get the user's tenant_id from the 'users' table 
    const { data: userRow } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user!.id)
        .single();

    const { error } = await supabase
        .from('company_documents')
        .insert({
            tenant_id: userRow?.tenant_id,
            company_id: data.companyId,
            doc_type: data.docType,
            file_name: data.fileName,
            file_path: data.filePath,
            file_size: data.fileSize,
            content_type: data.contentType,
            created_by: user!.id
        });

    if (error) throw new Error(error.message);
    return { success: true };
}

export async function deleteCompanyDocumentRecord(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('company_documents')
        .update({ is_deleted: true })
        .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
}
