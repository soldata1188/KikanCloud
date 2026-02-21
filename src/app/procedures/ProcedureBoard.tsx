'use client'
import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { quickToggleProcedureStatus, deleteProcedure } from './actions'
import { Clock, CheckCircle2, AlertCircle, Building2, UserCircle2, Edit2, FileText, Send, Landmark, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { ProcedureDeleteButton } from '@/components/SubmitButtons'

export function ProcedureBoard({ procedures }: { procedures: any[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || 'nyukan'

    const [activeTab, setActiveTab] = useState(defaultTab)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        setActiveTab(defaultTab)
    }, [defaultTab])

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId)
        router.replace(`/procedures?tab=${tabId}`)
    }

    const handleToggle = (id: string) => {
        startTransition(() => { quickToggleProcedureStatus(id) })
    }

    const filteredProcs = procedures.filter(p => p.agency === activeTab)

    const tabs = [
        { id: 'nyukan', label: '出入国在留管理局 (入管)', icon: <Landmark size={14} />, color: 'bg-[#1f1f1f] text-white', inactive: 'bg-white text-[#878787] hover:bg-[#fbfcfd]' },
        { id: 'kikou', label: '外国人技能実習機構 (OTIT)', icon: <Building2 size={14} />, color: 'bg-[#1f1f1f] text-white', inactive: 'bg-white text-[#878787] hover:bg-[#fbfcfd]' },
        { id: 'kentei', label: '各種検定協会 (技能検定)', icon: <GraduationCap size={14} />, color: 'bg-[#1f1f1f] text-white', inactive: 'bg-white text-[#878787] hover:bg-[#fbfcfd]' }
    ]

    const columns = [
        { id: 'preparing', title: '書類準備中 (未提出)', icon: <FileText size={14} className="text-[#878787]" /> },
        { id: 'submitted', title: '申請済・審査待ち', icon: <Send size={14} className="text-[#24b47e]" /> },
        { id: 'completed', title: '完了 (許可/認定/合格)', icon: <CheckCircle2 size={14} className="text-[#24b47e]" /> }
    ]

    const getAgencyTagStyle = (agency: string) => {
        if (agency === 'nyukan') return 'bg-[#fbfcfd] text-[#1f1f1f] border border-[#ededed]'
        if (agency === 'kikou') return 'bg-[#fbfcfd] text-[#1f1f1f] border border-[#ededed]'
        return 'bg-[#fbfcfd] text-[#1f1f1f] border border-[#ededed]'
    }

    return (
        <div className="flex flex-col gap-6">
            {/* 3 TABS ĐIỀU HƯỚNG */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#ededed] pl-1">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => handleTabChange(t.id)}
                        className={`px-5 py-2.5 rounded-t-lg text-sm font-medium flex items-center gap-2 transition-colors shrink-0 border border-b-0 ${activeTab === t.id ? 'border-[#1f1f1f] ' + t.color : 'border-transparent ' + t.inactive}`}
                    >
                        {t.icon} {t.label}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${activeTab === t.id ? 'bg-white/20' : 'bg-[#ededed] text-[#878787]'}`}>
                            {procedures.filter(p => p.agency === t.id && p.status !== 'completed').length}
                        </span>
                    </button>
                ))}
            </div>

            {/* LIST BOARD */}
            <div className="flex flex-col gap-6">
                {columns.map(col => {
                    const items = filteredProcs.filter(a => a.status === col.id || (col.id === 'preparing' && a.status === 'issue'));
                    if (items.length === 0) return null;

                    return (
                        <div key={col.id} className="bg-white border border-[#ededed] rounded-lg shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-[#ededed] bg-[#fbfcfd] flex items-center justify-between">
                                <h3 className="font-medium text-[13px] text-[#1f1f1f] flex items-center gap-2 uppercase tracking-wider">{col.icon} {col.title}</h3>
                                <span className="bg-white border border-[#ededed] text-[#878787] text-[10px] font-mono px-2 py-0.5 rounded">{items.length}</span>
                            </div>
                            <div className="flex flex-col divide-y divide-[#ededed]">
                                {items.map(proc => {
                                    const today = new Date().toISOString().split('T')[0];
                                    const isUrgent = proc.target_date && proc.target_date < new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0] && proc.status === 'preparing';
                                    const isOverdue = proc.target_date && proc.target_date < today && proc.status === 'preparing';
                                    const isIssue = proc.status === 'issue';

                                    return (
                                        <div key={proc.id} className="p-4 hover:bg-[#fbfcfd] transition-colors flex flex-col md:flex-row md:items-center gap-4 group">
                                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${getAgencyTagStyle(proc.agency)}`}>{proc.procedure_name}</span>
                                                    {isIssue && <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200"><AlertCircle size={10} /> 不備・要対応</span>}
                                                    {isOverdue && !isIssue && <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200"><Clock size={10} /> 期限超過</span>}
                                                    {isUrgent && !isOverdue && !isIssue && <span className="flex items-center gap-1 text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200"><Clock size={10} /> 期限注意</span>}
                                                </div>

                                                <div className="flex items-center gap-4 text-[12px] text-[#1f1f1f]">
                                                    <div className="flex items-center gap-1.5 font-medium">
                                                        <Building2 size={12} className="text-[#878787] shrink-0" />
                                                        <span className="truncate">{proc.companies?.name_jp || '企業未定'}</span>
                                                    </div>
                                                    {proc.workers && (
                                                        <div className="flex items-center gap-1.5 hover:text-[#24b47e] cursor-pointer transition-colors font-medium">
                                                            <UserCircle2 size={12} className="text-[#878787] shrink-0" />
                                                            <span className="truncate">{proc.workers.full_name_romaji}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-[11px] text-[#878787] flex items-center gap-4 mt-1">
                                                    <span>担当: {proc.pic_name || '未定'}</span>
                                                    {proc.notes && <span className="truncate max-w-[300px]" title={proc.notes}>メモ: {proc.notes}</span>}
                                                </div>
                                            </div>

                                            {/* Dates */}
                                            <div className="text-[12px] md:text-right shrink-0 w-32">
                                                {proc.status === 'preparing' || proc.status === 'issue' ? (
                                                    <div className={isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-[#878787]'}>
                                                        <p className="text-[10px] uppercase tracking-wider mb-0.5">目標</p>
                                                        <span className="font-mono">{proc.target_date?.replace(/-/g, '/') || '未設定'}</span>
                                                    </div>
                                                ) : proc.status === 'submitted' ? (
                                                    <div className="text-[#24b47e]">
                                                        <p className="text-[10px] uppercase tracking-wider mb-0.5 opacity-70">申請日</p>
                                                        <span className="font-mono">{proc.submitted_date?.replace(/-/g, '/')}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-[#878787]">
                                                        <p className="text-[10px] uppercase tracking-wider mb-0.5">完了日</p>
                                                        <span className="font-mono">{proc.completed_date?.replace(/-/g, '/')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-end gap-2 md:w-[150px] shrink-0">
                                                {(proc.status === 'preparing' || proc.status === 'issue') && (
                                                    <button onClick={() => handleToggle(proc.id)} disabled={isPending} className="px-3 py-1.5 text-[11px] font-medium text-white bg-[#1f1f1f] hover:bg-[#878787] rounded-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 w-full md:w-[100px]">
                                                        {isPending ? <Clock size={12} className="animate-spin" /> : <Send size={12} />} 申請
                                                    </button>
                                                )}
                                                {proc.status === 'submitted' && (
                                                    <button onClick={() => handleToggle(proc.id)} disabled={isPending} className="px-3 py-1.5 text-[11px] font-medium text-white bg-[#24b47e] hover:bg-[#1e9a6a] rounded-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 w-full md:w-[100px]">
                                                        {isPending ? <Clock size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} 許可
                                                    </button>
                                                )}
                                                {proc.status === 'completed' && (
                                                    <div className="px-3 py-1.5 text-[11px] font-medium text-[#878787] bg-[#fbfcfd] border border-[#ededed] rounded-md flex items-center justify-center gap-1.5 w-full md:w-[100px]">
                                                        <CheckCircle2 size={12} /> 完了
                                                    </div>
                                                )}

                                                <Link href={`/procedures/${proc.id}/edit`} className="p-1.5 flex items-center justify-center rounded-md text-[#878787] hover:text-[#1f1f1f] hover:bg-[#ededed] transition-colors shrink-0" title="編集">
                                                    <Edit2 size={14} />
                                                </Link>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
                {filteredProcs.length === 0 && (
                    <div className="text-center py-12 text-[13px] text-[#878787] border border-dashed border-[#ededed] bg-white rounded-lg">タスクはありません</div>
                )}
            </div>
        </div>
    )
}
