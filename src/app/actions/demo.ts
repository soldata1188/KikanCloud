'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clearDemoData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    const tenant_id = userData?.tenant_id

    // Xóa an toàn: Chỉ xóa những record chứa chữ DEMO (Thứ tự: Audits -> Workers -> Companies)
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
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    const tenant_id = userData?.tenant_id

    // 1. Dọn dẹp Demo cũ trước khi tạo mới để tránh rác
    await clearDemoData()

    // Các mốc thời gian động để kích hoạt Cảnh báo
    const today = new Date()
    const past5Days = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const next10Days = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const next2Years = new Date(today.getTime() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // 2. Tạo 5 Xí nghiệp DEMO
    const companies = [
        { tenant_id, name_jp: 'トヨタ自動車 (DEMO)', address: '愛知県豊田市', corporate_number: '1111111111111' },
        { tenant_id, name_jp: 'ソニー (DEMO)', address: '東京都港区', corporate_number: '2222222222222' },
        { tenant_id, name_jp: 'ホンダ (DEMO)', address: '東京都港区', corporate_number: '3333333333333' },
        { tenant_id, name_jp: 'パナソニック (DEMO)', address: '大阪府門真市', corporate_number: '4444444444444' },
        { tenant_id, name_jp: '任天堂 (DEMO)', address: '京都府京都市', corporate_number: '5555555555555' }
    ]
    const { data: insertedCompanies } = await supabase.from('companies').insert(companies).select()
    if (!insertedCompanies) throw new Error('Failed to insert companies')

    // 3. Tạo 5 Người lao động DEMO (Đa dạng trạng thái rủi ro)
    const workers = [
        { tenant_id, company_id: insertedCompanies[0].id, full_name_romaji: 'NGUYEN VAN A (DEMO)', full_name_kana: 'グエン ヴァン ア', dob: '2000-01-01', system_type: 'tokuteigino', status: 'working', passport_exp: next30Days, zairyu_no: 'DM00000001', nationality: 'VNM' }, // Cảnh báo Đỏ (Sắp hết hạn)
        { tenant_id, company_id: insertedCompanies[1].id, full_name_romaji: 'TRAN THI B (DEMO)', full_name_kana: 'トラン ティ ビー', dob: '2001-02-02', system_type: 'ikusei_shuro', status: 'missing', passport_exp: next2Years, zairyu_no: 'DM00000002', nationality: 'VNM' }, // Bỏ trốn
        { tenant_id, company_id: insertedCompanies[2].id, full_name_romaji: 'LE VAN C (DEMO)', full_name_kana: 'レ ヴァン シー', dob: '1999-03-03', system_type: 'ginou_jisshu', status: 'waiting', passport_exp: next2Years, zairyu_no: 'DM00000003', nationality: 'VNM' }, // Chờ bay
        { tenant_id, company_id: insertedCompanies[3].id, full_name_romaji: 'PHAM THI D (DEMO)', full_name_kana: 'ファム ティ ディー', dob: '1998-04-04', system_type: 'tokuteigino', status: 'returned', passport_exp: next2Years, zairyu_no: 'DM00000004', nationality: 'VNM' }, // Về nước
        { tenant_id, company_id: insertedCompanies[4].id, full_name_romaji: 'HOANG VAN E (DEMO)', full_name_kana: 'ホアン ヴァン イー', dob: '2002-05-05', system_type: 'ikusei_shuro', status: 'working', passport_exp: next2Years, zairyu_no: 'DM00000005', nationality: 'VNM' } // An toàn
    ]
    await supabase.from('workers').insert(workers)

    // 4. Tạo Lịch Kansa DEMO (Đủ 4 Level rủi ro cho Ma trận)
    const audits = [
        { tenant_id, company_id: insertedCompanies[0].id, audit_type: 'kansa', scheduled_date: past5Days, status: 'planned', pic_name: 'Admin', notes: '[DEMO]' }, // Ưu tiên 1 (Đỏ rực): Trễ hạn
        { tenant_id, company_id: insertedCompanies[1].id, audit_type: 'homon', scheduled_date: next10Days, status: 'planned', pic_name: 'Admin', notes: '[DEMO]' }, // Ưu tiên 4 (Xanh dương): Lịch an toàn
        { tenant_id, company_id: insertedCompanies[2].id, audit_type: 'kansa', scheduled_date: past5Days, actual_date: past5Days, status: 'completed', pic_name: 'Admin', notes: '[DEMO]' }, // Ưu tiên 5 (Đáy): Xong
        // Xưởng 3 và 4 cố tình không tạo lịch để rơi vào Ưu tiên 2 (Cam): Quên lên lịch
    ]
    await supabase.from('audits').insert(audits)

    revalidatePath('/', 'layout')
    return { success: true }
}
