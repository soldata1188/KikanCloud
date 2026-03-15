'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getOperationsData() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未認証のユーザーです。(Unauthorized)')

    const { data: userData } = await supabase.from('users').select('role, tenant_id, company_id').eq('id', user.id).single()
    if (!userData?.tenant_id) throw new Error('テナントIDが見つかりません。(Tenant ID not found)')

    const { data: workers, error } = await supabase
        .from('workers')
        .select(`*, companies(name_jp), visas(visa_type, expiration_date)`)
        .eq('is_deleted', false)
        .in('status', ['working', 'standby', 'waiting'])
        .order('expiration_date', { foreignTable: 'visas', ascending: false })
        .order('created_at', { ascending: false })

    if (error) throw new Error('データの取得に失敗しました。(Failed to fetch data)')

    const { data: companies } = await supabase
        .from('companies')
        .select('id, name_jp')
        .eq('is_deleted', false)
        .order('name_jp')

    const { data: staff } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('tenant_id', userData.tenant_id)
        .order('full_name')

    return {
        workers: workers || [],
        companies: companies || [],
        staff: staff || []
    }
}

export async function addWorker(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未認証のユーザーです。(Unauthorized)')
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData?.tenant_id) throw new Error('テナントIDが見つかりません。(Tenant ID not found)')

    const fullNameRomaji = formData.get('fullNameRomaji') as string
    const companyId = formData.get('companyId') as string

    if (!fullNameRomaji) throw new Error('名前を入力してください。(Name is required)')

    const { data, error } = await supabase
        .from('workers')
        .insert({
            tenant_id: userData.tenant_id,
            company_id: companyId || null,
            full_name_romaji: fullNameRomaji,
            full_name_kana: '',
            dob: '2000-01-01',
            system_type: 'ikusei_shuro',
            status: 'waiting',
        })
        .select()
        .single()

    if (error) throw new Error('追加に失敗しました。(Failed to add worker): ' + error.message)

    revalidatePath('/operations')
    return { success: true, data }
}

export async function updateWorkerStatus(workerId: string, column: string, value: string) {
    const supabase = await createClient()

    let dbValue = value
    if (column === 'status') {
        const statusMap: Record<string, string> = {
            '未入国': 'waiting',
            '対応中': 'standby',
            '就業中': 'working',
            '失踪': 'missing',
            '帰国': 'returned',
            '転籍済': 'transferred'
        }
        dbValue = statusMap[value] ?? value
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    updates[column] = dbValue

    const { error } = await supabase.from('workers').update(updates).eq('id', workerId)
    if (error) throw new Error('更新に失敗しました。(Failed to update status): ' + error.message)

    revalidatePath('/operations')
    return { success: true }
}

export async function updateOperationData(workerId: string, column: 'kentei_status' | 'kikou_status' | 'nyukan_status', data: unknown) {
    const supabase = await createClient()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    // For kentei_status: sync ○/× symbols → gakka/jitsugi text fields for kentei page compatibility
    if (column === 'kentei_status' && data !== null && typeof data === 'object') {
        const d = { ...(data as Record<string, unknown>) }
        if (typeof d.exam_result_written === 'string') {
            d.gakka_result = d.exam_result_written === '○' ? '合格' : d.exam_result_written === '×' ? '不合格' : '未受験'
        }
        if (typeof d.exam_result_practical === 'string') {
            d.jitsugi_result = d.exam_result_practical === '○' ? '合格' : d.exam_result_practical === '×' ? '不合格' : '未受験'
        }
        updates[column] = d
    } else {
        updates[column] = data
    }

    const { error } = await supabase.from('workers').update(updates).eq('id', workerId)
    if (error) throw new Error('更新に失敗しました。(Failed to update operation): ' + error.message)

    revalidatePath('/operations')
    revalidatePath('/kentei')
    return { success: true }
}

export async function getWorkerTasksAndLogs(workerId: string) {
    const supabase = await createClient()

    const [{ data: tasks }, { data: logs }] = await Promise.all([
        supabase.from('tasks')
            .select('*, assigned_user:assigned_to(full_name)')
            .eq('worker_id', workerId)
            .eq('is_deleted', false)
            .order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('shien_logs')
            .select('*, author:author_id(full_name)')
            .eq('worker_id', workerId)
            .eq('is_deleted', false)
            .order('support_date', { ascending: false })
    ])

    return {
        tasks: tasks || [],
        logs: logs || []
    }
}