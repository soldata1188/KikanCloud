'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─────────────────────────────────────────────────────────────────────────────
// Geocoding helper (server-side, called ONCE on save — zero client cost)
// Uses Google Maps Geocoding API with the server-only key
// ─────────────────────────────────────────────────────────────────────────────
async function geocodeAddress(address: string | null): Promise<{ latitude: number | null; longitude: number | null }> {
    if (!address?.trim()) return { latitude: null, longitude: null }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return { latitude: null, longitude: null }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=ja&key=${apiKey}`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return { latitude: null, longitude: null }

        const json = await res.json()
        if (json.status !== 'OK' || !json.results?.[0]) return { latitude: null, longitude: null }

        const loc = json.results[0].geometry.location
        return { latitude: loc.lat, longitude: loc.lng }
    } catch {
        return { latitude: null, longitude: null }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────
export async function createCompany(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()

    const address = formData.get('address') as string || null

    // ── Geocode once on server ──────────────────────────────────
    const { latitude, longitude } = await geocodeAddress(address)

    const newCompany = {
        tenant_id: userData?.tenant_id,
        name_jp: formData.get('name_jp') as string,
        name_kana: formData.get('name_kana') as string || null,
        name_romaji: formData.get('name_romaji') as string || null,
        corporate_number: formData.get('corporate_number') as string || null,
        postal_code: formData.get('postal_code') as string || null,
        address,
        latitude,
        longitude,
        phone: formData.get('phone') as string || null,
        email: formData.get('email') as string || null,
        industry: formData.get('industry') as string || null,
        accepted_occupations: formData.get('accepted_occupations') as string || null,
        representative: formData.get('representative') as string || null,
        representative_romaji: formData.get('representative_romaji') as string || null,
        manager_name: formData.get('manager_name') as string || null,
        training_date: formData.get('training_date') as string || null,
        pic_name: formData.get('pic_name') as string || null,
        guidance_manager: formData.get('guidance_manager') as string || null,
        life_advisor: formData.get('life_advisor') as string || null,
        tech_advisor: formData.get('tech_advisor') as string || null,
        employee_count: formData.get('employee_count') ? parseInt(formData.get('employee_count') as string) : null,
        labor_insurance_number: formData.get('labor_insurance_number') as string || null,
        employment_insurance_number: formData.get('employment_insurance_number') as string || null,
        acceptance_notification_number: formData.get('acceptance_notification_number') as string || null,
        acceptance_notification_date: formData.get('acceptance_notification_date') as string || null,
        general_supervision_fee: formData.get('general_supervision_fee') ? parseFloat(formData.get('general_supervision_fee') as string) : null,
        category_3_supervision_fee: formData.get('category_3_supervision_fee') ? parseFloat(formData.get('category_3_supervision_fee') as string) : null,
        support_fee: formData.get('support_fee') ? parseFloat(formData.get('support_fee') as string) : null,
        remarks: formData.get('remarks') as string || null,
    }

    await supabase.from('companies').insert(newCompany)
    revalidatePath('/companies')
    revalidatePath('/workers')
    revalidatePath('/')
    redirect('/companies')
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────
export async function updateCompany(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const id = formData.get('id') as string
    const address = formData.get('address') as string || null

    // ── Only re-geocode if address actually changed ─────────────
    const { data: existing } = await supabase
        .from('companies')
        .select('address, latitude, longitude')
        .eq('id', id)
        .single()

    let latitude = existing?.latitude ?? null
    let longitude = existing?.longitude ?? null

    const addressChanged = (address ?? '') !== (existing?.address ?? '')
    if (addressChanged) {
        const coords = await geocodeAddress(address)
        latitude = coords.latitude
        longitude = coords.longitude
    }

    const updatedData = {
        name_jp: formData.get('name_jp') as string,
        name_kana: formData.get('name_kana') as string || null,
        name_romaji: formData.get('name_romaji') as string || null,
        corporate_number: formData.get('corporate_number') as string || null,
        postal_code: formData.get('postal_code') as string || null,
        address,
        latitude,
        longitude,
        phone: formData.get('phone') as string || null,
        email: formData.get('email') as string || null,
        industry: formData.get('industry') as string || null,
        accepted_occupations: formData.get('accepted_occupations') as string || null,
        representative: formData.get('representative') as string || null,
        representative_romaji: (formData.get('representative_romaji') || formData.get('representative_kana')) as string || null,
        manager_name: formData.get('manager_name') as string || null,
        training_date: formData.get('training_date') as string || null,
        pic_name: formData.get('pic_name') as string || null,
        guidance_manager: formData.get('guidance_manager') as string || null,
        life_advisor: formData.get('life_advisor') as string || null,
        tech_advisor: formData.get('tech_advisor') as string || null,
        employee_count: formData.get('employee_count') ? parseInt(formData.get('employee_count') as string) : null,
        labor_insurance_number: formData.get('labor_insurance_number') as string || null,
        employment_insurance_number: formData.get('employment_insurance_number') as string || null,
        acceptance_notification_number: (formData.get('acceptance_notification_number') || formData.get('registration_number')) as string || null,
        acceptance_notification_date: formData.get('acceptance_notification_date') as string || null,
        general_supervision_fee: formData.get('general_supervision_fee') ? parseFloat(formData.get('general_supervision_fee') as string) : null,
        category_3_supervision_fee: formData.get('category_3_supervision_fee') ? parseFloat(formData.get('category_3_supervision_fee') as string) : null,
        support_fee: formData.get('support_fee') ? parseFloat(formData.get('support_fee') as string) : null,
        remarks: formData.get('remarks') as string || null,
    }

    const { error } = await supabase.from('companies').update(updatedData).eq('id', id)
    if (error) throw error

    revalidatePath('/companies')
    revalidatePath('/workers')
    revalidatePath('/')

    return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteCompany(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userData?.role !== 'admin') throw new Error('管理者権限が必要です。(Admin only)')
    const id = formData.get('id') as string
    await supabase.from('companies').update({ is_deleted: true }).eq('id', id)
    revalidatePath('/companies')
    revalidatePath('/workers')
    revalidatePath('/')
    redirect('/companies')
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT (bulk CSV — no geocoding to avoid quota spikes)
// ─────────────────────────────────────────────────────────────────────────────
export async function importCompanies(companiesData: { [key: string]: string | number | null }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
    if (userData?.role !== 'admin') throw new Error('管理者権限が必要です。(Admin only)')
    if (!userData?.tenant_id) throw new Error('Tenant ID not found')

    const payload = companiesData.map(c => ({
        tenant_id: userData?.tenant_id,
        name_jp: c.name_jp,
        name_romaji: c.name_romaji || null,
        corporate_number: c.corporate_number || null,
        postal_code: c.postal_code || null,
        address: c.address || null,
        // latitude/longitude intentionally omitted for bulk import:
        // User can open & re-save each record to geocode, or use a separate backfill job.
        phone: c.phone || null,
        email: c.email || null,
        industry: c.industry || null,
        accepted_occupations: c.accepted_occupations || null,
        representative: c.representative || null,
        representative_romaji: c.representative_romaji || null,
        manager_name: c.manager_name || null,
        training_date: c.training_date || null,
        pic_name: c.pic_name || null,
        guidance_manager: c.guidance_manager || null,
        life_advisor: c.life_advisor || null,
        tech_advisor: c.tech_advisor || null,
        employee_count: c.employee_count ? parseInt(c.employee_count as string) : null,
        labor_insurance_number: c.labor_insurance_number || null,
        employment_insurance_number: c.employment_insurance_number || null,
        acceptance_notification_number: c.acceptance_notification_number || null,
        acceptance_notification_date: c.acceptance_notification_date || null,
        general_supervision_fee: c.general_supervision_fee ? parseFloat(c.general_supervision_fee as string) : null,
        category_3_supervision_fee: c.category_3_supervision_fee ? parseFloat(c.category_3_supervision_fee as string) : null,
        support_fee: c.support_fee ? parseFloat(c.support_fee as string) : null,
        remarks: c.remarks || null,
    }))

    const { error } = await supabase.from('companies').insert(payload)
    if (error) {
        throw new Error('インポートに失敗しました。データ形式を確認してください。')
    }

    revalidatePath('/companies')
    revalidatePath('/workers')
    revalidatePath('/')
    return { success: true, count: payload.length }
}
