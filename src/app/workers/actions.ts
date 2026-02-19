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
        passport_exp: formData.get('passport_exp') as string || null,
        avatar_url,
        entry_batch: formData.get('entry_batch') as string || null,
        cert_start_date: formData.get('cert_start_date') as string || null,
        cert_end_date: formData.get('cert_end_date') as string || null,
        insurance_exp: formData.get('insurance_exp') as string || null,
        address: formData.get('address') as string || null,
        nationality: formData.get('nationality') as string || 'VNM',
        sending_org: formData.get('sending_org') as string || null,
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
        passport_exp: formData.get('passport_exp') as string || null,
        avatar_url,
        entry_batch: formData.get('entry_batch') as string || null,
        cert_start_date: formData.get('cert_start_date') as string || null,
        cert_end_date: formData.get('cert_end_date') as string || null,
        insurance_exp: formData.get('insurance_exp') as string || null,
        address: formData.get('address') as string || null,
        nationality: formData.get('nationality') as string || 'VNM',
        sending_org: formData.get('sending_org') as string || null,
    }

    await supabase.from('workers').update(updatedData).eq('id', id)
    revalidatePath('/workers')
    revalidatePath('/')
    redirect('/workers')
}

export async function deleteWorker(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string
    await supabase.from('workers').update({ is_deleted: true }).eq('id', id)
    revalidatePath('/workers')
    revalidatePath('/')
}
