'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveWorkflowMap(nodes: any[], edges: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('認証されていません')

    const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
    if (!userData?.tenant_id || (userData.role !== 'admin' && userData.role !== 'staff')) throw new Error('権限がありません')

    const { error } = await supabase.from('workflow_maps').upsert({
        tenant_id: userData.tenant_id,
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id' })

    if (error) throw new Error(error.message)
    revalidatePath('/workflows')
    return { success: true }
}
