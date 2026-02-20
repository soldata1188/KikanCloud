'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadWorkerDocument(workerId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: userData } = await supabase.from('users').select('tenant_id, full_name, role').eq('id', user.id).single()

    const file = formData.get('file') as File
    const docType = formData.get('doc_type') as string

    if (!file || file.size === 0) throw new Error('ファイルが選択されていません。(File is empty)')
    if (file.size > 5 * 1024 * 1024) throw new Error('ファイルサイズは5MB以下にしてください。(Max 5MB)')

    // 1. Upload to Supabase Private Storage
    const fileExt = file.name.split('.').pop()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${userData?.tenant_id}/${workerId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('worker_docs').upload(filePath, file)
    if (uploadError) {
        console.error('Upload Error:', uploadError);
        throw new Error(`ファイルのアップロードに失敗しました。${uploadError.message}`)
    }

    // 2. Save metadata to DB
    const { error: dbError } = await supabase.from('worker_documents').insert({
        tenant_id: userData?.tenant_id,
        worker_id: workerId,
        doc_type: docType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        content_type: file.type,
        uploaded_by: userData?.full_name
    })

    if (dbError) {
        await supabase.storage.from('worker_docs').remove([filePath])
        throw new Error('データベースへの記録に失敗しました。')
    }

    revalidatePath(`/workers/${workerId}/documents`)
    return { success: true }
}

export async function deleteWorkerDocument(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userData?.role !== 'admin') throw new Error('管理者権限が必要です。(Admin only)')

    const docId = formData.get('docId') as string
    const filePath = formData.get('filePath') as string
    const workerId = formData.get('workerId') as string

    // Soft delete metadata
    await supabase.from('worker_documents').update({ is_deleted: true }).eq('id', docId)

    // Xóa file vật lý để tiết kiệm dung lượng Storage
    await supabase.storage.from('worker_docs').remove([filePath])

    revalidatePath(`/workers/${workerId}/documents`)
}
