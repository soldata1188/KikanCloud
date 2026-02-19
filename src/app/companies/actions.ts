'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCompany(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()

    const newCompany = {
        tenant_id: userData?.tenant_id,
        name_jp: formData.get('name_jp') as string,
        name_romaji: formData.get('name_romaji') as string || null,
        corporate_number: formData.get('corporate_number') as string || null,
        postal_code: formData.get('postal_code') as string || null,
        address: formData.get('address') as string || null,
        phone: formData.get('phone') as string || null,
        representative: formData.get('representative') as string || null,
        pic_name: formData.get('pic_name') as string || null,
        guidance_manager: formData.get('guidance_manager') as string || null,
    }

    await supabase.from('companies').insert(newCompany)
    revalidatePath('/companies')
    revalidatePath('/workers')
    revalidatePath('/')
    redirect('/companies')
}

export async function updateCompany(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    const updatedData = {
        name_jp: formData.get('name_jp') as string,
        name_romaji: formData.get('name_romaji') as string || null,
        corporate_number: formData.get('corporate_number') as string || null,
        postal_code: formData.get('postal_code') as string || null,
        address: formData.get('address') as string || null,
        phone: formData.get('phone') as string || null,
        representative: formData.get('representative') as string || null,
        pic_name: formData.get('pic_name') as string || null,
        guidance_manager: formData.get('guidance_manager') as string || null,
    }

    await supabase.from('companies').update(updatedData).eq('id', id)
    revalidatePath('/companies')
    revalidatePath('/workers')
    revalidatePath('/')
    redirect('/companies')
}

export async function deleteCompany(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string
    await supabase.from('companies').update({ is_deleted: true }).eq('id', id)
    revalidatePath('/companies')
    revalidatePath('/workers')
    revalidatePath('/')
}

export async function importCompanies(companiesData: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()

    // Chuẩn hóa dữ liệu trước khi insert
    const payload = companiesData.map(c => ({
        tenant_id: userData?.tenant_id,
        name_jp: c.name_jp,
        name_romaji: c.name_romaji || null,
        corporate_number: c.corporate_number || null,
        postal_code: c.postal_code || null,
        address: c.address || null,
        phone: c.phone || null,
        representative: c.representative || null,
        pic_name: c.pic_name || null,
        guidance_manager: c.guidance_manager || null,
    }))

    const { error } = await supabase.from('companies').insert(payload)
    if (error) {
        console.error('Import Error:', error)
        throw new Error('インポートに失敗しました。データ形式を確認してください。')
    }

    revalidatePath('/companies')
    revalidatePath('/workers')
    revalidatePath('/')
    return { success: true, count: payload.length }
}
