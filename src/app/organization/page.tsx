import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { Building2, Users } from 'lucide-react'
import OrganizationForm from './OrganizationForm'
import StaffList from './StaffList'

export const dynamic = 'force-dynamic'

export default async function OrganizationPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('*, tenants(*)').eq('id', user.id).single()
    if (!userProfile) redirect('/login')

    // Restrict to admins and union_admins
    if (userProfile.role !== 'admin' && userProfile.role !== 'union_admin') {
        redirect('/')
    }

    const tenant = userProfile.tenants
    const resolvedParams = await searchParams;
    const activeTab = resolvedParams.tab || 'profile'

    // Fetch staff for this organization
    const { data: staffData } = await supabase.from('users').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true })

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="organization" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="機関情報" role={userProfile.role} userProfileStr={JSON.stringify(userProfile)} />
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-[1000px] mx-auto">
                        <div className="mb-8">
                            <h1 className="text-[28px] font-normal tracking-tight text-[#1f1f1f] flex items-center gap-3">機関管理</h1>
                            <p className="text-[13px] text-[#878787] mt-1">基本情報とスタッフ名簿を管理します。</p>
                        </div>

                        <div className="bg-white rounded-lg border border-[#ededed] overflow-hidden mb-6">
                            <div className="flex border-b border-[#ededed] bg-[#fbfcfd]">
                                <a href="?tab=profile" className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-[#24b47e] text-[#24b47e] bg-white' : 'border-transparent text-[#878787] hover:text-[#1f1f1f] hover:bg-gray-50'}`}>
                                    <Building2 size={16} /> 基本情報 (Profile)
                                </a>
                                <a href="?tab=staff" className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'staff' ? 'border-[#24b47e] text-[#24b47e] bg-white' : 'border-transparent text-[#878787] hover:text-[#1f1f1f] hover:bg-gray-50'}`}>
                                    <Users size={16} /> スタッフ名簿 (Staff)
                                </a>
                            </div>

                            <div className="p-6 md:p-8">
                                {activeTab === 'profile' && <OrganizationForm initialData={tenant} />}
                                {activeTab === 'staff' && <StaffList initialStaff={staffData || []} organizationId={tenant.id} />}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
