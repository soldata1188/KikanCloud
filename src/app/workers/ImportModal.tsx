'use client'
import { useState, useRef, useTransition } from 'react'
import Papa from 'papaparse'
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { ImportWorkerPayload, importWorkers } from './actions'
import { useRouter } from 'next/navigation'

export function ImportModal() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [parsedData, setParsedData] = useState<ImportWorkerPayload[]>([])
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('')
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv') && file.type !== 'application/vnd.ms-excel') {
            setError('CSVファイルのみ対応しています。Excel等からCSV形式で保存し直してください。')
            return
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const validData = results.data.filter((row: any) => row['氏名（ローマ字）'] && row['氏名（ローマ字）'].trim() !== '')
                if (validData.length === 0) {
                    setError('有効なデータが見つかりません。「氏名（ローマ字）」列は必須です。フォーマットを確認してください。')
                    return
                }

                const mappedData = validData.map((row: any) => ({
                    company_name: row['配属先企業'],
                    full_name_romaji: row['氏名（ローマ字）'],
                    dob: row['生年月日'],
                    gender: row['性別'],
                    has_spouse: row['配偶者'] === '有' ? true : (row['配偶者'] === '無' ? false : null),
                    nationality: row['国籍'],
                    entry_date: row['入国日'],
                    visa_status: row['在留資格'],
                    industry_field: row['職種区分'],
                    passport_no: row['パスポート番号'],
                    passport_exp: row['パスポート期限'],
                    address: row['社宅住所'],
                    japan_residence: row['日本の居住地'],
                }))
                setParsedData(mappedData)
            },
            error: () => setError('ファイルの読み込みに失敗しました。')
        })
    }

    const handleImport = () => {
        startTransition(async () => {
            try {
                await importWorkers(parsedData)
                setIsOpen(false)
                setParsedData([])
                if (fileInputRef.current) fileInputRef.current.value = ''
                router.refresh()
                alert(`${parsedData.length}名の人材データをインポートしました！`)
            } catch (err: any) {
                setError(err.message)
            }
        })
    }

    const downloadTemplate = () => {
        const headers = [
            '配属先企業', '氏名（ローマ字）', '生年月日', '性別', '配偶者', '国籍', '入国日', '在留資格', '職種区分', 'パスポート番号', 'パスポート期限', '社宅住所', '日本の居住地'
        ]
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n株式会社サンプル,NGUYEN VAN A,2000/01/01,男性,有,ベトナム,2024/04/01,技能実習,溶接,C1234567,2030/01/01,東京都新宿区,東京都杉並区'
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "workers_template.csv")
        document.body.appendChild(link)
        link.click()
        link.remove()
    }

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="group relative h-[32px] w-[32px] flex items-center justify-center bg-white border border-gray-350 text-[#1f1f1f] rounded-md transition-colors shrink-0 hover:bg-gray-50">
                <Upload size={16} />
                <div className="absolute top-full mt-2 px-2 py-1 bg-[#1f1f1f] text-white text-[11px] font-medium rounded-sm opacity-0 invisible translate-y-[-5px] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 whitespace-nowrap z-[60] pointer-events-none">
                    一括入力
                </div>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-[800px] border border-gray-350 overflow-hidden flex flex-col max-h-[90vh]">

                        <div className="px-6 py-4 border-b border-gray-350 flex justify-between items-center bg-white">
                            <h3 className="text-lg font-medium text-[#1f1f1f] flex items-center gap-2">CSV一括インポート (人材情報)</h3>
                            <button onClick={() => { setIsOpen(false); setParsedData([]); setError(''); }} className="p-1.5 hover:bg-gray-50 rounded-md transition-colors text-[#878787]"><X size={18} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {!parsedData.length ? (
                                <div className="space-y-6">
                                    <div className="bg-white p-4 rounded-md border border-gray-350 flex items-start gap-3">
                                        <AlertCircle className="text-[#878787] shrink-0 mt-0.5" size={18} />
                                        <div className="text-[13px] text-[#1f1f1f] space-y-2">
                                            <p>Excel等で作成したCSVファイルをアップロードすることで、複数の外国人材データを一度に登録できます。</p>
                                            <button onClick={downloadTemplate} className="text-[#24b47e] font-medium hover:underline flex items-center gap-1">テンプレートCSVをダウンロード</button>
                                        </div>
                                    </div>

                                    <div className="border border-dashed border-[#d1d5db] rounded-md p-10 text-center hover:border-[#24b47e] hover:bg-gray-50 transition-colors cursor-pointer relative group">
                                        <input type="file" accept=".csv" onChange={handleFileUpload} ref={fileInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <Upload size={32} className="mx-auto text-[#878787] mb-3 group-hover:text-[#24b47e] transition-colors" strokeWidth={1.5} />
                                        <p className="text-[14px] text-[#1f1f1f] font-medium mb-1">クリックまたはドラッグ＆ドロップでファイルを選択</p>
                                        <p className="text-[12px] text-[#878787]">CSV形式（.csv）のみ対応</p>
                                    </div>
                                    {error && <p className="text-red-600 text-[13px] text-center bg-red-50 py-2 rounded-md border border-red-200">{error}</p>}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-md border border-green-200">
                                        <div className="flex items-center gap-2 text-primary-700 font-medium text-[13px]"><CheckCircle2 size={16} /> 読み込み成功: {parsedData.length}件</div>
                                        <button onClick={() => { setParsedData([]); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-[12px] text-[#878787] hover:text-[#1f1f1f] underline">別のファイルを選択</button>
                                    </div>

                                    <div className="border border-gray-350 rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
                                        <table className="w-full text-left text-[12px]">
                                            <thead className="bg-white sticky top-0 border-b border-gray-350">
                                                <tr><th className="px-4 py-2 font-medium text-[#878787] uppercase">配属先企業</th><th className="px-4 py-2 font-medium text-[#878787] uppercase">氏名（ローマ字）</th><th className="px-4 py-2 font-medium text-[#878787] uppercase">配偶者</th><th className="px-4 py-2 font-medium text-[#878787] uppercase">国籍</th><th className="px-4 py-2 font-medium text-[#878787] uppercase">職種区分</th><th className="px-4 py-2 font-medium text-[#878787] uppercase">日本の居住地</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#ededed]">
                                                {parsedData.slice(0, 100).map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-[#1f1f1f]">{row.company_name || '-'}</td>
                                                        <td className="px-4 py-2 font-medium text-[#1f1f1f]">{row.full_name_romaji || '-'}</td>
                                                        <td className="px-4 py-2 text-[#878787]">{row.has_spouse === true ? '有' : row.has_spouse === false ? '無' : '-'}</td>
                                                        <td className="px-4 py-2 text-[#878787]">{row.nationality || '-'}</td>
                                                        <td className="px-4 py-2 text-[#878787]">{row.industry_field || '-'}</td>
                                                        <td className="px-4 py-2 text-[#878787]">{row.japan_residence || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {parsedData.length > 100 && <p className="text-[11px] text-center text-[#878787]">※プレビューは先頭100件のみ表示しています</p>}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-350 bg-white flex justify-end gap-3">
                            <button onClick={() => { setIsOpen(false); setParsedData([]); setError(''); }} className="px-4 py-2 text-[#878787] hover:text-[#1f1f1f] font-medium rounded-md transition-colors text-[13px]">キャンセル</button>
                            <button onClick={handleImport} disabled={!parsedData.length || isPending} className="px-4 py-2 bg-[#24b47e] text-white hover:bg-[#1e9a6a] font-medium rounded-md transition-colors text-[13px] disabled:opacity-50 flex items-center gap-2">
                                {isPending ? 'インポート中...' : `インポートを実行 (${parsedData.length}件)`}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}
