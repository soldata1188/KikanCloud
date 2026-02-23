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
 { id: 'nyukan', label: '出入国在留管理局 (入管)', icon: <Landmark size={14} />, color: 'bg-[#1f1f1f] text-white', inactive: 'bg-white text-[#878787] hover:bg-gray-50' },
 { id: 'kikou', label: '外国人技能実習機構 (OTIT)', icon: <Building2 size={14} />, color: 'bg-[#1f1f1f] text-white', inactive: 'bg-white text-[#878787] hover:bg-gray-50' },
 { id: 'kentei', label: '各種検定協会 (技能検定)', icon: <GraduationCap size={14} />, color: 'bg-[#1f1f1f] text-white', inactive: 'bg-white text-[#878787] hover:bg-gray-50' }
 ]

 const columns = [
 { id: 'preparing', title: '書類準備中 (未提出)', icon: <FileText size={14} className="text-[#878787]"/> },
 { id: 'submitted', title: '申請済・審査待ち', icon: <Send size={14} className="text-[#24b47e]"/> },
 { id: 'completed', title: '完了 (許可/認定/合格)', icon: <CheckCircle2 size={14} className="text-[#24b47e]"/> }
 ]

 const getAgencyTagStyle = (agency: string) => {
 if (agency === 'nyukan') return 'bg-white text-[#1f1f1f] border border-gray-350'
 if (agency === 'kikou') return 'bg-white text-[#1f1f1f] border border-gray-350'
 return 'bg-white text-[#1f1f1f] border border-gray-350'
 }

 return (
 <div className="flex flex-col gap-6">
 {/* 3つのナビゲーションタブ */}
 <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-350 pl-1">
 {tabs.map(t => (
 <button
 key={t.id}
 onClick={() => handleTabChange(t.id)}
 className={`px-5 py-2.5 rounded-t-lg text-sm font-medium flex items-center gap-2 transition-colors shrink-0 border border-b-0 ${activeTab === t.id ? 'border-[#1f1f1f] ' + t.color : 'border-gray-350 ' + t.inactive}`}
 >
 {t.icon} {t.label}
 <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${activeTab === t.id ? 'bg-white/20' : 'bg-[#ededed] text-[#878787]'}`}>
 {procedures.filter(p => p.agency === t.id && p.status !== 'completed').length}
 </span>
 </button>
 ))}
 </div>

 {/* KANBAN BOARD */}
 <div className="flex flex-row overflow-x-auto gap-6 pb-6 no-scrollbar h-full items-start">
 {columns.map(col => {
 const items = filteredProcs.filter(a => a.status === col.id || (col.id === 'preparing' && a.status === 'issue'));
 if (items.length === 0) return null;

 return (
 <div key={col.id} className="bg-white border border-gray-350 rounded-lg p-3 flex flex-col w-full md:w-[320px] shrink-0">
 <h3 className="text-[11px] font-medium text-[#878787] uppercase tracking-wider border-b border-gray-350 pb-3 mb-3 flex justify-between items-center">
 <span className="flex items-center gap-1.5">{col.icon} {col.title}</span>
 <span className="bg-white border border-gray-350 text-[#878787] text-[10px] font-mono px-2 py-0.5 rounded">{items.length}</span>
 </h3>
 <div className="flex flex-col">
 {items.map(proc => {
 const today = new Date().toISOString().split('T')[0];
 const isUrgent = proc.target_date && proc.target_date < new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0] && proc.status === 'preparing';
 const isOverdue = proc.target_date && proc.target_date < today && proc.status === 'preparing';
 const isIssue = proc.status === 'issue';

 return (
 <div key={proc.id} className="bg-white p-3.5 mb-3 rounded-md border border-gray-350 hover:border-[#878787] transition-all cursor-grab active:cursor-grabbing group flex flex-col gap-3">
 <div className="flex items-start justify-between gap-2">
 <h4 className="text-[13px] font-medium text-[#1f1f1f] leading-snug mb-2">{proc.procedure_name}</h4>
 <div className="flex flex-col gap-1 items-end shrink-0">
 {isIssue && <span className="flex items-center gap-1 text-[9px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200"><AlertCircle size={10} /> 不備</span>}
 {isOverdue && !isIssue && <span className="flex items-center gap-1 text-[9px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200"><Clock size={10} /> 超過</span>}
 {isUrgent && !isOverdue && !isIssue && <span className="flex items-center gap-1 text-[9px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200"><Clock size={10} /> 期限注意</span>}
 </div>
 </div>

 <div className="flex flex-col gap-1.5 text-[12px] text-[#1f1f1f]">
 <div className="flex items-center gap-2 font-medium">
 <Building2 size={12} className="text-[#878787] shrink-0"/>
 <span className="truncate">{proc.companies?.name_jp || '企業未定'}</span>
 </div>
 {proc.workers && (
 <div className="flex items-center gap-2 hover:text-[#24b47e] cursor-pointer transition-colors font-medium">
 <UserCircle2 size={12} className="text-[#878787] shrink-0"/>
 <span className="truncate">{proc.workers.full_name_romaji}</span>
 </div>
 )}
 </div>

 <div className="flex items-center gap-2 mt-1">
 <span className="px-1.5 py-0.5 border border-gray-350 text-[#878787] rounded-[4px] text-[10px] font-medium uppercase tracking-wider bg-white">
 {proc.agency === 'nyukan' ? '入管' : proc.agency === 'kikou' ? '機構' : '検定'}
 </span>
 <div className="text-[11px] text-[#878787] truncate">
 担当: {proc.pic_name || '未定'}
 </div>
 </div>

 <div className="flex items-center justify-between border-t border-gray-350 pt-3 mt-1">
 <div className="text-[11px]">
 {proc.status === 'preparing' || proc.status === 'issue' ? (
 <div className={isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-[#878787]'} title="目標">
 <span className="font-mono">{proc.target_date?.replace(/-/g, '/') || '未設定'}</span>
 </div>
 ) : proc.status === 'submitted' ? (
 <div className="text-[#24b47e]"title="申請日">
 <span className="font-mono">{proc.submitted_date?.replace(/-/g, '/')}</span>
 </div>
 ) : (
 <div className="text-[#878787]"title="完了日">
 <span className="font-mono">{proc.completed_date?.replace(/-/g, '/')}</span>
 </div>
 )}
 </div>
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 {(proc.status === 'preparing' || proc.status === 'issue') && (
 <button onClick={() => handleToggle(proc.id)} disabled={isPending} className="px-2 py-1 text-white bg-[#1f1f1f] hover:bg-[#878787] rounded text-[10px] transition-colors disabled:opacity-50 flex items-center gap-1"title="申請済みにする">
 {isPending ? <Clock size={10} className="animate-spin"/> : <Send size={10} />} 申請
 </button>
 )}
 {proc.status === 'submitted' && (
 <button onClick={() => handleToggle(proc.id)} disabled={isPending} className="px-2 py-1 text-white bg-[#24b47e] hover:bg-[#1e9a6a] rounded text-[10px] transition-colors disabled:opacity-50 flex items-center gap-1"title="許可済みにする">
 {isPending ? <Clock size={10} className="animate-spin"/> : <CheckCircle2 size={10} />} 許可
 </button>
 )}
 <Link href={`/procedures/${proc.id}/edit`} className="p-1 px-2 text-[#878787] hover:text-[#1f1f1f] hover:bg-[#ededed] transition-colors rounded text-[10px] flex items-center gap-1"title="編集">
 <Edit2 size={10} />
 </Link>
 </div>
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )
 })}
 {filteredProcs.length === 0 && (
 <div className="text-center py-12 text-[13px] text-[#878787] border border-dashed border-gray-350 bg-white rounded-lg w-full">タスクはありません</div>
 )}
 </div>
 </div>
 )
}
