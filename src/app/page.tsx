import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Shield, ArrowRight, AlertCircle, Clock, CheckCircle2, CalendarCheck, Calendar, Users, Building2, AlertTriangle, Plus, SlidersHorizontal, Mic } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase.from('users').select('full_name').eq('id', user.id).single()
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
        <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-[#f0f4f9] z-10">
          <h1 className="text-[22px] font-normal text-[#444746] tracking-tight">Kikan AI</h1>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex px-3 py-1 bg-white rounded-full text-[11px] font-semibold text-[#444746] tracking-wider border border-gray-200">ULTRA</span>
            <button className="flex items-center gap-2 pl-4 pr-1.5 py-1.5 bg-white rounded-full text-sm font-medium text-[#444746] hover:bg-gray-50 transition border border-gray-200 shadow-sm cursor-pointer">
              仕事 <div className="w-8 h-8 rounded-full bg-[#d81b60] text-white flex items-center justify-center text-xs font-bold">{displayName.charAt(0)}</div>
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
          <div className="bg-white rounded-[32px] p-2 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-300 border border-[#e1e5ea] mb-8">
            <div className="min-h-[64px] px-4 pt-3 pb-2 flex items-start gap-3">
              <Shield size={20} className="text-[#4285F4] mt-1 shrink-0" strokeWidth={1.5} />
              <textarea placeholder="Kikan AI に作業を依頼する (例: 期限が近い実習生のリストを出して)" className="w-full bg-transparent outline-none text-[16px] text-[#1f1f1f] placeholder:text-[#444746]/70 resize-none h-12 pt-0.5"></textarea>
            </div>
            <div className="flex justify-between items-center px-2 pb-1">
              <div className="flex items-center gap-1 text-[#444746]">
                <button className="p-2.5 hover:bg-[#f0f4f9] rounded-full transition-colors"><Plus size={20} strokeWidth={1.5} /></button>
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-[#f0f4f9] rounded-full transition-colors text-sm font-medium"><SlidersHorizontal size={18} strokeWidth={1.5} /> ツール</button>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-3 py-2 hover:bg-[#f0f4f9] rounded-full transition-colors text-sm font-medium text-[#444746]">Pro <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f0f4f9] hover:bg-[#e1e5ea] transition-colors text-[#444746]"><Mic size={20} strokeWidth={1.5} /></button>
              </div>
            </div>
          </div>

          {/* CÁC VIÊN THUỐC LỌC THÔNG MINH (ACTION CHIPS) */}
          <div className="flex flex-wrap gap-3 mb-10 pl-1">
            <Link href="/workers" className={`bg-white hover:bg-gray-50 border ${urgentCount > 0 ? 'border-red-200 text-red-600 bg-red-50/50 shadow-red-100' : 'border-[#e1e5ea] text-[#444746]'} px-5 py-3.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 shadow-sm`}>
              {urgentCount > 0 ? <AlertCircle size={16} /> : '⚠️'} 期限警告 ({urgentCount})
            </Link>
            <Link href="/audits" className={`bg-white hover:bg-gray-50 border ${overdueAuditsCount > 0 ? 'border-orange-200 text-orange-600 bg-orange-50/50 shadow-orange-100' : 'border-[#e1e5ea] text-[#444746]'} px-5 py-3.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 shadow-sm`}>
              {overdueAuditsCount > 0 ? <AlertTriangle size={16} /> : '🚨'} 監査遅延 ({overdueAuditsCount})
            </Link>
            <Link href="/companies" className="bg-white hover:bg-gray-50 border border-[#e1e5ea] px-5 py-3.5 rounded-full text-sm text-[#444746] font-medium transition-colors flex items-center gap-2 shadow-sm">
              🏢 受入企業 ({companyCount || 0})
            </Link>
            <Link href="/workers" className="bg-white hover:bg-gray-50 border border-[#e1e5ea] px-5 py-3.5 rounded-full text-sm text-[#444746] font-medium transition-colors flex items-center gap-2 shadow-sm">
              👥 就業中人材 ({workerCount || 0})
            </Link>
          </div>

          {/* 2 KHỐI WIDGETS CẢNH BÁO CHÍNH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

            {/* WIDGET 1: CẢNH BÁO HẾT HẠN (ĐỎ) */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-red-100 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600"></div>
              <h3 className="text-lg font-medium text-[#1f1f1f] mb-4 flex items-center gap-2 mt-2">
                <AlertCircle className="text-red-500" size={20} /> 期限が迫っている手続き
              </h3>
              <div className="flex-1 space-y-3">
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
                    <Link href={`/workers/${w.id}/edit`} key={w.id} className="block p-4 rounded-[20px] border border-red-100 bg-red-50/30 hover:bg-red-50/80 transition-colors group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-[#1f1f1f] group-hover:text-[#4285F4] transition-colors line-clamp-1 pr-2">{w.full_name_romaji}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold whitespace-nowrap">{reason}</span>
                      </div>
                      <p className="text-xs text-[#444746] flex items-center gap-1.5"><Clock size={12} className="text-red-400" /> 期限: {dateStr?.replace(/-/g, '/')} <span className="text-gray-300">|</span> {w.companies?.name_jp || '未配属'}</p>
                    </Link>
                  )
                }) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#444746]/50 py-10 bg-[#f0f4f9]/50 rounded-[20px]">
                    <CheckCircle2 size={32} className="text-green-300 mb-2" />
                    <p className="text-sm font-medium">直近90日以内の期限切れはありません</p>
                  </div>
                )}
              </div>
              {urgentCount > 5 && <Link href="/workers" className="mt-4 text-sm text-[#4285F4] hover:underline flex items-center justify-center gap-1">すべて見る <ArrowRight size={14} /></Link>}
            </div>

            {/* WIDGET 2: CÔNG VIỆC KANSA (CAM) */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-100 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-300 to-orange-500"></div>
              <h3 className="text-lg font-medium text-[#1f1f1f] mb-4 flex items-center gap-2 mt-2">
                <CalendarCheck className="text-orange-500" size={20} /> 今月の監査・訪問タスク
              </h3>
              <div className="flex-1 space-y-3">
                {pendingAudits && pendingAudits.length > 0 ? pendingAudits.map(a => {
                  const isOverdue = a.scheduled_date < todayStr;
                  return (
                    <Link href={`/audits`} key={a.id} className={`block p-4 rounded-[20px] border ${isOverdue ? 'border-orange-200 bg-orange-50/50 hover:bg-orange-50' : 'border-gray-100 hover:bg-gray-50'} transition-colors group`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-[#1f1f1f] group-hover:text-[#4285F4] transition-colors line-clamp-1">{a.companies?.name_jp}</span>
                        {isOverdue && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 animate-pulse">遅延</span>}
                      </div>
                      <p className="text-xs text-[#444746] flex items-center gap-1.5">
                        <Calendar size={12} className={isOverdue ? "text-orange-400" : "text-gray-400"} /> 予定: {a.scheduled_date.replace(/-/g, '/')}
                        <span className="text-gray-300">|</span>
                        {a.audit_type === 'kansa' ? '監査' : a.audit_type === 'homon' ? '定期訪問' : '臨時'}
                      </p>
                    </Link>
                  )
                }) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#444746]/50 py-10 bg-[#f0f4f9]/50 rounded-[20px]">
                    <CheckCircle2 size={32} className="text-green-300 mb-2" />
                    <p className="text-sm font-medium">今月の未完了タスクはありません</p>
                  </div>
                )}
              </div>
              {pendingAudits && pendingAudits.length > 5 && <Link href="/audits" className="mt-4 text-sm text-[#4285F4] hover:underline flex items-center justify-center gap-1">ボードを開く <ArrowRight size={14} /></Link>}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
