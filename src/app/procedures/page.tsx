import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { ProcedureBoard } from './ProcedureBoard'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default async function ProceduresPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'

    const { data: procedures } = await supabase.from('procedures')
        .select('id, agency, procedure_name, status, target_date, submitted_date, completed_date, pic_name, notes, worker_id, workers(id, full_name_romaji), companies(id, name_jp)')
        .eq('is_deleted', false)
        .order('target_date', { ascending: true })

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="procedures" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-[#f0f4f9] z-20">
                    <h1 className="text-[22px] font-normal text-[#444746] tracking-tight">KikanCloud</h1>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 pl-4 pr-1.5 py-1.5 bg-white rounded-[32px] text-sm font-medium text-[#444746] hover:bg-gray-50 transition border border-gray-200 shadow-sm cursor-pointer">
                            仕事 <div className="w-8 h-8 rounded-[32px] bg-[#d81b60] text-white flex items-center justify-center text-xs font-bold">{displayName.charAt(0)}</div>
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex flex-col px-4 w-full max-w-[1200px] mx-auto mt-4 md:mt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pl-2">
                        <div>
                            <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">申請・手続 管理</h2>
                            <p className="text-[#444746] mt-1 text-sm">入管・機構・検定協会への書類提出状況を機関別に一元管理します。</p>
                        </div>
                        <Link href="/procedures/new" className="flex items-center gap-2 px-6 py-3 bg-[#4285F4] hover:bg-[#3367d6] text-white rounded-[32px] text-sm font-bold transition-colors shadow-sm shrink-0">
                            <Plus size={18} strokeWidth={2} /> 新規手続を登録
                        </Link>
                    </div>

                    <ProcedureBoard procedures={procedures || []} />
                </div>
            </main>
        </div>
    )
}
