import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Shield, ArrowRight, AlertCircle, Clock, CheckCircle2, CalendarCheck, Calendar, Users, Building2, AlertTriangle, Plus, SlidersHorizontal, Mic, FileText } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { UserMenu } from '@/components/UserMenu'

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase.from('users').select('full_name, role, avatar_url').eq('id', user.id).single()
  const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'

  // --- LOGIC XỬ LÝ THỜI GIAN ---
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  const next90DaysStr = ninetyDaysFromNow.toISOString().split('T')[0];

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  // --- PARALLEL FETCHING (Tải dữ liệu siêu tốc) ---
  const [
    { count: companyCount },
    { count: workerCount },
    { data: pendingAudits },
    { data: expiringWorkers }
  ] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('workers').select('*', { count: 'exact', head: true }).eq('is_deleted', false).eq('status', 'working'),
    // Lịch Kansa chưa xong trong tháng này hoặc trễ hạn
    supabase.from('audits').select('id, audit_type, scheduled_date, status, companies(name_jp)')
      .eq('is_deleted', false).neq('status', 'completed').lte('scheduled_date', lastDayOfMonth)
      .order('scheduled_date', { ascending: true }).limit(5),
    // Visa/Passport/Nintei sắp hết hạn (< 90 ngày)
    supabase.from('workers').select('id, full_name_romaji, passport_exp, cert_end_date, companies(name_jp)')
      .eq('is_deleted', false).eq('status', 'working')
      .or(`passport_exp.lte.${next90DaysStr},cert_end_date.lte.${next90DaysStr}`)
      .limit(5)
  ]);

  const overdueAuditsCount = pendingAudits?.filter(a => a.scheduled_date < todayStr).length || 0;
  const urgentCount = expiringWorkers?.length || 0;

  return (
    <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
      <Sidebar active="dashboard" />
      <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
        <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-[#f0f4f9] z-10 transition-colors">
          <h1 className="text-[22px] font-normal text-[#444746] tracking-tight">KikanCloud</h1>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex px-3 py-1 bg-white rounded-full text-[11px] font-semibold text-[#444746] tracking-wider border border-gray-200">INTERNAL PRO</span>
            <button className="flex items-center gap-2 pl-4 pr-1.5 py-1.5 bg-white rounded-full text-sm font-medium text-[#444746] hover:bg-gray-50 transition border border-gray-200 shadow-sm cursor-pointer">
              {userProfile?.role === 'admin' ? '管理者' : 'スタッフ'} <div className="w-8 h-8 rounded-full bg-[#d81b60] text-white flex items-center justify-center text-xs font-bold">{displayName.charAt(0)}</div>
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[1000px] mx-auto mt-4 md:mt-8">

          {/* LỜI CHÀO & TỔNG QUAN */}
          <div className="mb-10 pl-2">
            <h2 className="text-[40px] md:text-[52px] font-medium leading-[1.2] tracking-tight text-[#1f1f1f] mb-1 flex items-center gap-3">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.6644 1.5033C11.8385 1.03875 12.5029 1.03875 12.6771 1.5033L14.7779 7.10495C14.8519 7.30232 15.008 7.45837 15.2053 7.53239L20.807 9.63318C21.2716 9.80731 21.2716 10.4717 20.807 10.6459L15.2053 12.7466C15.008 12.8207 14.8519 12.9767 14.7779 13.1741L12.6771 18.7758C12.5029 19.2403 11.8385 19.2403 11.6644 18.7758L9.56358 13.1741C9.48956 12.9767 9.33351 12.8207 9.13614 12.7466L3.53435 10.6459C3.0698 10.4717 3.0698 9.80731 3.53435 9.63318L9.13614 7.53239C9.33351 7.45837 9.48956 7.30232 9.56358 7.10495L11.6644 1.5033Z" fill="url(#paint0_linear)" /><defs><linearGradient id="paint0_linear" x1="12" y1="1" x2="12" y2="19" gradientUnits="userSpaceOnUse"><stop stopColor="#4285F4" /><stop offset="0.33" stopColor="#EA4335" /><stop offset="0.66" stopColor="#FBBC05" /><stop offset="1" stopColor="#34A853" /></linearGradient></defs></svg>
              {displayName} さん、お疲れ様です。
            </h2>
            <h2 className="text-[40px] md:text-[52px] font-medium leading-[1.2] tracking-tight text-[#c4c7c5]">
              本日の業務状況をまとめました。
            </h2>
          </div>

          {/* Ô PROMPT AI (TRANG TRÍ UX) */}
          <div className="bg-white rounded-[32px] p-2 mb-8">
            <div className="min-h-[64px] px-4 pt-3 pb-2 flex items-start gap-3">
              <Shield size={20} className="text-[#4285F4] mt-1 shrink-0" strokeWidth={1.5} />
              <textarea placeholder="KikanCloud のAIに作業を依頼する (例: 期限が近い実習生のリストを出して)" className="w-full bg-transparent outline-none text-[16px] text-[#1f1f1f] placeholder:text-[#444746]/70 resize-none h-12 pt-0.5"></textarea>
            </div>
            <div className="flex justify-between items-center px-2 pb-1">
              <div className="flex items-center gap-1 text-[#444746]">
                <button className="p-2.5 hover:bg-[#f0f4f9] rounded-[32px] transition-colors"><Plus size={20} strokeWidth={1.5} /></button>
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-[#f0f4f9] rounded-[32px] transition-colors text-sm font-medium"><SlidersHorizontal size={18} strokeWidth={1.5} /> ツール</button>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-3 py-2 hover:bg-[#f0f4f9] rounded-[32px] transition-colors text-sm font-medium text-[#444746]">Pro <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                <button className="w-10 h-10 flex items-center justify-center rounded-[32px] bg-[#f0f4f9] hover:bg-[#e1e5ea] transition-colors text-[#444746]"><Mic size={20} strokeWidth={1.5} /></button>
              </div>
            </div>
          </div>

          {/* CÁC VIÊN THUỐC LỌC THÔNG MINH (ACTION CHIPS) */}
          <div className="flex flex-wrap gap-3 mb-10 pl-1">
            <Link href="/workers" className={`bg-white hover:bg-gray-50 ${urgentCount > 0 ? 'text-red-600 bg-red-50/50' : 'text-[#444746]'} px-5 py-3.5 rounded-[32px] text-sm font-medium transition-colors flex items-center gap-2`}>
              {urgentCount > 0 ? <AlertCircle size={16} /> : '⚠️'} 期限警告 ({urgentCount})
            </Link>
            <Link href="/audits" className={`bg-white hover:bg-gray-50 ${overdueAuditsCount > 0 ? 'text-orange-600 bg-orange-50/50' : 'text-[#444746]'} px-5 py-3.5 rounded-[32px] text-sm font-medium transition-colors flex items-center gap-2`}>
              {overdueAuditsCount > 0 ? <AlertTriangle size={16} /> : '🚨'} 監査遅延 ({overdueAuditsCount})
            </Link>
            <Link href="/companies" className="bg-white hover:bg-gray-50 px-5 py-3.5 rounded-[32px] text-sm text-[#444746] font-medium transition-colors flex items-center gap-2">
              🏢 受入企業 ({companyCount || 0})
            </Link>
            <Link href="/workers" className="bg-white hover:bg-gray-50 px-5 py-3.5 rounded-[32px] text-sm text-[#444746] font-medium transition-colors flex items-center gap-2">
              👥 就業中人材 ({workerCount || 0})
            </Link>
          </div>

          {/* 2 KHỐI WIDGETS CẢNH BÁO CHÍNH (LIST VIEW) */}
          <div className="flex flex-col gap-8 mb-12">

            {/* WIDGET 1: CẢNH BÁO HẾT HẠN (ĐỎ) */}
            <div className="bg-white/80 rounded-[32px] overflow-hidden p-2 relative flex flex-col">


              <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-200/50 bg-white">
                <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">
                  <AlertCircle className="text-red-500" size={18} strokeWidth={2.5} /> 期限が迫っている手続き
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#444746]">
                  <thead className="bg-transparent text-[12px] font-semibold text-[#444746]/60 border-b border-gray-200/50 uppercase tracking-widest whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-2 font-medium">氏名 / 受入企業</th>
                      <th className="px-4 py-2 font-medium">警告内容</th>
                      <th className="px-4 py-2 font-medium text-right w-[160px]">期限日</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e5ea]">
                    {expiringWorkers && expiringWorkers.length > 0 ? expiringWorkers.map(w => {
                      const passExp = w.passport_exp ? new Date(w.passport_exp) : new Date('2099-01-01');
                      const certExp = w.cert_end_date ? new Date(w.cert_end_date) : new Date('2099-01-01');
                      const isPassExpiring = passExp <= new Date(next90DaysStr) && passExp >= new Date('2000-01-01');
                      const isCertExpiring = certExp <= new Date(next90DaysStr) && certExp >= new Date('2000-01-01');

                      let reason = '';
                      let dateStr = '';
                      if (isPassExpiring) { reason = 'パスポート'; dateStr = w.passport_exp; }
                      else if (isCertExpiring) { reason = '認定修了'; dateStr = w.cert_end_date; }

                      return (
                        <tr key={w.id} className="hover:bg-red-50/50 transition-colors group">
                          <td className="px-4 py-2">
                            <Link href={`/workers/${w.id}/edit`} className="block">
                              <span className="font-semibold text-[#1f1f1f] group-hover:text-[#4285F4] transition-colors line-clamp-1 mb-1">{w.full_name_romaji}</span>
                              <span className="text-[12px] text-gray-500">{(w.companies as any)?.name_jp || '未配属'}</span>
                            </Link>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-[11px] px-2.5 py-1 rounded-[32px] bg-red-50 text-red-600 font-bold border border-red-200 whitespace-nowrap flex items-center gap-1.5 w-max"><AlertCircle size={12} /> {reason}期限迫る</span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="font-medium text-[#1f1f1f] flex flex-col items-end gap-1">
                              <span className="flex items-center gap-1.5"><Clock size={14} className="text-red-400" /> {dateStr?.replace(/-/g, '/')}</span>
                            </div>
                          </td>
                        </tr>
                      )
                    }) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-[#444746]/50">
                          <div className="flex flex-col items-center justify-center">
                            <CheckCircle2 size={32} className="text-green-300 mb-2" />
                            <p className="text-sm font-medium">直近90日以内の期限切れはありません</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {urgentCount > 5 && (
                <div className="px-5 py-3 bg-white border-t border-[#e1e5ea] text-center">
                  <Link href="/workers" className="text-sm text-[#4285F4] font-bold hover:underline inline-flex items-center gap-1.5">すべて見る ({urgentCount}件) <ArrowRight size={14} strokeWidth={2.5} /></Link>
                </div>
              )}
            </div>

            {/* WIDGET 2: CÔNG VIỆC KANSA (CAM) */}
            <div className="bg-white/80 rounded-[32px] overflow-hidden p-2 relative flex flex-col">


              <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-200/50 bg-white">
                <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">
                  <CalendarCheck className="text-orange-500" size={18} strokeWidth={2.5} /> 今月の監査・訪問タスク
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#444746]">
                  <thead className="bg-transparent text-[12px] font-semibold text-[#444746]/60 border-b border-gray-200/50 uppercase tracking-widest whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-2 font-medium">受入企業 / 手続種別</th>
                      <th className="px-4 py-2 font-medium">ステータス</th>
                      <th className="px-4 py-2 font-medium text-right w-[160px]">予定日</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e5ea]">
                    {pendingAudits && pendingAudits.length > 0 ? pendingAudits.map(a => {
                      const isOverdue = a.scheduled_date < todayStr;
                      return (
                        <tr key={a.id} className={`hover:bg-orange-50/30 transition-colors group ${isOverdue ? 'bg-orange-50/20' : ''}`}>
                          <td className="px-4 py-2">
                            <Link href={`/audits`} className="block">
                              <span className="font-semibold text-[#1f1f1f] group-hover:text-[#4285F4] transition-colors line-clamp-1 mb-1">{(a.companies as any)?.name_jp}</span>
                              <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
                                <FileText size={12} className="text-gray-400" />
                                {a.audit_type === 'kansa' ? '監査' : a.audit_type === 'homon' ? '定期訪問' : '臨時'}
                              </span>
                            </Link>
                          </td>
                          <td className="px-4 py-2">
                            {isOverdue ? (
                              <span className="text-[11px] px-2.5 py-1 rounded-[32px] bg-orange-50 text-orange-600 font-bold border border-orange-200 whitespace-nowrap flex items-center gap-1.5 w-max animate-pulse"><AlertTriangle size={12} /> 期限遅延</span>
                            ) : (
                              <span className="text-[11px] px-2.5 py-1 rounded-[32px] bg-gray-50 text-gray-600 font-bold border border-gray-200 whitespace-nowrap flex items-center gap-1.5 w-max"><Calendar size={12} /> 今月タスク</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className={`font-medium flex flex-col items-end gap-1 ${isOverdue ? 'text-orange-600' : 'text-[#1f1f1f]'}`}>
                              <span className="flex items-center gap-1.5"><CalendarCheck size={14} className={isOverdue ? "text-orange-400" : "text-gray-400"} /> {a.scheduled_date.replace(/-/g, '/')}</span>
                            </div>
                          </td>
                        </tr>
                      )
                    }) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-[#444746]/50">
                          <div className="flex flex-col items-center justify-center">
                            <CheckCircle2 size={32} className="text-green-300 mb-2" />
                            <p className="text-sm font-medium">今月の未完了タスクはありません</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {pendingAudits && pendingAudits.length > 5 && (
                <div className="px-5 py-3 bg-white border-t border-[#e1e5ea] text-center">
                  <Link href="/audits" className="text-sm text-[#4285F4] font-bold hover:underline inline-flex items-center gap-1.5">すべて見る ({pendingAudits.length}件) <ArrowRight size={14} strokeWidth={2.5} /></Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
