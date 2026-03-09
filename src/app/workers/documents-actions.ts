'use server'

import { createClient } from '@/lib/supabase/server';

interface SaveDocParams {
    workerId: string;
    docType: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    contentType: string;
}

export async function saveDocumentRecord(params: SaveDocParams) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userRow } = await supabase.from('users').select('tenant_id').eq('id', user!.id).single();

    const { error } = await supabase.from('worker_documents').insert({
        tenant_id: userRow?.tenant_id,
        worker_id: params.workerId,
        doc_type: params.docType,
        file_name: params.fileName,
        file_path: params.filePath,
        file_size: params.fileSize,
        content_type: params.contentType,
        uploaded_by: user?.email || user?.id,
    });

    if (error) throw new Error(error.message);
}

export async function deleteDocumentRecord(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('worker_documents')
        .update({ is_deleted: true })
        .eq('id', id);
    if (error) throw new Error(error.message);
}
