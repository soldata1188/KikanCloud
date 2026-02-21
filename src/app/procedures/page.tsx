import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { ProcedureBoard } from './ProcedureBoard'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default async function ProceduresPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    const { data: procedures } = await supabase.from('procedures')
        .select('id, agency, procedure_name, status, target_date, submitted_date, completed_date, pic_name, notes, worker_id, workers(id, full_name_romaji), companies(id, name_jp)')
        .eq('is_deleted', false)
        .order('target_date', { ascending: true })

    return (
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="procedures" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="行政手続管理" role={userProfile?.role} />
                <main className="flex-1 overflow-x-auto p-6 md:p-10 no-scrollbar">
                    <div className="min-w-[1200px] h-full">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-[28px] font-normal tracking-tight text-[#1f1f1f]">手続・進行管理</h1>
                            <Link href="/procedures/new" className="h-[32px] px-3 bg-[#24b47e] hover:bg-[#1e9a6a] text-white rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors">
                                <Plus size={14} /> 新規登録
                            </Link>
                        </div>
                        <ProcedureBoard procedures={procedures || []} />
                    </div>
                </main>
            </div>
        </div>
    )
}
