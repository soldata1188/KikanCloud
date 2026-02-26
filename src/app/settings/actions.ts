'use server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const getAdminClient = () => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error('システムエラー: SUPABASE_SERVICE_ROLE_KEY が設定されていません。');
    return createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

export async function createAccount(formData: FormData) {
    const localSupabase = await createClient()
    const { data: { user } } = await localSupabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminData } = await localSupabase.from('users').select('role, tenant_id').eq('id', user.id).single()
    if (adminData?.role !== 'admin') throw new Error('権限がありません。最高管理者のみ実行可能です。')

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as string
    const companyIdStr = formData.get('companyId') as string
    const companyId = companyIdStr && companyIdStr !== 'null' ? companyIdStr : null

    const adminClient = getAdminClient()

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: fullName }
    })
    if (authError || !authData.user) throw new Error(authError?.message || 'アカウント作成に失敗しました')

    await adminClient.from('users').update({
        tenant_id: adminData.tenant_id, full_name: fullName, role: role,
        company_id: (role === 'company_admin' || role === 'company_user') ? companyId : null
    }).eq('id', authData.user.id)

    revalidatePath('/settings')
}

export async function deleteAccount(formData: FormData) {
    const id = formData.get('id') as string
    const localSupabase = await createClient()
    const { data: { user } } = await localSupabase.auth.getUser()
    const { data: adminData } = await localSupabase.from('users').select('role').eq('id', user?.id).single()
    if (adminData?.role !== 'admin') throw new Error('Permission denied')

    const adminClient = getAdminClient()
    await adminClient.auth.admin.deleteUser(id)
    revalidatePath('/settings')
}

export async function updateProfile(formData: FormData) {
    const localSupabase = await createClient()
    const { data: { user } } = await localSupabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const fullName = formData.get('fullName') as string
    const password = formData.get('password') as string

    const adminClient = getAdminClient()

    if (fullName) {
        const { error } = await adminClient.from('users').update({ full_name: fullName }).eq('id', user.id)
        if (error) throw new Error('名前の更新に失敗しました')
        await adminClient.auth.admin.updateUserById(user.id, { user_metadata: { full_name: fullName } })
    }

    if (password && password.length >= 6) {
        const { error } = await adminClient.auth.admin.updateUserById(user.id, { password })
        if (error) throw new Error('パスワードの更新に失敗しました')
    }

    revalidatePath('/settings')
}
