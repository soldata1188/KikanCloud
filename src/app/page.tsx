import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from './login/actions'
import {
  Activity,
  Users,
  AlertTriangle,
  Building2,
  Briefcase,
  FileWarning,
  LogOut,
} from 'lucide-react'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Lấy thông tin User hiện tại từ bảng users public
  const { data: userProfile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // 2. Kéo dữ liệu thật: Danh sách người lao động + Tên xí nghiệp + Hạn visa
  const { data: workers } = await supabase
    .from('workers')
    .select(`
    id, full_name_romaji, system_type,
    companies (name_jp),
    visas (expiration_date)
  `)
    .order('created_at', { ascending: false })
    .limit(10)

  // 3. Đếm KPI
  const { count: urgentVisas } = await supabase
    .from('visas')
    .select('*', { count: 'exact', head: true })
    .lt(
      'expiration_date',
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    )

  const { count: transfers } = await supabase
    .from('job_transfers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'intent_declared')

  const { count: companyCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-blue-500" /> Kikan SaaS
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a
            href="#"
            className="flex items-center gap-3 bg-blue-600/10 text-blue-400 px-4 py-3 rounded-lg text-sm font-medium"
          >
            <Activity size={18} /> Tổng quan
          </a>
          <a
            href="#"
            className="flex items-center gap-3 hover:bg-slate-800 hover:text-white px-4 py-3 rounded-lg text-sm transition"
          >
            <Building2 size={18} /> Xí nghiệp
          </a>
          <a
            href="#"
            className="flex items-center gap-3 hover:bg-slate-800 hover:text-white px-4 py-3 rounded-lg text-sm transition"
          >
            <Briefcase size={18} /> Người lao động
          </a>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 text-slate-400 hover:text-red-400 w-full px-4 py-2 transition"
            >
              <LogOut size={18} /> Đăng xuất
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Xin chào, {userProfile?.full_name || 'Admin'} 👋
            </h2>
            <p className="text-slate-500 mt-1">
              Dữ liệu bảo mật RLS đã được đồng bộ trực tiếp từ Database.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
            <h3 className="text-slate-500 text-sm font-medium">
              Visa sắp hết hạn (&lt; 90 ngày)
            </h3>
            <div className="mt-4 flex items-start justify-between">
              <span className="text-3xl font-bold text-red-600">
                {urgentVisas || 0}
              </span>
              <div className="p-3 bg-red-50 rounded-lg">
                <FileWarning className="text-red-500" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
            <h3 className="text-slate-500 text-sm font-medium">
              Xí nghiệp quản lý
            </h3>
            <div className="mt-4 flex items-start justify-between">
              <span className="text-3xl font-bold text-slate-800">
                {companyCount || 0}
              </span>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building2 className="text-blue-500" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
            <h3 className="text-slate-500 text-sm font-medium">
              Yêu cầu Chuyển việc
            </h3>
            <div className="mt-4 flex items-start justify-between">
              <span className="text-3xl font-bold text-orange-500">
                {transfers || 0}
              </span>
              <div className="p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="text-orange-500" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-slate-800">
              Danh sách Người lao động (Live Data)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Họ tên (Romaji)</th>
                  <th className="px-6 py-4">Xí nghiệp</th>
                  <th className="px-6 py-4">Chế độ</th>
                  <th className="px-6 py-4">Hạn Visa (Gần nhất)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workers?.map((worker: any) => (
                  <tr key={worker.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {worker.full_name_romaji}
                    </td>
                    <td className="px-6 py-4">
                      {worker.companies?.name_jp || 'Chưa xếp xưởng'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${worker.system_type === 'ikusei_shuro'
                            ? 'bg-green-100 text-green-700'
                            : worker.system_type === 'tokuteigino'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                      >
                        {worker.system_type === 'ikusei_shuro'
                          ? '育成就労'
                          : worker.system_type === 'tokuteigino'
                            ? '特定技能'
                            : '技能実習'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {worker.visas?.[0]?.expiration_date || 'Chưa có dữ liệu'}
                    </td>
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
