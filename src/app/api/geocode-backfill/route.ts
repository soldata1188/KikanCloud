import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Simple rate-limiter: N ms between calls to stay under 50 QPS limit
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function geocodeOne(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=ja&key=${apiKey}`
    try {
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return null
        const json = await res.json()
        if (json.status !== 'OK' || !json.results?.[0]) return null
        const loc = json.results[0].geometry.location
        return { lat: loc.lat, lng: loc.lng }
    } catch {
        return null
    }
}

export async function POST(req: Request) {
    // Validate using last 12 chars of public anon key (internal tool guard)
    const secret = req.headers.get('x-backfill-secret')
    const expectedSecret = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(-12)
    if (!secret || secret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })

    // Use service role to bypass RLS
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Companies without coords ──────────────────────────────────
    const { data: companies } = await supabase
        .from('companies')
        .select('id, address')
        .eq('is_deleted', false)
        .not('address', 'is', null)
        .or('latitude.is.null,longitude.is.null')

    let companiesUpdated = 0, companiesFailed = 0

    for (const company of companies || []) {
        if (!company.address?.trim()) { companiesFailed++; continue }
        const coords = await geocodeOne(company.address, apiKey)
        if (coords) {
            await supabase.from('companies').update({
                latitude: coords.lat,
                longitude: coords.lng
            }).eq('id', company.id)
            companiesUpdated++
        } else {
            companiesFailed++
        }
        await sleep(100) // 10 req/s max → well under 50 QPS limit
    }

    // ── Workers without coords ──────────────────────────────────
    const { data: workers } = await supabase
        .from('workers')
        .select('id, address')
        .eq('is_deleted', false)
        .not('address', 'is', null)
        .or('latitude.is.null,longitude.is.null')

    let workersUpdated = 0, workersFailed = 0

    for (const worker of workers || []) {
        if (!worker.address?.trim()) { workersFailed++; continue }
        const coords = await geocodeOne(worker.address, apiKey)
        if (coords) {
            await supabase.from('workers').update({
                latitude: coords.lat,
                longitude: coords.lng
            }).eq('id', worker.id)
            workersUpdated++
        } else {
            workersFailed++
        }
        await sleep(100)
    }

    return NextResponse.json({
        success: true,
        companies: { updated: companiesUpdated, failed: companiesFailed },
        workers: { updated: workersUpdated, failed: workersFailed },
    })
}
