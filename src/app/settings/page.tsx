import { createClient } from"@/lib/supabase/server";
import { redirect } from"next/navigation";
import { Sidebar } from"@/components/Sidebar";
import SettingsPageClient from"./SettingsPageClient";

export const metadata = {
 title:"設定 | KikanCloud",
 description:"システム設定",
};

export default async function SettingsPage() {
 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();
 if (!user) redirect("/login");

 const { data: userProfile } = await supabase
 .from("users")
 .select("full_name, role")
 .eq("id", user.id)
 .single();
 const userRole = userProfile?.role ||"staff";

 let users: any[] = [];
 let companies: any[] = [];

 if (userRole ==="admin") {
 const { data: u } = await supabase
 .from("users")
 .select("id, full_name, email, role, companies(name_jp)")
 .order("created_at", { ascending: true });
 const { data: c } = await supabase
 .from("companies")
 .select("id, name_jp")
 .eq("is_deleted", false);
 users = u || [];
 companies = c || [];
 }

 return (
 <div className="flex h-screen bg-[#f4f7f6]">
 {/* Sidebar */}
 <Sidebar active="settings"/>

 {/* Main Content Area */}
 <main className="flex-1 h-screen overflow-y-auto w-full">
 <SettingsPageClient
 currentUser={{
 id: user.id,
 full_name: userProfile?.full_name ||"",
 email: user.email ||"",
 }}
 userRole={userRole}
 usersList={users}
 companiesList={companies}
 />
 </main>
 </div>
 );
}
