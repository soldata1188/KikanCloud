import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import GreetingBanner from '@/components/dashboard/GreetingBannerUpdated'
import RecentChats from '@/components/dashboard/RecentChats'
import { getDashboardStats, getExpiringDocuments } from '@/app/dashboard/actions'
import { Users, Building2, AlertTriangle, MessageSquare, ClipboardList, ShieldCheck, Map, Workflow, Bot, Route } from 'lucide-react'

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

                        {/* Row: Recent Chats */}
                        <div className="w-full min-h-[400px] mt-24">
                            <RecentChats tenantId={userProfile?.tenant_id} />
                        </div>

                        {/* Row 3: Removed Nationality Ratio per user request */}
                    </div>
                </main>
            </div>
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
