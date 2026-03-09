'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getShienLogs() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('shien_logs')
        .select(`
            *,
            companies(name_jp),
            workers(full_name_romaji),
            author:author_id(full_name)
        `)
        .eq('is_deleted', false)
        .order('support_date', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) throw new Error('Failed to fetch shien logs')

    return data || []
}

export async function addShienLog(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const companyId = formData.get('company_id') as string
    const workerId = formData.get('worker_id') as string
    const content = formData.get('content') as string
    const supportDate = formData.get('support_date') as string
    const supportType = formData.get('support_type') as string

    if (!companyId || !content) throw new Error('Company and content are required')

    const { error } = await supabase
        .from('shien_logs')
        .insert({
            tenant_id: (await supabase.from('users').select('tenant_id').eq('id', user.id).single()).data?.tenant_id,
            company_id: companyId,
            worker_id: workerId || null,
            content,
            support_date: supportDate || new Date().toISOString().split('T')[0],
            support_type: supportType || 'visit',
            author_id: user.id
        })

    if (error) throw new Error('Failed to add shien log: ' + error.message)

    revalidatePath('/operations/shien')
    return { success: true }
}

export async function deleteShienLog(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('shien_logs').update({ is_deleted: true }).eq('id', id)
    if (error) throw new Error('Failed to delete shien log')
    revalidatePath('/operations/shien')
    return { success: true }
}
