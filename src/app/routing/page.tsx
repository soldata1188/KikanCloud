import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import RoutingClient from './RoutingClient'
import type { RawLocation } from './RoutingClient'

export const dynamic = 'force-dynamic';

export default async function RoutingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single()

    // ── 2. Xí nghiệp (companies) ─────────────────────────────────
    const { data: companies } = await supabase
        .from('companies')
        .select('id, name_jp, address, latitude, longitude')
        .eq('is_deleted', false)

    const companyLocations: RawLocation[] = (companies || [])
        .map(c => ({
            id: c.id,
            name: c.name_jp ?? '名前なし',
            type: 'company' as const,
            address: c.address ?? '',
            latitude: c.latitude ?? null,
            longitude: c.longitude ?? null,
            companyId: c.id,
            companyName: c.name_jp ?? '',
        }))

    // Build company map
    const companyMap: Record<string, string> = {}
        ; (companies || []).forEach(c => { if (c.name_jp) companyMap[c.id] = c.name_jp })

    // Fetch workers (Simple select to avoid join issues)
    const { data: workers } = await supabase
        .from('workers')
        .select('id, full_name_romaji, full_name_kana, address, japan_residence, latitude, longitude, company_id, status')
        .eq('is_deleted', false)

    const workerLocations: RawLocation[] = (workers || [])
        // Include residents even if entry status is 'waiting' if user wants to see them
        .filter(w => w.status === 'working' || w.status === 'standby' || w.status === 'waiting')
        .map(w => ({
            id: w.id,
            name: w.full_name_romaji ?? w.full_name_kana ?? '名前なし',
            type: 'worker' as const,
            address: w.address?.trim() ? w.address : (w.japan_residence || ''),
            latitude: w.latitude ?? null,
            longitude: w.longitude ?? null,
            companyId: w.company_id ?? '',
            companyName: companyMap[w.company_id ?? ''] ?? '企業不明',
            badge: w.status === 'standby' ? '対応中' : (w.status === 'waiting' ? '未入国' : '就業中'),
        }))

    // ── All locations ─────────────────────────────────────────────
    const initialLocations: RawLocation[] = [
        ...companyLocations,
        ...workerLocations,
    ]

    // Companies that have workers (for filter dropdown)
    const activeCompanyIds = new Set((workers || []).map(w => w.company_id).filter(Boolean))
    const filterCompanies = (companies || [])
        .filter(c => activeCompanyIds.has(c.id))
        .map(c => ({ id: c.id, name: c.name_jp ?? '' }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ja'))

    const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
            <Sidebar active="routing" />
            <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                <TopNav title="位置情報マップ" role={userProfile?.role} />
                <main className="flex-1 relative overflow-hidden pb-14 md:pb-0">
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