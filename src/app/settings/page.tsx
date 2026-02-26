import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import SettingsPageClient from "./SettingsPageClient";
import { Suspense } from "react";

export const metadata = {
    title: "システム設定 | KikanCloud",
    description: "システム設定と管理",
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: userProfile } = await supabase
        .from("users")
        .select("full_name, role, tenant_id, login_id, tenants(*)")
        .eq("id", user.id)
        .single();

    if (!userProfile) redirect("/login");

    const userRole = userProfile.role || "staff";
    const tenant = userProfile.tenants;

    const isAdmin = userRole === 'admin' || userRole === 'union_admin';

    let usersList: any[] = [];
    let companiesList: any[] = [];

    if (isAdmin) {
        const { data: u } = await supabase
            .from("users")
            .select("id, full_name, login_id, role, companies(name_jp)")
            .eq("tenant_id", userProfile.tenant_id)
            .order("role", { ascending: true });

        const { data: c } = await supabase
            .from("companies")
            .select("id, name_jp")
            .eq("tenant_id", userProfile.tenant_id)
            .eq("is_deleted", false)
            .order("name_jp", { ascending: true });

        usersList = u || [];
        companiesList = c || [];
    }

    return (
        <div className="flex h-screen bg-[#f4f7f6] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="settings" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <main className="flex-1 overflow-y-auto w-full p-6 md:p-10">
                    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-[#24b47e] border-t-transparent rounded-full animate-spin"></div></div>}>
                        <SettingsPageClient
                            currentUser={{
                                id: user.id,
                                full_name: userProfile.full_name || "",
                                email: user.email || "",
                            }}
                            userRole={userRole}
                            usersList={usersList}
                            companiesList={companiesList}
                            tenant={tenant}
                        />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
