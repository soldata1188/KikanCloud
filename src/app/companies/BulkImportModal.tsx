'use client'
import { useState, useTransition } from 'react'
import { X, Upload, Save, AlertCircle, FileText, Download, CheckCircle2 } from 'lucide-react'
import { importCompanies } from '@/app/companies/actions'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'

// 12列 — ユーザー指定の順序
const COMPANY_COLUMNS = [
    { key: 'name_jp',               label: '企業名(日本語)',   required: true  },
    { key: 'representative',        label: '代表者名',         required: false },
    { key: 'representative_romaji', label: '代表者名(カナ)',   required: false },
    { key: 'corporate_number',      label: '法人番号',         required: false },
    { key: 'address',               label: '住所',             required: false },
    { key: 'phone',                 label: '電話番号',         required: false },
    { key: 'pic_name',              label: '責任者',           required: false },
    { key: 'training_date',         label: '講習受講日',       required: false },
    { key: 'life_advisor',          label: '生活指導員',       required: false },
    { key: 'tech_advisor',          label: '技能指導員',       required: false },
    { key: 'accepted_occupations',  label: '受入職種',         required: false },
    { key: 'employee_count',        label: '従業員数',         required: false },
]

// BOM付きUTF-8でCSVを生成してダウンロード（Excelで文字化けしない）
function downloadTemplate() {
    const headers = COMPANY_COLUMNS.map(c => c.label).join(',')
    const sample1 = [
        'サンプル工業株式会社', '山田 太郎', 'ヤマダ タロウ',
        '1234567890123', '東京都千代田区千代田1-1', '03-1234-5678',
        '田中 花子', '2024-01-10', '鈴木 一郎', '高橋 次郎',
        '機械加工・溶接', '50',
    ].join(',')
    const sample2 = [
        'テスト建設株式会社', '佐藤 次郎', 'サトウ ジロウ',
        '9876543210987', '大阪府大阪市北区梅田1-1', '06-9876-5432',
        '伊藤 三郎', '2024-02-15', '渡辺 四郎', '山本 五郎',
        '建設・とび', '30',
    ].join(',')

    // \uFEFF = UTF-8 BOM — Excelが日本語を正しく読み込む
    const csv = '\uFEFF' + [headers, sample1, sample2].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '受入企業_インポート雛形.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

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
                        String(r['企業名(日本語)'] || Object.values(r)[0] || '')
                    )
                    setPreview({ count: results.data.length, sample })
                }
            })
        }
        reader.readAsText(f, 'UTF-8')
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
                    const data = (results.data as any[]).map((row: any) => {
                        const g = (label: string) => String(row[label] || '').trim() || null
                        return {
                            name_jp:               String(row['企業名(日本語)'] || '').trim(),
                            representative:        g('代表者名'),
                            representative_romaji: g('代表者名(カナ)'),
                            corporate_number:      g('法人番号'),
                            address:               g('住所'),
                            phone:                 g('電話番号'),
                            pic_name:              g('責任者'),
                            training_date:         g('講習受講日'),
                            life_advisor:          g('生活指導員'),
                            tech_advisor:          g('技能指導員'),
                            accepted_occupations:  g('受入職種'),
                            employee_count:        g('従業員数'),
                        }
                    }).filter(r => r.name_jp)

                    startTransition(async () => {
                        try {
                            const res = await importCompanies(data)
                            if (res.success) {
                                alert(`${res.count}社をインポートしました。`)
                                onSuccess()
                                router.refresh()
                            }
                        } catch (err: any) {
                            setError(err.message || 'インポート中にエラーが発生しました。')
                        }
                    })
                },
                error: (err: any) => setError(`CSV解析エラー: ${err.message}`)
            })
        }
        reader.readAsText(file, 'UTF-8')
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <Upload size={18} className="text-gray-600" />
                        <h3 className="font-black text-[15px] text-gray-900">受入企業 一括CSV入力</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* テンプレート説明 */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[12px] font-black text-blue-800 flex items-center gap-2">
                                <FileText size={13} /> CSVテンプレート（全{COMPANY_COLUMNS.length}列）
                            </h4>
                            <button
                                type="button"
                                onClick={downloadTemplate}
                                className="flex items-center gap-1.5 text-[11px] font-black text-white bg-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <Download size={11} /> 雛形ダウンロード
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                            {COMPANY_COLUMNS.map((col, i) => (
                                <div key={col.key} className="flex items-center gap-1.5 text-[10px]">
                                    <span className="text-blue-300 font-mono w-4 shrink-0 text-right">{i + 1}</span>
                                    <span className={col.required ? 'font-black text-blue-900' : 'text-blue-700'}>{col.label}</span>
                                    {col.required && <span className="text-red-500 text-[8px] shrink-0">必須</span>}
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-blue-500 mt-3">
                            日付形式: <span className="font-mono">YYYY-MM-DD</span>　・　1行目はヘッダー行　・　BOM付きUTF-8またはShift-JIS対応
                        </p>
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
                                {preview.count}件を検出 — {preview.sample.filter(Boolean).join('、')}
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
                            <p className="text-[10px] font-bold text-gray-400 mt-1">CSV形式　UTF-8 / Shift-JIS対応</p>
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
