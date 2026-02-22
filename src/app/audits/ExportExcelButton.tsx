'use client'
import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'
import { useState } from 'react'

export function ExportExcelButton({ data, month }: { data: any[], month: string }) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = () => {
        setIsExporting(true)
        try {
            if (!data || data.length === 0) {
                alert('出力するデータがありません。')
                setIsExporting(false)
                return
            }

            // 1. Excel出力用にデータをフォーマット (日本語ヘッダーへの標準化)
            const exportData = data.map((row, index) => {
                const audit = row.currentAudit;
                let typeLabel = '-';
                if (audit?.audit_type === 'kansa') typeLabel = '監査(3ヶ月)';
                if (audit?.audit_type === 'homon') typeLabel = '定期訪問';
                if (audit?.audit_type === 'rinji') typeLabel = '臨時対応';

                return {
                    'No.': index + 1,
                    '受入企業名': row.company.name_jp,
                    '在籍人数': `${row.workerCounts.total}名${row.workerCounts.total > 0 ? ` (育成就労: ${row.workerCounts.ikusei}, 特定技能: ${row.workerCounts.tokutei}, 技能実習: ${row.workerCounts.ginou})` : ''}`,
                    '訪問種別': typeLabel,
                    '実施日': audit?.actual_date ? audit.actual_date.replace(/-/g, '/') : (audit?.scheduled_date ? audit.scheduled_date.replace(/-/g, '/') + ' (予定)' : '-'),
                    '担当スタッフ': audit?.pic_name || '-',
                    '前回実績': row.lastTwoAudits && row.lastTwoAudits.length > 0 && row.lastTwoAudits[0].actual_date ? `${row.lastTwoAudits[0].actual_date.replace(/-/g, '/')} (${row.lastTwoAudits[0].audit_type === 'kansa' ? '監査' : row.lastTwoAudits[0].audit_type === 'homon' ? '訪問' : '臨時'})` : 'なし',
                    '特記事項・メモ': audit?.notes || '-'
                }
            });

            // 2. Khởi tạo Worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);

            // 3. 各列の幅を自動調整 (開いた際の見栄えを良くするため)
            ws['!cols'] = [
                { wch: 5 },   // No.
                { wch: 35 },  // 企業名
                { wch: 50 },  // 在籍人数
                { wch: 15 },  // 種別
                { wch: 20 },  // 実施日
                { wch: 22 },  // 担当スタッフ
                { wch: 25 },  // 前回実績
                { wch: 50 },  // メモ
            ];

            // 4. Khởi tạo Workbook và Gắn Sheet vào
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, `${month.replace('-', '年')}月 訪問スケジュール`);

            // 5. ファイルをダウンロード (ファイル名にフィルタリング中の月を含む)
            XLSX.writeFile(wb, `監査訪問スケジュール_${month.replace('-', '年')}月度.xlsx`);
        } catch (error) {
            console.error('Export Error:', error)
            alert('エクスポート中にエラーが発生しました。')
        }
        setTimeout(() => setIsExporting(false), 500)
    }

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="h-[32px] px-3 bg-white border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-300 text-[#1f1f1f] rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
            title="現在表示されているリストをExcelでダウンロードします"
        >
            <Download size={14} /> {isExporting ? '出力中...' : 'Excel出力'}
        </button>
    )
}
