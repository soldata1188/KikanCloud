'use client'
import { useTransition } from 'react'
import { quickToggleAuditStatus } from './actions'
import Link from 'next/link'
import { Plus, CheckCircle2, Clock } from 'lucide-react'

export function SmartActionCell({ auditId, status, companyId, filterMonth }: { auditId: string | null, status: string | null, companyId: string, filterMonth: string }) {
    const [isPending, startTransition] = useTransition()

    const handleToggle = () => {
        if (!auditId) return;
        if (!confirm('このスケジュールを「完了」にしますか？\n（本日の日付が実施日として自動記録されます）')) return;
        startTransition(() => { quickToggleAuditStatus(auditId) })
    }

    if (!auditId) {
        return (
            <Link href={`/audits/new?company_id=${companyId}&month=${filterMonth}`} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#ededed] text-[#878787] hover:text-[#1f1f1f] text-[11px] font-medium rounded-lg transition-colors border border-gray-300 w-full">
                <Plus size={12} strokeWidth={2} /> 予定作成
            </Link>
        )
    }

    if (status === 'planned' || status === 'in_progress') {
        // 🔴/🔵 優先度1または4: スケジュール済・未実施 (直接完了へ変更)
        return (
            <button onClick={handleToggle} disabled={isPending} className="flex justify-center items-center gap-1.5 w-full bg-[#24b47e] hover:bg-[#1e9a6a] text-white rounded-md text-xs px-3 py-1.5 transition-colors font-medium disabled:opacity-50">
                {isPending ? <Clock size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                {isPending ? '処理中...' : '完了にする'}
            </button>
        )
    }

    return (
        <div className="text-center w-full px-3 py-1.5 bg-white text-[#878787] text-[11px] font-medium rounded-lg border border-gray-300 flex items-center justify-center gap-1 opacity-80">
            <CheckCircle2 size={12} /> 今月完了済
        </div>
    )
}
