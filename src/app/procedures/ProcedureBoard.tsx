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
        { id: 'nyukan', label: '出入国在留管理局 (入管)', icon: <Landmark size={18} />, color: 'bg-[#4285F4] text-white', inactive: 'bg-gray-50 text-[#444746] hover:bg-gray-100' },
        { id: 'kikou', label: '外国人技能実習機構 (OTIT)', icon: <Building2 size={18} />, color: 'bg-[#34A853] text-white', inactive: 'bg-gray-50 text-[#444746] hover:bg-gray-100' },
        { id: 'kentei', label: '各種検定協会 (技能検定)', icon: <GraduationCap size={18} />, color: 'bg-[#FABB05] text-[#1f1f1f]', inactive: 'bg-gray-50 text-[#444746] hover:bg-gray-100' }
    ]

    const columns = [
        { id: 'preparing', title: '書類準備中 (未提出)', icon: <FileText size={18} className="text-gray-500" />, bg: 'bg-[#f0f4f9]', border: 'border-t-gray-400' },
        { id: 'submitted', title: '申請済・審査待ち', icon: <Send size={18} className="text-[#4285F4]" />, bg: 'bg-[#e8f0fe]', border: 'border-t-[#4285F4]' },
        { id: 'completed', title: '完了 (許可/認定/合格)', icon: <CheckCircle2 size={18} className="text-[#34A853]" />, bg: 'bg-[#e6f4ea]', border: 'border-t-[#34A853]' }
    ]

    const getAgencyTagStyle = (agency: string) => {
        if (agency === 'nyukan') return 'bg-blue-50 text-blue-700 border-blue-200'
        if (agency === 'kikou') return 'bg-green-50 text-green-700 border-green-200'
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    }

    return (
        <div className="flex flex-col gap-6">
            {/* 3 TABS ĐIỀU HƯỚNG */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#e1e5ea] pl-1">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => handleTabChange(t.id)}
                        className={`px-6 py-3 rounded-t-2xl font-bold flex items-center gap-2 transition-colors shrink-0 ${activeTab === t.id ? t.color : t.inactive}`}
                    >
                        {t.icon} {t.label}
                        <span className={`text-[11px] px-2 py-0.5 rounded-[32px] ${activeTab === t.id ? 'bg-black/10' : 'bg-gray-200'}`}>
                            {procedures.filter(p => p.agency === t.id && p.status !== 'completed').length}件
                        </span>
                    </button>
                ))}
            </div>

            {/* LIST BOARD */}
            <div className="flex flex-col gap-8">
                {columns.map(col => {
                    const items = filteredProcs.filter(a => a.status === col.id || (col.id === 'preparing' && a.status === 'issue'));
                    if (items.length === 0) return null;

                    return (
                        <div key={col.id} className="bg-white rounded-[24px] shadow-sm border border-[#e1e5ea] overflow-hidden">
                            <div className="px-5 py-3 border-b border-[#e1e5ea] bg-gray-50/50 flex items-center justify-between">
                                <h3 className="font-bold text-[#1f1f1f] flex items-center gap-2">{col.icon} {col.title}</h3>
                                <span className="bg-white text-[#444746] text-xs font-bold px-2.5 py-1 rounded-[32px] border border-gray-200 shadow-sm">{items.length}件</span>
                            </div>
                            <div className="flex flex-col">
                                {items.map(proc => {
                                    const today = new Date().toISOString().split('T')[0];
                                    const isUrgent = proc.target_date && proc.target_date < new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0] && proc.status === 'preparing';
                                    const isOverdue = proc.target_date && proc.target_date < today && proc.status === 'preparing';
                                    const isIssue = proc.status === 'issue';

                                    return (
                                        <div key={proc.id} className="py-4 px-2 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row md:items-center gap-4 group relative border-b border-[#e1e5ea]/80 last:border-0 mx-4">
                                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[11px] px-2.5 py-0.5 rounded-[32px] font-bold border ${getAgencyTagStyle(proc.agency)}`}>{proc.procedure_name}</span>
                                                    {isIssue && <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-[32px] border border-red-200"><AlertCircle size={10} /> 不備・要対応</span>}
                                                    {isOverdue && !isIssue && <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-[32px] border border-red-200"><Clock size={10} /> 期限超過</span>}
                                                    {isUrgent && !isOverdue && !isIssue && <span className="flex items-center gap-1 text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-[32px] border border-orange-200"><Clock size={10} /> 期限注意</span>}
                                                </div>

                                                <div className="flex items-baseline gap-2">
                                                    {proc.workers ? (
                                                        <Link href={`/workers/${proc.workers.id}/edit`} className="font-bold text-[#1f1f1f] text-[16px] hover:text-[#4285F4] transition-colors truncate flex items-center gap-1.5">
                                                            <UserCircle2 size={16} className="text-[#4285F4]" /> {proc.workers.full_name_romaji}
                                                        </Link>
                                                    ) : (
                                                        <span className="font-bold text-[#1f1f1f] text-[16px] truncate flex items-center gap-1.5">
                                                            <Building2 size={16} className="text-[#34A853]" /> {proc.companies?.name_jp || '企業未定'}
                                                        </span>
                                                    )}
                                                    {proc.workers && <span className="text-sm text-gray-500 truncate">({proc.companies?.name_jp || '未配属'})</span>}
                                                </div>

                                                <div className="text-xs text-gray-500 flex items-center gap-4">
                                                    <span>担当: {proc.pic_name || '未定'}</span>
                                                    {proc.notes && <span className="truncate max-w-[300px]" title={proc.notes}>メモ: {proc.notes}</span>}
                                                </div>
                                            </div>

                                            {/* Dates */}
                                            <div className="text-sm md:text-right shrink-0 w-32">
                                                {proc.status === 'preparing' || proc.status === 'issue' ? (
                                                    <div className={isOverdue ? 'text-red-600 font-bold' : isUrgent ? 'text-orange-600 font-bold' : 'text-[#444746]'}>
                                                        <p className="text-[10px] text-gray-400 font-semibold mb-0.5">提出目標</p>
                                                        {proc.target_date?.replace(/-/g, '/') || '未設定'}
                                                    </div>
                                                ) : proc.status === 'submitted' ? (
                                                    <div className="text-[#4285F4] font-bold">
                                                        <p className="text-[10px] text-[#4285F4]/70 font-semibold mb-0.5">申請日</p>
                                                        {proc.submitted_date?.replace(/-/g, '/')}
                                                    </div>
                                                ) : (
                                                    <div className="text-[#34A853] font-bold">
                                                        <p className="text-[10px] text-[#34A853]/70 font-semibold mb-0.5">完了日</p>
                                                        {proc.completed_date?.replace(/-/g, '/')}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-end gap-2 md:w-[220px] shrink-0">
                                                {(proc.status === 'preparing' || proc.status === 'issue') && (
                                                    <button onClick={() => handleToggle(proc.id)} disabled={isPending} className="px-5 py-2.5 text-[13px] font-bold text-white bg-[#4285F4] hover:bg-[#3367d6] rounded-[32px] transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 w-full md:w-[140px]">
                                                        {isPending ? <Clock size={16} className="animate-spin" /> : <Send size={16} />} 申請にする
                                                    </button>
                                                )}
                                                {proc.status === 'submitted' && (
                                                    <button onClick={() => handleToggle(proc.id)} disabled={isPending} className="px-5 py-2.5 text-[13px] font-bold text-[#137333] bg-[#e6f4ea] hover:bg-[#ceead6] border border-green-200 rounded-[32px] transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 w-full md:w-[140px]">
                                                        {isPending ? <Clock size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 許可・認定
                                                    </button>
                                                )}
                                                {proc.status === 'completed' && (
                                                    <div className="px-5 py-2.5 text-[13px] font-bold text-gray-500 bg-gray-50 border border-gray-200 rounded-[32px] flex items-center justify-center gap-1.5 w-full md:w-[140px]">
                                                        <CheckCircle2 size={16} className="text-gray-400" /> 完了済
                                                    </div>
                                                )}

                                                <Link href={`/procedures/${proc.id}/edit`} className="w-10 h-10 flex items-center justify-center rounded-[32px] text-[#444746] hover:text-[#4285F4] hover:bg-blue-50 transition-colors shrink-0" title="編集">
                                                    <Edit2 size={18} />
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
                    <div className="text-center py-12 text-sm text-[#444746]/50 border-2 border-dashed border-[#e1e5ea]/70 rounded-[24px]">タスクはありません</div>
                )}
            </div>
        </div>
    )
}
