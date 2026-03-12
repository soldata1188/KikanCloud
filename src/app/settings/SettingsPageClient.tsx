"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Bell, Building2, Bot, Save,
    ShieldCheck, User, CheckCircle2,
    UserCircle2, LogOut
} from "lucide-react";
import OrganizationForm from "../organization/OrganizationForm";
import TeamManagerClient from "../accounts/TeamManagerClient";
import { createClient } from "@/lib/supabase/client";
import { logout } from "../login/actions";

// ── Types ─────────────────────────────────────────────────────────
type TabId = "account" | "notifications" | "organization" | "ai";

interface SettingsProps {
    currentUser: { id: string; full_name: string; email: string; role: string };
    usersList: any[];
    companiesList: any[];
    tenant: any;
    initialAiModel?: string;
    initialAiTone?: string;
}

// ── Tab: 個人設定 ─────────────────────────────────────────────────
function TabAccount({ userProfile }: { userProfile: { id: string; full_name: string; email: string; role: string } }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md">
                    <User size={20} />
                </div>
                <h3 className="text-lg font-normal text-gray-900 uppercase tracking-tight">個人設定</h3>
            </div>
            <div className="space-y-4 max-w-md">
                <div>
                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-wider mb-1.5">氏名</label>
                    <input type="text" value={userProfile?.full_name || ''} disabled
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-400 cursor-not-allowed font-normal" />
                </div>
                <div>
                    <label className="block text-xs font-normal text-gray-500 uppercase tracking-wider mb-1.5">メールアドレス</label>
                    <input type="email" value={userProfile?.email || ''} disabled
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-400 cursor-not-allowed font-normal" />
                </div>
                <div>
                    <label className="block text-xs font-normal text-gray-500 uppercase tracking-wider mb-1.5">権限</label>
                    <div className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded uppercase tracking-widest">
                        {userProfile?.role || 'staff'}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Tab: 通知 ─────────────────────────────────────────────────────
function TabNotifications({ emailAlerts, setEmailAlerts, pushAlerts, setPushAlerts }:
    { emailAlerts: boolean; setEmailAlerts: (v: boolean) => void; pushAlerts: boolean; setPushAlerts: (v: boolean) => void }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md">
                    <Bell size={20} />
                </div>
                <h3 className="text-lg font-normal text-gray-900 uppercase tracking-tight">通知設定</h3>
            </div>
            <div className="space-y-3 max-w-md">
                {[
                    { label: 'メール通知', desc: '書類の提出期限や新着メッセージをメールで受け取ります。', v: emailAlerts, s: setEmailAlerts },
                    { label: 'ブラウザ通知', desc: 'リアルタイムの更新情報をデスクトップに通知します。', v: pushAlerts, s: setPushAlerts },
                ].map(({ label, desc, v, s }) => (
                    <div key={label} className="flex items-center justify-between p-4 border border-gray-100 rounded-md bg-white">
                        <div>
                            <p className="font-normal text-gray-900 text-sm">{label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                        </div>
                        <button onClick={() => s(!v)}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors shrink-0 ${v ? "bg-emerald-600" : "bg-gray-200"}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${v ? "translate-x-5.5" : "translate-x-1"}`} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Tab: AI設定 ──────────────────────────────────────────────────
function TabAI() {
    const [isSaving, setIsSaving] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const handleSave = () => {
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 3000)
        }, 800)
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-normal text-gray-900 uppercase tracking-tight">AI アシスタント設定</h3>
                        <p className="text-xs text-gray-500 mt-0.5 font-normal">自動生成と業務効率化のためのAIモデル設定</p>
                    </div>
                </div>
                {showSuccess && (
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-normal animate-in fade-in slide-in-from-right-4 uppercase tracking-widest">
                        <CheckCircle2 size={14} /> 設定を保存しました
                    </div>
                )}
            </div>

            <div className="space-y-8 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-xs font-normal text-gray-500 uppercase tracking-wider mb-2">使用モデル</label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-emerald-500 transition-colors font-normal">
                            <option>Gemini 1.5 Pro (推奨)</option>
                            <option>Gemini 1.5 Flash (高速)</option>
                            <option>GPT-4o</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-gray-500 uppercase tracking-wider mb-2">出力言語</label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-emerald-500 transition-colors font-normal">
                            <option>日本語 (Default)</option>
                            <option>English</option>
                            <option>Tiếng Việt</option>
                        </select>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md text-sm font-normal transition-colors flex items-center gap-2 disabled:opacity-50 uppercase tracking-widest"
                    >
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                        保存
                    </button>
                </div>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function SettingsPageClient({ currentUser, usersList, companiesList, tenant, initialAiModel, initialAiTone }: SettingsProps) {
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get("tab") as TabId) || "account";

    const [activeTab, setActiveTab] = useState<TabId>(initialTab);
    const [orgSubTab, setOrgSubTab] = useState<"profile" | "accounts">("profile");

    const [emailAlerts, setEmailAlerts] = useState(true);
    const [pushAlerts, setPushAlerts] = useState(false);

    const isAdmin = currentUser.role === "admin" || currentUser.role === "union_admin";

    const TABS: { id: TabId; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
        { id: "account", label: "個人設定", icon: UserCircle2 },
        { id: "notifications", label: "通知", icon: Bell },
        ...(isAdmin ? [{ id: "organization" as TabId, label: "機関管理", icon: Building2 }] : []),
        { id: "ai", label: "AI設定", icon: Bot },
    ];

    // Sub-tabs for 機関管理
    const ORG_SUB_TABS = [
        { id: "profile" as const, label: "機関情報", icon: Building2 },
        { id: "accounts" as const, label: "アカウント発行・管理", icon: ShieldCheck },
    ];

    return (
        <div className="w-full max-w-6xl mx-auto py-10 px-6">
            <div className="flex flex-col md:flex-row gap-10">

                {/* ── Sidebar Nav ── */}
                <nav className="w-full md:w-48 shrink-0 flex flex-col gap-1">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-2.5 text-xs font-normal rounded-lg transition-all duration-150 whitespace-nowrap text-left uppercase tracking-widest
                                    ${isActive
                                        ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
                                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-600 border border-transparent"}`}>
                                <Icon size={14} className={isActive ? "text-emerald-700" : "text-gray-400"} strokeWidth={1.5} />
                                {tab.label}
                            </button>
                       );
                    })}

                    <div className="h-px bg-gray-100 my-1.5 mx-2" />

                    <button
                        onClick={async () => {
                            if (window.confirm('ログアウトしますか？')) {
                                await logout();
                            }
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-xs font-normal rounded-md transition-all duration-300 text-red-600 bg-red-50 hover:bg-red-100 shadow-sm active:scale-95 group w-full uppercase tracking-widest"
                    >
                        <LogOut size={14} strokeWidth={1.5} className="group-hover:rotate-12 transition-transform" />
                        <span>ログアウト</span>
                    </button>
               </nav>

                {/* ── Content Panel ── */}
                <div className="flex-1 min-h-[600px] overflow-hidden">
                    {activeTab === "account" && (
                        <div>
                            <TabAccount userProfile={currentUser} />
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div>
                            <TabNotifications emailAlerts={emailAlerts} setEmailAlerts={setEmailAlerts} pushAlerts={pushAlerts} setPushAlerts={setPushAlerts} />
                        </div>
                    )}

                    {activeTab === "organization" && isAdmin && (
                        <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                            {/* Sub-tab bar */}
                            <div className="flex items-center gap-0 border-b border-gray-100 px-6 bg-gray-50/50">
                                {ORG_SUB_TABS.map(({ id, label, icon: Icon }) => (
                                    <button key={id} onClick={() => setOrgSubTab(id)}
                                        className={`relative flex items-center gap-2 px-6 py-4 text-xs font-normal tracking-widest uppercase transition-all border-b-2 -mb-[1px]
                                            ${orgSubTab === id
                                                ? "text-emerald-700 border-emerald-600"
                                                : "text-gray-400 border-transparent hover:text-gray-700"}`}>
                                        <Icon size={14} />
                                        {label}
                                        {id === "accounts" && (
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ml-1
                                                ${orgSubTab === id ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                                                {usersList.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Sub-tab content */}
                            <div className="flex-1 p-8">
                                {orgSubTab === "profile" && <OrganizationForm initialData={tenant} />}
                                {orgSubTab === "accounts" && (
                                    <TeamManagerClient
                                        staffList={usersList}
                                        companies={companiesList}
                                        isAdmin={isAdmin}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "ai" && (
                        <div>
                            <TabAI />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
