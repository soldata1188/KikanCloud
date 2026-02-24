'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getOperationsData() {
    const supabase = await createClient()

    // Get user information to check permissions / tenant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('未認証のユーザーです。(Unauthorized)')
    }

    const { data: userData } = await supabase.from('users').select('role, tenant_id, company_id').eq('id', user.id).single()
    if (!userData?.tenant_id) {
        throw new Error('テナントIDが見つかりません。(Tenant ID not found)')
    }

    // Basic query statement
    const query = supabase
        .from('workers')
        .select(`
            *,
            companies (
                name_jp
            ),
            visas (
                visa_type,
                expiration_date
            )
        `)
        .eq('is_deleted', false)
        .order('expiration_date', { foreignTable: 'visas', ascending: false })
        .order('created_at', { ascending: false })

    // RLS will automatically handle filtering by tenant_id and user_role according to migration 00023.
    // Execute query
    const { data: workers, error } = await query

    if (error) {
        console.error('Error fetching operations data:', error)
        throw new Error('データの取得に失敗しました。(Failed to fetch data)')
    }

    // If companies need a list for dropdown during new creation:
    const companiesQuery = supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')
    const { data: companies, error: companiesError } = await companiesQuery

    if (companiesError) {
        console.error('Error fetching companies:', companiesError)
    }

    return { workers: workers || [], companies: companies || [] }
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

    const newWorker = {
        tenant_id: userData.tenant_id,
        company_id: companyId ? companyId : null,
        full_name_romaji: fullNameRomaji,
        full_name_kana: '', // Indicates intention, will be filled later
        dob: '2000-01-01', // Dummy data, UI input required later
        system_type: 'ikusei_shuro', // Default
        status: 'waiting', // Default is 入国待ち (waiting for entry)
    }

    const { data, error } = await supabase
        .from('workers')
        .insert(newWorker)
        .select()
        .single()

    if (error) {
        console.error('Error adding worker:', error)
        throw new Error('追加に失敗しました。(Failed to add worker): ' + error.message)
    }

    revalidatePath('/operations')
    return { success: true, data }
}

export async function updateWorkerStatus(workerId: string, column: string, value: string) {
    const supabase = await createClient()

    // Map column from UI to Database (depending on schema)
    // Currently, the workers schema has a 'status' column ('waiting', 'working', 'missing', 'returned')
    // If columns like kenteiStatus, etc., are not in the DB, they must be created or JSON used; here, we temporarily map
    // to a basic struct. If the DB does not yet support kentei_status, kikou_status... we update the main status first.

    // Convert Japanese status to ENUM if updating the `status` column
    const dbColumn = column;
    let dbValue = value;

    if (column === 'status') {
        const statusMap: Record<string, string> = {
            '入国待ち': 'waiting',
            '対応中': 'standby',
            '就業中': 'working',
            '失踪': 'missing',
            '帰国': 'returned'
        };
        dbValue = statusMap[value] || value; // Fallback
    }

    const updates: any = {
        updated_at: new Date().toISOString()
    }
    updates[dbColumn] = dbValue;

    const { error } = await supabase
        .from('workers')
        .update(updates)
        .eq('id', workerId)

    if (error) {
        console.error('Error updating worker status:', error)
        throw new Error('更新に失敗しました。(Failed to update status): ' + error.message)
    }

    revalidatePath('/operations')
    return { success: true }
}

export async function updateOperationData(workerId: string, column: 'kentei_status' | 'kikou_status' | 'nyukan_status', data: any) {
    const supabase = await createClient()

    const updates: any = {
        updated_at: new Date().toISOString()
    }
    updates[column] = data; // Overwrite the JSON object entirely

    const { error } = await supabase
        .from('workers')
        .update(updates)
        .eq('id', workerId)

    if (error) {
        console.error('Error updating operation data:', error)
        throw new Error('更新に失敗しました。(Failed to update operation): ' + error.message)
    }

    revalidatePath('/operations')
    return { success: true }
}