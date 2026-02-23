'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getOperationsData() {
    const supabase = await createClient()

    // Lấy thông tin người dùng để kiểm tra quyền / tenant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('未認証のユーザーです。(Unauthorized)')
    }

    const { data: userData } = await supabase.from('users').select('role, tenant_id, company_id').eq('id', user.id).single()
    if (!userData?.tenant_id) {
        throw new Error('テナントIDが見つかりません。(Tenant ID not found)')
    }

    // Câu query cơ bản
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
        .order('created_at', { ascending: false })

    // RLS sẽ tự động xử lý việc filter theo tenant_id và user_role theo migration 00023.
    // Thực thi query
    const { data: workers, error } = await query

    if (error) {
        console.error('Error fetching operations data:', error)
        throw new Error('データの取得に失敗しました。(Failed to fetch data)')
    }

    // Nếu công ty cần danh sách để dropdown lúc tạo mới:
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
        full_name_kana: '', // Thể hiện ý định, sẽ fill sau
        dob: '2000-01-01', // Dummy data, cần UI nhập sau
        system_type: 'ikusei_shuro', // Mặc định
        status: 'waiting', // Mặc định là 入国待ち
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

    // Ánh xạ cột từ UI sang Database (tuỳ thuộc schema)
    // Hiện tại schema workers có cột status ('waiting', 'working', 'missing', 'returned')
    // Nếu các cột kenteiStatus, v.v không có trong DB thì phải tạo thêm hoặc dùng JSON, ở đây tạm mapping 
    // sang một struct cơ bản. Nếu DB chưa hỗ trợ kentei_status, kikou_status... ta update status chính trước.

    // Chuyển đổi trạng thái tiếng Nhật sang ENUM nếu update cột `status`
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
