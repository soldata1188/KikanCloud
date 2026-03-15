'use client'
import { useState, useTransition } from 'react'
import { X, Upload, Save, AlertCircle, FileText, Download, CheckCircle2 } from 'lucide-react'
import { importWorkers } from '@/app/workers/actions'
import type { ImportWorkerPayload } from '@/app/workers/actions'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'

const WORKER_COLUMNS = [
    { key: 'company_name',    label: '受入企業名',           required: true  },
    { key: 'full_name_romaji',label: '氏名(英字)',            required: true  },
    { key: 'full_name_kana',  label: '氏名(カナ)',            required: false },
    { key: 'dob',             label: '生年月日',              required: false },
    { key: 'gender',          label: '性別',                  required: false },
    { key: 'has_spouse',      label: '既婚',                  required: false },
    { key: 'nationality',     label: '国籍',                  required: false },
    { key: 'birthplace',      label: '出生地',                required: false },
    { key: 'entry_date',      label: '入国日',                required: false },
    { key: 'entry_batch',     label: '入国バッチ',            required: false },
    { key: 'visa_status',     label: '在留資格',              required: false },
    { key: 'zairyu_no',       label: '在留番号',              required: false },
    { key: 'zairyu_exp',      label: '在留期限',              required: false },
    { key: 'passport_no',     label: 'パスポート番号',        required: false },
    { key: 'passport_exp',    label: 'パスポート期限',        required: false },
    { key: 'industry_field',  label: '職種',                  required: false },
    { key: 'system_type',     label: '制度',                  required: false },
    { key: 'status',          label: 'ステータス',            required: false },
    { key: 'japanese_level',  label: '日本語レベル',          required: false },
    { key: 'blood_type',      label: '血液型',                required: false },
    { key: 'cert_no',         label: '認定番号',              required: false },
    { key: 'cert_start_date', label: '認定開始日',            required: false },
    { key: 'cert_end_date',   label: '認定終了日',            required: false },
    { key: 'insurance_exp',   label: '社会保険期限',          required: false },
    { key: 'sending_org',     label: '送り出し機関',          required: false },
    { key: 'address',         label: '現住所',                required: false },
    { key: 'japan_residence', label: '社宅住所',              required: false },
    { key: 'remarks',         label: '備考',                  required: false },
    { key: 'kentei_status',   label: '検定ステータス',        required: false },
    { key: 'kikou_status',    label: '機構ステータス',        required: false },
    { key: 'nyukan_status',   label: '入管ステータス',        required: false },
]

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
    const [preview, setPreview] = useState<{ count: number; sample: string[] } | null>(null)

    const handleFileChange = (f: File | null) => {
        setFile(f)
        setError(null)
        setPreview(null)
        if (!f) return
        const reader = new FileReader()
        reader.onload = (e) => {
            const text = e.target?.result as string
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const sample = (results.data as any[]).slice(0, 3).map((r: any) =>
                        Object.values(r)[1] as string || ''
                    )
                    setPreview({ count: results.data.length, sample })
                }
            })
        }
        reader.readAsText(f)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return
        setError(null)
        const reader = new FileReader()
        reader.onload = async (event) => {
            const text = event.target?.result as string
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const data: ImportWorkerPayload[] = (results.data as any[]).map((row: any) => {
                        const g = (label: string) => String(row[label] || '').trim()
                        return {
                            company_name:     g('受入企業名'),
                            full_name_romaji: g('氏名(英字)'),
                            full_name_kana:   g('氏名(カナ)'),
                            dob:              g('生年月日'),
                            gender:           g('性別'),
                            has_spouse:       g('既婚').includes('有') || g('既婚').includes('既'),
                            nationality:      g('国籍'),
                            birthplace:       g('出生地'),
                            entry_date:       g('入国日'),
                            entry_batch:      g('入国バッチ'),
                            visa_status:      g('在留資格'),
                            zairyu_no:        g('在留番号') || null,
                            zairyu_exp:       g('在留期限') || null,
                            passport_no:      g('パスポート番号') || null,
                            passport_exp:     g('パスポート期限') || null,
                            industry_field:   g('職種'),
                            system_type:      g('制度'),
                            status:           g('ステータス'),
                            japanese_level:   g('日本語レベル') || null,
                            blood_type:       g('血液型') || null,
                            cert_no:          g('認定番号') || null,
                            cert_start_date:  g('認定開始日') || null,
                            cert_end_date:    g('認定終了日') || null,
                            insurance_exp:    g('社会保険期限') || null,
                            sending_org:      g('送り出し機関') || null,
                            address:          g('現住所') || null,
                            japan_residence:  g('社宅住所') || null,
                            remarks:          g('備考') || null,
                            kentei_status:    g('検定ステータス') || null,
                            kikou_status:     g('機構ステータス') || null,
                            nyukan_status:    g('入管ステータス') || null,
                        }
                    })
                    startTransition(async () => {
                        const res = await importWorkers(data)
                        if (res.success) {
                            const msg = res.newCompanies && res.newCompanies > 0
                                ? `${res.count}名をインポートしました。（新規企業${res.newCompanies}社を自動作成）`
                                : `${res.count}名をインポートしました。`
                            alert(msg)
                            onSuccess()
                            router.refresh()
                        } else {
                            setError(res.error || 'インポート中にエラーが発生しました。')
                        }
                    })
                },
                error: (err: any) => setError(`CSV解析エラー: ${err.message}`)
            })
        }
        reader.readAsText(file)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <Upload size={18} className="text-gray-600" />
                        <h3 className="font-black text-[15px] text-gray-900 uppercase tracking-wider">外国人材 一括CSV入力</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                    {/* Template download + column list */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[12px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={13} /> CSVテンプレート（全{WORKER_COLUMNS.length}列）
                            </h4>
                            <a
                                href="/templates/worker_import_template.csv"
                                download
                                className="flex items-center gap-1.5 text-[11px] font-black text-white bg-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <Download size={11} /> 雛形ダウンロード
                            </a>
                        </div>
                        <div className="grid grid-cols-3 gap-x-4 gap-y-0.5">
                            {WORKER_COLUMNS.map((col, i) => (
                                <div key={col.key} className="flex items-center gap-1.5 text-[10px]">
                                    <span className="text-blue-300 font-mono w-4 text-right">{i + 1}</span>
                                    <span className={col.required ? 'font-black text-blue-900' : 'text-blue-700'}>{col.label}</span>
                                    {col.required && <span className="text-red-500 text-[8px]">*</span>}
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-blue-600 mt-2">* 必須。日付形式: YYYY-MM-DD。1行目はヘッダー行。</p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p className="text-[12px] font-semibold">{error}</p>
                        </div>
                    )}

                    {preview && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                            <p className="text-[12px] font-semibold text-emerald-700">
                                {preview.count}件検出 — サンプル: {preview.sample.filter(Boolean).join(', ')}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 bg-gray-50 hover:bg-white hover:border-blue-300 transition-all cursor-pointer group">
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                            />
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform mb-3">
                                <Upload className="text-blue-500" size={22} />
                            </div>
                            <p className="text-[13px] font-black text-gray-700">
                                {file ? file.name : 'CSVファイルを選択またはドラッグ'}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">CSV Only • UTF-8推奨</p>
                        </label>

                        <div className="flex gap-3">
                            <button type="button" onClick={onClose}
                                className="flex-1 h-11 bg-gray-100 text-gray-600 font-black rounded-xl hover:bg-gray-200 text-[13px] active:scale-95 transition-all">
                                キャンセル
                            </button>
                            <button type="submit" disabled={isPending || !file}
                                className="flex-1 h-11 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 text-[13px] active:scale-95 transition-all">
                                {isPending ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><Save size={15} /><span>インポート実行</span></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
