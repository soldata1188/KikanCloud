'use client'
import { useState } from 'react'
import { FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'

export function AutoDocButton({ worker, role = 'admin' }: { worker: any, role?: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    if (role !== 'admin') return null;

    const generateDoc = (type: 'meibo' | 'joken') => {
        setIsExporting(true); setIsOpen(false)
        try {
            let wsData = []
            if (type === 'meibo') {
                wsData = [
                    ["技能実習生名簿 (法定フォーマット)", "", "", "", ""], [],
                    ["作成日", new Date().toISOString().split('T')[0], "", "受入企業", worker.companies?.name_jp || '未配属'],
                    ["氏名 (ローマ字)", worker.full_name_romaji, "", "氏名 (カナ)", worker.full_name_kana || ''],
                    ["生年月日", worker.dob?.replace(/-/g, '/'), "", "性別", worker.gender === 'male' ? '男' : worker.gender === 'female' ? '女' : ''],
                    ["国籍", worker.nationality, "", "在留カード番号", worker.zairyu_no || ''],
                    ["パスポート期限", worker.passport_exp?.replace(/-/g, '/'), "", "制度区分", worker.system_type === 'tokuteigino' ? '特定技能' : '技能実習'],
                    ["送出機関", worker.sending_org || '-', "", "入国日", worker.entry_date?.replace(/-/g, '/') || '-']
                ]
            } else {
                wsData = [
                    ["雇用条件書 (法定フォーマット)", "", "", "", ""], [],
                    ["雇用主 (企業名)", worker.companies?.name_jp || '未配属', "", "労働者氏名", worker.full_name_romaji],
                    ["就業場所", worker.companies?.address || '-', "", "連絡先", worker.companies?.phone || '-'],
                    ["契約期間開始", worker.cert_start_date?.replace(/-/g, '/') || '-', "", "契約期間終了", worker.cert_end_date?.replace(/-/g, '/') || '-']
                ]
            }
            const ws = XLSX.utils.aoa_to_sheet(wsData)
            ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 5 }, { wch: 15 }, { wch: 30 }]
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "法定書類")
            XLSX.writeFile(wb, `${worker.full_name_romaji}_${type === 'meibo' ? '名簿' : '条件書'}.xlsx`)
        } catch (err) { alert('エラーが発生しました') }
        setTimeout(() => setIsExporting(false), 500)
    }

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} disabled={isExporting} className="flex items-center gap-2 px-5 py-2.5 bg-[#311b92] text-white hover:bg-[#4527a0] rounded-full text-sm font-bold transition-colors shadow-sm disabled:opacity-50">
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} strokeWidth={2} />} {isExporting ? '生成中...' : '法定書類を出力'} <ChevronDown size={14} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-md shadow-sm border border-gray-200 py-2 z-50 overflow-hidden">
                    <button onClick={() => generateDoc('meibo')} className="w-full text-left px-4 py-3 text-sm font-bold text-[#1f1f1f] hover:bg-gray-50 transition-colors">📄 技能実習生名簿 (自動作成)</button>
                    <button onClick={() => generateDoc('joken')} className="w-full text-left px-4 py-3 text-sm font-bold text-[#1f1f1f] hover:bg-gray-50 transition-colors border-t border-gray-50">📄 雇用条件書 (自動作成)</button>
                </div>
            )}
        </div>
    )
}
