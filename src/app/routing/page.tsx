import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import RoutingClient from './RoutingClient'
import type { RawLocation } from './RoutingClient'

export const metadata = { title: '位置情報マップ' }

export const dynamic = 'force-dynamic';

function daysFromNow(dateStr: string | null | undefined): number | null {
    if (!dateStr) return null
    const diff = new Date(dateStr).getTime() - Date.now()
    return Math.ceil(diff / 86400000)
}

export default async function RoutingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase
        .from('users').select('role, tenant_id').eq('id', user.id).single()

    // ── Companies ──────────────────────────────────────────────────
    const { data: companies } = await supabase
        .from('companies')
        .select('id, name_jp, address, latitude, longitude')
        .eq('is_deleted', false)

    // ── Workers: 就業中・対応中 only ──────────────────────────────────
    const { data: workers } = await supabase
        .from('workers')
        .select('id, full_name_romaji, full_name_kana, address, japan_residence, latitude, longitude, company_id, status, zairyu_exp')
        .eq('is_deleted', false)
        .in('status', ['working', 'standby'])

    // Build lookup maps
    const companyMap: Record<string, string> = {}
    ;(companies || []).forEach(c => { if (c.name_jp) companyMap[c.id] = c.name_jp })

    // Worker count per company
    const workerCountMap: Record<string, number> = {}
    ;(workers || []).forEach(w => {
        if (w.company_id) workerCountMap[w.company_id] = (workerCountMap[w.company_id] ?? 0) + 1
    })

    // ── Build company locations: 受入中 (has active workers) only ────
    const companyLocations: RawLocation[] = (companies || []).filter(c => (workerCountMap[c.id] ?? 0) > 0).map(c => ({
        id: c.id,
        name: c.name_jp ?? '名前なし',
        type: 'company' as const,
        address: c.address ?? '',
        latitude: c.latitude ?? null,
        longitude: c.longitude ?? null,
        companyId: c.id,
        companyName: c.name_jp ?? '',
        workerCount: workerCountMap[c.id] ?? 0,
        daysUntilExpiry: null,
    }))

    // ── Build worker locations ─────────────────────────────────────
    const workerLocations: RawLocation[] = (workers || []).map(w => {
        const days = daysFromNow(w.zairyu_exp)
        return {
            id: w.id,
            name: w.full_name_romaji ?? w.full_name_kana ?? '名前なし',
            type: 'worker' as const,
            address: w.address?.trim() ? w.address : (w.japan_residence || ''),
            latitude: w.latitude ?? null,
            longitude: w.longitude ?? null,
            companyId: w.company_id ?? '',
            companyName: companyMap[w.company_id ?? ''] ?? '企業不明',
            badge: w.status === 'standby' ? '対応中' : '就業中',
            daysUntilExpiry: days,
        }
    })

    const initialLocations: RawLocation[] = [...companyLocations, ...workerLocations]

    const filterCompanies = (companies || [])
        .filter(c => workerCountMap[c.id])
        .map(c => ({ id: c.id, name: c.name_jp ?? '' }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ja'))

    const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

    return (
        <div className="seamless-block">
            <Sidebar active="routing" />
            <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                <TopNav role={userProfile?.role} />
                <main className="flex-1 relative overflow-hidden">
                    <RoutingClient
                        initialLocations={initialLocations}
                        filterCompanies={filterCompanies}
                        googleMapsKey={googleMapsKey}
                    />
                </main>
            </div>
        </div>
    )
}
