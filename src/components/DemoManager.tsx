'use client'
import { useTransition } from 'react'
import { injectDemoData, clearDemoData } from '@/app/actions/demo'
import { DatabaseZap, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DemoManager() {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleInject = () => {
        if (!confirm('テスト用のDEMOデータ（企業5社・人材5名・監査3件）を生成しますか？\n※既存のデータは一切消えません。安全にテストできます。')) return
        startTransition(async () => {
            await injectDemoData()
            alert('✅ フルデータセットのデモ生成が完了しました！\nダッシュボードのアラートやマトリックスが充実しました。')
            router.refresh()
        })
    }

    const handleClear = () => {
        if (!confirm('生成したDEMOデータをすべて削除しますか？\n※(DEMO)という名前のデータのみが削除されます。本番データは安全です。')) return
        startTransition(async () => {
            await clearDemoData()
            alert('DEMOデータの削除が完了しました。')
            router.refresh()
        })
    }

    return (
 <div className="flex items-center gap-2 mr-4 bg-white px-2 py-1.5 rounded-[32px] border border-gray-200 hidden sm:flex">
 <button onClick={handleInject} disabled={isPending} className="flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-[32px] text-[11px] font-bold transition-colors disabled:opacity-50">
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <DatabaseZap size={12} strokeWidth={2} />} DEMO生成
            </button>
            <div className="w-px h-4 bg-gray-200"></div>
 <button onClick={handleClear} disabled={isPending} className="flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-[32px] text-[11px] font-bold transition-colors disabled:opacity-50">
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} strokeWidth={2} />} リセット
            </button>
        </div>
    )
}
