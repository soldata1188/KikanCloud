import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RoadmapClient from "./RoadmapClient";
import { Sidebar } from "@/components/Sidebar";

export default async function RoadmapPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Role check if needed, for now just allow logged in users
    return (
        <div className="flex h-screen bg-[#f8fcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="roadmap" />

            <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
                <RoadmapClient />
            </div>
        </div>
    );
}
