import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Users } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { redirect } from 'next/navigation'
import { BulkInputClient } from './BulkInputClient'

export default async function BulkInputWorkersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp', { ascending: true })

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[1400px] mx-auto mt-4 md:mt-8">
                    {/* Top Menu Sticky Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pl-2 sticky top-0 bg-[#f0f4f9] z-20 py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                        <div className="flex items-center gap-4">
                            <Link href="/workers" className="w-10 h-10 flex items-center justify-center rounded-[32px] hover:bg-black/5 transition-colors text-[#444746]"><ArrowLeft size={24} strokeWidth={1.5} /></Link>
                            <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">外国人材 一括入力</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/workers" className="px-6 py-3 text-[#444746] bg-white border border-[#e1e5ea] font-medium hover:bg-gray-50 rounded-[32px] transition-colors shadow-sm">キャンセル</Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] shadow-sm border border-[#e1e5ea] p-8 min-h-[500px] flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <Users className="text-[#4285F4]" size={20} />
                            <h3 className="text-lg font-medium text-[#1f1f1f]">Excelライクの直接入力</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 flex-shrink-0">
                            表のセルを直接クリックして入力できます。下の「行を追加」ボタンで行を増やし、一気に複数人登録することが可能です。
                        </p>

                        <BulkInputClient companies={companies || []} />
                    </div>
                </div>
            </main>
        </div>
    )
}
