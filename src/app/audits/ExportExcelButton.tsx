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

            // 1. Format lại dữ liệu cho đẹp để xuất Excel (Chuẩn hóa Header tiếng Nhật)
            const exportData = data.map((row, index) => {
                const audit = row.currentAudit;
                let typeLabel = '-';
                if (audit?.audit_type === 'kansa') typeLabel = '監査(3ヶ月)';
                if (audit?.audit_type === 'homon') typeLabel = '定期訪問';
                if (audit?.audit_type === 'rinji') typeLabel = '臨時対応';

                return {
                    'No.': index + 1,
                    '優先度 (Mức độ Rủi ro)': row.priority === 1 ? '1_超過 (緊急)' : row.priority === 2 ? '2_未作成' : row.priority === 4 ? '3_予定あり' : '4_完了済',
                    '受入企業名 (Tên Xí nghiệp)': row.company.name_jp,
                    '在籍人数 (Số lượng)': `${row.workerCounts.total}名${row.workerCounts.total > 0 ? ` (育成就労: ${row.workerCounts.ikusei}, 特定技能: ${row.workerCounts.tokutei}, 技能実習: ${row.workerCounts.ginou})` : ''}`,
                    '今月の状況 (Tình trạng)': row.statusLabel.text,
                    '訪問種別 (Loại)': typeLabel,
                    '予定日 (Ngày dự kiến)': audit?.scheduled_date ? audit.scheduled_date.replace(/-/g, '/') : '未定',
                    '実施日 (Ngày thực tế)': audit?.actual_date ? audit.actual_date.replace(/-/g, '/') : '-',
                    '担当スタッフ (Người phụ trách)': audit?.pic_name || '-',
                    '前回実績 (Lịch sử lần trước)': row.lastVisit ? `${row.lastVisit.actual_date.replace(/-/g, '/')} (${row.lastVisit.audit_type === 'kansa' ? '監査' : '訪問'})` : 'なし'
                }
            });

            // 2. Khởi tạo Worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);

            // 3. Tùy chỉnh độ rộng các cột (Auto-width) cho đẹp mắt khi mở lên
            ws['!cols'] = [
                { wch: 5 },   // No.
                { wch: 22 },  // 優先度
                { wch: 35 },  // 企業名
                { wch: 50 },  // 在籍人数
                { wch: 18 },  // 状況
                { wch: 15 },  // 種別
                { wch: 15 },  // 予定日
                { wch: 15 },  // 実施日
                { wch: 22 },  // 担当スタッフ
                { wch: 25 },  // 前回実績
            ];

            // 4. Khởi tạo Workbook và Gắn Sheet vào
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, `${month.replace('-', '年')}月 訪問スケジュール`);

            // 5. Tải xuống file (Tên file chứa luôn tháng đang lọc)
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
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#e1e5ea] hover:bg-[#e6f4ea] hover:text-[#137333] hover:border-[#a8dab5] text-[#444746] rounded-full text-sm font-bold transition-colors shadow-sm shrink-0 disabled:opacity-50"
            title="現在表示されているリストをExcelでダウンロードします"
        >
            <Download size={18} strokeWidth={2.5} /> {isExporting ? '出力中...' : 'Excel出力'}
        </button>
    )
}
