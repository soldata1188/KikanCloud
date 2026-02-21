'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getScheduleEntries(startDate: string, endDate: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .rpc('get_schedule_entries_by_user', {
            p_start_date: startDate,
            p_end_date: endDate
        })

    if (error) {
        console.error('Error fetching schedule entries:', error)
        return []
    }

    return data || []
}

export async function saveScheduleEntry(entryDate: string, rowIndex: number, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Execute UPSERT or DELETE securely via the database RPC function
    const { error } = await supabase
        .rpc('save_schedule_entry_by_user', {
            p_date: entryDate,
            p_row: rowIndex,
            p_content: content
        })

    if (error) {
        console.error('Error saving schedule entry:', error)
        throw new Error(error.message)
    }

    // No need to revalidate path because we handle state purely on the client side without router refreshes,
    // but doing so ensures if they reload it's correct.
    return { success: true }
}
