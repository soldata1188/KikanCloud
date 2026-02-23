'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadClientDocument(workerId: string, formData: FormData) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) throw new Error('Unauthorized')

 const { data: userData } = await supabase.from('users').select('tenant_id, company_id, full_name, role').eq('id', user.id).single()
 if (userData?.role !== 'company_client') throw new Error('企業アカウントでのみ実行可能です。')

 const file = formData.get('file') as File
 const docType = formData.get('doc_type') as string
 const targetMonth = formData.get('target_month') as string

 if (!file || file.size === 0) throw new Error('ファイルが選択されていません。')

 const fileExt = file.name.split('.').pop()
 const filePath =`${userData?.tenant_id}/${userData.company_id}/${workerId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

 const { error: uploadError } = await supabase.storage.from('client_docs').upload(filePath, file)
 if (uploadError) throw new Error('アップロード失敗')

 await supabase.from('client_documents').insert({
 tenant_id: userData?.tenant_id, company_id: userData.company_id, worker_id: workerId,
 doc_type: docType, target_month: targetMonth, file_name: file.name, file_path: filePath,
 file_size: file.size, uploaded_by: userData?.full_name + ' (企業)'
 })

 revalidatePath(`/portal/workers/${workerId}`)
 return { success: true }
}

export async function sendChatMessage(companyId: string, content: string, sourcePath: string) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user || !content.trim()) return

 const { data: userData } = await supabase.from('users').select('tenant_id, full_name, role, company_id').eq('id', user.id).single()
 if (userData?.role === 'company_client' && userData.company_id !== companyId) return

 await supabase.from('messages').insert({
 tenant_id: userData?.tenant_id, company_id: companyId, sender_id: user.id,
 sender_name: userData?.full_name, sender_role: userData?.role, content: content.trim()
 })

 revalidatePath(sourcePath)
}
