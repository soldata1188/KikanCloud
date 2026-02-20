'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clearDemoData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
    if (userData?.role !== 'admin') throw new Error('Admin only')
    const tenant_id = userData?.tenant_id

    // Xóa rác Demo theo thứ tự khóa ngoại (Procedures -> Audits -> Workers -> Companies)
    await supabase.from('procedures').delete().eq('tenant_id', tenant_id).like('notes', '%[DEMO]%')
    await supabase.from('audits').delete().eq('tenant_id', tenant_id).like('notes', '%[DEMO]%')
    await supabase.from('workers').delete().eq('tenant_id', tenant_id).like('full_name_romaji', '%(DEMO)%')
    await supabase.from('companies').delete().eq('tenant_id', tenant_id).like('name_jp', '%(DEMO)%')

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function injectDemoData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
    if (userData?.role !== 'admin') throw new Error('Admin only')
    const tenant_id = userData?.tenant_id

    await clearDemoData()

    // --- TÍNH TOÁN NGÀY THÁNG ĐỘNG (Dựa theo thời gian thực để luôn kích hoạt Cảnh báo) ---
    const today = new Date()
    const d = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const d_today = d(0)

    // 1. FULL DATA: 5 XÍ NGHIỆP
    const companies = [
        { tenant_id, name_jp: 'トヨタモータース (DEMO)', name_romaji: 'TOYOTA MOTORS', corporate_number: '1234567890123', postal_code: '471-8571', address: '愛知県豊田市トヨタ町1', phone: '0565-28-2121', representative: '豊田 章男', pic_name: '佐藤 健', guidance_manager: '鈴木 一郎' },
        { tenant_id, name_jp: 'ソニーエレクトロニクス (DEMO)', name_romaji: 'SONY ELECTRONICS', corporate_number: '2345678901234', postal_code: '108-0075', address: '東京都港区港南1-7-1', phone: '03-6748-2111', representative: '吉田 憲一郎', pic_name: '田中 次郎', guidance_manager: '高橋 美咲' },
        { tenant_id, name_jp: 'ホンダエンジニアリング (DEMO)', name_romaji: 'HONDA ENGINEERING', corporate_number: '3456789012345', postal_code: '107-8556', address: '東京都港区南青山2-1-1', phone: '03-3423-1111', representative: '三部 敏宏', pic_name: '伊藤 三郎', guidance_manager: '渡辺 健太' },
        { tenant_id, name_jp: 'パナソニックファクトリー (DEMO)', name_romaji: 'PANASONIC FACTORY', corporate_number: '4567890123456', postal_code: '571-8501', address: '大阪府門真市大字門真1006', phone: '06-6908-1121', representative: '楠見 雄規', pic_name: '山本 四郎', guidance_manager: '小林 さくら' },
        { tenant_id, name_jp: '任天堂クリエイツ (DEMO)', name_romaji: 'NINTENDO CREATES', corporate_number: '5678901234567', postal_code: '601-8501', address: '京都府京都市南区上鳥羽鉾立町11-1', phone: '075-662-9600', representative: '古川 俊太郎', pic_name: '中村 五郎', guidance_manager: '加藤 雄大' }
    ]
    const { data: insertedComps } = await supabase.from('companies').insert(companies).select()
    if (!insertedComps) throw new Error('Insert companies failed')

    // 2. FULL DATA: 6 NGƯỜI LAO ĐỘNG (Sinh hình Avatar động cho sống động)
    const getAvatar = (name: string, bg: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=256&font-size=0.4&bold=true`

    const workers = [
        // 🔴 Báo đỏ (Hộ chiếu < 90 ngày)
        { tenant_id, company_id: insertedComps[0].id, full_name_romaji: 'NGUYEN VAN A (DEMO)', full_name_kana: 'グエン ヴァン ア', dob: '1998-05-15', system_type: 'tokuteigino', status: 'working', entry_date: '2023-04-01', zairyu_no: 'AB12345678CD', passport_exp: d(45), cert_start_date: '2023-04-01', cert_end_date: d(800), insurance_exp: d(800), entry_batch: '特定技能1期', nationality: 'VNM', address: '愛知県豊田市平山町2', sending_org: 'VINAJAPAN JSC', avatar_url: getAvatar('NA', '4285F4') },
        // 🚨 Mất tích
        { tenant_id, company_id: insertedComps[1].id, full_name_romaji: 'TRAN THI B (DEMO)', full_name_kana: 'トラン ティ ビー', dob: '2001-08-22', system_type: 'ikusei_shuro', status: 'missing', entry_date: '2024-01-10', zairyu_no: 'CD23456789EF', passport_exp: d(900), cert_start_date: '2024-01-10', cert_end_date: d(900), insurance_exp: d(900), entry_batch: '育成就労第1期', nationality: 'VNM', address: '不明', sending_org: 'VIETNAM HR', avatar_url: getAvatar('TB', 'EA4335') },
        // 🔴 Báo đỏ (Nintei < 90 ngày)
        { tenant_id, company_id: insertedComps[2].id, full_name_romaji: 'BUDI SANTOSO (DEMO)', full_name_kana: 'ブディ サントソ', dob: '1999-12-05', system_type: 'ginou_jisshu', status: 'working', entry_date: '2022-10-15', zairyu_no: 'EF34567890GH', passport_exp: d(1000), cert_start_date: '2022-10-15', cert_end_date: d(30), insurance_exp: d(1000), entry_batch: '技能実習5期', nationality: 'IDN', address: '東京都港区...', sending_org: 'PT LPK INDO', avatar_url: getAvatar('BS', 'FABB05') },
        // 🟡 Chờ nhập cảnh
        { tenant_id, company_id: null, full_name_romaji: 'MARIA SANTOS (DEMO)', full_name_kana: 'マリア サントス', dob: '2000-03-30', system_type: 'tokuteigino', status: 'waiting', entry_date: null, zairyu_no: null, passport_exp: d(1200), cert_start_date: null, cert_end_date: null, insurance_exp: null, entry_batch: '特定技能(比)', nationality: 'PHL', address: null, sending_org: 'PHIL MANPOWER', avatar_url: getAvatar('MS', 'E91E63') },
        // ⚪ Đã về nước
        { tenant_id, company_id: insertedComps[4].id, full_name_romaji: 'WANG WEI (DEMO)', full_name_kana: 'ワン ウェイ', dob: '1995-11-11', system_type: 'ikusei_shuro', status: 'returned', entry_date: '2020-04-01', zairyu_no: 'IJ56789012KL', passport_exp: d(-50), cert_start_date: '2020-04-01', cert_end_date: d(-50), insurance_exp: d(-50), entry_batch: '育成就労(中国)', nationality: 'CHN', address: '帰国済み', sending_org: 'CHINA HR', avatar_url: getAvatar('WW', '9C27B0') },
        // 🟢 An toàn
        { tenant_id, company_id: insertedComps[3].id, full_name_romaji: 'LE VAN C (DEMO)', full_name_kana: 'レ ヴァン シー', dob: '2000-01-01', system_type: 'tokuteigino', status: 'working', entry_date: '2024-05-15', zairyu_no: 'XY11223344ZZ', passport_exp: d(800), cert_start_date: '2024-05-15', cert_end_date: d(800), insurance_exp: d(800), entry_batch: '第5期生', nationality: 'VNM', address: '大阪府門真市...', sending_org: 'VINAJAPAN JSC', avatar_url: getAvatar('LC', '34A853') }
    ]
    const { data: insertedWorkers } = await supabase.from('workers').insert(workers).select()

    // 3. FULL DATA: MA TRẬN KANSA/HOMON
    const audits = [
        // 🔴 Trễ hạn (Cố tình set ngày quá khứ)
        { tenant_id, company_id: insertedComps[0].id, audit_type: 'kansa', scheduled_date: d(-3), status: 'planned', pic_name: 'デモ管理者', notes: '[DEMO] 監査報告書の作成が遅れています。至急訪問してください。' },
        // 🔵 Tương lai an toàn
        { tenant_id, company_id: insertedComps[1].id, audit_type: 'homon', scheduled_date: d(15), status: 'planned', pic_name: '鈴木 スタッフ', notes: '[DEMO] 通常の定期訪問予定です。アパート巡回も実施。' },
        // 🟢 Đã xong
        { tenant_id, company_id: insertedComps[2].id, audit_type: 'kansa', scheduled_date: d(-10), actual_date: d(-10), status: 'completed', pic_name: '田中 スタッフ', notes: '[DEMO] 監査完了。問題なし。' },
        // ⚪ Lịch sử cũ (Tháng trước)
        { tenant_id, company_id: insertedComps[0].id, audit_type: 'homon', scheduled_date: d(-30), actual_date: d(-30), status: 'completed', pic_name: 'デモ管理者', notes: '[DEMO] 先月の記録' }
        // Cố tình bỏ qua Công ty [3] và [4] để kích hoạt trạng thái 🟠 Cam (Quên lên lịch) trên Ma trận
    ]
    await supabase.from('audits').insert(audits)

    // 4. FULL DATA: THỦ TỤC HÀNH CHÍNH (Procedures Kanban)
    const procedures = [
        // 🔴 Nyukan: Có vấn đề (Lỗi hồ sơ)
        { tenant_id, worker_id: null, company_id: insertedComps[1].id, agency: 'nyukan', procedure_name: '在留資格認定証明書交付申請', status: 'issue', target_date: d(-2), submitted_date: d(-15), pic_name: 'デモ管理者', notes: '[DEMO] 🚨 入管から追加資料（雇用条件書）の提出を求められています。至急対応！' },
        // 🟠 Nyukan: Khẩn cấp (Sắp đến hạn nộp)
        { tenant_id, worker_id: insertedWorkers?.[0].id, company_id: insertedComps[0].id, agency: 'nyukan', procedure_name: '在留期間更新許可申請', status: 'preparing', target_date: d(5), pic_name: 'ビザ担当 鈴木', notes: '[DEMO] 在留期限が近いため、早急に書類を作成して提出すること。' },
        // 🔵 OTIT: Đang nộp chờ kết quả
        { tenant_id, worker_id: insertedWorkers?.[1].id, company_id: insertedComps[0].id, agency: 'kikou', procedure_name: '技能実習計画認定申請', status: 'submitted', target_date: d(-5), submitted_date: d(-3), pic_name: '認定担当 田中', notes: '[DEMO] 機構へ電子申請済み。現在審査待ちです。' },
        // 🟢 Kentei: Đã hoàn thành (Thi đỗ)
        { tenant_id, worker_id: insertedWorkers?.[5].id, company_id: insertedComps[3].id, agency: 'kentei', procedure_name: '随時3級 技能検定', status: 'completed', target_date: d(-30), submitted_date: d(-30), completed_date: d(-5), pic_name: '検定担当 高橋', notes: '[DEMO] 無事に実技・学科ともに合格しました！証書受領済。' }
    ]
    await supabase.from('procedures').insert(procedures)

    revalidatePath('/', 'layout')
    return { success: true }
}
