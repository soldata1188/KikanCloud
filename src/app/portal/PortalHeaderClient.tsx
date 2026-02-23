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
                <Bell size={16} className="text-[#878787]" />
            </div>
            <div className="w-px h-5 bg-[#ededed]"></div>
            <div className="flex items-center gap-2">
                <div className="text-[11px] font-bold text-[#878787] hidden md:block">{userProfile?.full_name} 様</div>
                <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-[#fbfcfd] border border-[#ededed] text-[#878787] hover:text-[#d93025] hover:border-[#fce8e6] hover:bg-[#fff9f9] flex items-center justify-center transition-colors" title="Sign Out">
                    <LogOut size={14} />
                </button>
            </div>
        </div>
    )
}
