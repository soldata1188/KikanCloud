'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getScheduleEntries(startDate: string, endDate: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('schedule_entries')
        .select('entry_date, row_index, content')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)

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

    if (!content || content.trim() === '') {
        // If empty, we can just delete the entry to save space
        const { error } = await supabase
            .from('schedule_entries')
            .delete()
            .match({
                entry_date: entryDate,
                row_index: rowIndex
            })

        if (error) {
            console.error('Error deleting schedule entry:', error)
            throw new Error(error.message)
        }
        return { success: true }
    }

    // Upsert
    const { error } = await supabase
        .from('schedule_entries')
        .upsert({
            entry_date: entryDate,
            row_index: rowIndex,
            content: content
        }, {
            onConflict: 'tenant_id,entry_date,row_index'
        })

    if (error) {
        console.error('Error saving schedule entry:', error)
        throw new Error(error.message)
    }

    // No need to revalidate path because we handle state purely on the client side without router refreshes,
    // but doing so ensures if they reload it's correct.
    return { success: true }
}
