'use client'
import { useFormStatus } from 'react-dom'
import { Trash2, Sparkles } from 'lucide-react'

export function DeleteButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className={`p-2 rounded-[32px] transition-colors ${pending ? 'text-gray-300' : 'text-[#444746] hover:text-red-600 hover:bg-red-50'}`} title="削除" onClick={(e) => { if (!confirm('この外国人材のデータを削除してもよろしいですか？\n※システム上は非表示となりますが、監査データとして保持されます。')) e.preventDefault() }}>
            <Trash2 size={20} strokeWidth={1.5} />
        </button>
    )
}

export function SaveButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-[#e1e5ea] text-[#1f1f1f] hover:bg-gray-50 font-medium rounded-[32px] transition-colors shadow-sm disabled:opacity-50">
            <Sparkles size={18} className="text-[#4285F4]" /> {pending ? '保存中...' : '登録する'}
        </button>
    )
}

export function UpdateButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-[#e1e5ea] text-[#1f1f1f] hover:bg-gray-50 font-medium rounded-[32px] transition-colors shadow-sm disabled:opacity-50">
            <Sparkles size={18} className="text-[#4285F4]" /> {pending ? '更新中...' : '更新する'}
        </button>
    )
}

export function CompanyDeleteButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className={`p-2 rounded-[32px] transition-colors ${pending ? 'text-gray-300' : 'text-[#444746] hover:text-red-600 hover:bg-red-50'}`} title="削除" onClick={(e) => { if (!confirm('この受入企業を削除してもよろしいですか？\n※所属している外国人材のデータは削除されません。')) e.preventDefault() }}>
            <Trash2 size={20} strokeWidth={1.5} />
        </button>
    )
}

export function AuditDeleteButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className={`p-2 rounded-[32px] transition-colors ${pending ? 'text-gray-300' : 'text-[#444746] hover:text-red-600 hover:bg-red-50'}`} title="削除" onClick={(e) => { if (!confirm('このスケジュールを削除してもよろしいですか？')) e.preventDefault() }}>
            <Trash2 size={20} strokeWidth={1.5} />
        </button>
    )
}

export function AuditEditDeleteButton({ deleteAction }: { deleteAction: any }) {
    const { pending } = useFormStatus()
    return (
        <button formAction={deleteAction} disabled={pending} className="px-6 py-3 text-red-600 bg-red-50 font-medium hover:bg-red-100 rounded-[32px] transition-colors shadow-sm disabled:opacity-50" onClick={(e) => { if (!confirm('このスケジュールを削除してもよろしいですか？')) e.preventDefault() }}>削除</button>
    )
}

export function ProcedureDeleteButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className={`p-2 rounded-[32px] transition-colors ${pending ? 'text-gray-300' : 'text-[#444746] hover:text-red-600 hover:bg-red-50'}`} title="削除" onClick={(e) => { if (!confirm('この手続記録を削除してもよろしいですか？')) e.preventDefault() }}>
            <Trash2 size={20} strokeWidth={1.5} />
        </button>
    )
}
