'use client'
import { useTransition } from 'react'
import { quickToggleAuditStatus } from './actions'
import Link from 'next/link'
import { Plus, CheckCircle2, Clock, Pencil } from 'lucide-react'

interface Props {
    auditId: string | null
    status: string | null
    companyId: string
    filterMonth: string
    onAddClick?: (companyId: string) => void
}

export function SmartActionCell({ auditId, status, companyId, filterMonth, onAddClick }: Props) {
    const [isPending, startTransition] = useTransition()

    const handleToggle = () => {
        if (!auditId) return
        if (!confirm('このスケジュールを「完了」にしますか？\n（本日の日付が実施日として自動記録されます）')) return
        startTransition(() => { quickToggleAuditStatus(auditId) })
    }

    // No audit yet — compact + button
    if (!auditId) {
        return onAddClick ? (
            <button
                onClick={() => onAddClick(companyId)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:border-[#24b47e] hover:bg-emerald-50 text-slate-400 hover:text-[#24b47e] transition-all"
                title="スケジュール追加"
            >
                <Plus size={14} strokeWidth={2.5} />
            </button>
        ) : (
            <Link
                href={`/audits/new?company_id=${companyId}&month=${filterMonth}`}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:border-[#24b47e] hover:bg-emerald-50 text-slate-400 hover:text-[#24b47e] transition-all"
                title="スケジュール追加"
            >
                <Plus size={14} strokeWidth={2.5} />
            </Link>
        )
    }

    // Planned / in progress — complete button + edit link
    if (status === 'planned' || status === 'in_progress') {
        return (
            <div className="flex items-center gap-1.5 justify-center">
                <button
                    onClick={handleToggle}
                    disabled={isPending}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-50 shadow-sm"
                    title="完了にする"
                >
                    {isPending ? <Clock size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                </button>
                <Link
                    href={`/audits/${auditId}/edit`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 transition-all"
                    title="編集"
                >
                    <Pencil size={13} />
                </Link>
            </div>
        )
    }

    // Completed
    return (
        <div className="flex items-center gap-1.5 justify-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-500" title="今月完了済">
                <CheckCircle2 size={13} />
            </div>
            <Link
                href={`/audits/${auditId}/edit`}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 transition-all"
                title="編集"
            >
                <Pencil size={13} />
            </Link>
        </div>
    )
}
