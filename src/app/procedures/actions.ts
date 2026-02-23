'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { syncWorkerStatusFromProcedure } from '@/app/actions/rpa'

export async function createProcedure(formData: FormData) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) throw new Error('Unauthorized')
 const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()

 const worker_id = formData.get('worker_id') as string || null
 let company_id = formData.get('company_id') as string || null

 // Auto-fill company_id nếu người dùng chỉ chọn worker
 if (worker_id && !company_id) {
 const { data: worker } = await supabase.from('workers').select('company_id').eq('id', worker_id).single()
 if (worker?.company_id) company_id = worker.company_id;
 }

 const newProc = {
 tenant_id: userData?.tenant_id,
 worker_id: worker_id,
 company_id: company_id,
 agency: formData.get('agency') as string,
 procedure_name: formData.get('procedure_name') as string,
 target_date: formData.get('target_date') as string || null,
 pic_name: formData.get('pic_name') as string || null,
 notes: formData.get('notes') as string || null,
 status: formData.get('status') as string || 'preparing'
 }

 await supabase.from('procedures').insert(newProc)
 revalidatePath('/procedures')
 redirect(`/procedures?tab=${newProc.agency}`)
}

export async function updateProcedure(formData: FormData) {
 const supabase = await createClient()
 const id = formData.get('id') as string
 const worker_id = formData.get('worker_id') as string || null
 let company_id = formData.get('company_id') as string || null

 if (worker_id && !company_id) {
 const { data: worker } = await supabase.from('workers').select('company_id').eq('id', worker_id).single()
 if (worker?.company_id) company_id = worker.company_id;
 }

 const updatedData = {
 worker_id: worker_id,
 company_id: company_id,
 agency: formData.get('agency') as string,
 procedure_name: formData.get('procedure_name') as string,
 target_date: formData.get('target_date') as string || null,
 submitted_date: formData.get('submitted_date') as string || null,
 completed_date: formData.get('completed_date') as string || null,
 pic_name: formData.get('pic_name') as string || null,
 notes: formData.get('notes') as string || null,
 status: formData.get('status') as string,
 }

 await supabase.from('procedures').update(updatedData).eq('id', id)

 // RPA: Sync Kanban status to Worker profile
 if (updatedData.status === 'completed' && worker_id) {
 await syncWorkerStatusFromProcedure(worker_id, updatedData.procedure_name, updatedData.status)
 }
 revalidatePath('/procedures')
 redirect(`/procedures?tab=${updatedData.agency}`)
}

export async function quickToggleProcedureStatus(procId: string) {
 const supabase = await createClient()
 const { data: proc } = await supabase.from('procedures').select('status, worker_id, procedure_name').eq('id', procId).single()
 if (!proc) return

 let newStatus = 'preparing'
 const todayStr = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0] // Giờ JST
 const updateData: any = {}

 if (proc.status === 'preparing' || proc.status === 'issue') {
 newStatus = 'submitted'
 updateData.submitted_date = todayStr
 } else if (proc.status === 'submitted') {
 newStatus = 'completed'
 updateData.completed_date = todayStr
 } else {
 return
 }

 updateData.status = newStatus
 await supabase.from('procedures').update(updateData).eq('id', procId)

 // RPA: Sync Kanban status to Worker profile
 if (newStatus === 'completed' && proc.worker_id) {
 await syncWorkerStatusFromProcedure(proc.worker_id, proc.procedure_name, newStatus)
 }
 revalidatePath('/procedures')
}

export async function deleteProcedure(formData: FormData) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) throw new Error('Unauthorized')
 const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
 if (userData?.role !== 'admin') throw new Error('管理者権限が必要です。(Admin only)')
 const id = formData.get('id') as string
 await supabase.from('procedures').update({ is_deleted: true }).eq('id', id)
 revalidatePath('/procedures')
}
