'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTasks() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('tasks')
        .select(`
            *,
            companies(name_jp),
            workers(full_name_romaji),
            assigned_user:assigned_to(full_name)
        `)
        .eq('is_deleted', false)
        .order('due_date', { ascending: true })

    if (error) throw new Error('Failed to fetch tasks')

    return data || []
}

export async function addTask(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const companyId = formData.get('company_id') as string
    const workerId = formData.get('worker_id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const status = formData.get('status') as string || 'todo'
    const priority = formData.get('priority') as string || 'medium'
    const dueDate = formData.get('due_date') as string
    const assignedTo = formData.get('assigned_to') as string

    if (!title) throw new Error('Title is required')

    const { error } = await supabase
        .from('tasks')
        .insert({
            tenant_id: (await supabase.from('users').select('tenant_id').eq('id', user.id).single()).data?.tenant_id,
            company_id: companyId || null,
            worker_id: workerId || null,
            title,
            description,
            status,
            priority,
            due_date: dueDate || null,
            assigned_to: assignedTo || null,
            task_type: 'manual'
        })

    if (error) throw new Error('Failed to add task: ' + error.message)

    revalidatePath('/operations/kanban')
    return { success: true }
}

export async function updateTaskStatus(taskId: string, status: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (error) throw new Error('Failed to update task status')
    revalidatePath('/operations/kanban')
    return { success: true }
}

export async function deleteTask(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('tasks').update({ is_deleted: true }).eq('id', id)
    if (error) throw new Error('Failed to delete task')
    revalidatePath('/operations/kanban')
    return { success: true }
}
