'use client'
import { useState, useRef, useTransition } from 'react'
import Papa from 'papaparse'
import { Upload, X, FileText, CheckCircle2, AlertCircle, Download, Briefcase } from 'lucide-react'
import { importWorkers } from './actions'
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
            setError('CSVファイルのみ対応しています。ExcelからCSV形式（UTF-8）で保存し直してください。')
            return
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const validData = results.data.filter((row: any) => row['氏名（ローマ字）'] && String(row['氏名（ローマ字）']).trim() !== '')
                if (validData.length === 0) {
                    setError('有効なデータが見つかりません。「氏名（ローマ字）」列は必須です。')
                    return
                }

                // Map header tiếng Nhật sang column name của DB
                const mappedData = validData.map((row: any) => ({
                    full_name_romaji: row['氏名（ローマ字）'],
                    full_name_kana: row['氏名（カナ）'],
                    dob: row['生年月日'],
                    system_type: row['制度区分'],
                    status: row['ステータス'],
                    company_name: row['配属先企業名'],
                    zairyu_no: row['在留カード番号'],
                    entry_date: row['入国日'],
                    passport_exp: row['パスポート期限'],
                    cert_start_date: row['認定開始日'],
                    cert_end_date: row['認定修了日'],
                    insurance_exp: row['保険期限'],
                    entry_batch: row['入国期生'],
                    nationality: row['国籍'],
                    sending_org: row['送出機関'],
                    address: row['現住所'],
                }))
                setParsedData(mappedData)
            },
            error: () => setError('ファイルの読み込みに失敗しました。文字コードがUTF-8であることを確認してください。')
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
            '氏名（ローマ字）', '氏名（カナ）', '生年月日', '制度区分', 'ステータス',
            '配属先企業名', '在留カード番号', '入国日', 'パスポート期限',
            '認定開始日', '認定修了日', '保険期限',
            '入国期生', '国籍', '送出機関', '現住所'
        ]
        const row1 = ['NGUYEN VAN A', 'グエン ヴァン ア', '2000/01/01', '育成就労', '就業中', '株式会社ミライ', 'AB12345678CD', '2024/04/01', '2030/01/01', '2024/04/01', '2027/04/01', '2025/04/01', '第15期生', 'ベトナム', 'VINAJAPAN JSC', '東京都新宿区...']
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + row1.join(',')

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
 <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#fbfcfd] text-[#1f1f1f] rounded-md text-sm font-medium transition-colors shrink-0"> 
                <Upload size={18} strokeWidth={2} /> CSV一括登録
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-[60]">
 <div className="bg-white rounded-md w-full max-w-[1000px] overflow-hidden flex flex-col max-h-[90vh]"> 

                        <div className="px-8 py-6 border-b border-[#ededed] flex justify-between items-center bg-[#fbfcfd]/50">
                            <h3 className="text-xl font-medium text-[#1f1f1f] flex items-center gap-2"><Briefcase className="text-[#24b47e]" /> 外国人材 CSVインポート</h3>
 <button onClick={() => { setIsOpen(false); setParsedData([]); setError(''); }} className="p-2 hover:bg-black/5 rounded-md transition-colors text-[#878787]"><X size={20} /></button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            {!parsedData.length ? (
                                <div className="space-y-6">
 <div className="bg-[#fbfcfd]/50 p-4 rounded-md border border-blue-100 flex items-start gap-3">
                                        <AlertCircle className="text-[#24b47e] shrink-0 mt-0.5" size={20} />
                                        <div className="text-sm text-[#1f1f1f] space-y-2">
                                            <p>数千人規模の実習生・特定技能のデータを一括でシステムに登録します。「配属先企業名」はシステムに登録済みの企業名と完全一致させる必要があります。</p>
                                            <button onClick={downloadTemplate} className="text-[#24b47e] font-medium hover:underline flex items-center gap-1 mt-2"><Download size={14} /> テンプレートCSVをダウンロード</button>
                                        </div>
                                    </div>

                                    <div className="border-2 border-dashed border-[#e1e5ea] rounded-lg p-10 text-center hover:border-[#24b47e] hover:bg-[#fbfcfd]/30 transition-colors cursor-pointer relative group">
                                        <input type="file" accept=".csv" onChange={handleFileUpload} ref={fileInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <Upload size={40} className="mx-auto text-[#878787] mb-4 group-hover:text-[#24b47e] transition-colors" strokeWidth={1.5} />
                                        <p className="text-[#1f1f1f] font-medium mb-1">クリックまたはドラッグ＆ドロップでファイルを選択</p>
                                        <p className="text-xs text-[#878787]">CSV形式（UTF-8）のみ対応</p>
                                    </div>
 {error && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-md border border-red-100">{error}</p>}
                                </div>
                            ) : (
                                <div className="space-y-4">
 <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-md border border-green-100">
                                        <div className="flex items-center gap-2 text-green-700 font-medium"><CheckCircle2 size={18} /> 読み込み成功: {parsedData.length}名</div>
                                        <button onClick={() => { setParsedData([]); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-xs text-[#878787] hover:text-[#1f1f1f] underline">別のファイルを選択</button>
                                    </div>

 <div className="rounded-md overflow-hidden max-h-[350px] overflow-y-auto">
                                        <table className="w-full text-left text-xs whitespace-nowrap">
                                            <thead className="bg-[#fbfcfd] sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium text-gray-600">氏名（ローマ字）</th>
                                                    <th className="px-4 py-3 font-medium text-gray-600">生年月日</th>
                                                    <th className="px-4 py-3 font-medium text-gray-600">区分</th>
                                                    <th className="px-4 py-3 font-medium text-gray-600">配属先（自動紐付）</th>
                                                    <th className="px-4 py-3 font-medium text-gray-600">在留カード</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {parsedData.slice(0, 100).map((row, i) => (
                                                    <tr key={i} className="hover:bg-[#fbfcfd]">
                                                        <td className="px-4 py-3 font-medium text-[#1f1f1f] uppercase">{row.full_name_romaji}</td>
                                                        <td className="px-4 py-3 text-[#878787]">{row.dob || '-'}</td>
                                                        <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 rounded text-[10px]">{row.system_type || '-'}</span></td>
                                                        <td className="px-4 py-3 text-[#878787]">{row.company_name || '未配属'}</td>
                                                        <td className="px-4 py-3 font-mono text-[#878787] uppercase">{row.zairyu_no || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {parsedData.length > 100 && <p className="text-xs text-center text-[#878787]">※プレビューは先頭100件のみ表示しています</p>}
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-4 border-t border-[#ededed] bg-[#fbfcfd] flex justify-end gap-3 mt-auto">
 <button onClick={() => { setIsOpen(false); setParsedData([]); setError(''); }} className="px-6 py-2.5 text-[#1f1f1f] font-medium hover:bg-gray-200 rounded-md transition-colors text-sm">キャンセル</button>
 <button onClick={handleImport} disabled={!parsedData.length || isPending} className="px-6 py-2.5 bg-[#24b47e] text-white hover:bg-[#1e9a6a] font-medium rounded-md transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
                                {isPending ? '登録処理中...' : `一括インポートを実行 (${parsedData.length}名)`}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}
