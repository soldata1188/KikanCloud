'use client'
import { Bell, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PortalHeaderClient({ userProfile }: { userProfile: any }) {
    const router = useRouter()
    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="flex items-center gap-4">
            <div className="relative cursor-pointer hover:bg-gray-50 p-1.5 rounded-full transition-colors">
                <Bell size={16} className="text-gray-500" />
            </div>
            <div className="w-px h-5 bg-gray-200"></div>
            <div className="flex items-center gap-2">
                <div className="text-[11px] font-bold text-gray-500 hidden md:block">{userProfile?.full_name} 様</div>
                <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50 flex items-center justify-center transition-colors" title="Sign Out">
                    <LogOut size={14} />
                </button>
            </div>
        </div>
    )
}
