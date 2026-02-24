import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { redirect } from 'next/navigation'
import { BulkInputClient } from './BulkInputClient'
import { TopNav } from '@/components/TopNav'

export default async function BulkInputCompaniesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    return (
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="companies" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="受入企業管理" role={userProfile?.role} />
                <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                    <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[1200px] mx-auto mt-4 md:mt-8">
                        {/* Top Menu Sticky Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pl-2 sticky top-0 bg-white z-20 py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                            <div className="flex items-center gap-4">
                                <Link href="/companies" className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors text-[#1f1f1f]">
                                    <ArrowLeft size={24} strokeWidth={1.5} />
                                </Link>
                                <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">受入企業 一括入力</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link href="/companies" className="px-6 py-3 text-[#1f1f1f] bg-white font-medium hover:bg-gray-50 rounded-md transition-colors">キャンセル</Link>
                            </div>
                        </div>

                        <div className="bg-white rounded-md p-8 min-h-[500px] flex flex-col border border-gray-350">
                            <div className="flex items-center gap-2 mb-6">
                                <Building2 className="text-[#24b47e]" size={20} />
                                <h3 className="text-lg font-medium text-[#1f1f1f]">Excelライクの直接入力</h3>
                            </div>
                            <p className="text-sm text-[#878787] mb-6 flex-shrink-0">
                                表のセルを直接クリックして入力できます。下の「行を追加」ボタンで行を増やし、一気に複数企業を登録することが可能です。
                            </p>

                            <BulkInputClient />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
