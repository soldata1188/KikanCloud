'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAuditInline(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()

    const status = formData.get('status') as string || 'planned'
    const newAudit: any = {
        tenant_id: userData?.tenant_id,
        company_id: formData.get('company_id') as string,
        audit_type: formData.get('audit_type') as string,
        scheduled_date: formData.get('scheduled_date') as string,
        pic_name: formData.get('pic_name') as string || null,
        notes: formData.get('notes') as string || null,
        status,
    }
    if (status === 'completed') {
        const actualDate = formData.get('actual_date') as string
        newAudit.actual_date = actualDate || new Date().toISOString().split('T')[0]
    }
    const { error } = await supabase.from('audits').insert(newAudit)
    if (error) return { error: error.message }
    revalidatePath('/audits')
    return { success: true }
}

export async function upsertAuditSchedule({
    companyId, auditType, month, scheduledDate, actualDate, picName, markCompleted, existingId,
}: {
    companyId: string, auditType: string, month: string,
    scheduledDate: string, actualDate?: string, picName?: string,
    markCompleted?: boolean, existingId?: string,
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()

    const todayJST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
    const status = markCompleted ? 'completed' : 'planned'
    const payload: any = {
        company_id: companyId, audit_type: auditType,
        scheduled_date: scheduledDate, pic_name: picName || null,
        status, actual_date: markCompleted ? (actualDate || todayJST) : (actualDate || null),
        tenant_id: userData?.tenant_id,
    }

    if (existingId) {
        const { error } = await supabase.from('audits').update(payload).eq('id', existingId)
        if (error) return { error: error.message }
    } else {
        const { error } = await supabase.from('audits').insert(payload)
        if (error) return { error: error.message }
    }
    revalidatePath('/audits')
    return { success: true }
}


export async function createAudit(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()

    const status = formData.get('status') as string || 'planned'
    const newAudit: any = {
        tenant_id: userData?.tenant_id,
        company_id: formData.get('company_id') as string,
        audit_type: formData.get('audit_type') as string,
        scheduled_date: formData.get('scheduled_date') as string,
        pic_name: formData.get('pic_name') as string || null,
        notes: formData.get('notes') as string || null,
        status,
    }
    // If created as completed, record actual_date
    if (status === 'completed') {
        const actualDate = formData.get('actual_date') as string
        newAudit.actual_date = actualDate || new Date().toISOString().split('T')[0]
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
    try {
        const supabase = await createClient()
        const updateData: { status: string; actual_date?: string } = { status: newStatus }
        if (newStatus === 'completed') {
            updateData.actual_date = new Date().toISOString().split('T')[0]
        }
        await supabase.from('audits').update(updateData).eq('id', id)
        revalidatePath('/audits')
    } catch {
        // silently ignore — UI revalidates on next load
    }
}

export async function deleteAudit(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }
        const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
        if (userData?.role !== 'admin') return { error: '管理者権限が必要です。' }
        const id = formData.get('id') as string
        await supabase.from('audits').update({ is_deleted: true }).eq('id', id)
        revalidatePath('/audits')
    } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : '削除に失敗しました。' }
    }
    redirect('/audits')
}

export async function deleteAuditHistory(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
        if (userData?.role !== 'admin') return
        const id = formData.get('id') as string
        await supabase.from('audits').update({ is_deleted: true }).eq('id', id)
        revalidatePath('/audits')
    } catch (e: unknown) {
        // Silently fail or log to telemetry
    }
}

export async function quickToggleAuditStatus(auditId: string) {
    try {
        const supabase = await createClient()
        const { data: audit } = await supabase.from('audits').select('status').eq('id', auditId).single()
        if (!audit) return

        if (audit.status !== 'planned' && audit.status !== 'in_progress') return

        const d = new Date()
        const actualDate = new Date(d.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0]
        const updateData = { status: 'completed', actual_date: actualDate }

        await supabase.from('audits').update(updateData).eq('id', auditId)
        revalidatePath('/audits')
        revalidatePath('/')
    } catch {
        // silently ignore
    }
}