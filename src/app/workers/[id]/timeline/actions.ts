'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertTimelineProcedure(workerId: string, companyId: string | null, procedureName: string, agency: string, status: string, targetDateStr: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    const targetDate = targetDateStr.replace(/\//g, '-') + '-01'
    const { data: existing } = await supabase.from('procedures').select('id').eq('worker_id', workerId).eq('procedure_name', procedureName).eq('is_deleted', false).single()

    if (status === 'none') {
        if (existing) await supabase.from('procedures').update({ is_deleted: true }).eq('id', existing.id);
    } else {
        let payload: any = { status, target_date: targetDate }
        if (status === 'submitted') payload.submitted_date = new Date().toISOString()
        if (status === 'completed') payload.completed_date = new Date().toISOString()

        if (existing) {
            await supabase.from('procedures').update(payload).eq('id', existing.id)
        } else {
            payload.tenant_id = userData?.tenant_id; payload.company_id = companyId; payload.worker_id = workerId;
            payload.procedure_name = procedureName; payload.agency = agency;
            await supabase.from('procedures').insert(payload)
        }
    }

    revalidatePath(`/workers/${workerId}/timeline`)
    revalidatePath(`/procedures`)
}
