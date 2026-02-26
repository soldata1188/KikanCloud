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
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="audits" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <div className="flex-1 flex flex-col px-4 pb-16 w-full max-w-[720px] mx-auto mt-6 md:mt-10">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/audits" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600">
                            <ArrowLeft size={20} strokeWidth={2} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">スケジュールの編集</h1>
                            <p className="text-sm text-slate-400 mt-0.5">{companies?.find(c => c.id === audit.company_id)?.name_jp || ''}</p>
                        </div>
                    </div>

                    {/* Edit form */}
                    <form action={updateAudit} className="flex flex-col gap-5">
                        <input type="hidden" name="id" value={audit.id} />

                        {/* 基本情報 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <CalendarCheck size={16} className="text-slate-400" />
                                    <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">訪問詳細</h2>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">編集中</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">対象企業 <span className="text-red-400">*</span></label>
                                    <select name="company_id" required defaultValue={audit.company_id}
                                        className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none appearance-none text-slate-800 font-medium transition-all text-sm">
                                        {companies?.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">種別 <span className="text-red-400">*</span></label>
                                    <select name="audit_type" required defaultValue={audit.audit_type}
                                        className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none appearance-none text-slate-800 font-medium transition-all text-sm">
                                        <option value="homon">訪問 (毎月)</option>
                                        <option value="kansa">監査 (3ヶ月)</option>
                                        <option value="rinji">臨時対応・その他</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">ステータス <span className="text-red-400">*</span></label>
                                    <select name="status" required defaultValue={audit.status === 'in_progress' ? 'planned' : audit.status}
                                        className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none appearance-none text-slate-800 font-medium transition-all text-sm">
                                        <option value="planned">予定（未実施）</option>
                                        <option value="completed">完了（提出済）</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">予定日 <span className="text-red-400">*</span></label>
                                    <input name="scheduled_date" type="date" required defaultValue={audit.scheduled_date}
                                        className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none text-slate-800 font-medium transition-all text-sm" />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">実施日</label>
                                    <input name="actual_date" type="date" defaultValue={audit.actual_date || ''}
                                        className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none text-slate-800 font-medium transition-all text-sm" />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">担当スタッフ</label>
                                    {staffList && staffList.length > 0 ? (
                                        <select name="pic_name" defaultValue={audit.pic_name || ''}
                                            className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none appearance-none text-slate-800 font-medium transition-all text-sm">
                                            <option value="">— 担当者を選択 —</option>
                                            {staffList.map(s => (
                                                <option key={s.id} value={s.full_name || ''}>{s.full_name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input name="pic_name" type="text" defaultValue={audit.pic_name || ''} placeholder="担当者名"
                                            className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none text-slate-800 font-medium transition-all text-sm placeholder:text-slate-300" />
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">特記事項・メモ</label>
                                    <textarea name="notes" rows={3} defaultValue={audit.notes || ''} placeholder="特記事項があれば記入..."
                                        className="w-full bg-white border border-slate-200 focus:border-[#24b47e] rounded-xl px-3 py-2.5 outline-none text-slate-800 transition-all resize-none text-sm placeholder:text-slate-300" />
                                </div>
                            </div>
                        </div>

                        {/* Footer buttons */}
                        <div className="flex items-center justify-between pt-1">
                            {userProfile?.role === 'admin' ? <AuditEditDeleteButton deleteAction={deleteAudit} /> : <div />}
                            <div className="flex gap-3">
                                <Link href="/audits" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm">
                                    キャンセル
                                </Link>
                                <UpdateButton />
                            </div>
                        </div>
                    </form>

                    {/* ── 監査・訪問 履歴 ── */}
                    <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50">
                            <History size={15} className="text-slate-400" />
                            <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">監査・訪問 履歴</h2>
                            <span className="ml-auto text-[11px] text-slate-400">{history?.length || 0} 件</span>
                        </div>

                        {!history || history.length === 0 ? (
                            <div className="px-5 py-10 text-center text-slate-300 text-sm">
                                <Clock size={28} className="mx-auto mb-2 opacity-40" />
                                履歴がありません
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {history.map(h => {
                                    const isCompleted = h.status === 'completed'
                                    return (
                                        <div key={h.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
                                            {/* Status dot */}
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${isCompleted ? 'bg-emerald-400' : 'bg-blue-400'}`} />

                                            {/* Type badge */}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${TYPE_COLORS[h.audit_type] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                {TYPE_LABELS[h.audit_type] || h.audit_type}
                                            </span>

                                            {/* Dates */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[12px] text-slate-600 font-bold">
                                                        {(h.actual_date || h.scheduled_date)?.replace(/-/g, '/')}
                                                    </span>
                                                    {!isCompleted && (
                                                        <span className="text-[10px] text-blue-500 font-bold">予定</span>
                                                    )}
                                                </div>
                                                {h.notes && (
                                                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{h.notes}</div>
                                                )}
                                            </div>

                                            {/* Pic name */}
                                            {h.pic_name && (
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-[9px] font-bold">
                                                        {h.pic_name.charAt(0)}
                                                    </div>
                                                    <span className="text-[11px] text-slate-500 hidden sm:block">{h.pic_name}</span>
                                                </div>
                                            )}

                                            {/* Status icon */}
                                            {isCompleted
                                                ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                                : <Clock size={14} className="text-blue-300 shrink-0" />
                                            }

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <Link href={`/audits/${h.id}/edit`}
                                                    className="p-1.5 rounded-md text-slate-400 hover:text-[#24b47e] hover:bg-emerald-50 transition-colors"
                                                    title="編集">
                                                    <Pencil size={14} />
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
            </main>
        </div>
    )
}
