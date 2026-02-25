'use server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const getAdminSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function createProvisionedAccount(formData: FormData) {
    try {
        const loginId = (formData.get('loginId') as string).trim().toLowerCase()
        const password = formData.get('password') as string
        const fullName = formData.get('fullName') as string
        const role = (formData.get('role') as string) || 'staff'
        const companyId = formData.get('companyId') as string

        if (!loginId || !password || !fullName) return { error: 'すべての必須項目を入力してください。' }
        if (password.length < 6) return { error: 'パスワードは6文字以上で入力してください。' }
        if (!/^[a-z0-9_-]+$/.test(loginId)) return { error: 'ログインIDは半角英数字とハイフン(-)のみ使用可能です。' }
        if (role === 'company_admin' && !companyId) return { error: '受入企業を選択してください。' }

        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: '認証エラー' }
        const { data: adminProfile } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single()
        if (adminProfile?.role !== 'admin' || !adminProfile?.tenant_id) return { error: '管理者権限が必要です。' }

        const adminDb = getAdminSupabase()

        const { data: existingUser } = await adminDb.from('users').select('id').eq('login_id', loginId).single()
        if (existingUser) return { error: 'このログインIDは既に使用されています。' }

        const dummyEmail = `${loginId}@kikancloud.local`

        const { data: authData, error: authError } = await adminDb.auth.admin.createUser({
            email: dummyEmail, password: password, email_confirm: true, user_metadata: { full_name: fullName }
        })

        if (authError) return { error: 'アカウントの作成に失敗しました: ' + authError.message }

        const { error: updateError } = await adminDb.from('users').update({
            full_name: fullName, role: role, login_id: loginId, tenant_id: adminProfile.tenant_id, company_id: role === 'company_admin' ? companyId : null
        }).eq('id', authData.user!.id)

        if (updateError) {
            await adminDb.auth.admin.deleteUser(authData.user!.id)
            return { error: '権限の割り当てに失敗しました。' }
        }

        revalidatePath('/accounts')
        return { success: true, loginId, password }
    } catch (err: any) {
        return { error: 'サーバーエラーが発生しました。' }
    }
}

export async function resetUserPassword(userId: string, newPassword: string) {
    try {
        if (!newPassword || newPassword.length < 6) return { error: 'パスワードは6文字以上で入力してください。' }

        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: '認証エラー' }

        const { data: adminProfile } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single()
        if (adminProfile?.role !== 'admin') return { error: '管理者権限が必要です。' }

        // RLS check
        const { data: targetUser } = await supabase.from('users').select('tenant_id').eq('id', userId).single()
        if (targetUser?.tenant_id !== adminProfile.tenant_id) return { error: '不正な操作です。' }

        const adminDb = getAdminSupabase()
        const { error: updateError } = await adminDb.auth.admin.updateUserById(userId, { password: newPassword })

        if (updateError) return { error: 'パスワードのリセットに失敗しました: ' + updateError.message }

        revalidatePath('/accounts')
        return { success: true }
    } catch (err: any) {
        return { error: 'サーバーエラーが発生しました。' }
    }
}
