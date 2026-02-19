import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { Shield, Plus, SlidersHorizontal, Mic } from 'lucide-react'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase.from('users').select('full_name, role').eq('id', user.id).single()
  const { data: workers } = await supabase.from('workers').select(`id, full_name_romaji, system_type, companies (name_jp), visas (expiration_date)`).order('created_at', { ascending: false }).limit(4)
  const { count: urgentVisas } = await supabase.from('visas').select('*', { count: 'exact', head: true }).lt('expiration_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString())
  const { count: transfers } = await supabase.from('job_transfers').select('*', { count: 'exact', head: true }).eq('status', 'intent_declared')
  const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true })

  // Xử lý Tên hiển thị (Lấy từ cuối cùng)
  const fullName = userProfile?.full_name || '管理者';
  const nameParts = fullName.split(' ');
  const displayName = nameParts[nameParts.length - 1];

  return (
    <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">

      <Sidebar active="dashboard" />

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">

        {/* Top Header Badges */}
        <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-[#f0f4f9] z-10">
          <h1 className="text-[22px] font-normal text-[#444746] tracking-tight">Kikan AI</h1>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex px-3 py-1 bg-white rounded-full text-[11px] font-semibold text-[#444746] tracking-wider border border-gray-200">
              ULTRA
            </span>
            <button className="flex items-center gap-2 pl-4 pr-1.5 py-1.5 bg-white rounded-full text-sm font-medium text-[#444746] hover:bg-gray-50 transition border border-gray-200 shadow-sm cursor-pointer">
              仕事
              <div className="w-8 h-8 rounded-full bg-[#d81b60] text-white flex items-center justify-center text-xs font-bold">
                {displayName.charAt(0)}
              </div>
            </button>
          </div>
        </header>

        {/* Center Focal Point */}
        <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[830px] mx-auto mt-8 md:mt-[8vh]">

          {/* Greeting Text */}
          <div className="mb-10 pl-2">
            <h2 className="text-[40px] md:text-[52px] font-medium leading-[1.2] tracking-tight text-[#1f1f1f] mb-1 flex items-center gap-3">
              {/* SVG Sparkle Icon chuẩn Google */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.6644 1.5033C11.8385 1.03875 12.5029 1.03875 12.6771 1.5033L14.7779 7.10495C14.8519 7.30232 15.008 7.45837 15.2053 7.53239L20.807 9.63318C21.2716 9.80731 21.2716 10.4717 20.807 10.6459L15.2053 12.7466C15.008 12.8207 14.8519 12.9767 14.7779 13.1741L12.6771 18.7758C12.5029 19.2403 11.8385 19.2403 11.6644 18.7758L9.56358 13.1741C9.48956 12.9767 9.33351 12.8207 9.13614 12.7466L3.53435 10.6459C3.0698 10.4717 3.0698 9.80731 3.53435 9.63318L9.13614 7.53239C9.33351 7.45837 9.48956 7.30232 9.56358 7.10495L11.6644 1.5033Z" fill="url(#paint0_linear)" />
                <defs>
                  <linearGradient id="paint0_linear" x1="12" y1="1" x2="12" y2="19" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4285F4" /><stop offset="0.33" stopColor="#EA4335" /><stop offset="0.66" stopColor="#FBBC05" /><stop offset="1" stopColor="#34A853" />
                  </linearGradient>
                </defs>
              </svg>
              {displayName} さん
            </h2>
            <h2 className="text-[40px] md:text-[52px] font-medium leading-[1.2] tracking-tight text-[#c4c7c5]">
              何から始めますか？
            </h2>
          </div>

          {/* AI Prompt Input Box */}
          <div className="bg-white rounded-[32px] p-2 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-300 border border-[#e1e5ea] mb-8">
            <div className="min-h-[64px] px-4 pt-3 pb-2 flex items-start gap-3">
              <Shield size={20} className="text-[#444746] mt-1 shrink-0" strokeWidth={1.5} />
              <textarea
                placeholder="Kikan AI へのプロンプトを入力 (例: 在留期限が近い実習生を教えて)"
                className="w-full bg-transparent outline-none text-[16px] text-[#1f1f1f] placeholder:text-[#444746]/70 resize-none h-12 pt-0.5"
              ></textarea>
            </div>
            <div className="flex justify-between items-center px-2 pb-1">
              <div className="flex items-center gap-1 text-[#444746]">
                <button className="p-2.5 hover:bg-[#f0f4f9] rounded-full transition-colors"><Plus size={20} strokeWidth={1.5} /></button>
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-[#f0f4f9] rounded-full transition-colors text-sm font-medium">
                  <SlidersHorizontal size={18} strokeWidth={1.5} /> ツール
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-3 py-2 hover:bg-[#f0f4f9] rounded-full transition-colors text-sm font-medium text-[#444746]">
                  Pro <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f0f4f9] hover:bg-[#e1e5ea] transition-colors text-[#444746]">
                  <Mic size={20} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap gap-3 mb-12 pl-1">
            <button className="bg-white hover:bg-gray-50 border border-[#e1e5ea] px-5 py-3.5 rounded-full text-sm text-[#444746] font-medium transition-colors flex items-center gap-2 shadow-sm">
              ⚠️ 在留期限警告 ({urgentVisas || 0})
            </button>
            <button className="bg-white hover:bg-gray-50 border border-[#e1e5ea] px-5 py-3.5 rounded-full text-sm text-[#444746] font-medium transition-colors flex items-center gap-2 shadow-sm">
              🔄 転籍申請の確認 ({transfers || 0})
            </button>
            <button className="bg-white hover:bg-gray-50 border border-[#e1e5ea] px-5 py-3.5 rounded-full text-sm text-[#444746] font-medium transition-colors flex items-center gap-2 shadow-sm">
              🏢 受入企業リスト ({companyCount || 0})
            </button>
            <button className="bg-white hover:bg-gray-50 border border-[#e1e5ea] px-5 py-3.5 rounded-full text-sm text-[#444746] font-medium transition-colors flex items-center gap-2 shadow-sm">
              💡 何でも書く
            </button>
          </div>

          {/* Data Table (Làm mờ viền, chìm vào nền) */}
          <div className="mt-auto bg-white/60 rounded-[24px] shadow-sm border border-[#e1e5ea] p-1">
            <table className="w-full text-left text-sm text-[#444746]">
              <thead className="text-xs font-medium text-gray-500 border-b border-gray-200/50">
                <tr><th className="px-6 py-4 font-normal">最近更新された外国人材</th><th className="px-6 py-4 font-normal">配属先</th><th className="px-6 py-4 font-normal">在留期限</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50">
                {workers?.map((worker: any) => (
                  <tr key={worker.id} className="hover:bg-white transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-medium text-[#1f1f1f]">{worker.full_name_romaji}</td>
                    <td className="px-6 py-4">{worker.companies?.name_jp || '未配属'}</td>
                    <td className="px-6 py-4">{worker.visas?.[0]?.expiration_date ? worker.visas[0].expiration_date.replace(/-/g, '/') : 'ー'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  )
}
