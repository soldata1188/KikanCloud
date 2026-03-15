import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { id, type, latitude, longitude } = await req.json()
        if (!id || !type || latitude == null || longitude == null) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const supabase = await createClient()
        const table = type === 'company' ? 'companies' : 'workers'

        const { error } = await supabase
            .from(table)
            .update({ latitude, longitude })
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ ok: true })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
