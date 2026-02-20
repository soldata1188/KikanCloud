'use client'
import { useState, useRef, useTransition } from 'react'
import Papa from 'papaparse'
import { Upload, X, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import { importCompanies } from './actions'
import { useRouter } from 'next/navigation'

export function ImportModal() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [parsedData, setParsedData] = useState<any[]>([])
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('')
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv') && file.type !== 'application/vnd.ms-excel') {
            setError('CSVファイルのみ対応しています。ExcelからCSV形式で保存し直してください。')
            return
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const validData = results.data.filter((row: any) => row['企業名（日本語）'] && row['企業名（日本語）'].trim() !== '')
                if (validData.length === 0) {
                    setError('有効なデータが見つかりません。「企業名（日本語）」列は必須です。フォーマットを確認してください。')
                    return
                }

                const mappedData = validData.map((row: any) => ({
                    name_jp: row['企業名（日本語）'],
                    name_romaji: row['企業名（ローマ字）'],
                    corporate_number: row['法人番号（13桁）'],
                    industry: row['業種'],
                    postal_code: row['郵便番号'],
                    address: row['所在地（住所）'],
                    phone: row['電話番号'],
                    representative: row['代表者名'],
                    manager_name: row['責任者'],
                    pic_name: row['連絡・実習担当者'],
                    life_advisor: row['生活指導員'],
                    tech_advisor: row['技能指導員'],
                }))
                setParsedData(mappedData)
            },
            error: () => setError('ファイルの読み込みに失敗しました。')
        })
    }

    const handleImport = () => {
        startTransition(async () => {
            try {
                await importCompanies(parsedData)
                setIsOpen(false)
                setParsedData([])
                if (fileInputRef.current) fileInputRef.current.value = ''
                router.refresh()
                alert(`${parsedData.length}件の受入企業をインポートしました！`)
            } catch (err: any) {
                setError(err.message)
            }
        })
    }

    const downloadTemplate = () => {
        const headers = ['企業名（日本語）', '企業名（ローマ字）', '法人番号（13桁）', '業種', '郵便番号', '所在地（住所）', '電話番号', '代表者名', '責任者', '連絡・実習担当者', '生活指導員', '技能指導員']
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n株式会社サンプル,SAMPLE CO.,1234567890123,製造業,100-0001,東京都千代田区,03-1234-5678,山田 太郎,田中 健太,鈴木 一郎,佐藤 花子,高橋 次郎'
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "companies_template.csv")
        document.body.appendChild(link)
        link.click()
        link.remove()
    }

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#444746] rounded-[32px] text-sm font-medium transition-colors shadow-sm border border-[#e1e5ea] shrink-0">
                <Upload size={18} strokeWidth={2} /> CSV一括登録
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-[800px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-[#f0f4f9]/50">
                            <h3 className="text-xl font-medium text-[#1f1f1f] flex items-center gap-2"><FileText className="text-[#4285F4]" /> CSV一括インポート</h3>
                            <button onClick={() => { setIsOpen(false); setParsedData([]); setError(''); }} className="p-2 hover:bg-black/5 rounded-[32px] transition-colors text-gray-500"><X size={20} /></button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            {!parsedData.length ? (
                                <div className="space-y-6">
                                    <div className="bg-blue-50/50 p-4 rounded-[32px] border border-blue-100 flex items-start gap-3">
                                        <AlertCircle className="text-[#4285F4] shrink-0 mt-0.5" size={20} />
                                        <div className="text-sm text-[#444746] space-y-2">
                                            <p>Excel等で作成したCSVファイルをアップロードすることで、複数の受入企業を一度に登録できます。</p>
                                            <button onClick={downloadTemplate} className="text-[#4285F4] font-medium hover:underline flex items-center gap-1"><Download size={14} /> テンプレートCSVをダウンロード</button>
                                        </div>
                                    </div>

                                    <div className="border-2 border-dashed border-[#e1e5ea] rounded-[32px] p-10 text-center hover:border-[#4285F4] hover:bg-blue-50/30 transition-colors cursor-pointer relative group">
                                        <input type="file" accept=".csv" onChange={handleFileUpload} ref={fileInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <Upload size={40} className="mx-auto text-gray-400 mb-4 group-hover:text-[#4285F4] transition-colors" strokeWidth={1.5} />
                                        <p className="text-[#1f1f1f] font-medium mb-1">クリックまたはドラッグ＆ドロップでファイルを選択</p>
                                        <p className="text-xs text-gray-400">CSV形式（.csv）のみ対応</p>
                                    </div>
                                    {error && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-[32px] border border-red-100">{error}</p>}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-[32px] border border-green-100">
                                        <div className="flex items-center gap-2 text-green-700 font-medium"><CheckCircle2 size={18} /> 読み込み成功: {parsedData.length}件</div>
                                        <button onClick={() => { setParsedData([]); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-xs text-gray-500 hover:text-[#1f1f1f] underline">別のファイルを選択</button>
                                    </div>

                                    <div className="border border-[#e1e5ea] rounded-[32px] overflow-hidden max-h-[300px] overflow-y-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-[#f0f4f9] sticky top-0">
                                                <tr><th className="px-4 py-3 font-medium text-gray-600">企業名（日本語）</th><th className="px-4 py-3 font-medium text-gray-600">法人番号</th><th className="px-4 py-3 font-medium text-gray-600">代表者</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {parsedData.slice(0, 100).map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-[#1f1f1f]">{row.name_jp}</td>
                                                        <td className="px-4 py-3 text-gray-500">{row.corporate_number || '-'}</td>
                                                        <td className="px-4 py-3 text-gray-500">{row.representative || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {parsedData.length > 100 && <p className="text-xs text-center text-gray-400">※プレビューは先頭100件のみ表示しています</p>}
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => { setIsOpen(false); setParsedData([]); setError(''); }} className="px-6 py-2.5 text-[#444746] font-medium hover:bg-gray-200 rounded-[32px] transition-colors text-sm">キャンセル</button>
                            <button onClick={handleImport} disabled={!parsedData.length || isPending} className="px-6 py-2.5 bg-[#4285F4] text-white hover:bg-[#3367d6] font-medium rounded-[32px] transition-colors text-sm disabled:opacity-50 flex items-center gap-2 shadow-sm">
                                {isPending ? 'インポート中...' : `インポートを実行 (${parsedData.length}件)`}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}
