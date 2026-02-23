import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import RoutingClient from './RoutingClient'

export const dynamic = 'force-dynamic';

export default async function RoutingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single()

    // Retrieve company and worker data with coordinates (if available).
    const { data: companies } = await supabase.from('companies').select('id, name_jp, address, latitude, longitude').eq('tenant_id', userProfile?.tenant_id).eq('is_deleted', false)
    const { data: workers } = await supabase.from('workers').select('id, full_name_romaji, address, latitude, longitude').eq('tenant_id', userProfile?.tenant_id)

    // Retreive only actual locations with coordinates
    const initialLocations = [
        ...(companies || []).filter(c => c.latitude).map(c => ({ id: c.id, name: c.name_jp, type: 'company', address: c.address, latitude: c.latitude, longitude: c.longitude })),
        ...(workers || []).filter(w => w.latitude).map(w => ({ id: w.id, name: w.full_name_romaji, type: 'worker', address: w.address, latitude: w.latitude, longitude: w.longitude }))
    ];

    const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="routing" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="AI Route Optimizer" role={userProfile?.role} />
                <main className="flex-1 relative">
                    <RoutingClient initialLocations={initialLocations} googleMapsKey={googleMapsKey} />
                </main>
            </div>
        </div>
    )
}