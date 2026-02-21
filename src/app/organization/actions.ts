'use server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const getAdminClient = () => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error('System Error: Missing SUPABASE_SERVICE_ROLE_KEY');
    return createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

export async function removeStaff(formData: FormData) {
    const userId = formData.get('userId') as string
    const localSupabase = await createClient()

    // Auth Check
    const { data: { user } } = await localSupabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Role Check (Only admins or union_admins of the same tenant can delete)
    const { data: executor } = await localSupabase.from('users').select('role, tenant_id').eq('id', user.id).single()
    if (!executor || (executor.role !== 'admin' && executor.role !== 'union_admin')) {
        throw new Error('Permission denied')
    }

    // Verify target belongs to same tenant to prevent cross-tenant deletion
    const { data: targetUser } = await localSupabase.from('users').select('tenant_id').eq('id', userId).single()
    if (targetUser?.tenant_id !== executor.tenant_id && executor.role !== 'admin') {
        throw new Error('Cross-tenant action forbidden')
    }

    const adminClient = getAdminClient()
    await adminClient.auth.admin.deleteUser(userId)

    revalidatePath('/organization')
}
