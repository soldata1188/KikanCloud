import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'

import WorkersListClient from './WorkersListClient'

export const metadata = { title: '外国人材管理' }

export const dynamic = 'force-dynamic';

export default async function WorkersPage() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) redirect('/login')

        const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
        const { data: workers } = await supabase.from('workers').select('*, companies(name_jp)').eq('is_deleted', false).order('created_at', { ascending: false })

        const next90Days = new Date();
        next90Days.setDate(next90Days.getDate() + 90);
        const next90DaysStr = next90Days.toISOString().split('T')[0];

        return (
            <div className="flex h-screen font-sans text-gray-900 overflow-hidden selection:bg-emerald-500/20">
                <Sidebar active="workers" />
                <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                    <TopNav title="" role={userProfile?.role} />
                    <WorkersListClient initialWorkers={workers || []} role={userProfile?.role || 'staff'} next90DaysStr={next90DaysStr} />
                </div>
            </div>
        )
    } catch (error: any) {
        // If it's a redirect (NEXT_REDIRECT), re-throw it
        if (error?.digest?.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error('[WorkersPage] Server render error:', error);
        return (
            <div className="flex h-screen items-center justify-center bg-white p-8 text-center">
                <div className="max-w-lg space-y-4">
                    <h1 className="text-xl font-bold text-gray-900">ページの読み込みに失敗しました</h1>
                    <p className="text-gray-500 text-sm">サーバーエラーが発生しました。ページを再読み込みしてください。</p>
                    <p className="text-xs text-red-400 font-mono bg-red-50 p-3 rounded-lg text-left break-all">
                        {String(error?.message || error || 'Unknown error')}
                    </p>
                    <Link href="/workers" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md text-sm">再読み込み</Link>
                </div>
            </div>
        )
    }
}
