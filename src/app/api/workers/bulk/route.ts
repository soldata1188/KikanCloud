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

        const insertData = payload.map((row: Record<string, unknown>) => ({
            ...row,
            tenant_id: userData?.tenant_id,
            nationality: 'VNM',
        }))

        const { error } = await supabase.from('workers').insert(insertData)
        if (error) return NextResponse.json({ message: error.message }, { status: 500 })

        return NextResponse.json({ success: true, count: payload.length })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Internal Server Error'
        return NextResponse.json({ message: msg }, { status: 500 })
    }
}
