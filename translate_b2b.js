const fs = require('fs');
const path = require('path');

// Dictionary of translations (case-sensitive where applicable)
// Using array of objects to maintain order, longer phrases first for better matching
const translations = [
    // --- Sidebar & Navigation ---
    { from: /"ダッシュボード"/g, to: '"ホーム"' },
    { from: /"Người lao động"/g, to: '"実習生・特定技能"' },
    { from: /"外国人材管理"/g, to: '"実習生一覧"' },
    { from: /"Quản lý xí nghiệp"/g, to: '"受入企業管理"' },
    { from: /"受入企業管理"/g, to: '"受入企業一覧"' },
    { from: /"監査・訪問・面談"/g, to: '"監査・訪問・面談"' },
    { from: /"業務フロー"/g, to: '"業務フロー"' },
    { from: /"業務管理"/g, to: '"業務管理"' },
    { from: /"企業連絡"/g, to: '"企業連絡"' },
    { from: /"ルート最適化"/g, to: '"ルート最適化"' },
    { from: /"AIチャット"/g, to: '"AIチャット"' },
    { from: /"設定"/g, to: '"設定"' },
    { from: /"ログアウト"/g, to: '"ログアウト"' },
    { from: /"Đăng xuất"/g, to: '"ログアウト"' },
    { from: /"Tài khoản"/g, to: '"アカウント"' },
    { from: /"Thông báo"/g, to: '"通知"' },
    { from: /"Tìm kiếm\.\.\."/g, to: '"検索..."' },
    { from: /"Tìm kiếm"/g, to: '"検索"' },

    // --- Common Actions ---
    { from: /"Thêm mới"/g, to: '"新規追加"' },
    { from: /"Gửi"/g, to: '"送信"' },
    { from: /"Lưu"/g, to: '"保存"' },
    { from: /"Cập nhật"/g, to: '"更新"' },
    { from: /"Xóa"/g, to: '"削除"' },
    { from: /"Hủy"/g, to: '"キャンセル"' },
    { from: /"Chỉnh sửa"/g, to: '"編集"' },
    { from: /"Chi tiết"/g, to: '"詳細"' },
    { from: /"Quay lại"/g, to: '"戻る"' },
    { from: /"Đóng"/g, to: '"閉じる"' },
    { from: /"Xác nhận"/g, to: '"確認"' },
    { from: /"In"/g, to: '"印刷"' },
    { from: /"Tải xuống"/g, to: '"ダウンロード"' },
    { from: /"Tải lên"/g, to: '"アップロード"' },

    // --- Common Fields ---
    { from: /"Tên lao động"/g, to: '"氏名"' },
    { from: /"Tên Xí nghiệp"/g, to: '"受入企業名"' },
    { from: /"Tên công ty"/g, to: '"企業名"' },
    { from: /"Trạng thái"/g, to: '"ステータス"' },
    { from: /"Ngày sinh"/g, to: '"生年月日"' },
    { from: /"Giới tính"/g, to: '"性別"' },
    { from: /"Quốc tịch"/g, to: '"国籍"' },
    { from: /"Địa chỉ"/g, to: '"住所"' },
    { from: /"Số điện thoại"/g, to: '"電話番号"' },
    { from: /"Ghi chú"/g, to: '"備考"' },
    { from: /"Tiến độ"/g, to: '"進捗"' },

    // --- Specific replacements found in previous context ---
    { from: />Thêm nhân tài mới</g, to: '>新規実習生追加<' },
    { from: />Thêm nhân tài</g, to: '>新規追加<' },
    { from: />Xuất danh sách</g, to: '>リスト出力<' },
    { from: />Lọc</g, to: '>絞り込み<' },
    { from: />Tất cả</g, to: '>すべて<' },
    { from: />Bỏ lọc</g, to: '>クリア<' },
    { from: />Đang làm việc</g, to: '>就業中<' },
    { from: />Đã về nước</g, to: '>帰国済<' },
    { from: />Chuyển việc</g, to: '>転籍<' },
    { from: />Thoát\/Mất tích</g, to: '>失踪<' },
    { from: />Đang chờ việc</g, to: '>待機中<' },

    // Remaining English Phrases
    { from: />Search...</g, to: '>検索...<' },
    { from: /placeholder="Search..."/g, to: 'placeholder="検索..."' },
    { from: />Signed in as</g, to: '>ログイン中：<' },
    { from: />Online</g, to: '>オンライン<' },
    { from: />Email Address</g, to: '>メールアドレス<' },
    { from: />Role</g, to: '>権限<' },
    { from: />Email</g, to: '>メールアドレス<' },
    { from: /"Tên TTS, Mã thẻ, hoặc Xí nghiệp\.\.\."/g, to: '"実習生名、在留カード番号、または受入企業名..."' },
    { from: /"admin@kikancloud\.com"/g, to: '"admin@kikancloud.com"' }, // keep
    { from: />Nhập ít nhất 2 ký tự để tìm kiếm toàn cầu\.\.\.</g, to: '>全体検索には2文字以上入力してください...<' },
    { from: />Không tìm thấy kết quả cho/g, to: '>検索結果が見つかりません: <' },
    { from: />Hoạt động</g, to: '>アクティブ<' },
    { from: />Tạm khóa</g, to: '>ロック中<' },
    { from: />Vô hiệu hóa</g, to: '>無効化<' },

    // JSX Text Nodes (using Regex with > < boundaries)
    { from: />Tìm kiếm\.\.\.</g, to: '>検索...<' },
    { from: />Tên Xí nghiệp</g, to: '>受入企業名<' },
    { from: />Tên lao động</g, to: '>氏名<' },
    { from: />Lưu</g, to: '>保存<' },
    { from: />Hủy</g, to: '>キャンセル<' },
    { from: />Cập nhật</g, to: '>更新<' },
    { from: />Quay lại</g, to: '>戻る<' },
    { from: />Xóa</g, to: '>削除<' },
    { from: />Hồ sơ</g, to: '>プロフィール<' },
    { from: />Thông tin</g, to: '>情報<' },
    { from: />Tài liệu</g, to: '>ドキュメント<' },
    { from: />Cài đặt</g, to: '>設定<' },
    { from: />Đăng xuất</g, to: '>ログアウト<' },
    { from: />Tạo mới</g, to: '>新規作成<' },
    { from: />Chi tiết</g, to: '>詳細<' },
    { from: />Tải xuống</g, to: '>ダウンロード<' },
    { from: />Lịch sử/g, to: '>履歴<' },

    // Remaining placeholders explicitly
    { from: /placeholder="KikanCloud AI に質問する\.\.\."/g, to: 'placeholder="KikanCloud AI に質問する..."' }, // keep
    { from: /placeholder="例：NGUYEN VAN A、または在留カード番号を入力\.\.\."/g, to: 'placeholder="例：NGUYEN VAN A、または在留カード番号を入力..."' }, // keep
    { from: /placeholder="質問、翻訳、メール作成など、何でも聞いてください\.\.\. \(Shift\+Enterで改行\)"/g, to: 'placeholder="質問、翻訳、メール作成など、何でも聞いてください... (Shift+Enterで改行)"' }, // keep
    { from: /placeholder="例：VINAJAPAN JSC"/g, to: 'placeholder="例：VINAJAPAN JSC"' }, // keep
    { from: /placeholder="例：AB12345678CD"/g, to: 'placeholder="例：AB12345678CD"' }, // keep
    { from: /placeholder="例：C1234567"/g, to: 'placeholder="例：C1234567"' }, // keep
    { from: /placeholder="例：NGUYEN VAN A"/g, to: 'placeholder="例：NGUYEN VAN A"' }, // keep
    { from: /placeholder="例：MIRAI CO\., LTD"/g, to: 'placeholder="例：MIRAI CO., LTD"' }, // keep
    { from: /placeholder="例：YAMADA TARO"/g, to: 'placeholder="例：YAMADA TARO"' }, // keep
    { from: /placeholder="例：example@domain\.com"/g, to: 'placeholder="例：example@domain.com"' }, // keep
    { from: /placeholder="AIにメッセージを送信\.\.\. \(Enterで送信, Shift\+Enterで改行\)"/g, to: 'placeholder="AIにメッセージを送信... (Enterで送信, Shift+Enterで改行)"' }, // keep
    { from: /placeholder="NGUYEN VAN A"/g, to: 'placeholder="NGUYEN VAN A"' }, // keep
    { from: /placeholder="XX123456"/g, to: 'placeholder="XX123456"' }, // keep

    { from: />Tiến độ</g, to: '>進捗<' },
    { from: />Nhân viên</g, to: '>担当者<' },

    // Specifically target Operations Page text
    { from: />Người phụ trách</g, to: '>担当者<' },
    { from: />Số thụ lý</g, to: '>受理番号<' },
];

const targetDir = path.join(__dirname, 'src');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    translations.forEach(t => {
        content = content.replace(t.from, t.to);
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(directoryPath) {
    const files = fs.readdirSync(directoryPath);

    files.forEach(file => {
        const fullPath = path.join(directoryPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (stat.isFile()) {
            const ext = path.extname(fullPath).toLowerCase();
            if (['.tsx', '.ts', '.jsx', '.js', '.html'].includes(ext)) {
                processFile(fullPath);
            }
        }
    });
}

console.log('Starting translation process...');
processDirectory(targetDir);
console.log('Translation process complete.');
