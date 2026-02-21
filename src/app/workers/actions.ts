'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createWorker(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    const companyId = formData.get('company_id') as string

    let avatar_url = null;
    const avatarFile = formData.get('avatar_file') as File;
    if (avatarFile && avatarFile.size > 0) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { data, error } = await supabase.storage.from('avatars').upload(`workers/${fileName}`, avatarFile);
        if (!error && data) {
            avatar_url = supabase.storage.from('avatars').getPublicUrl(data.path).data.publicUrl;
        }
    }

    const newWorker = {
        tenant_id: userData?.tenant_id,
        full_name_romaji: (formData.get('full_name_romaji') as string).toUpperCase(),
        full_name_kana: formData.get('full_name_kana') as string,
        dob: formData.get('dob') as string,
        company_id: companyId ? companyId : null,
        system_type: formData.get('system_type') as string,
        status: formData.get('status') as string,
        entry_date: formData.get('entry_date') as string || null,
        zairyu_no: formData.get('zairyu_no') as string || null,
        zairyu_exp: formData.get('zairyu_exp') as string || null,
        passport_no: (formData.get('passport_no') as string)?.toUpperCase() || null,
        passport_exp: formData.get('passport_exp') as string || null,
        avatar_url,
        entry_batch: formData.get('entry_batch') as string || null,
        cert_start_date: formData.get('cert_start_date') as string || null,
        cert_end_date: formData.get('cert_end_date') as string || null,
        insurance_exp: formData.get('insurance_exp') as string || null,
        address: formData.get('address') as string || null,
        nationality: formData.get('nationality') as string || 'VNM',
        sending_org: formData.get('sending_org') as string || null,
        industry_field: formData.get('industry_field') as string || null,
        visa_status: formData.get('visa_status') as string || null,
    }

    await supabase.from('workers').insert(newWorker)
    revalidatePath('/workers')
    revalidatePath('/')
    redirect('/workers')
}

export async function updateWorker(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const id = formData.get('id') as string
    const companyId = formData.get('company_id') as string

    let avatar_url = formData.get('existing_avatar_url') as string || null;
    const avatarFile = formData.get('avatar_file') as File;
    if (avatarFile && avatarFile.size > 0) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { data, error } = await supabase.storage.from('avatars').upload(`workers/${fileName}`, avatarFile);
        if (!error && data) {
            avatar_url = supabase.storage.from('avatars').getPublicUrl(data.path).data.publicUrl;
        }
    }

    const updatedData = {
        full_name_romaji: (formData.get('full_name_romaji') as string).toUpperCase(),
        full_name_kana: formData.get('full_name_kana') as string,
        dob: formData.get('dob') as string,
        company_id: companyId ? companyId : null,
        system_type: formData.get('system_type') as string,
        status: formData.get('status') as string,
        entry_date: formData.get('entry_date') as string || null,
        zairyu_no: formData.get('zairyu_no') as string || null,
        zairyu_exp: formData.get('zairyu_exp') as string || null,
        passport_no: (formData.get('passport_no') as string)?.toUpperCase() || null,
        passport_exp: formData.get('passport_exp') as string || null,
        avatar_url,
        entry_batch: formData.get('entry_batch') as string || null,
        cert_start_date: formData.get('cert_start_date') as string || null,
        cert_end_date: formData.get('cert_end_date') as string || null,
        insurance_exp: formData.get('insurance_exp') as string || null,
        address: formData.get('address') as string || null,
        nationality: formData.get('nationality') as string || 'VNM',
        sending_org: formData.get('sending_org') as string || null,
        industry_field: formData.get('industry_field') as string || null,
        visa_status: formData.get('visa_status') as string || null,
    }

    await supabase.from('workers').update(updatedData).eq('id', id)
    revalidatePath('/workers')
    revalidatePath('/')
    redirect('/workers')
}

export async function deleteWorker(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userData?.role !== 'admin') throw new Error('管理者権限が必要です。(Admin only)')
    const id = formData.get('id') as string
    await supabase.from('workers').update({ is_deleted: true }).eq('id', id)
    revalidatePath('/workers')
    revalidatePath('/')
}

export async function importWorkers(workersData: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
    if (userData?.role !== 'admin') throw new Error('管理者権限が必要です。(Admin only)')

    // 1. 全受入企業を取得し、企業名からIDを自動マッピング
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false)

    // データ処理用ヘルパー関数
    const parseDate = (dateStr: string) => {
        if (!dateStr || String(dateStr).trim() === '') return null;
        const cleanStr = String(dateStr).replace(/\//g, '-');
        const d = new Date(cleanStr);
        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    }

    const mapSystemType = (text: string) => {
        const t = String(text || '');
        if (t.includes('育成就労')) return 'ikusei_shuro'
        if (t.includes('特定技能')) return 'tokuteigino'
        return 'ginou_jisshu'
    }

    const mapStatus = (text: string) => {
        const t = String(text || '');
        if (t.includes('待機') || t.includes('入国待')) return 'waiting'
        if (t.includes('失踪')) return 'missing'
        if (t.includes('帰国')) return 'returned'
        return 'working' // Default là Đang làm việc
    }

    const mapNationality = (text: string) => {
        const t = String(text || '');
        if (t.includes('インドネシア')) return 'IDN'
        if (t.includes('フィリピン')) return 'PHL'
        if (t.includes('ミャンマー')) return 'MMR'
        if (t.includes('中国')) return 'CHN'
        return 'VNM'
    }

    // 2. データの正規化と型変換
    const payload = workersData.map(w => {
        // Excelに企業名が入力されている場合、Company IDを検索
        let cId = null;
        if (w.company_name) {
            const found = companies?.find(c => c.name_jp === String(w.company_name).trim())
            if (found) cId = found.id
        }

        return {
            tenant_id: userData?.tenant_id,
            full_name_romaji: w.full_name_romaji ? String(w.full_name_romaji).toUpperCase().trim() : 'UNKNOWN',
            full_name_kana: w.full_name_kana ? String(w.full_name_kana).trim() : '-',
            dob: parseDate(w.dob) || '2000-01-01', // 生年月日は必須
            company_id: cId,
            system_type: mapSystemType(w.system_type),
            status: mapStatus(w.status),
            zairyu_no: w.zairyu_no ? String(w.zairyu_no).toUpperCase().trim() : null,
            entry_date: parseDate(w.entry_date),
            passport_exp: parseDate(w.passport_exp),
            cert_start_date: parseDate(w.cert_start_date),
            cert_end_date: parseDate(w.cert_end_date),
            insurance_exp: parseDate(w.insurance_exp),
            entry_batch: w.entry_batch ? String(w.entry_batch).trim() : null,
            nationality: mapNationality(w.nationality),
            sending_org: w.sending_org ? String(w.sending_org).trim() : null,
            address: w.address ? String(w.address).trim() : null,
        }
    })

    // 3. バルクインサート (配列を一度にDBへ保存)
    const { error } = await supabase.from('workers').insert(payload)
    if (error) {
        console.error('Worker Import Error:', error)
        throw new Error('インポートに失敗しました。日付の形式（YYYY/MM/DD）等を確認してください。')
    }

    revalidatePath('/workers')
    revalidatePath('/companies')
    revalidatePath('/')
    return { success: true, count: payload.length }
}
