import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { MoreVertical, AlertCircle, Calendar, Users, Building2, CalendarClock, Target, Sparkles } from 'lucide-react'
import { AnimatedLogo } from '@/components/AnimatedLogo'
import DashboardClient from './DashboardClient'

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

  // Fetch various statistics
  const [workersRes, companiesRes, auditsRes] = await Promise.all([
    supabase
      .from('workers')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', userProfile?.tenant_id),
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', userProfile?.tenant_id)
      .eq('is_deleted', false),
    supabase
      .from('audits')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', userProfile?.tenant_id)
      .eq('status', 'Pending')
  ])

  const workersCount = workersRes.count
  const companiesCount = companiesRes.count
  const auditsCount = auditsRes.count

  // Fetch expiring docs
  const today = new Date()
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(today.getDate() + 90)
  const ninetyDaysStr = ninetyDaysFromNow.toISOString().split('T')[0]

  const { data: expiringWorkers } = await supabase
    .from('workers')
    .select(`
      id, full_name_romaji, cert_end_date, passport_exp,
      companies!workers_company_id_fkey(name_jp)
    `)
    .eq('tenant_id', userProfile?.tenant_id)
    .or(`cert_end_date.lte.${ninetyDaysStr},passport_exp.lte.${ninetyDaysStr}`)
    .order('cert_end_date', { ascending: true })
    .limit(5)

  // Fetch upcoming audits
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(today.getDate() + 7)
  const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]

  const { data: upcomingAudits } = await supabase
    .from('audits')
    .select(`
      id, audit_type, scheduled_date,
      companies!audits_company_id_fkey(name_jp)
    `)
    .eq('tenant_id', userProfile?.tenant_id)
    .lte('scheduled_date', sevenDaysStr)
    .gte('scheduled_date', today.toISOString().split('T')[0])
    .order('scheduled_date', { ascending: true })
    .limit(5)

  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'User'
  const lastName = displayName.split(' ')[0]

  const hour = new Date().getHours()
  let greeting = 'お疲れ様です'
  let emoji = '💼'

  if (hour >= 5 && hour < 11) {
    greeting = 'おはようございます'
    emoji = '☀️'
  } else if (hour >= 18 || hour < 5) {
    greeting = '夜遅くまでお疲れ様です'
    emoji = '🌙'
  }

  return (
    <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
      <Sidebar active="dashboard" />

      <div className="flex-1 flex flex-col relative min-w-0">
        <TopNav title="ダッシュボード" role={role} />

        <main className="flex-1 overflow-y-auto relative">
          <DashboardClient
            userName={displayName}
            role={role}
            systemData={{
              stats: {
                workers: workersCount || 0,
                companies: companiesCount || 0,
                audits: auditsCount || 0
              }
            }}
          />
        </main>
      </div>
    </div>
  )
}
