import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase.from('users').select('full_name, role, tenant_id').eq('id', user.id).single()
  if (userProfile?.role === 'company_admin' || userProfile?.role === 'company_user') redirect('/portal')

  // HÚT DỮ LIỆU THẬT ĐỂ ĐẨY VÀO AI
  const [workersRes, companiesRes, auditsRes] = await Promise.all([
    supabase.from('workers').select('id', { count: 'exact', head: true }).eq('tenant_id', userProfile?.tenant_id),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('tenant_id', userProfile?.tenant_id).eq('is_deleted', false),
    supabase.from('audits').select('id', { count: 'exact', head: true }).eq('tenant_id', userProfile?.tenant_id).eq('status', 'Pending')
  ])

  const systemData = {
    stats: { workers: workersRes.count || 0, companies: companiesRes.count || 0, audits: auditsRes.count || 0 }
  }

  return (
    <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
      <Sidebar active="dashboard" />
      <div className="flex-1 flex flex-col relative min-w-0">
        <TopNav title="Staff Command Center" role={userProfile?.role} />
        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
          <DashboardClient userName={userProfile?.full_name || 'Staff'} role={userProfile?.role || 'staff'} systemData={systemData} />
        </main>
      </div>
    </div>
  )
}
