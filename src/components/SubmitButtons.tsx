'use client'
import { useFormStatus } from 'react-dom'
import { Trash2, Sparkles } from 'lucide-react'

export function DeleteButton() {
 const { pending } = useFormStatus()
 return (
 <button type="submit"disabled={pending} className="p-1.5 rounded-md text-[#878787] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"title="削除"onClick={(e) => { if (!confirm('このデータを削除してもよろしいですか？')) e.preventDefault() }}>
 <Trash2 size={16} strokeWidth={1.5} />
 </button>
 )
}

export function SaveButton() {
 const { pending } = useFormStatus()
 return (
 <button type="submit"disabled={pending} className="inline-flex items-center gap-2 px-6 py-2 bg-[#24b47e] text-white hover:bg-[#1e9a6a] text-sm font-medium rounded-md transition-colors disabled:opacity-50">
 <Sparkles size={16} /> {pending ? '保存中...' : '登録する'}
 </button>
 )
}

export function UpdateButton() {
 const { pending } = useFormStatus()
 return (
 <button type="submit"disabled={pending} className="inline-flex items-center gap-2 px-6 py-2 bg-[#24b47e] text-white hover:bg-[#1e9a6a] text-sm font-medium rounded-md transition-colors disabled:opacity-50">
 <Sparkles size={16} /> {pending ? '更新中...' : '更新する'}
 </button>
 )
}

export function CompanyDeleteButton() {
 const { pending } = useFormStatus()
 return (
 <button type="submit"disabled={pending} className="p-1.5 rounded-md text-[#878787] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"title="削除"onClick={(e) => { if (!confirm('この受入企業を削除してもよろしいですか？\n※所属している外国人材のデータは削除されません。')) e.preventDefault() }}>
 <Trash2 size={16} strokeWidth={1.5} />
 </button>
 )
}

export function AuditDeleteButton() {
 const { pending } = useFormStatus()
 return (
 <button type="submit"disabled={pending} className="p-1.5 rounded-md text-[#878787] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"title="削除"onClick={(e) => { if (!confirm('このスケジュールを削除してもよろしいですか？')) e.preventDefault() }}>
 <Trash2 size={16} strokeWidth={1.5} />
 </button>
 )
}

export function AuditEditDeleteButton({ deleteAction }: { deleteAction: any }) {
 const { pending } = useFormStatus()
 return (
 <button formAction={deleteAction} disabled={pending} className="p-1.5 rounded-md text-[#878787] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"onClick={(e) => { if (!confirm('このスケジュールを削除してもよろしいですか？')) e.preventDefault() }}>削除</button>
 )
}

export function ProcedureDeleteButton() {
 const { pending } = useFormStatus()
 return (
 <button type="submit"disabled={pending} className="p-1.5 rounded-md text-[#878787] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"title="削除"onClick={(e) => { if (!confirm('この手続記録を削除してもよろしいですか？')) e.preventDefault() }}>
 <Trash2 size={16} strokeWidth={1.5} />
 </button>
 )
}

export function BadgeUpdateButton() {
 const { pending } = useFormStatus()
 return (
 <button type="submit"disabled={pending} className="text-[11px] text-white bg-[#24b47e] hover:bg-[#1e9a6a] px-4 py-1.5 rounded-md font-bold transition-colors disabled:opacity-50 inline-flex items-center justify-center">
 {pending ? '更新中...' : '更 新'}
 </button>
 )
}
