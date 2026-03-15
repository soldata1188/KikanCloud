'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface KenteiData {
    type?: string
    progress?: string
    institution?: string
    location?: string
    exam_date_written?: string
    exam_date_practical?: string
    assignee?: string
    tachiai_person?: string   // maps to kentei_status.witness
    gakka_result?: string
    jitsugi_result?: string
    result_memo?: string
    soegai_memo?: string
}

function toSymbol(result: string | undefined): string {
    if (result === '合格') return '○'
    if (result === '不合格') return '×'
    return '---'
}

export async function updateKenteiRecord(workerId: string, data: KenteiData) {
    const supabase = await createClient()

    const { data: worker } = await supabase
        .from('workers')
        .select('kentei_status')
        .eq('id', workerId)
        .single()

    if (!worker) return { error: 'Worker not found' }

    const current = (worker.kentei_status as Record<string, any>) || {}
    const merged: Record<string, any> = { ...current }

    if (data.type !== undefined) merged.type = data.type
    if (data.progress !== undefined) merged.progress = data.progress
    if (data.institution !== undefined) merged.institution = data.institution
    if (data.location !== undefined) merged.location = data.location
    if (data.exam_date_written !== undefined) merged.exam_date_written = data.exam_date_written || null
    if (data.exam_date_practical !== undefined) merged.exam_date_practical = data.exam_date_practical || null
    if (data.assignee !== undefined) merged.assignee = data.assignee
    if (data.tachiai_person !== undefined) merged.witness = data.tachiai_person
    if (data.result_memo !== undefined) merged.result_memo = data.result_memo
    if (data.soegai_memo !== undefined) merged.soegai_memo = data.soegai_memo

    // Sync gakka_result ↔ exam_result_written for operations compatibility
    if (data.gakka_result !== undefined) {
        merged.gakka_result = data.gakka_result
        merged.exam_result_written = toSymbol(data.gakka_result)
    }
    if (data.jitsugi_result !== undefined) {
        merged.jitsugi_result = data.jitsugi_result
        merged.exam_result_practical = toSymbol(data.jitsugi_result)
    }

    const { error } = await supabase
        .from('workers')
        .update({ kentei_status: merged, updated_at: new Date().toISOString() })
        .eq('id', workerId)

    if (error) return { error: error.message }
    revalidatePath('/kentei')
    revalidatePath('/operations')
    return { success: true }
}

export async function deleteKenteiRecord(workerId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('workers')
        .update({ kentei_status: null, updated_at: new Date().toISOString() })
        .eq('id', workerId)

    if (error) return { error: error.message }
    revalidatePath('/kentei')
    revalidatePath('/operations')
    return { success: true }
}
