'use client'
import { useState, useTransition } from 'react'
import { X, Upload, Save, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import { importWorkers, ImportWorkerPayload } from '@/app/workers/actions'
import { useRouter } from 'next/navigation'

export function BulkImportModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void
    onSuccess: () => void
}) {
    const [file, setFile] = useState<File | null>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setError(null)
        const reader = new FileReader()
        reader.onload = async (event) => {
            const text = event.target?.result as string

            // Using a more robust parsing logic (simple CSV split for now like before, but safer)
            // Ideally we'd use Papaparse here since it's in package.json
            import('papaparse').then((Papa) => {
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        const data: ImportWorkerPayload[] = results.data.map((row: any) => {
                            // Map values by matching header names or indices
                            // The user's template has: 受入企業名, 氏名(英字), 生年月日, 性別, 既婚, 国籍, 出生地, 入国日, 在留期限, パスポート期限, 在留資格, 職種, 社宅住所
                            const values = Object.values(row);
                            return {
                                company_name: values[0] as string,
                                full_name_romaji: values[1] as string,
                                dob: values[2] as string,
                                gender: values[3] as string,
                                has_spouse: String(values[4]).includes('有') || String(values[4]).includes('あり') || String(values[4]).includes('既婚'),
                                nationality: values[5] as string,
                                birthplace: values[6] as string,
                                entry_date: values[7] as string,
                                zairyu_exp: values[8] as string,
                                passport_exp: values[9] as string,
                                visa_status: values[10] as string,
                                industry_field: values[11] as string,
                                japan_residence: values[12] as string,
                            };
                        });

                        startTransition(async () => {
                            try {
                                const res = await importWorkers(data)
                                if (res.success) {
                                    alert(`${res.count}名のデータをインポートしました。`)
                                    onSuccess()
                                    router.refresh()
                                }
                            } catch (err: any) {
                                setError(err.message || 'インポート中にエラーが発生しました。')
                            }
                        })
                    },
                    error: (error) => {
                        setError(`CSV解析エラー: ${error.message}`);
                    }
                });
            });
        }
        reader.readAsText(file)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-emerald-700 text-white">
                    <div className="flex items-center gap-3">
                        <Upload size={18} />
                        <h3 className="font-black text-[15px] uppercase tracking-wider">外国人材CSVインポート</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Instructions & Template */}
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[12px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} /> CSVテンプレート
                            </h4>
                            <a
                                href="/templates/worker_import_template.csv"
                                download
                                className="text-[10px] font-black text-white bg-emerald-600 px-2 py-1 rounded hover:bg-emerald-700 transition-colors flex items-center gap-1"
                            >
                                <Upload size={10} className="rotate-180" />
                                雛形をダウンロード
                            </a>
                        </div>
                        <p className="text-[11px] text-emerald-600 leading-relaxed font-bold">
                            以下の順序で入力してください。1行目はヘッダーとして残してください。<br />
                            <span className="text-emerald-800">受入企業名*, 氏名(英字), 生年月日, 性別, 既婚, 国籍, 出生地, 入国日, 在留期限, パスポート期限, 在留資格, 職種, 社宅住所</span>
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p className="text-[12px] font-black">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 hover:bg-white hover:border-emerald-300 transition-all cursor-pointer relative group">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                    <Upload className="text-emerald-600" size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[13px] font-black text-gray-700">
                                        {file ? file.name : 'CSVファイルを選択またはドラッグ'}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                                        Max 10MB • CSV Only
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 h-11 bg-gray-100 text-gray-600 font-black rounded-xl hover:bg-gray-200 text-[13px] active:scale-95 transition-all"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                disabled={isPending || !file}
                                className="flex-1 h-11 bg-emerald-700 text-white font-black rounded-xl hover:bg-emerald-800 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 text-[13px] active:scale-95 transition-all"
                            >
                                {isPending ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={16} />
                                        <span>インポート実行</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
