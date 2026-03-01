'use server'
import { createClient } from '@/lib/supabase/server'
import { Worker } from '@/types/schema'

/**
 * Automates the creation of 1st, 3rd, and 6th-month regular audits
 * for newly registered Technical Interns (Ginou Jisshu) or Specified Skilled Workers (Ikusei Shuro).
 */
export async function autoScheduleAuditsForWorkers(workers: Partial<Worker>[]) {
    const auditsToInsert: any[] = [];

    workers.forEach(worker => {
        // Only schedule if we have a company and tenant
        if (!worker.company_id || !worker.tenant_id) return;

        // Base date is entry_date or cert_start_date or strictly today
        const baseDateStr = worker.entry_date || worker.cert_start_date || new Date().toISOString().split('T')[0];
        const baseDate = new Date(baseDateStr);

        if (isNaN(baseDate.getTime())) return;

        // Schedule 1st, 3rd, 6th month audits
        [1, 3, 6].forEach(months => {
            const scheduledDate = new Date(baseDate);
            scheduledDate.setMonth(scheduledDate.getMonth() + months);

            auditsToInsert.push({
                tenant_id: worker.tenant_id,
                company_id: worker.company_id,
                audit_type: 'kansa',
                status: 'planned',
                scheduled_date: scheduledDate.toISOString().split('T')[0],
                notes: `システム自動生成: ${worker.full_name_romaji} 様の入国/配属${months}ヶ月定期監査`
            });
        });
    });

    if (auditsToInsert.length === 0) return;

    const supabase = await createClient()
    await supabase.from('audits').insert(auditsToInsert);
}

/**
 * Kanban Sync: Auto-update worker status based on procedure completion.
 */
export async function syncWorkerStatusFromProcedure(worker_id: string, procedure_name: string, status: string) {
    if (!worker_id || status !== 'completed') return;

    let newWorkerStatus = null;
    const name = procedure_name || '';

    if (name.includes('在留') || name.includes('COE') || name.includes('coe')) {
        // COE Application completed -> Worker is waiting to enter Japan
        newWorkerStatus = 'waiting';
    } else if (name.includes('入国') || name.includes('配属') || name.includes('変更')) {
        // Entry completed or Visa changed -> Worker is now actively working
        newWorkerStatus = 'working';
    }

    if (newWorkerStatus) {
        const supabase = await createClient();
        await supabase.from('workers').update({ status: newWorkerStatus }).eq('id', worker_id);
    }
}
