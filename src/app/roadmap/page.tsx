import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RoadmapClient from "./RoadmapClient";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";

export default async function RoadmapPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Role check if needed, for now just allow logged in users
    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden selection:bg-emerald-500/20">
            <Sidebar active="roadmap" />

            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="制度ロードマップ" role={userProfile?.role} />
                <main className="flex-1 overflow-y-auto relative bg-[#f8f9fa]">
                    {/* Micro-Dot Grid Overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.08] z-0"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #0067b8 1px, transparent 0)', backgroundSize: '32px 32px' }} />

                    <div className="relative z-10">
                        <RoadmapClient />
                    </div>
                </main>
            </div>
        </div>
    );
}
