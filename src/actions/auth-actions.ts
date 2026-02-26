'use server'

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function inviteUser(email: string) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing Supabase Service Role Key or URL');
    }

    const serverClient = await createServerClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: currentUser } = await serverClient.from('users').select('tenant_id').eq('id', user.id).single()
    if (!currentUser?.tenant_id) throw new Error('Invalid current user context')

    const supabaseAdmin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Call Supabase Admin API to invite user by email
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/update-password`
    });

    if (error) {
        throw new Error(error.message);
    }

    if (data.user) {
        const { error: dbError } = await supabaseAdmin.from('users').update({
            tenant_id: currentUser.tenant_id,
            role: 'union_staff'
        }).eq('id', data.user.id)
        if (dbError) throw new Error('テナントの紐付けに失敗しました: ' + dbError.message)
    }

    return { success: true, user: data.user };
}
