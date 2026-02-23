'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUnreadNotifications(role: string, companyId?: string | null) {
    const supabase = await createClient()
    let query = supabase.from('notifications').select('*').eq('is_read', false).order('created_at', { ascending: false }).limit(20)
    if (role === 'company_admin' || role === 'company_user') query = query.eq('target_company_id', companyId).in('target_role', ['company_admin', 'company_client'])
    else query = query.is('target_company_id', null).eq('target_role', 'admin')

    const { data } = await query
    return data || []
}

export async function markNotificationAsRead(id: string) {
    const supabase = await createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
}

export async function bulkUpdateWorkerStatus(ids: string[], status: string) {
    const supabase = await createClient()
    await supabase.from('workers').update({ status }).in('id', ids)
    revalidatePath('/workers')
}

export async function bulkUpdateWorkerField(ids: string[], field: string, value: any) {
    const supabase = await createClient()
    await supabase.from('workers').update({ [field]: value }).in('id', ids)
    revalidatePath('/workers')
}

export async function bulkDeleteWorkers(ids: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: userData } = await supabase.from('users').select('role').eq('id', user?.id).single()
    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') throw new Error('Unauthorized')

    await supabase.from('workers').update({ is_deleted: true }).in('id', ids)
    revalidatePath('/workers')
}
