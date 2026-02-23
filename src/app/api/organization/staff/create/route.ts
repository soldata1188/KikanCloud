import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const getAdminClient = () => {
 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!serviceKey) throw new Error('System Error: Missing SUPABASE_SERVICE_ROLE_KEY');
 return createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
 auth: { autoRefreshToken: false, persistSession: false }
 })
}

export async function POST(request: Request) {
 try {
 const localSupabase = await createClient()
 const { data: { user } } = await localSupabase.auth.getUser()
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

 const { data: executor } = await localSupabase.from('users').select('role, tenant_id').eq('id', user.id).single()

 if (!executor || (executor.role !== 'admin' && executor.role !== 'union_admin')) {
 return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
 }

 const formData = await request.formData()
 const fullName = formData.get('fullName') as string
 const email = formData.get('email') as string
 const password = formData.get('password') as string
 const role = formData.get('role') as string // Should be 'union_staff' or 'union_admin'

 // Enforce role limitations to prevent privilege escalation
 if (role !== 'union_staff' && role !== 'union_admin') {
 return NextResponse.json({ error: 'Invalid role assignment' }, { status: 400 })
 }

 const adminClient = getAdminClient()

 // 1. Create Auth User
 const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
 email, password, email_confirm: true, user_metadata: { full_name: fullName }
 })

 if (authError || !authData.user) {
 return NextResponse.json({ error: authError?.message || 'Failed to create account in Auth' }, { status: 400 })
 }

 // 2. Lock to the creator's exact Tenant ID, assign role
 const { error: dbError } = await adminClient.from('users').update({
 tenant_id: executor.tenant_id,
 full_name: fullName,
 role: role
 }).eq('id', authData.user.id)

 if (dbError) throw dbError

 return NextResponse.redirect(new URL('/organization?tab=staff', request.url))

 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }
}
