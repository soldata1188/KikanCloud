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
            setError('CSVファイルのみ対応しています。Excel等からCSV形式で保存し直してください。')
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
            <button onClick={() => setIsOpen(true)} className="h-[32px] px-3 bg-white border border-[#ededed] text-[#1f1f1f] rounded-md text-[13px] font-medium hover:bg-[#fbfcfd] transition-colors flex items-center gap-1.5 shadow-sm">
                <Upload size={14} /> 一括入力
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-[800px] shadow-sm border border-[#ededed] overflow-hidden flex flex-col max-h-[90vh]">

                        <div className="px-6 py-4 border-b border-[#ededed] flex justify-between items-center bg-white">
                            <h3 className="text-lg font-medium text-[#1f1f1f] flex items-center gap-2">CSV一括インポート</h3>
                            <button onClick={() => { setIsOpen(false); setParsedData([]); setError(''); }} className="p-1.5 hover:bg-[#fbfcfd] rounded-md transition-colors text-[#878787]"><X size={18} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {!parsedData.length ? (
                                <div className="space-y-6">
                                    <div className="bg-[#fbfcfd] p-4 rounded-md border border-[#ededed] flex items-start gap-3">
                                        <AlertCircle className="text-[#878787] shrink-0 mt-0.5" size={18} />
                                        <div className="text-[13px] text-[#1f1f1f] space-y-2">
                                            <p>Excel等で作成したCSVファイルをアップロードすることで、複数の受入企業を一度に登録できます。</p>
                                            <button onClick={downloadTemplate} className="text-[#24b47e] font-medium hover:underline flex items-center gap-1">テンプレートCSVをダウンロード</button>
                                        </div>
                                    </div>

                                    <div className="border border-dashed border-[#d1d5db] rounded-md p-10 text-center hover:border-[#24b47e] hover:bg-[#fbfcfd] transition-colors cursor-pointer relative group">
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
                                        <div className="flex items-center gap-2 text-green-700 font-medium text-[13px]"><CheckCircle2 size={16} /> 読み込み成功: {parsedData.length}件</div>
                                        <button onClick={() => { setParsedData([]); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-[12px] text-[#878787] hover:text-[#1f1f1f] underline">別のファイルを選択</button>
                                    </div>

                                    <div className="border border-[#ededed] rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
                                        <table className="w-full text-left text-[12px]">
                                            <thead className="bg-[#fbfcfd] sticky top-0 border-b border-[#ededed]">
                                                <tr><th className="px-4 py-2 font-medium text-[#878787] uppercase">企業名（日本語）</th><th className="px-4 py-2 font-medium text-[#878787] uppercase">法人番号</th><th className="px-4 py-2 font-medium text-[#878787] uppercase">代表者</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#ededed]">
                                                {parsedData.slice(0, 100).map((row, i) => (
                                                    <tr key={i} className="hover:bg-[#fbfcfd]">
                                                        <td className="px-4 py-2 font-medium text-[#1f1f1f]">{row.name_jp}</td>
                                                        <td className="px-4 py-2 text-[#878787]">{row.corporate_number || '-'}</td>
                                                        <td className="px-4 py-2 text-[#878787]">{row.representative || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {parsedData.length > 100 && <p className="text-[11px] text-center text-[#878787]">※プレビューは先頭100件のみ表示しています</p>}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-[#ededed] bg-[#fbfcfd] flex justify-end gap-3">
                            <button onClick={() => { setIsOpen(false); setParsedData([]); setError(''); }} className="px-4 py-2 text-[#878787] hover:text-[#1f1f1f] font-medium rounded-md transition-colors text-[13px]">キャンセル</button>
                            <button onClick={handleImport} disabled={!parsedData.length || isPending} className="px-4 py-2 bg-[#24b47e] text-white hover:bg-[#1e9a6a] font-medium rounded-md transition-colors text-[13px] disabled:opacity-50 flex items-center gap-2 shadow-sm">
                                {isPending ? 'インポート中...' : `インポートを実行 (${parsedData.length}件)`}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}
