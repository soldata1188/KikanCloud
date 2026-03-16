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
        const companyId = formData.get('companyId') as string || null

        if (!loginId || !password || !fullName) return { error: 'すべての必須項目を入力してください。' }
        if (role === 'company_admin' && !companyId) return { error: '受入企業を選択してください。' }

        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: '認証エラー' }
        const { data: adminProfile } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single()
        if (!adminProfile || !['admin', 'union_admin'].includes(adminProfile.role) || !adminProfile.tenant_id) {
            return { error: '管理者権限が必要です。' }
        }

        const adminDb = getAdminSupabase()

        // Call stored procedure — bypasses GoTrue's auth.admin.createUser
        // (which fails with "Database error checking email" due to internal GoTrue issues)
        const { data: rpcResult, error: rpcError } = await adminDb.rpc('provision_account', {
            p_login_id:   loginId,
            p_password:   password,
            p_full_name:  fullName,
            p_role:       role,
            p_tenant_id:  adminProfile.tenant_id,
            p_company_id: companyId,
        })

        if (rpcError) return { error: 'アカウントの作成に失敗しました: ' + rpcError.message }

        const result = rpcResult as { success?: boolean; error?: string; login_id?: string; user_id?: string }
        if (result?.error) return { error: result.error }

        // Re-set password via GoTrue Admin API to ensure bcrypt format compatibility.
        // updateUserById only does an UPDATE (no email check), so it won't fail like createUser did.
        if (result?.user_id) {
            const { error: pwError } = await adminDb.auth.admin.updateUserById(result.user_id, { password })
            if (pwError) {
                await adminDb.auth.admin.deleteUser(result.user_id)
                return { error: 'パスワードの設定に失敗しました: ' + pwError.message }
            }
        }

        revalidatePath('/accounts')
        revalidatePath('/organization')
        revalidatePath('/settings')
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
        if (!adminProfile || !['admin', 'union_admin'].includes(adminProfile.role)) {
            return { error: '管理者権限が必要です。' }
        }

        // RLS check
        const { data: targetUser } = await supabase.from('users').select('tenant_id').eq('id', userId).single()
        if (targetUser?.tenant_id !== adminProfile.tenant_id) return { error: '不正な操作です。' }

        const adminDb = getAdminSupabase()
        const { error: updateError } = await adminDb.auth.admin.updateUserById(userId, { password: newPassword })

        if (updateError) return { error: 'パスワードのリセットに失敗しました: ' + updateError.message }

        revalidatePath('/accounts')
        revalidatePath('/organization')
        revalidatePath('/settings')
        return { success: true }
    } catch (err: any) {
        return { error: 'サーバーエラーが発生しました。' }
    }
}

export async function deleteProvisionedAccount(userId: string) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: '認証エラー' }

        const { data: adminProfile } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single()
        if (!adminProfile || !['admin', 'union_admin'].includes(adminProfile.role)) {
            return { error: '管理者権限が必要です。' }
        }

        // Cannot delete yourself
        if (userId === user.id) return { error: '自分自身のアカウントは削除できません。' }

        // Tenant isolation: only delete within same tenant
        const { data: targetUser } = await supabase.from('users').select('tenant_id, role').eq('id', userId).single()
        if (!targetUser || targetUser.tenant_id !== adminProfile.tenant_id) return { error: '不正な操作です。' }
        if (targetUser.role === 'admin') return { error: '管理者アカウントは削除できません。' }

        const adminDb = getAdminSupabase()
        const { error: delError } = await adminDb.auth.admin.deleteUser(userId)
        if (delError) return { error: 'アカウントの削除に失敗しました: ' + delError.message }

        revalidatePath('/accounts')
        revalidatePath('/organization')
        revalidatePath('/settings')
        return { success: true }
    } catch (err: any) {
        return { error: 'サーバーエラーが発生しました。' }
    }
}
