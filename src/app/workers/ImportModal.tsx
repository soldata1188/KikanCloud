'use client'
import { useState, useRef, useTransition } from 'react'
import Papa from 'papaparse'
import { Upload, X, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import { ImportWorkerPayload, importWorkers } from './actions'
import { useRouter } from 'next/navigation'
import { Worker } from '@/types/schema'

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
                    full_name_romaji: row['氏名（ローマ字）'],
                    full_name_kana: row['氏名（カタカナ）'],
                    dob: row['生年月日'],
                    company_name: row['受入企業名'],
                    system_type: row['区分（技能実習/特定技能/育成就労）'],
                    status: row['ステータス（就業中/待機中/帰国など）'] || row['ステータス（就業中/待機/帰国など）'],
                    zairyu_no: row['在留カード番号'],
                    entry_date: row['入国日'],
                    passport_exp: row['パスポート期限'],
                    cert_start_date: row['在留期間（開始）'],
                    cert_end_date: row['在留期間（終了）'],
                    insurance_exp: row['保険満了日'],
                    entry_batch: row['入国期（第何期生）'],
                    nationality: row['国籍'],
                    sending_org: row['送出機関'],
                    address: row['現住所'],
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
            '氏名（ローマ字）', '氏名（カタカナ）', '生年月日', '受入企業名',
            '区分（技能実習/特定技能/育成就労）', 'ステータス（就業中/待機中/帰国など）',
            '在留カード番号', '入国日', 'パスポート期限', '在留期間（開始）',
            '在留期間（終了）', '保険満了日', '入国期（第何期生）', '国籍',
            '送出機関', '現住所'
        ]
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\nNGUYEN VAN A,グエン ヴァン エー,2000/01/01,株式会社サンプル,技能実習,就業中,AB1234567CD,2023/04/01,2030/01/01,2023/04/01,2026/04/01,2026/04/01,第1期生,ベトナム,VINA CO.,東京都千代田区'
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
            <button onClick={() => setIsOpen(true)} className="h-[32px] px-3 bg-white border border-[#ededed] text-[#1f1f1f] rounded-md text-[13px] font-medium hover:bg-[#fbfcfd] transition-colors flex items-center gap-1.5 shadow-sm">
                <Upload size={14} /> 一括入力
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-[800px] shadow-sm border border-[#ededed] overflow-hidden flex flex-col max-h-[90vh]">

                        <div className="px-6 py-4 border-b border-[#ededed] flex justify-between items-center bg-white">
                            <h3 className="text-lg font-medium text-[#1f1f1f] flex items-center gap-2">CSV一括インポート (人材情報)</h3>
                            <button onClick={() => { setIsOpen(false); setParsedData([]); setError(''); }} className="p-1.5 hover:bg-[#fbfcfd] rounded-md transition-colors text-[#878787]"><X size={18} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {!parsedData.length ? (
                                <div className="space-y-6">
                                    <div className="bg-[#fbfcfd] p-4 rounded-md border border-[#ededed] flex items-start gap-3">
                                        <AlertCircle className="text-[#878787] shrink-0 mt-0.5" size={18} />
                                        <div className="text-[13px] text-[#1f1f1f] space-y-2">
                                            <p>Excel等で作成したCSVファイルをアップロードすることで、複数の外国人材データを一度に登録できます。</p>
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
                                                <tr><th className="px-4 py-2 font-medium text-[#878787] uppercase">氏名（ローマ字）</th><th className="px-4 py-2 font-medium text-[#878787] uppercase">受入企業名</th><th className="px-4 py-2 font-medium text-[#878787] uppercase">区分</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#ededed]">
                                                {parsedData.slice(0, 100).map((row, i) => (
                                                    <tr key={i} className="hover:bg-[#fbfcfd]">
                                                        <td className="px-4 py-2 font-medium text-[#1f1f1f]">{row.full_name_romaji}</td>
                                                        <td className="px-4 py-2 text-[#878787]">{row.company_name || '-'}</td>
                                                        <td className="px-4 py-2 text-[#878787]">{row.system_type || '-'}</td>
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
