import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfileSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    if (userProfile) {
        userProfile.email = user.email
    }

    return (
        <div>
            <h3 className="text-2xl font-semibold mb-6">プロフィール設定</h3>
            <ProfileClient initialData={userProfile} />
        </div>
    )
}
