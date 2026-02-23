import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
 try {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { data: userProfile } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()

 if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'union_admin')) {
 return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
 }

 const body = await request.json()
 const { name, license_number, address, representative, phone, email } = body

 const { error } = await supabase
 .from('tenants')
 .update({ name, license_number, address, representative, phone, email })
 .eq('id', userProfile.tenant_id)

 if (error) throw error

 return NextResponse.json({ success: true })
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }
}
