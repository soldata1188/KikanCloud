'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Worker } from '@/types/schema'
import { redirect } from 'next/navigation'
import { autoScheduleAuditsForWorkers } from '@/app/actions/rpa'

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
        dob: formData.get('dob') as string || '2000-01-01',
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
        nationality: formData.get('nationality') as string || 'ベトナム',
        sending_org: formData.get('sending_org') as string || null,
        industry_field: formData.get('industry_field') as string || null,
        visa_status: formData.get('visa_status') as string || null,
    }

    await supabase.from('workers').insert(newWorker)

    // RPA: Automatically schedule routine audits for the new worker
    await autoScheduleAuditsForWorkers([newWorker as Partial<Worker>])

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
        dob: formData.get('dob') as string || '2000-01-01',
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
        nationality: formData.get('nationality') as string || 'ベトナム',
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
    redirect('/workers')
}

export type ImportWorkerPayload = {
    company_name?: string;
    full_name_romaji?: string;
    dob?: string;
    gender?: string;
    has_spouse?: boolean | null;
    nationality?: string;
    birthplace?: string;
    entry_date?: string;
    zairyu_exp?: string | null;
    visa_status?: string;
    industry_field?: string;
    passport_no?: string | null;
    passport_exp?: string | null;
    address?: string | null;
    japan_residence?: string | null;
};

export async function importWorkers(workersData: ImportWorkerPayload[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
    if (userData?.role !== 'admin') throw new Error('管理者権限が必要です。(Admin only)')
    if (!userData?.tenant_id) throw new Error('Tenant ID not found')

    // 1. Retrieve all host companies and automatically map company names to IDs
    const { data: companies } = await supabase.from('companies').select('id, name_jp').eq('is_deleted', false)

    // Helper function for data processing
    const parseDate = (dateStr?: string | null) => {
        if (!dateStr || String(dateStr).trim() === '') return null;
        const cleanStr = String(dateStr).replace(/\//g, '-');
        const d = new Date(cleanStr);
        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    }

    const mapGender = (text?: string | null) => {
        const t = String(text || '');
        if (t.includes('男')) return 'male'
        if (t.includes('女')) return 'female'
        return 'other'
    }

    const mapNationality = (text?: string | null) => {
        const t = String(text || '');
        if (t.includes('インドネシア')) return 'インドネシア'
        if (t.includes('フィリピン')) return 'フィリピン'
        if (t.includes('カンボジア')) return 'カンボジア'
        return t.trim() || 'ベトナム'
    }

    // 2. Normalize data and convert types
    const payload = workersData.map(w => {
        // STRICT COMPANY MATCHING
        if (!w.company_name || String(w.company_name).trim() === '') {
            throw new Error(`エラー: 配属先企業（Company Name）が未入力の行が存在します。`)
        }

        const foundCompany = companies?.find(c => c.name_jp === String(w.company_name).trim())
        if (!foundCompany) {
            throw new Error(`エラー: 「${w.company_name}」という企業名はシステムに登録されていません。受入企業一覧を先に確認・登録してください。`)
        }

        return {
            tenant_id: userData?.tenant_id,
            company_id: foundCompany.id,
            full_name_romaji: w.full_name_romaji ? String(w.full_name_romaji).toUpperCase().trim() : 'UNKNOWN',
            full_name_kana: '-', // Required by DB Schema
            dob: parseDate(w.dob) || '2000-01-01', // DOB is mandatory
            gender: mapGender(w.gender),
            has_spouse: w.has_spouse,
            nationality: mapNationality(w.nationality),
            birthplace: w.birthplace ? String(w.birthplace).trim() : null,
            entry_date: parseDate(w.entry_date),
            zairyu_exp: parseDate(w.zairyu_exp),
            visa_status: w.visa_status ? String(w.visa_status).trim() : null,
            industry_field: w.industry_field ? String(w.industry_field).trim() : null,
            passport_no: w.passport_no ? String(w.passport_no).trim() : null,
            passport_exp: parseDate(w.passport_exp),
            address: w.birthplace ? String(w.birthplace).trim() : null, // Birthplace mapped to address
            japan_residence: w.japan_residence ? String(w.japan_residence).trim() : null,
            status: 'working',
            system_type: 'ikusei_shuro'
        }
    })

    // 3. Bulk upsert (save array to DB at once, overwrite if conflict on tenant+name+dob)
    const { error } = await supabase.from('workers').upsert(payload, {
        onConflict: 'tenant_id,full_name_romaji,dob'
    })
    if (error) {
        console.error('Import error:', error)
        throw new Error('インポートに失敗しました。日付の形式（YYYY/MM/DD）や重複データを確認してください。')
    }

    // RPA: Automatically schedule routine audits for the inserted workers
    await autoScheduleAuditsForWorkers(payload as Partial<Worker>[])

    revalidatePath('/workers')
    revalidatePath('/companies')
    revalidatePath('/')
    return { success: true, count: payload.length }
}