import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Briefcase } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default async function PortalWorkersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('company_id').eq('id', user.id).single()
    if (!userProfile?.company_id) redirect('/')

    const { data: workers } = await supabase.from('workers').select('*').eq('company_id', userProfile.company_id).eq('is_deleted', false)

    return (
        <div className="max-w-[1000px] mx-auto">
            <h2 className="text-[32px] font-bold text-primary-800 mb-6 flex items-center gap-2">
                <Briefcase size={32} /> 人材一覧
            </h2>
            <div className="bg-white rounded-md p-6">
                {workers?.map(w => (
                    <div key={w.id} className="p-4 border-b border-gray-350 flex items-center justify-between">
                        <Link href={`/portal/workers/${w.id}`} className="font-bold text-primary-700 hover:underline flex items-center gap-2">{w.full_name_romaji}</Link>
                        <span className="text-sm text-gray-500">{w.nationality}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
