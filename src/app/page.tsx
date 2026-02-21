import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { MoreVertical, AlertCircle, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (userProfile?.role === 'company_admin' || userProfile?.role === 'company_user') redirect('/portal')
  if (userProfile?.role === 'worker') redirect('/connect')

  const { data: companies } = await supabase.from('companies').select('id, name_jp, created_at').eq('is_deleted', false).order('created_at', { ascending: false }).limit(4)
  const { data: workers } = await supabase.from('workers').select('id, full_name_romaji, status, system_type, created_at').eq('is_deleted', false).order('created_at', { ascending: false }).limit(4)

  // Smart Alerts Logic
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);
  const ninetyDaysStr = ninetyDaysFromNow.toISOString().split('T')[0];

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);
  const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

  // Fetch expiring visas/passports
  const { data: expiringWorkers } = await supabase
    .from('workers')
    .select('id, full_name_romaji, cert_end_date, passport_exp, companies(name_jp)')
    .eq('is_deleted', false)
    .in('status', ['working', 'waiting', 'standby'])
    .or(`cert_end_date.lte.${ninetyDaysStr},passport_exp.lte.${ninetyDaysStr}`)
    .order('cert_end_date', { ascending: true })
    .limit(5);

  // Fetch upcoming audits
  const { data: upcomingAudits } = await supabase
    .from('audits')
    .select('id, audit_type, scheduled_date, companies(name_jp)')
    .eq('is_deleted', false)
    .eq('status', 'planned')
    .gte('scheduled_date', todayStr)
    .lte('scheduled_date', sevenDaysStr)
    .order('scheduled_date', { ascending: true })
    .limit(5);

  return (
    <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
      <Sidebar active="dashboard" />
      <div className="flex-1 flex flex-col relative min-w-0">
        <TopNav title="ダッシュボード" role={userProfile?.role} userProfileStr={JSON.stringify(userProfile)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-[1200px] mx-auto">
            <h1 className="text-[28px] font-normal tracking-tight text-[#1f1f1f] mb-8">ダッシュボード</h1>

            {/* Smart Dashboard Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* Expiring Docs Alert */}
              <div className="bg-white border border-[#ededed] rounded-lg shadow-sm p-5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={18} className="text-orange-500" />
                    <h2 className="text-[15px] font-semibold text-[#1f1f1f]">在留期限 / パスポート期限 <span className="text-xs font-normal text-[#878787] ml-1">(90日以内)</span></h2>
                  </div>
                  <Link href="/workers" className="text-xs font-medium text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:underline">すべて見る</Link>
                </div>
                {expiringWorkers && expiringWorkers.length > 0 ? (
                  <div className="space-y-3">
                    {expiringWorkers.map(w => (
                      <div key={w.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md bg-orange-50/50 border border-orange-100 hover:bg-orange-50 transition-colors">
                        <div>
                          <Link href={`/workers/${w.id}`} className="font-medium text-[13px] text-[#1f1f1f] hover:text-orange-600 transition-colors">{w.full_name_romaji}</Link>
                          <div className="text-[11px] text-[#666666] mt-0.5">{(w.companies as any)?.name_jp || '企業未定'}</div>
                        </div>
                        <div className="text-right mt-2 sm:mt-0 flex flex-col gap-1 items-end">
                          {w.cert_end_date && w.cert_end_date <= ninetyDaysStr && (
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-white border border-orange-200 rounded-full text-orange-600 flex items-center gap-1 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>在留: {w.cert_end_date}</span>
                          )}
                          {w.passport_exp && w.passport_exp <= ninetyDaysStr && (
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-white border border-orange-200 rounded-full text-orange-600 flex items-center gap-1 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>旅券: {w.passport_exp}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[13px] text-[#878787] flex items-center justify-center p-6 bg-[#fbfcfd] rounded border border-dashed border-[#ededed]">期限が近い人材はいません。</div>
                )}
              </div>

              {/* Upcoming Audits Alert */}
              <div className="bg-white border border-[#ededed] rounded-lg shadow-sm p-5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#24b47e]"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#24b47e]" />
                    <h2 className="text-[15px] font-semibold text-[#1f1f1f]">直近の予定 <span className="text-xs font-normal text-[#878787] ml-1">(7日以内)</span></h2>
                  </div>
                  <Link href="/audits" className="text-xs font-medium text-[#24b47e] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:underline">一覧へ</Link>
                </div>
                {upcomingAudits && upcomingAudits.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAudits.map(a => (
                      <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md bg-green-50/50 border border-green-100 hover:bg-green-50 transition-colors">
                        <div>
                          <span className="font-medium text-[13px] text-[#1f1f1f]">{(a.companies as any)?.name_jp || '企業不明'}</span>
                          <div className="text-[11px] text-[#666666] mt-0.5">{a.audit_type === 'kansa' ? '定期監査' : a.audit_type === 'homon' ? '定期訪問' : '臨時監査'}</div>
                        </div>
                        <div className="text-right mt-2 sm:mt-0">
                          <span className="text-[11px] font-bold font-mono px-2 py-1 bg-white border border-green-200 rounded-md text-green-700 shadow-sm">{new Date(a.scheduled_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[13px] text-[#878787] flex items-center justify-center p-6 bg-[#fbfcfd] rounded border border-dashed border-[#ededed]">直近の予定はありません。</div>
                )}
              </div>
            </div>

            <h2 className="text-lg font-normal tracking-tight text-[#1f1f1f] mb-4">最近の登録 (受入企業)</h2>
            {/* Supabase-style Table */}
            <div className="bg-white border border-[#ededed] rounded-lg shadow-sm overflow-hidden mb-12">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#fbfcfd] border-b border-[#ededed] text-[11px] font-medium text-[#878787] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 font-medium">受入企業</th><th className="px-5 py-3 font-medium">ステータス</th>
                      <th className="px-5 py-3 font-medium">プラン</th><th className="px-5 py-3 font-medium">地域</th>
                      <th className="px-5 py-3 font-medium">作成日時</th><th className="px-5 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ededed]">
                    {companies?.map(c => (
                      <tr key={c.id} className="hover:bg-[#fbfcfd] transition-colors group">
                        <td className="px-5 py-4">
                          <Link href={`/companies/${c.id}/edit`} className="font-medium text-[#1f1f1f] hover:text-[#24b47e] transition-colors">{c.name_jp}</Link>
                          <div className="text-[12px] text-[#878787] font-mono mt-0.5">{c.id.split('-')[0]}...</div>
                        </td>
                        <td className="px-5 py-4"><span className="px-2 py-0.5 border border-[#24b47e] text-[#24b47e] rounded-full text-[10px] font-bold uppercase tracking-widest bg-transparent">稼働中</span></td>
                        <td className="px-5 py-4"><span className="px-2 py-0.5 border border-[#ededed] text-[#878787] rounded-[4px] text-[10px] font-mono uppercase tracking-wider bg-[#fbfcfd]">NANO</span></td>
                        <td className="px-5 py-4 text-[#666666]">jp | osaka-1</td>
                        <td className="px-5 py-4 text-[#666666]">{new Date(c.created_at).toLocaleString('ja-JP', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-5 py-4 text-right"><button className="p-1 rounded border border-transparent text-[#878787] hover:border-[#ededed] hover:bg-white transition-all opacity-0 group-hover:opacity-100"><MoreVertical size={14} /></button></td>
                      </tr>
                    ))}
                    {(!companies || companies.length === 0) && <tr><td colSpan={6} className="px-5 py-8 text-center text-[#878787] text-sm">データがありません。</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-lg font-normal tracking-tight text-[#1f1f1f] mb-4">最近の登録 (外国人材)</h2>
            <div className="bg-white border border-[#ededed] rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#fbfcfd] border-b border-[#ededed] text-[11px] font-medium text-[#878787] uppercase tracking-wider">
                    <tr><th className="px-5 py-3 font-medium">氏名</th><th className="px-5 py-3 font-medium">ステータス</th><th className="px-5 py-3 font-medium">区分</th><th className="px-5 py-3 font-medium">作成日</th><th className="px-5 py-3 w-10"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#ededed]">
                    {workers?.map(w => (
                      <tr key={w.id} className="hover:bg-[#fbfcfd] transition-colors group">
                        <td className="px-5 py-4"><Link href={`/workers/${w.id}/edit`} className="font-medium text-[#1f1f1f] hover:text-[#24b47e]">{w.full_name_romaji}</Link></td>
                        <td className="px-5 py-4"><span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-widest bg-transparent ${w.status === 'working' ? 'border-[#24b47e] text-[#24b47e]' : 'border-gray-300 text-[#878787]'}`}>{w.status === 'working' ? '就業中' : w.status === 'standby' ? '待機中' : w.status === 'returned' ? '帰国' : w.status === 'waiting' ? '入国待ち' : w.status === 'missing' ? '失踪' : w.status}</span></td>
                        <td className="px-5 py-4"><span className="px-2 py-0.5 border border-[#ededed] text-[#878787] rounded-[4px] text-[10px] font-mono uppercase bg-[#fbfcfd]">{w.system_type === 'tokuteigino' ? '特定技能' : w.system_type === 'ikusei_shuro' ? '育成就労' : '技能実習'}</span></td>
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
