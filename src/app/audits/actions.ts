'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAudit(formData: FormData) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) throw new Error('Unauthorized')
 const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()

 const newAudit = {
 tenant_id: userData?.tenant_id,
 company_id: formData.get('company_id') as string,
 audit_type: formData.get('audit_type') as string,
 scheduled_date: formData.get('scheduled_date') as string,
 pic_name: formData.get('pic_name') as string || null,
 notes: formData.get('notes') as string || null,
 status: formData.get('status') as string || 'planned'
 }

 await supabase.from('audits').insert(newAudit)
 revalidatePath('/audits')
 redirect('/audits')
}

export async function updateAudit(formData: FormData) {
 const supabase = await createClient()
 const id = formData.get('id') as string

 const updatedData = {
 company_id: formData.get('company_id') as string,
 audit_type: formData.get('audit_type') as string,
 scheduled_date: formData.get('scheduled_date') as string,
 actual_date: formData.get('actual_date') as string || null,
 status: formData.get('status') as string,
 pic_name: formData.get('pic_name') as string || null,
 notes: formData.get('notes') as string || null,
 }

 await supabase.from('audits').update(updatedData).eq('id', id)
 revalidatePath('/audits')
 redirect('/audits')
}

export async function updateAuditStatus(id: string, newStatus: string) {
 const supabase = await createClient()
 const updateData: any = { status: newStatus }
 if (newStatus === 'completed') {
 updateData.actual_date = new Date().toISOString().split('T')[0]
 }
 await supabase.from('audits').update(updateData).eq('id', id)
 revalidatePath('/audits')
}

export async function deleteAudit(formData: FormData) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) throw new Error('Unauthorized')
 const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
 if (userData?.role !== 'admin') throw new Error('管理者権限が必要です。(Admin only)')
 const id = formData.get('id') as string
 await supabase.from('audits').update({ is_deleted: true }).eq('id', id)
 revalidatePath('/audits')
}

export async function quickToggleAuditStatus(auditId: string) {
 const supabase = await createClient()
 const { data: audit } = await supabase.from('audits').select('status').eq('id', auditId).single()
 if (!audit) return

 let newStatus = 'planned'
 let actualDate = null

 if (audit.status === 'planned' || audit.status === 'in_progress') {
 newStatus = 'completed' // 直接完了へ変更
 const d = new Date()
 actualDate = new Date(d.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0] // Giờ JST
 } else {
 return // 完了済みの場合は何もしない
 }

 const updateData: any = { status: newStatus }
 if (actualDate) updateData.actual_date = actualDate

 await supabase.from('audits').update(updateData).eq('id', auditId)
 revalidatePath('/audits')
 revalidatePath('/')
}
