import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, ListPlus } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { ImportModal } from './ImportModal'
import { UserMenu } from '@/components/UserMenu'
import { redirect } from 'next/navigation'
import { WorkersClient } from './WorkersClient'

export default async function WorkersList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role, avatar_url').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'

    const { data: workers } = await supabase.from('workers')
        .select('id, full_name_romaji, full_name_kana, system_type, status, entry_date, cert_end_date, zairyu_no, avatar_url, nationality, entry_batch, companies(name_jp)')
        .eq('is_deleted', false).order('created_at', { ascending: false })

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-[#f0f4f9] z-10">
                    <h1 className="text-[22px] font-normal text-[#444746] tracking-tight">KikanCloud</h1>
                    <div className="flex items-center gap-2">
 <span className="hidden sm:flex px-3 py-1 bg-white rounded-[32px] text-[11px] font-semibold text-[#444746] tracking-wider">ULTRA</span> 
                        <UserMenu displayName={displayName} email={user.email || ''} role={userProfile?.role} avatarUrl={userProfile?.avatar_url} />
                    </div>
                </header>

                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[1200px] mx-auto mt-4 md:mt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-2">
                        <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">外国人材 管理</h2>
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
                            <ImportModal />
 <Link href="/workers/bulk-input" className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#1f1f1f] rounded-[32px] text-sm font-medium transition-colors shrink-0"> 
                                <ListPlus size={18} strokeWidth={2} /> 一括入力
                            </Link>
 <Link href="/workers/new" className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#1f1f1f] rounded-[32px] text-sm font-medium transition-colors shrink-0"> 
                                <Plus size={18} strokeWidth={2} /> 新規登録
                            </Link>
                        </div>
                    </div>

                    <WorkersClient workers={workers || []} userRole={userProfile?.role} />
                </div>
            </main>
        </div>
    )
}
