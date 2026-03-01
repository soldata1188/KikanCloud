import { createClient } from '@/lib/supabase/server'
import { Users, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default async function PortalDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: userProfile } = await supabase.from('users').select('company_id, companies(name_jp)').eq('id', user?.id).single()

    // Query data BELONGING ONLY TO THIS COMPANY (2-layer protection: RLS + Query)
    const [workersRes, auditsRes, workersListRes] = await Promise.all([
        supabase.from('workers').select('id', { count: 'exact', head: true }).eq('company_id', userProfile?.company_id),
        supabase.from('audits').select('scheduled_date, status').eq('company_id', userProfile?.company_id).eq('status', 'Pending').order('scheduled_date', { ascending: true }).limit(1),
        supabase.from('workers').select('id, full_name_romaji, nationality, system_type, status').eq('company_id', userProfile?.company_id).order('created_at', { ascending: false }).limit(5)
    ])

    const totalWorkers = workersRes.count || 0
    const nextAudit = auditsRes.data?.[0]
    const workers = workersListRes.data || []

    return (
        <div className="max-w-[1200px] mx-auto space-y-8">
            {/* ELEGANT GREETING (TRUST BLUE) */}
            <section className="bg-white border border-[#ededed] rounded-[24px] p-8 md:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#1a73e8]/5 to-transparent rounded-bl-full pointer-events-none"></div>
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-[28px] font-black text-[#1f1f1f] leading-tight tracking-tight mb-2">
                        いつもお世話になっております、<span className="text-[#1a73e8]">{(userProfile as any)?.companies?.name_jp || '受入企業'}</span>様。
                    </h1>
                    <p className="text-[14px] text-[#666666] font-medium mb-6">
                        本ポータルでは、貴社に配属された実習生の状況や、次回の監査予定、必要書類のダウンロードが可能です。
                    </p>
                </div>
            </section>

            {/* KEY METRICS */}
            <section className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-[#ededed] rounded-xl p-6 flex items-center justify-between shadow-sm hover:border-[#878787] transition-colors">
                    <div>
                        <p className="text-[11px] font-bold text-[#878787] uppercase tracking-widest mb-1">在籍実習生 (Active Workers)</p>
                        <p className="text-3xl font-black text-[#1f1f1f] font-mono">{totalWorkers} <span className="text-[14px] font-medium text-[#878787] font-sans">名</span></p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[#f8f9fa] border border-[#ededed] flex items-center justify-center text-[#1a73e8]"><Users size={20} /></div>
                </div>

                <div className="bg-white border border-[#ededed] rounded-xl p-6 flex items-center justify-between shadow-sm cursor-not-allowed opacity-70">
                    <div>
                        <p className="text-[11px] font-bold text-[#878787] uppercase tracking-widest mb-1">書類センター (Documents)</p>
                        <p className="text-[14px] font-bold text-[#1a73e8] flex items-center gap-1 mt-2">準備中 (Coming soon)</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[#e8f0fe] border border-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8]"><FileText size={20} /></div>
                </div>
            </section>

            {/* LEFT-BORDER ACCENT CARD AND LIST */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div>
                        <h3 className="text-[16px] font-semibold text-[#444746] mb-4 tracking-tight">次回の監査予定 (Next Audit)</h3>
                        <div className={`${nextAudit ? 'bg-[#fff9f9] border-[#fce8e6]' : 'bg-white border-[#ededed]'} border rounded-xl p-6 shadow-sm min-h-[150px] flex flex-col justify-between relative`}>
                            <div className="relative pl-5 py-0.5 z-10">
                                <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-full ${nextAudit ? 'bg-[#d93025]' : 'bg-[#1e8e3e]'}`}></div>
                                <span className={`text-[12px] font-bold uppercase tracking-wide block mb-2 flex items-center gap-1.5 ${nextAudit ? 'text-[#d93025]' : 'text-[#1e8e3e]'}`}>
                                    {nextAudit ? 'ACTION REQUIRED' : 'NO PENDING AUDITS'}
                                </span>
                                <p className="text-[14px] text-[#444746] leading-relaxed">
                                    {nextAudit ? (
                                        <><strong className="font-semibold text-[#1f1f1f]">{new Date(nextAudit.scheduled_date).toLocaleDateString('ja-JP')}</strong> に定期監査が予定されています。タイムカードと賃金台帳のご準備をお願いいたします。</>
                                    ) : (
                                        <><strong className="font-semibold text-[#1f1f1f]">現在、予定されている監査はありません。</strong> 次回の日程が決まり次第、こちらに通知されます。</>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[16px] font-bold text-[#1f1f1f] flex items-center gap-2"><Users size={18} className="text-[#1a73e8]" /> 所属実習生一覧 (Worker Roster)</h2>
                    </div>
                    <div className="bg-white border border-[#ededed] rounded-xl shadow-sm overflow-hidden">
                        {workers.length === 0 ? (
                            <div className="p-8 text-center text-[#878787] text-[13px]">登録されている実習生はいません。</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#fbfcfd] border-b border-[#ededed] text-[11px] font-bold text-[#878787] uppercase tracking-wider">
                                        <th className="p-4 font-medium">氏名 (Name)</th>
                                        <th className="p-4 font-medium">国籍 (Nationality)</th>
                                        <th className="p-4 font-medium">在留資格 (Visa)</th>
                                        <th className="p-4 font-medium">ステータス (Status)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[13px] text-[#1f1f1f]">
                                    {workers.map((worker) => (
                                        <tr key={worker.id} className="border-b border-[#ededed] hover:bg-[#fbfcfd] transition-colors group">
                                            <td className="p-4 font-bold group-hover:text-[#1a73e8] transition-colors">{worker.full_name_romaji}</td>
                                            <td className="p-4">{worker.nationality}</td>
                                            <td className="p-4"><span className="bg-[#f8f9fa] border border-[#ededed] px-2 py-1 rounded text-[11px] text-[#666666]">{worker.system_type}</span></td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider ${worker.status === 'working' ? 'bg-[#1e8e3e]/10 text-[#1e8e3e]' : 'bg-[#878787]/10 text-[#878787]'}`}>
                                                    {worker.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}