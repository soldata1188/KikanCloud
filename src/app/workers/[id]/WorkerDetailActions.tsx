'use client'

import { Printer, Edit2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function WorkerDetailActions({ id }: { id: string }) {
    return (
        <div className="flex items-center gap-3 print:hidden">
            <Link href="/workers" className="p-2.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors shadow-sm" title="戻る">
                <ArrowLeft size={18} strokeWidth={2} />
            </Link>
            <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-white text-[#444746] hover:bg-gray-50 rounded-full text-sm font-semibold transition-colors shadow-sm border border-[#e1e5ea] flex items-center gap-2"
            >
                <Printer size={16} strokeWidth={2.5} /> 詳細を印刷
            </button>
            <Link
                href={`/workers/${id}/edit`}
                className="px-5 py-2.5 bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-full text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
            >
                <Edit2 size={16} strokeWidth={2.5} /> 編集
            </Link>
        </div>
    )
}
