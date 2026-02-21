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

    // Lấy dữ liệu Xí nghiệp và TTS có tọa độ (nếu có)
    const { data: companies } = await supabase.from('companies').select('id, name_jp, address, latitude, longitude').eq('tenant_id', userProfile?.tenant_id).eq('is_deleted', false)
    const { data: workers } = await supabase.from('workers').select('id, full_name_romaji, address, latitude, longitude').eq('tenant_id', userProfile?.tenant_id)

    // MOCK DATA KHU VỰC SAKAI, OSAKA (NẾU DB CHƯA CÓ TỌA ĐỘ) ĐỂ DEMO TÍNH NĂNG
    const mockLocations = [
        { id: '1', name: 'Arata-Biz 本社', type: 'office', address: '大阪府堺市堺区南瓦町3-1', latitude: 34.5733, longitude: 135.4814 },
        { id: '2', name: 'トヨタ下請工場', type: 'company', address: '大阪府堺市西区鳳東町7', latitude: 34.5422, longitude: 135.4544 },
        { id: '3', name: '実習生 第1寮 (Nguyen Van A)', type: 'worker', address: '大阪府堺市北区中百舌鳥町2', latitude: 34.5683, longitude: 135.5188 },
        { id: '4', name: 'さくら製造株式会社', type: 'company', address: '大阪府松原市丹南1', latitude: 34.5772, longitude: 135.5532 }
    ];

    let initialLocations = [];
    // Nếu database có data thật có tọa độ thì dùng, không thì dùng mock data
    if (companies && companies.some(c => c.latitude)) {
        initialLocations = [
            ...companies.filter(c => c.latitude).map(c => ({ id: c.id, name: c.name_jp, type: 'company', address: c.address, latitude: c.latitude, longitude: c.longitude })),
            ...(workers || []).filter(w => w.latitude).map(w => ({ id: w.id, name: w.full_name_romaji, type: 'worker', address: w.address, latitude: w.latitude, longitude: w.longitude }))
        ]
    } else {
        initialLocations = mockLocations;
    }

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
