'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TransferType = 'airport_pickup' | 'airport_dropoff' | 'repatriation' | 'hospital' | 'other'
export type TransferStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface TransferScheduleInput {
    worker_id: string
    company_id: string
    type: TransferType
    scheduled_date: string
    scheduled_time?: string
    departure_location?: string
    destination?: string
    flight_number?: string
    status?: TransferStatus
    pic_name?: string
    notes?: string
}

export async function getTransferSchedules() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('transfer_schedules')
        .select(`
            *,
            workers!inner(id, full_name, nationality),
            companies!inner(id, name_jp)
        `)
        .eq('is_deleted', false)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
    if (error) throw error
    return data ?? []
}

export async function createTransferSchedule(input: TransferScheduleInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'No tenant' }

    const { error } = await supabase.from('transfer_schedules').insert({
        ...input,
        tenant_id: profile.tenant_id,
    })
    if (error) return { error: error.message }
    revalidatePath('/transfer')
    return { success: true }
}

export async function updateTransferSchedule(id: string, input: Partial<TransferScheduleInput>) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('transfer_schedules')
        .update(input)
        .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/transfer')
    return { success: true }
}

export async function updateTransferStatus(id: string, status: TransferStatus) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('transfer_schedules')
        .update({ status })
        .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/transfer')
    return { success: true }
}

export async function deleteTransferSchedule(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('transfer_schedules')
        .update({ is_deleted: true })
        .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/transfer')
    return { success: true }
}
