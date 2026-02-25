import { SidebarClient } from "./SidebarClient";
import { createClient } from "@/lib/supabase/server";

export async function Sidebar({ active }: { active: string }) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    let userRole = "staff";
    let userProfile = null;
    if (user) {
        const { data } = await supabase
            .from("users")
            .select("full_name, role")
            .eq("id", user.id)
            .single();
        userRole = data?.role || "staff";
        userProfile = data;
    }

    return (
        <SidebarClient active={active} userRole={userRole} userProfile={userProfile} />
    );
}
