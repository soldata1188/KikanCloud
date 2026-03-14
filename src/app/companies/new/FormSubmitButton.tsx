'use client'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export function FormSubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="h-9 px-5 bg-[#0067b8] hover:bg-[#005a9e] text-white rounded-md text-[12px] font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
        >
            {pending && <Loader2 size={13} className="animate-spin" />}
            {pending ? '保存中...' : '登録完了'}
        </button>
    )
}
