'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const fullName = formData.get('full_name') as string
    const avatarFile = formData.get('avatar') as File | null

    let avatarUrl = undefined

    if (avatarFile && avatarFile.size > 0) {
        // Upload new avatar
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}_${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile)

        if (uploadError) {
            throw new Error(`Failed to upload avatar: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        avatarUrl = publicUrl
    }

    const updates: any = { full_name: fullName }
    if (avatarUrl) {
        updates.avatar_url = avatarUrl
    }

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/', 'layout')
    return { success: true }
}
