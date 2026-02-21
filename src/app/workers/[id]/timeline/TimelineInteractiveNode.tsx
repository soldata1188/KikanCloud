'use client'
import { useState, useTransition, useRef, useEffect } from 'react'
import { ChevronDown, Clock, CheckCircle2, AlertCircle, Loader2, PlayCircle, Building2, Landmark, FileText, X } from 'lucide-react'
import { upsertTimelineProcedure } from './actions'

export function TimelineInteractiveNode({ event, workerId, companyId, existingProcedure, agency }: { event: any, workerId: string, companyId: string | null, existingProcedure?: any, agency: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const dropdownRef = useRef<HTMLDivElement>(null)

    const currentStatus = existingProcedure?.status || 'none'
    const isPast = event.status === 'past'
    const isCurrent = event.status === 'current'

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false) }
        document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleUpdate = (newStatus: string) => {
        setIsOpen(false); if (newStatus === currentStatus) return
        startTransition(async () => { await upsertTimelineProcedure(workerId, companyId, event.title, agency, newStatus, event.expectedDate) })
    }

    const getStatusUI = () => {
        switch (currentStatus) {
            case 'completed': return { label: '許可・完了', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200', icon: <CheckCircle2 size={14} /> }
            case 'submitted': return { label: '申請・審査中', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200', icon: <PlayCircle size={14} /> }
            case 'issue': return { label: '不備・要対応', color: 'bg-red-100 text-red-700 border-red-200 animate-pulse hover:bg-red-200', icon: <AlertCircle size={14} /> }
            case 'preparing': return { label: '書類準備中', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200', icon: <Clock size={14} /> }
            default: return { label: '未対応 (Chưa処理)', color: 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200', icon: null }
        }
    }

    const getAgencyInfo = () => {
        if (agency === 'nyukan') return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1"><Landmark size={10} /> 入管</span>
        if (agency === 'kikou') return <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded flex items-center gap-1"><Building2 size={10} /> 機構</span>
        if (agency === 'kentei') return <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1"><FileText size={10} /> 検定</span>
        return null
    }

    const ui = getStatusUI()

    return (
        <div className="relative flex items-center gap-4 sm:gap-6 group" ref={dropdownRef}>
            <div className="w-16 sm:w-20 text-right shrink-0">
                <span className={`text-sm font-bold font-mono tracking-tight ${isCurrent ? 'text-[#4285F4]' : isPast ? 'text-gray-400' : 'text-gray-400'}`}>{event.expectedDate}</span>
            </div>

            <div className="relative z-10 flex flex-col items-center shrink-0">
                <div className={`w-8 h-8 rounded-full border-4 border-[#f0f4f9] shadow-sm flex items-center justify-center transition-all duration-300 
          ${currentStatus === 'completed' || isPast ? 'bg-green-500' : currentStatus === 'issue' ? 'bg-red-500' : isCurrent ? 'bg-[#4285F4] scale-125' : currentStatus !== 'none' ? 'bg-blue-300' : 'bg-gray-200'}`}>
                    {(currentStatus === 'completed' || isPast) && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                    {currentStatus === 'issue' && <AlertCircle size={12} className="text-white" strokeWidth={3} />}
                    {isCurrent && currentStatus !== 'completed' && currentStatus !== 'issue' && <span className="absolute w-full h-full bg-[#4285F4] rounded-full animate-ping opacity-60"></span>}
                </div>
            </div>

            <div className={`flex-1 py-3 px-4 sm:px-5 rounded-2xl transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border
        ${isCurrent ? 'bg-blue-50/50 border-blue-200 shadow-sm ml-1 sm:ml-2' : currentStatus !== 'none' ? 'bg-white border-gray-200 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100 hover:bg-white'}`}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-base font-bold ${currentStatus === 'completed' ? 'text-gray-500 line-through' : currentStatus === 'issue' ? 'text-red-600' : isCurrent ? 'text-[#4285F4]' : 'text-[#1f1f1f]'}`}>{event.title}</h4>
                        {isCurrent && currentStatus === 'none' && <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full shadow-sm animate-pulse"><Clock size={12} /> NEXT ACTION</span>}
                    </div>
                    <div className="text-[10px] font-bold tracking-wider">{getAgencyInfo()}</div>
                </div>

                {agency !== 'other' && (
                    <div className="relative shrink-0">
                        <button onClick={() => setIsOpen(!isOpen)} disabled={isPending} className={`flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors disabled:opacity-50 min-w-[130px] ${ui.color}`}>
                            {isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : (<><span className="flex items-center gap-1.5 truncate">{ui.icon} {ui.label}</span> <ChevronDown size={14} className="opacity-50" /></>)}
                        </button>
                        {isOpen && (
                            <div className="absolute top-full mt-1 right-0 w-[180px] bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <button onClick={() => handleUpdate('preparing')} className="w-full text-left px-4 py-2 text-xs font-bold text-yellow-700 hover:bg-yellow-50 flex items-center gap-2"><Clock size={14} /> 書類準備中 (Preparing)</button>
                                <button onClick={() => handleUpdate('submitted')} className="w-full text-left px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center gap-2"><PlayCircle size={14} /> 申請・審査中 (Submitted)</button>
                                <button onClick={() => handleUpdate('issue')} className="w-full text-left px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 flex items-center gap-2"><AlertCircle size={14} /> 不備・要対応 (Issue)</button>
                                <button onClick={() => handleUpdate('completed')} className="w-full text-left px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-50 flex items-center gap-2 border-t border-gray-50"><CheckCircle2 size={14} /> 許可・完了 (Completed)</button>
                                {currentStatus !== 'none' && <button onClick={() => handleUpdate('none')} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 border-t border-gray-50 flex items-center gap-2"><X size={14} /> リセット (Reset)</button>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
