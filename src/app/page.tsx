import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { MoreVertical } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (userProfile?.role === 'company_admin' || userProfile?.role === 'company_user') redirect('/portal')
  if (userProfile?.role === 'worker') redirect('/connect')

  const { data: companies } = await supabase.from('companies').select('id, name_jp, created_at').eq('is_deleted', false).order('created_at', { ascending: false }).limit(4)
  const { data: workers } = await supabase.from('workers').select('id, full_name_romaji, status, system_type, created_at').eq('is_deleted', false).order('created_at', { ascending: false }).limit(4)

  return (
    <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
      <Sidebar active="dashboard" />
      <div className="flex-1 flex flex-col relative min-w-0">
        <TopNav title="Projects" role={userProfile?.role} />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-[1200px] mx-auto">
            <h1 className="text-[28px] font-normal tracking-tight text-[#1f1f1f] mb-8">Projects</h1>

            {/* Supabase-style Table */}
            <div className="bg-white border border-[#ededed] rounded-lg shadow-sm overflow-hidden mb-12">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#fbfcfd] border-b border-[#ededed] text-[11px] font-medium text-[#878787] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 font-medium">PROJECT</th><th className="px-5 py-3 font-medium">STATUS</th>
                      <th className="px-5 py-3 font-medium">COMPUTE</th><th className="px-5 py-3 font-medium">REGION</th>
                      <th className="px-5 py-3 font-medium">CREATED</th><th className="px-5 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ededed]">
                    {companies?.map(c => (
                      <tr key={c.id} className="hover:bg-[#fbfcfd] transition-colors group">
                        <td className="px-5 py-4">
                          <Link href={`/companies/${c.id}/edit`} className="font-medium text-[#1f1f1f] hover:text-[#24b47e] transition-colors">{c.name_jp}</Link>
                          <div className="text-[12px] text-[#878787] font-mono mt-0.5">{c.id.split('-')[0]}...</div>
                        </td>
                        <td className="px-5 py-4"><span className="px-2 py-0.5 border border-[#24b47e] text-[#24b47e] rounded-full text-[10px] font-bold uppercase tracking-widest bg-transparent">ACTIVE</span></td>
                        <td className="px-5 py-4"><span className="px-2 py-0.5 border border-[#ededed] text-[#878787] rounded-[4px] text-[10px] font-mono uppercase tracking-wider bg-[#fbfcfd]">NANO</span></td>
                        <td className="px-5 py-4 text-[#666666]">jp | osaka-1</td>
                        <td className="px-5 py-4 text-[#666666]">{new Date(c.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-5 py-4 text-right"><button className="p-1 rounded border border-transparent text-[#878787] hover:border-[#ededed] hover:bg-white transition-all opacity-0 group-hover:opacity-100"><MoreVertical size={14} /></button></td>
                      </tr>
                    ))}
                    {(!companies || companies.length === 0) && <tr><td colSpan={6} className="px-5 py-8 text-center text-[#878787] text-sm">No projects found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-lg font-normal tracking-tight text-[#1f1f1f] mb-4">Recent Deployments (Workers)</h2>
            <div className="bg-white border border-[#ededed] rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#fbfcfd] border-b border-[#ededed] text-[11px] font-medium text-[#878787] uppercase tracking-wider">
                    <tr><th className="px-5 py-3 font-medium">NAME</th><th className="px-5 py-3 font-medium">STATUS</th><th className="px-5 py-3 font-medium">SYSTEM TYPE</th><th className="px-5 py-3 font-medium">CREATED</th><th className="px-5 py-3 w-10"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#ededed]">
                    {workers?.map(w => (
                      <tr key={w.id} className="hover:bg-[#fbfcfd] transition-colors group">
                        <td className="px-5 py-4"><Link href={`/workers/${w.id}/edit`} className="font-medium text-[#1f1f1f] hover:text-[#24b47e]">{w.full_name_romaji}</Link></td>
                        <td className="px-5 py-4"><span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-widest bg-transparent ${w.status === 'working' ? 'border-[#24b47e] text-[#24b47e]' : 'border-gray-300 text-[#878787]'}`}>{w.status === 'working' ? 'ACTIVE' : w.status}</span></td>
                        <td className="px-5 py-4"><span className="px-2 py-0.5 border border-[#ededed] text-[#878787] rounded-[4px] text-[10px] font-mono uppercase bg-[#fbfcfd]">{w.system_type}</span></td>
                        <td className="px-5 py-4 text-[#666666] font-mono">{new Date(w.created_at).toISOString().split('T')[0]}</td>
                        <td className="px-5 py-4 text-right"><button className="p-1 rounded border border-transparent text-[#878787] hover:border-[#ededed] hover:bg-white transition-all opacity-0 group-hover:opacity-100"><MoreVertical size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
