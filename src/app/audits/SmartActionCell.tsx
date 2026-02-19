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
        // 🟠 Ưu tiên 2: Chưa có lịch (Cam)
        return (
            <Link href={`/audits/new?company_id=${companyId}&month=${filterMonth}`} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 text-[12px] font-bold rounded-lg transition-colors border border-orange-200 shadow-sm w-full">
                <Plus size={14} strokeWidth={2} /> 予定作成
            </Link>
        )
    }

    if (status === 'planned' || status === 'in_progress') {
        // 🔴/🔵 Ưu tiên 1 hoặc 4: Có lịch nhưng chưa đi (Chuyển thẳng sang Hoàn thành)
        return (
            <button onClick={handleToggle} disabled={isPending} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#e6f4ea] text-[#4285F4] hover:text-[#137333] text-[12px] font-bold rounded-lg transition-all border border-[#e1e5ea] hover:border-[#a8dab5] shadow-sm w-full disabled:opacity-50">
                {isPending ? <Clock size={14} className="animate-spin text-gray-400" /> : <CheckCircle2 size={14} />}
                {isPending ? '処理中...' : '完了にする'}
            </button>
        )
    }

    // 🟢 Ưu tiên 5: Đã xong
    return (
        <div className="text-center w-full px-3 py-2 bg-gray-50 text-gray-500 text-[12px] font-bold rounded-lg border border-gray-200 flex items-center justify-center gap-1 shadow-inner opacity-80">
            <CheckCircle2 size={14} /> 今月完了済
        </div>
    )
}
