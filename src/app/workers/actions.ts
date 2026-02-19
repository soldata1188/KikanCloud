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
    }

    const { error } = await supabase.from('workers').insert(newWorker)
    if (error) console.error('Insert error:', error)

    revalidatePath('/workers')
    revalidatePath('/')
    redirect('/workers')
}

export async function deleteWorker(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string
    const { error } = await supabase.from('workers').update({ is_deleted: true }).eq('id', id)
    if (error) console.error('Delete error:', error)
    revalidatePath('/workers')
    revalidatePath('/')
}
