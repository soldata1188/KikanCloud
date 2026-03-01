import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { updateAudit, deleteAudit, deleteAuditHistory } from '@/app/audits/actions'
import { ArrowLeft, CalendarCheck, Clock, CheckCircle2, History, Trash2, Pencil } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { UpdateButton, AuditEditDeleteButton, AuditHistoryDeleteButton } from '@/components/SubmitButtons'
import { redirect, notFound } from 'next/navigation'

const TYPE_LABELS: Record<string, string> = { homon: '訪問', kansa: '監査', rinji: '臨時' }
const TYPE_COLORS: Record<string, string> = {
    homon: 'bg-blue-50 text-blue-700 border-blue-200',
    kansa: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    rinji: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default async function EditAuditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single()
    const { data: audit } = await supabase.from('audits').select('*').eq('id', id).eq('is_deleted', false).single()
    if (!audit) notFound()

    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false).order('name_jp')

    // Fetch staff list for 担当 dropdown
    const { data: staffList } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('tenant_id', userProfile?.tenant_id)
        .order('full_name')

    // Fetch full history for this company
    const { data: history } = await supabase.from('audits')
        .select('id, audit_type, scheduled_date, actual_date, status, pic_name, notes')
        .eq('company_id', audit.company_id)
        .eq('is_deleted', false)
        .neq('id', id) // exclude current
        .order('scheduled_date', { ascending: false })
        .limit(20)

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <Sidebar active="audits" />
            <main className="flex-1 flex flex-col relative overflow-hidden">

                {/* ── Top Bar ── */}
                <div className="flex items-center justify-between px-6 h-[57px] border-b border-gray-200 bg-white shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <Link href="/audits"
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 border border-transparent">
                            <ArrowLeft size={18} strokeWidth={2} />
                        </Link>
                        <div className="w-px h-5 bg-gray-200" />
                        <div>
                            <h2 className="text-[15px] font-bold text-gray-900 leading-tight tracking-tight uppercase">スケジュールの編集</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/audits"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-[11px] font-bold rounded-md hover:bg-gray-50 transition-colors">
                            キャンセル
                        </Link>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                    <div className="w-[800px] mx-auto p-8 space-y-8">

                        {/* ── Edit Form ── */}
                        <form action={updateAudit} className="space-y-8">
                            <input type="hidden" name="id" value={audit.id} />

                            <div className="bg-white border border-gray-200 overflow-hidden rounded-md">
                                <div className="px-5 py-2.5 border-b border-[#005a9e] flex items-center justify-between bg-[#0067b8]">
                                    <div className="flex items-center gap-2.5">
                                        <CalendarCheck size={14} className="text-white" />
                                        <h3 className="text-[11px] font-black text-white uppercase tracking-widest">訪問詳細の編集</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {userProfile?.role === 'admin' ? <AuditEditDeleteButton deleteAction={deleteAudit} /> : <div />}
                                        <UpdateButton />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex flex-col sm:flex-row border-b border-gray-100 bg-gray-50/10">
                                        <div className="w-full sm:w-[160px] lg:w-[180px] px-5 py-3 flex items-start border-b sm:border-b-0 sm:border-r border-gray-100 shrink-0 bg-gray-50/30">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">対象企業 <span className="text-rose-500 font-black">*</span></label>
                                        </div>
                                        <div className="flex-1 px-5 py-3">
                                            <select name="company_id" required defaultValue={audit.company_id}
                                                className="w-full bg-white border border-gray-300 focus:border-[#0067b8] rounded px-3 py-1.5 text-[13px] font-bold outline-none text-gray-900 transition-all font-sans">
                                                {companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row border-b border-gray-100">
                                        <div className="w-full sm:w-[160px] lg:w-[180px] px-5 py-3 flex items-start border-b sm:border-b-0 sm:border-r border-gray-100 shrink-0 bg-gray-50/30">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">訪問種別 <span className="text-rose-500 font-black">*</span></label>
                                        </div>
                                        <div className="flex-1 px-5 py-3">
                                            <select name="audit_type" required defaultValue={audit.audit_type}
                                                className="w-full bg-white border border-gray-300 focus:border-[#0067b8] rounded px-3 py-1.5 text-[13px] font-bold outline-none text-gray-900 transition-all">
                                                <option value="homon">訪問 (毎月)</option>
                                                <option value="kansa">監査 (3ヶ月)</option>
                                                <option value="rinji">臨時対応・その他</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row border-b border-gray-100">
                                        <div className="w-full sm:w-[160px] lg:w-[180px] px-5 py-3 flex items-start border-b sm:border-b-0 sm:border-r border-gray-100 shrink-0 bg-gray-50/30">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">ステータス <span className="text-rose-500 font-black">*</span></label>
                                        </div>
                                        <div className="flex-1 px-5 py-3">
                                            <select name="status" required defaultValue={audit.status === 'in_progress' ? 'planned' : audit.status}
                                                className="w-full bg-white border border-gray-300 focus:border-[#0067b8] rounded px-3 py-1.5 text-[13px] font-bold outline-none text-gray-900 transition-all">
                                                <option value="planned">予定（未実施）</option>
                                                <option value="completed">完了（提出済）</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row border-b border-gray-100">
                                        <div className="w-full sm:w-[160px] lg:w-[180px] px-5 py-3 flex items-start border-b sm:border-b-0 sm:border-r border-gray-100 shrink-0 bg-gray-50/30">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">予定日 <span className="text-rose-500 font-black">*</span></label>
                                        </div>
                                        <div className="flex-1 px-5 py-3">
                                            <input name="scheduled_date" type="date" required defaultValue={audit.scheduled_date}
                                                className="w-full bg-white border border-gray-300 focus:border-[#0067b8] rounded px-3 py-1.5 text-[13px] font-bold outline-none text-gray-900 transition-all font-mono" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row border-b border-gray-100">
                                        <div className="w-full sm:w-[160px] lg:w-[180px] px-5 py-3 flex items-start border-b sm:border-b-0 sm:border-r border-gray-100 shrink-0 bg-gray-50/30">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">実施日</label>
                                        </div>
                                        <div className="flex-1 px-5 py-3">
                                            <input name="actual_date" type="date" defaultValue={audit.actual_date || ''}
                                                className="w-full bg-white border border-gray-300 focus:border-[#0067b8] rounded px-3 py-1.5 text-[13px] font-bold outline-none text-gray-900 transition-all font-mono" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row border-b border-gray-100">
                                        <div className="w-full sm:w-[160px] lg:w-[180px] px-5 py-3 flex items-start border-b sm:border-b-0 sm:border-r border-gray-100 shrink-0 bg-gray-50/30">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">担当者</label>
                                        </div>
                                        <div className="flex-1 px-5 py-3">
                                            {staffList && staffList.length > 0 ? (
                                                <select name="pic_name" defaultValue={audit.pic_name || ''}
                                                    className="w-full bg-white border border-gray-300 focus:border-[#0067b8] rounded px-3 py-1.5 text-[13px] font-bold outline-none text-gray-900 transition-all">
                                                    <option value="">— 担当者を選択 —</option>
                                                    {staffList.map((s: { id: string, full_name: string | null }) => (
                                                        <option key={s.id} value={s.full_name || ''}>{s.full_name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input name="pic_name" type="text" defaultValue={audit.pic_name || ''} placeholder="担当者名"
                                                    className="w-full bg-white border border-gray-300 focus:border-[#0067b8] rounded px-3 py-1.5 text-[13px] font-bold outline-none text-gray-900 transition-all" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="w-full px-5 py-3 flex items-start border-b border-gray-100 shrink-0 bg-gray-50/30">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">特記事項・メモ</label>
                                        </div>
                                        <div className="p-5">
                                            <textarea name="notes" rows={5} defaultValue={audit.notes || ''} placeholder="特記事項があれば記入..."
                                                className="w-full bg-white border border-gray-300 focus:border-[#0067b8] rounded px-3 py-2 text-[13px] font-bold outline-none text-gray-900 transition-all resize-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* ── 監査・訪問 履歴 ── */}
                        <div className="bg-white border border-gray-200 overflow-hidden rounded-md shadow-sm">
                            <div className="px-5 py-2.5 border-b border-[#005a9e] flex items-center justify-between bg-[#0067b8]">
                                <div className="flex items-center gap-2.5">
                                    <History size={14} className="text-white" />
                                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest">同企業の訪問履歴</h3>
                                </div>
                                <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black border border-white/20 uppercase tracking-widest">
                                    {history?.length || 0} 件
                                </span>
                            </div>

                            {!history || history.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 text-[13px] flex flex-col items-center gap-2">
                                    <Clock size={24} className="opacity-20" />
                                    <span className="font-bold">履歴が存在いたしません</span>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {history.map(h => {
                                        const isCompleted = h.status === 'completed'
                                        return (
                                            <div key={h.id} className="group flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/80 transition-all">
                                                {/* Status dot */}
                                                <div className={`w-2 h-2 rounded-full shrink-0 ${isCompleted ? 'bg-emerald-500' : 'bg-amber-400'}`} />

                                                {/* Type badge */}
                                                <div className={`w-[60px] text-center text-[10px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${TYPE_COLORS[h.audit_type] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                    {TYPE_LABELS[h.audit_type] || h.audit_type}
                                                </div>

                                                {/* Dates */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-[13px] text-gray-900 font-bold">
                                                            {(h.actual_date || h.scheduled_date)?.replace(/-/g, '/')}
                                                        </span>
                                                        {!isCompleted && (
                                                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 rounded font-black border border-amber-100 uppercase tracking-widest">予定</span>
                                                        )}
                                                    </div>
                                                    {h.notes && (
                                                        <div className="text-[11px] text-gray-400 font-medium truncate mt-0.5">{h.notes}</div>
                                                    )}
                                                </div>

                                                {/* Pic name */}
                                                {h.pic_name && (
                                                    <div className="flex items-center gap-2.5 px-3 py-1 bg-gray-50 rounded border border-gray-100">
                                                        <div className="w-5 h-5 rounded bg-[#0067b8] flex items-center justify-center text-white text-[9px] font-black">
                                                            {h.pic_name.charAt(0)}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-gray-600 hidden md:block">{h.pic_name}</span>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 translate-x-1 group-hover:translate-x-0 transition-all">
                                                    <Link href={`/audits/${h.id}/edit`}
                                                        className="p-1.5 rounded hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-[#0067b8] transition-all"
                                                        title="編集">
                                                        <Pencil size={15} />
                                                    </Link>

                                                    {userProfile?.role === 'admin' && (
                                                        <form action={deleteAuditHistory}>
                                                            <input type="hidden" name="id" value={h.id} />
                                                            <AuditHistoryDeleteButton />
                                                        </form>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
