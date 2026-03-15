import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { importWorkers } from '@/app/workers/actions'
import type { ImportWorkerPayload } from '@/app/workers/actions'

// GET /api/workers — list workers for the authenticated tenant
export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData?.tenant_id) return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('company_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

    let query = supabase
        .from('workers')
        .select('id, full_name_romaji, full_name_kana, nationality, status, company_id, entry_date, zairyu_exp, visa_status, industry_field')
        .eq('tenant_id', userData.tenant_id)
        .eq('is_deleted', false)
        .order('full_name_romaji')
        .limit(limit)

    if (companyId) query = query.eq('company_id', companyId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data, count: data?.length ?? 0 })
}

// POST /api/workers — bulk import from JSON payload (same format as CSV import)
// Body: ImportWorkerPayload[] or { workers: ImportWorkerPayload[] }
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const workers: ImportWorkerPayload[] = Array.isArray(body)
        ? body
        : (body as any)?.workers ?? []

    if (!Array.isArray(workers) || workers.length === 0) {
        return NextResponse.json({ error: 'workers array is required and must not be empty' }, { status: 400 })
    }

    if (workers.length > 500) {
        return NextResponse.json({ error: 'Maximum 500 workers per request' }, { status: 400 })
    }

    const result = await importWorkers(workers)

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 422 })
    }

    return NextResponse.json({ count: result.count, newCompanies: result.newCompanies }, { status: 201 })
}
