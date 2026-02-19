'use client'
import { useTransition } from 'react'
import { updateAuditStatus } from './actions'
import { Clock, CheckCircle2, AlertCircle, Building2, UserCircle2, Calendar, Edit2, ArrowRight, FileText } from 'lucide-react'
import Link from 'next/link'

export function KanbanBoard({ audits }: { audits: any[] }) {
    const [isPending, startTransition] = useTransition()

    const handleStatusChange = (id: string, newStatus: string) => {
        startTransition(() => { updateAuditStatus(id, newStatus) })
    }

    const columns = [
        { id: 'planned', title: '予定（未実施）', icon: <Calendar size={18} className="text-[#4285F4]" />, bg: 'bg-[#f0f4f9]', border: 'border-t-[#4285F4]' },
        { id: 'in_progress', title: '報告書作成中', icon: <FileText size={18} className="text-[#FABB05]" />, bg: 'bg-[#fff8e1]', border: 'border-t-[#FABB05]' },
        { id: 'completed', title: '完了（提出済）', icon: <CheckCircle2 size={18} className="text-[#34A853]" />, bg: 'bg-[#e6f4ea]', border: 'border-t-[#34A853]' }
    ]

    const getTypeStyle = (type: string) => {
        if (type === 'kansa') return { label: '監査(3ヶ月)', style: 'bg-[#fce8e6] text-[#b31412]' }
        if (type === 'homon') return { label: '定期訪問', style: 'bg-[#e8def8] text-[#1d192b]' }
        return { label: '臨時対応', style: 'bg-[#c2e7ff] text-[#001d35]' }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {columns.map(col => (
                <div key={col.id} className={`${col.bg} rounded-[32px] p-4 min-h-[500px] border-t-4 ${col.border} shadow-sm border-x border-b border-[#e1e5ea] flex flex-col`}>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-medium text-[#1f1f1f] flex items-center gap-2">{col.icon} {col.title}</h3>
                        <span className="bg-white/60 text-[#444746] text-xs font-bold px-2 py-1 rounded-full border border-gray-200">{audits.filter(a => a.status === col.id).length}</span>
                    </div>

                    <div className="space-y-4 flex-1">
                        {audits.filter(a => a.status === col.id).map(audit => {
                            const isOverdue = new Date(audit.scheduled_date) < new Date(new Date().setHours(0, 0, 0, 0)) && audit.status === 'planned';
                            const typeInfo = getTypeStyle(audit.audit_type);

                            return (
                                <div key={audit.id} className={`bg-white p-5 rounded-[24px] shadow-sm border border-[#e1e5ea] hover:shadow-md transition-all group relative`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${typeInfo.style}`}>{typeInfo.label}</span>
                                        <div className="flex items-center gap-2">
                                            {isOverdue && <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded-full animate-pulse"><AlertCircle size={12} /> 期限超過</span>}
                                            <Link href={`/audits/${audit.id}/edit`} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-[#444746] hover:text-[#4285F4] hover:bg-blue-50 transition-colors" title="編集"><Edit2 size={14} /></Link>
                                        </div>
                                    </div>

                                    <h4 className="font-medium text-[#1f1f1f] text-base mb-3 flex items-start gap-2 leading-tight">
                                        <Building2 size={18} className={`${isOverdue ? 'text-red-400' : 'text-[#4285F4]'} shrink-0 mt-0.5`} />
                                        <span className="line-clamp-2">{audit.companies?.name_jp || '不明な企業'}</span>
                                    </h4>

                                    <div className="space-y-2 mb-4">
                                        <p className={`text-sm flex items-center gap-2 ${isOverdue ? 'text-red-600 font-medium' : 'text-[#444746]'}`}><Calendar size={14} className={isOverdue ? 'text-red-500' : 'text-gray-400'} /> 予定日: {audit.scheduled_date.replace(/-/g, '/')}</p>
                                        <p className="text-sm text-[#444746] flex items-center gap-2"><UserCircle2 size={14} className="text-gray-400" /> 担当: {audit.pic_name || '未定'}</p>
                                        {audit.notes && <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg line-clamp-2 mt-2">{audit.notes}</p>}
                                    </div>

                                    {/* 1-Click Actions */}
                                    <div className="pt-3 border-t border-gray-100">
                                        {audit.status === 'planned' && (
                                            <button onClick={() => handleStatusChange(audit.id, 'in_progress')} disabled={isPending} className="w-full flex items-center justify-center gap-2 bg-[#f0f4f9] hover:bg-[#e1e5ea] text-[#444746] text-xs font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50">
                                                訪問完了（報告書作成へ） <ArrowRight size={14} />
                                            </button>
                                        )}
                                        {audit.status === 'in_progress' && (
                                            <button onClick={() => handleStatusChange(audit.id, 'completed')} disabled={isPending} className="w-full flex items-center justify-center gap-2 bg-[#e6f4ea] hover:bg-[#ceead6] text-[#137333] text-xs font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50">
                                                提出完了にする <CheckCircle2 size={14} />
                                            </button>
                                        )}
                                        {audit.status === 'completed' && (
                                            <div className="w-full text-center text-xs text-[#34A853] font-medium py-1.5 flex items-center justify-center gap-1">
                                                <CheckCircle2 size={14} /> {audit.actual_date?.replace(/-/g, '/')} 完了
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        {audits.filter(a => a.status === col.id).length === 0 && (
                            <div className="text-center py-8 text-sm text-[#444746]/50 border-2 border-dashed border-[#e1e5ea]/50 rounded-[24px]">タスクはありません</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
