'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUnreadNotifications(role: string, companyId?: string | null) {
    try {
        const supabase = await createClient()
        let query = supabase.from('notifications').select('*').eq('is_read', false).order('created_at', { ascending: false }).limit(20)
        if (role === 'company_admin' || role === 'company_user') query = query.eq('target_company_id', companyId).in('target_role', ['company_admin', 'company_client'])
        else query = query.is('target_company_id', null).eq('target_role', 'admin')

        const { data } = await query
        return data || []
    } catch {
        return []
    }
}

export async function markNotificationAsRead(id: string) {
    try {
        const supabase = await createClient()
        await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    } catch {
        // fire-and-forget — notification UI will update on next load
    }
}

export async function bulkUpdateWorkerStatus(ids: string[], status: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from('workers').update({ status }).in('id', ids)
        if (error) return { error: error.message }
        revalidatePath('/workers')
        return { success: true }
    } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : '一括更新に失敗しました。' }
    }
}

export async function bulkUpdateWorkerField(ids: string[], field: string, value: string | null) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from('workers').update({ [field]: value }).in('id', ids)
        if (error) return { error: error.message }
        revalidatePath('/workers')
        return { success: true }
    } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : '一括更新に失敗しました。' }
    }
}

export async function bulkDeleteWorkers(ids: string[]) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { data: userData } = await supabase.from('users').select('role').eq('id', user?.id).single()
        if (userData?.role !== 'admin' && userData?.role !== 'super_admin') return { error: '権限がありません。(Unauthorized)' }

        const { error } = await supabase.from('workers').update({ is_deleted: true }).in('id', ids)
        if (error) return { error: error.message }
        revalidatePath('/workers')
        return { success: true }
    } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : '削除に失敗しました。' }
    }
}
