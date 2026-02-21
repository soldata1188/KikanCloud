const fs = require('fs');
const pageTsxContent = `import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
import { MoreVertical, AlertCircle, Calendar, Users, Building2, CalendarClock, Target, Sparkles } from 'lucide-react'
import { AICopilot } from '@/components/AICopilot'
import { AITaskSuggestion } from '@/components/AITaskSuggestion'
import { DateTimeBadge } from '@/components/DateTimeBadge'

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
    .select(\`
      id, full_name_romaji, cert_end_date, passport_exp,
      companies!workers_company_id_fkey(name_jp)
    \`)
    .eq('tenant_id', userProfile?.tenant_id)
    .or(\`cert_end_date.lte.\${ninetyDaysStr},passport_exp.lte.\${ninetyDaysStr}\`)
    .order('cert_end_date', { ascending: true })
    .limit(5)

  // Fetch upcoming audits
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(today.getDate() + 7)
  const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]
  
  const { data: upcomingAudits } = await supabase
    .from('audits')
    .select(\`
      id, audit_type, scheduled_date,
      companies!audits_company_id_fkey(name_jp)
    \`)
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
          {/* AI Copilot Hero Section */}
          <div className="relative pt-16 pb-12 px-6 md:px-10 border-b border-gray-200 bg-white">
            <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col items-center text-center">
              <DateTimeBadge />

              <h1 className="text-[32px] md:text-[40px] font-bold text-[#1f1f1f] mb-3 tracking-tight">
                {lastName}さん、 {greeting} <span className="text-3xl ml-1">{emoji}</span>
              </h1>

              <p className="text-[#666666] text-[15px] mb-10 max-w-lg mx-auto">
                本日の調子はいかがですか？入管への申請や監査など、フォーカスしたい業務を教えてください。
              </p>

              <AICopilot />
            </div>
          </div>

          <div className="p-6 md:p-10 max-w-[1200px] mx-auto">
            {/* Split Top Section: Task Suggestion & Action Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* AI Task Suggestion */}
              <div className="flex flex-col">
                <h2 className="text-[17px] font-semibold tracking-tight text-[#1f1f1f] mb-4 shrink-0">AIタスク提案</h2>
                <div className="flex-1">
                  <AITaskSuggestion
                    priorityTask="未実施の監査"
                    secondaryTask="在留期限リスト"
                    reasoning="コンプライアンス上、最も優先度が高いためです。"
                  />
                </div>
              </div>

              {/* System Alerts */}
              <div className="flex flex-col">
                <h2 className="text-[17px] font-semibold tracking-tight text-[#1f1f1f] mb-4 shrink-0">システムアラート</h2>
                <div className="flex-1 border border-[#ffeded] rounded-none p-5 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#ef4444]"></div>

                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={16} className="text-[#ef4444]" />
                    <h3 className="text-[11px] font-bold text-[#ef4444] uppercase tracking-wider">要対応</h3>
                  </div>

                  <h4 className="text-[15px] font-bold text-[#1f1f1f] mb-2">在留期限アラート</h4>
                  <p className="text-[14px] leading-relaxed text-[#666666] mb-4">
                    システムは90日以内に在留資格が切れる実習生（{expiringWorkers?.length || 0}名）を検知しました。至急リストを確認し、更新手続きを開始してください。
                  </p>

                  <Link href="/workers" className="text-[12px] font-bold text-[#1f1f1f] tracking-wider hover:text-[#ef4444] transition-colors flex items-center gap-1">
                    対象者を確認 <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* Expiring Docs Alert */}
              <div className="border border-gray-200 rounded-none p-5 relative overflow-hidden group">
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
                          <Link href={\`/workers/\${w.id}\`} className="font-medium text-[13px] text-[#1f1f1f] hover:text-orange-600 transition-colors">{w.full_name_romaji}</Link>
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
                  <div className="text-[13px] text-[#878787] flex items-center justify-center p-6 bg-white rounded border border-dashed border-gray-200">期限が近い人材はいません。</div>
                )}
              </div>

              {/* Upcoming Audits Alert */}
              <div className="border border-gray-200 rounded-none p-5 relative overflow-hidden group">
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
                  <div className="text-[13px] text-[#878787] flex items-center justify-center p-6 bg-white rounded border border-dashed border-gray-200">直近の予定はありません。</div>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <div className="bg-white border text-center border-gray-200 rounded-xl p-5 shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:border-[#24b47e]/30 transition-colors">
                <Users size={20} className="mx-auto text-[#878787] mb-3" />
                <div className="text-[10px] font-bold text-[#878787] tracking-wider mb-1">管理中の実習生</div>
                <div className="text-[28px] font-bold text-[#1f1f1f]">{workersCount || 0}</div>
              </div>

              <div className="bg-white border text-center border-gray-200 rounded-xl p-5 shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:border-[#24b47e]/30 transition-colors">
                <Building2 size={20} className="mx-auto text-[#878787] mb-3" />
                <div className="text-[10px] font-bold text-[#878787] tracking-wider mb-1">担当企業</div>
                <div className="text-[28px] font-bold text-[#1f1f1f]">{companiesCount || 0}</div>
              </div>

              <div className="bg-white border text-center border-gray-200 rounded-xl p-5 shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:border-[#24b47e]/30 transition-colors">
                <CalendarClock size={20} className="mx-auto text-[#878787] mb-3" />
                <div className="text-[10px] font-bold text-[#878787] tracking-wider mb-1">未実施の監査</div>
                <div className="text-[28px] font-bold text-[#1f1f1f]">{auditsCount || 0}</div>
              </div>

              <div className="bg-white border text-center border-[#24b47e]/50 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden group cursor-pointer hover:border-[#24b47e] transition-colors">
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#24b47e]"></div>
                <Target size={20} className="mx-auto text-[#24b47e] mb-3" />
                <div className="text-[10px] font-bold text-[#24b47e] tracking-wider mb-1">タスク状況</div>
                <div className="text-[22px] font-bold text-[#1f1f1f] mt-2">順調</div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
`;

fs.writeFileSync('src/app/page.tsx', pageTsxContent);
console.log('page.tsx restored.');

const topNavContent = `'use client'
import { HelpCircle } from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'
import { createClient } from '@/lib/supabase/server'

export function TopNav({ title, role, userProfileStr }: { title: string, role?: string, userProfileStr?: string }) {
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
    const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'User'
    const email = userProfile?.email || ''
    const avatarUrl = userProfile?.avatar_url

    return (
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0 w-full">
            <div className="flex items-center gap-2 text-[13px]">
                <span className="font-medium text-[#1f1f1f]">KikanCloud</span>
                <span className="text-[#878787]">/</span>
                <span className="text-[#1f1f1f]">{title}</span>
            </div>

            <div className="flex items-center gap-4">
                <div title="ヘルプ"><HelpCircle size={18} className="text-[#878787] hover:text-[#1f1f1f] cursor-pointer transition-colors" strokeWidth={1.5} /></div>
                {role && <NotificationBell role={role} />}
                <UserMenu displayName={displayName} email={email} role={role} avatarUrl={avatarUrl} />
            </div>
        </header>
    )
}
`;

fs.writeFileSync('src/components/TopNav.tsx', topNavContent);
console.log('TopNav.tsx restored.');

const dashboardAiContent = `'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai';

export async function chatWithDashboardAI(userName: string, input: string) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return {
                success: false,
                text: "API Key is not configured."
            };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const prompt = \`You are KikanCloud AI Copilot, a helpful analytical assistant for a Japanese cooperative staff named \${userName}.
The user asks: "\${input}"

Respond briefly and professionally in Japanese. Focus on practical advice for cooperative (監理団体) operations.
Keep the response to 1-2 paragraphs max. No markdown bolding, just plain text.
        \`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
            }
        });

        return {
            success: true,
            text: response.text
        };
    } catch (error: any) {
        console.error('AI Chat Error:', error);
        return {
            success: false,
            text: "申し訳ありません。エラーが発生しました。"
        };
    }
}
`;

fs.writeFileSync('src/app/actions/dashboardAi.ts', dashboardAiContent);
console.log('dashboardAi.ts restored.');
