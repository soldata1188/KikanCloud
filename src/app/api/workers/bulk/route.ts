import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
 try {
 const payload = await req.json()
 const supabase = await createClient()

 const { data: { user }, error: authError } = await supabase.auth.getUser()
 if (authError || !user) {
 return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
 }

 const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()

 if (!Array.isArray(payload) || payload.length === 0) {
 return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
 }

 const insertData = payload.map((row: any) => ({
 ...row,
 tenant_id: userData?.tenant_id,
 nationality: 'VNM', // Default for demo
 }))

 const { error } = await supabase.from('workers').insert(insertData)

 if (error) {
 console.error('Insert error:', error)
 return NextResponse.json({ message: error.message }, { status: 500 })
 }

 return NextResponse.json({ success: true, count: payload.length })
 } catch (err: any) {
 console.error('API /workers/bulk Error:', err)
 return NextResponse.json({ message: err.message || 'Internal Server Error' }, { status: 500 })
 }
}
