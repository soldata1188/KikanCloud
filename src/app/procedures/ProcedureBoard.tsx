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
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${activeTab === t.id ? 'bg-black/10' : 'bg-gray-200'}`}>
                            {procedures.filter(p => p.agency === t.id && p.status !== 'completed').length}件
                        </span>
                    </button>
                ))}
            </div>

            {/* KANBAN BOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {columns.map(col => (
                    <div key={col.id} className={`${col.bg} rounded-[32px] p-4 min-h-[500px] border-t-4 ${col.border} shadow-sm border-x border-b border-[#e1e5ea] flex flex-col`}>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-medium text-[#1f1f1f] flex items-center gap-2">{col.icon} {col.title}</h3>
                            <span className="bg-white text-[#444746] text-xs font-bold px-2 py-1 rounded-full border border-gray-200">
                                {filteredProcs.filter(a => a.status === col.id || (col.id === 'preparing' && a.status === 'issue')).length}
                            </span>
                        </div>

                        <div className="space-y-4 flex-1">
                            {filteredProcs.filter(a => a.status === col.id || (col.id === 'preparing' && a.status === 'issue')).map(proc => {
                                const today = new Date().toISOString().split('T')[0];
                                const isUrgent = proc.target_date && proc.target_date < new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0] && proc.status === 'preparing';
                                const isOverdue = proc.target_date && proc.target_date < today && proc.status === 'preparing';
                                const isIssue = proc.status === 'issue';

                                return (
                                    <div key={proc.id} className={`bg-white p-5 rounded-[24px] shadow-sm border ${isIssue ? 'border-red-400 bg-red-50/30' : isOverdue ? 'border-red-400 shadow-[0_0_12px_rgba(234,67,53,0.15)]' : isUrgent ? 'border-orange-300' : 'border-[#e1e5ea]'} hover:shadow-md transition-all group relative`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${getAgencyTagStyle(proc.agency)}`}>{proc.procedure_name}</span>
                                            <div className="flex items-center gap-1">
                                                {isIssue && <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded-full animate-pulse"><AlertCircle size={12} /> 不備・要対応</span>}
                                                {isOverdue && !isIssue && <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded-full animate-pulse"><Clock size={12} /> 期限超過</span>}
                                                {isUrgent && !isOverdue && !isIssue && <span className="flex items-center gap-1 text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-full"><Clock size={12} /> 期限注意</span>}
                                                <Link href={`/procedures/${proc.id}/edit`} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-[#444746] hover:text-[#4285F4] hover:bg-blue-50 transition-colors" title="編集"><Edit2 size={14} /></Link>
                                            </div>
                                        </div>

                                        {proc.workers ? (
                                            <h4 className="font-bold text-[#1f1f1f] text-[15px] mb-1 leading-tight hover:text-[#4285F4] transition-colors"><Link href={`/workers/${proc.workers.id}/edit`} className="flex items-start gap-2"><UserCircle2 size={16} className="text-[#4285F4] shrink-0 mt-0.5" />{proc.workers.full_name_romaji}</Link></h4>
                                        ) : (
                                            <h4 className="font-bold text-[#1f1f1f] text-[15px] mb-1 leading-tight"><span className="flex items-center gap-2"><Building2 size={16} className="text-[#34A853] shrink-0" />{proc.companies?.name_jp || '企業未定'}</span></h4>
                                        )}
                                        {proc.workers && <p className="text-[11px] text-gray-500 mb-3 truncate border-b border-gray-100 pb-2 ml-6">{proc.companies?.name_jp || '未配属'}</p>}

                                        <div className="space-y-1.5 mb-4 text-xs text-[#444746]">
                                            {proc.status === 'preparing' || proc.status === 'issue' ? (
                                                <p className={isOverdue ? 'text-red-600 font-bold' : isUrgent ? 'text-orange-600 font-bold' : ''}>提出目標: {proc.target_date?.replace(/-/g, '/') || '未設定'}</p>
                                            ) : proc.status === 'submitted' ? (
                                                <p className="text-[#4285F4] font-medium">申請日: {proc.submitted_date?.replace(/-/g, '/')}</p>
                                            ) : (
                                                <p className="text-[#34A853] font-medium">完了日: {proc.completed_date?.replace(/-/g, '/')}</p>
                                            )}
                                            <p className="text-gray-400">担当: {proc.pic_name || '未定'}</p>
                                        </div>

                                        {/* 1-Click Actions */}
                                        <div className="pt-3 border-t border-gray-100">
                                            {(proc.status === 'preparing' || proc.status === 'issue') && (
                                                <button onClick={() => handleToggle(proc.id)} disabled={isPending} className="w-full flex items-center justify-center gap-2 bg-[#f0f4f9] hover:bg-[#e1e5ea] text-[#4285F4] font-bold text-xs py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm border border-transparent hover:border-blue-200">
                                                    {isPending ? <Clock size={14} className="animate-spin" /> : <Send size={14} />} 申請完了にする (本日付)
                                                </button>
                                            )}
                                            {proc.status === 'submitted' && (
                                                <button onClick={() => handleToggle(proc.id)} disabled={isPending} className="w-full flex items-center justify-center gap-2 bg-[#e6f4ea] hover:bg-[#ceead6] text-[#137333] font-bold text-xs py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm border border-transparent hover:border-green-200">
                                                    {isPending ? <Clock size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} 許可・認定が下りた
                                                </button>
                                            )}
                                            {proc.status === 'completed' && (
                                                <div className="w-full text-center text-xs text-gray-400 font-medium py-1.5 flex items-center justify-center gap-1">
                                                    <CheckCircle2 size={14} /> 手続完了
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            {filteredProcs.filter(a => a.status === col.id || (col.id === 'preparing' && a.status === 'issue')).length === 0 && (
                                <div className="text-center py-8 text-sm text-[#444746]/50 border-2 border-dashed border-[#e1e5ea]/50 rounded-[24px]">タスクはありません</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
