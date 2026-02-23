import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import GreetingBanner from '@/components/dashboard/GreetingBannerUpdated'
import RecentChats from '@/components/dashboard/RecentChats'
import { getDashboardStats, getExpiringDocuments } from '@/app/dashboard/actions'
import { Users, Building2, AlertTriangle, MessageSquare, ClipboardList, ShieldCheck, Map, Workflow, Bot, Route } from 'lucide-react'
import FloatingSmile from '@/components/dashboard/FloatingSmile'

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile and role
    const { data: userProfile } = await supabase
        .from('users')
        .select('full_name, role, tenant_id')
        .eq('id', user.id)
        .single()

    if (userProfile?.role === 'company_admin' || userProfile?.role === 'company_user') {
        redirect('/portal')
    }

    const role = userProfile?.role
    const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'User'

    const stats = await getDashboardStats()
    const documents = await getExpiringDocuments()

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="dashboard" />

            <div className="flex-1 flex flex-col relative min-w-0 bg-white">
                <main className="flex-1 overflow-y-auto relative p-6 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-10">
                        {/* Friendly greeting banner & Weather */}
                        <GreetingBanner displayName={displayName} />

                        {/* Quick Access Menu - Removed per user request */}

                        {/* Row 4: Two columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left column 2/3: Alert Table */}
                            <div className="lg:col-span-2 p-5 md:p-6 border-l-[6px] border-[#24b47e]">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">要対応アラート</h2>
                                    <div className="flex items-center gap-1.5 font-bold px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-sm border border-red-100">
                                        <AlertTriangle size={16} />
                                        <span>期限90日以内</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left whitespace-nowrap bg-white">
                                        <thead className="text-xs text-gray-500 uppercase bg-white">
                                            <tr>
                                                <th className="border-b border-gray-200 px-4 py-3 font-bold tracking-widest">氏名</th>
                                                <th className="border-b border-gray-200 px-4 py-3 font-bold tracking-widest">企業</th>
                                                <th className="border-b border-gray-200 px-4 py-3 font-bold tracking-widest">種類</th>
                                                <th className="border-b border-gray-200 px-4 py-3 font-bold tracking-widest">期限</th>
                                                <th className="border-b border-gray-200 px-4 py-3 font-bold tracking-widest text-right">残り</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {documents.length === 0 ? (
                                                <tr><td colSpan={5} className="border-b border-gray-200 px-4 py-12 text-center text-gray-400 font-bold">直近で期限切れになる書類はありません</td></tr>
                                            ) : documents.map((doc: { full_name_romaji: string, company_name: string, doc_type: string, exp_date: string, days_left: number }, i: number) => {
                                                const isCritical = doc.days_left <= 30;
                                                const rowClass = isCritical
                                                    ? 'bg-white text-red-600'
                                                    : 'bg-white text-gray-800';

                                                return (
                                                    <tr key={i} className={rowClass}>
                                                        <td className="border-b border-gray-200 px-4 py-3 font-bold">{doc.full_name_romaji}</td>
                                                        <td className="border-b border-gray-200 px-4 py-3">{doc.company_name}</td>
                                                        <td className="border-b border-gray-200 px-4 py-3 font-medium"><span className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600">{doc.doc_type}</span></td>
                                                        <td className="border-b border-gray-200 px-4 py-3 font-medium tracking-wide">{doc.exp_date}</td>
                                                        <td className="border-b border-gray-200 px-4 py-3 font-bold text-right text-base">
                                                            {doc.days_left < 0 ? (
                                                                <span className="text-red-600 bg-white px-2.5 py-1 rounded-lg border border-red-200">超過 {Math.abs(doc.days_left)}日</span>
                                                            ) : (
                                                                <span>あと {doc.days_left}日</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right column 1/3 */}
                            <div className="lg:col-span-1 flex flex-col gap-6">
                                {/* Recent Chats */}
                                <div className="flex-1 min-h-[400px] h-full">
                                    <RecentChats tenantId={userProfile?.tenant_id} />
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Removed Nationality Ratio per user request */}
                    </div>
                </main>
            </div>
            <FloatingSmile />
        </div>
    )
}

function KpiCard({ title, value, icon, iconBg, iconColor }: { title: string, value: number, icon: React.ReactNode, iconBg: string, iconColor: string }) {
    return (
        <div className="p-6 md:p-8 flex items-center justify-between group hover:-translate-y-1 transition-all cursor-default">
            <div className="space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</div>
                <div className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">{value}</div>
            </div>
            <div className={`w-14 h-14 flex justify-center items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${iconBg} ${iconColor}`}>
                {icon}
            </div>
        </div>
    )
}
