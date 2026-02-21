'use client'

import { Printer, Edit2, ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

export function WorkerDetailActions({ id }: { id: string }) {
    return (
        <div className="flex items-center gap-3 print:hidden">
            <Link href="/workers" className="p-2.5 rounded-md bg-white hover:bg-[#fbfcfd] text-[#878787] hover:text-gray-700 transition-colors" title="戻る">
                <ArrowLeft size={18} strokeWidth={2} />
            </Link>
            <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-white text-[#1f1f1f] hover:bg-[#fbfcfd] rounded-md text-sm font-semibold transition-colors flex items-center gap-2"
            >
                <Printer size={16} strokeWidth={2.5} /> 詳細を印刷
            </button>
            <Link
                href={`/workers/${id}/documents/employment-notice`}
                target="_blank"
                className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 border border-indigo-200"
            >
                <FileText size={16} strokeWidth={2.5} /> 雇入通知書PDF
            </Link>
            <Link
                href={`/workers/${id}/edit`}
                className="px-5 py-2.5 bg-[#24b47e] hover:bg-[#1e9a6a] text-white rounded-md text-sm font-semibold transition-colors flex items-center gap-2"
            >
                <Edit2 size={16} strokeWidth={2.5} /> 編集
            </Link>
        </div>
    )
}
