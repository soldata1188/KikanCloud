'use client'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export function FormSubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="px-6 py-2.5 text-white text-sm bg-[#24b47e] hover:bg-[#1e9a6a] font-bold rounded-none transition-colors disabled:opacity-50 flex items-center gap-2"
        >
            {pending && <Loader2 size={16} className="animate-spin" />}
            {pending ? '保存中...' : '保存'}
        </button>
    )
}
