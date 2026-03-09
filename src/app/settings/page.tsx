import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
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
        .select("full_name, role, tenant_id, login_id, ai_model, ai_tone, tenants(*)")
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
        <div className="seamless-block">
            <Sidebar active="settings" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="システム設定" role={userRole} />
                <div className="seamless-header">
                    <h2 className="text-[14px] font-black text-gray-950">
                        システム<span className="text-blue-700">設定</span>
                    </h2>
                </div>
                <main className="flex-1 overflow-y-auto relative bg-white thin-scrollbar">
                    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                        <SettingsPageClient
                            currentUser={{
                                id: user.id,
                                full_name: userProfile.full_name || "",
                                email: user.email || "",
                                role: userRole,
                            }}
                            usersList={usersList}
                            companiesList={companiesList}
                            tenant={tenant}
                            initialAiModel={userProfile.ai_model || "gemini-2.5-flash"}
                            initialAiTone={userProfile.ai_tone || "professional"}
                        />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
