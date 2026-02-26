"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    UserCircle2, Bell, Building2, Bot, Save,
    ShieldCheck, Key,
} from "lucide-react";
import { updateProfile } from "./actions";
import { SaveButton } from "@/components/SubmitButtons";
import OrganizationForm from "../organization/OrganizationForm";
import TeamManagerClient from "../accounts/TeamManagerClient";

// ── Types ─────────────────────────────────────────────────────────
type TabId = "account" | "notifications" | "organization" | "ai";

interface SettingsProps {
    currentUser: { id: string; full_name: string; email: string };
    userRole: string;
    usersList: any[];
    companiesList: any[];
    tenant: any;
}

// ── Shared label style ─────────────────────────────────────────────
const L = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5";

// ── Tab: 個人設定 ─────────────────────────────────────────────────
function TabAccount({ name, setName, email }: { name: string; setName: (v: string) => void; email: string }) {
    return (
        <div className="max-w-sm mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6">
                <h3 className="text-[17px] font-black text-slate-900 flex items-center gap-2">
                    <UserCircle2 size={18} className="text-emerald-500" /> 個人アカウント設定
                </h3>
                <p className="text-[12px] text-slate-400 mt-1">氏名やパスワードなど、あなたのプロフィールを管理します。</p>
            </div>
            <form action={updateProfile} className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div>
                    <label className={L}>フルネーム</label>
                    <input type="text" name="fullName" value={name} onChange={(e) => setName(e.target.value)} required
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-emerald-400 focus:bg-white transition-colors" />
                </div>
                <div>
                    <label className={L}>メールアドレス <span className="normal-case text-slate-300 font-normal">(変更不可)</span></label>
                    <input type="email" value={email} disabled
                        className="w-full h-11 px-4 bg-slate-100 border border-slate-200 rounded-xl text-[14px] text-slate-400 cursor-not-allowed font-mono" />
                </div>
                <div>
                    <label className={L}>新しいパスワード</label>
                    <input type="password" name="password" placeholder="変更する場合のみ入力" minLength={6}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-emerald-400 focus:bg-white transition-colors" />
                </div>
                <div className="pt-2">
                    <SaveButton />
                </div>
            </form>
        </div>
    );
}

// ── Tab: 通知 ─────────────────────────────────────────────────────
function TabNotifications({ emailAlerts, setEmailAlerts, pushAlerts, setPushAlerts }:
    { emailAlerts: boolean; setEmailAlerts: (v: boolean) => void; pushAlerts: boolean; setPushAlerts: (v: boolean) => void }) {
    return (
        <div className="max-w-md mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6">
                <h3 className="text-[17px] font-black text-slate-900 flex items-center gap-2">
                    <Bell size={18} className="text-emerald-500" /> 通知設定
                </h3>
                <p className="text-[12px] text-slate-400 mt-1">通知の受け取り方法を設定します。</p>
            </div>
            <div className="space-y-3">
                {[
                    { label: 'メール通知', desc: '書類の提出期限や新着メッセージをメールで受け取ります。', v: emailAlerts, s: setEmailAlerts },
                    { label: 'ブラウザ通知', desc: 'リアルタイムの更新情報をデスクトップに通知します。', v: pushAlerts, s: setPushAlerts },
                ].map(({ label, desc, v, s }) => (
                    <div key={label} className="flex items-center justify-between p-5 border border-slate-200 rounded-2xl bg-white shadow-sm">
                        <div>
                            <p className="font-bold text-slate-900 text-[14px]">{label}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                        </div>
                        <button onClick={() => s(!v)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${v ? "bg-emerald-500" : "bg-slate-200"}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${v ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Tab: AI設定 ──────────────────────────────────────────────────
function TabAI({ aiModel, setAiModel, aiTone, setAiTone }:
    { aiModel: string; setAiModel: (v: string) => void; aiTone: string; setAiTone: (v: string) => void }) {
    return (
        <div className="max-w-sm mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6">
                <h3 className="text-[17px] font-black text-slate-900 flex items-center gap-2">
                    <Bot size={18} className="text-emerald-500" /> AIアシスタント設定
                </h3>
                <p className="text-[12px] text-slate-400 mt-1">Gemini AIのモデルと応答スタイルをカスタマイズします。</p>
            </div>
            <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div>
                    <label className={L}>Core Engine</label>
                    <select value={aiModel} onChange={(e) => setAiModel(e.target.value)}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold outline-none focus:border-emerald-400">
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (高速・推奨)</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (高度な推論)</option>
                        <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (次世代)</option>
                    </select>
                </div>
                <div>
                    <label className={L}>応答スタイル (Tone)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[['professional', 'プロフェッショナル'], ['friendly', 'フレンドリー']].map(([v, l]) => (
                            <button key={v} onClick={() => setAiTone(v)}
                                className={`py-2.5 px-3 rounded-xl border text-[13px] font-bold transition-all ${aiTone === v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
                <button className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors font-bold shadow-sm text-[13px]">
                    <Save size={15} /> 設定を保存
                </button>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function SettingsPageClient({ currentUser, userRole, usersList, companiesList, tenant }: SettingsProps) {
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get("tab") as TabId) || "account";

    const [activeTab, setActiveTab] = useState<TabId>(initialTab);
    const [orgSubTab, setOrgSubTab] = useState<"profile" | "accounts">("profile");

    const [name, setName] = useState(currentUser.full_name || "");
    const [email] = useState(currentUser.email || "");
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [pushAlerts, setPushAlerts] = useState(false);
    const [aiModel, setAiModel] = useState("gemini-1.5-flash");
    const [aiTone, setAiTone] = useState("professional");

    const isAdmin = userRole === "admin" || userRole === "union_admin";

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
        <div className="w-full max-w-6xl mx-auto">

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">システム設定</h1>
                    <p className="text-[13px] text-slate-400 mt-1">アカウント、機関、および環境設定を統合管理します。</p>
                </div>
                <span className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {userRole.replace("_", " ")}
                </span>
            </div>

            <div className="flex flex-col md:flex-row gap-8">

                {/* ── Sidebar Nav ── */}
                <nav className="w-full md:w-52 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold rounded-xl transition-all duration-150 whitespace-nowrap text-left
                                    ${isActive
                                        ? "bg-slate-900 text-white shadow-sm"
                                        : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm"}`}>
                                <Icon size={16} className={isActive ? "text-emerald-400" : "text-slate-400"} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* ── Content Panel ── */}
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[600px] overflow-hidden">

                    {activeTab === "account" && (
                        <div className="p-8">
                            <TabAccount name={name} setName={setName} email={email} />
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div className="p-8">
                            <TabNotifications emailAlerts={emailAlerts} setEmailAlerts={setEmailAlerts} pushAlerts={pushAlerts} setPushAlerts={setPushAlerts} />
                        </div>
                    )}

                    {activeTab === "organization" && isAdmin && (
                        <div className="flex flex-col h-full">
                            {/* Sub-tab bar */}
                            <div className="flex items-center gap-0 border-b border-slate-200 px-8 bg-slate-50/60">
                                {ORG_SUB_TABS.map(({ id, label, icon: Icon }) => (
                                    <button key={id} onClick={() => setOrgSubTab(id)}
                                        className={`relative flex items-center gap-2 px-5 py-4 text-[13px] font-bold transition-all border-b-2 -mb-[1px]
                                            ${orgSubTab === id
                                                ? "text-slate-900 border-slate-900"
                                                : "text-slate-400 border-transparent hover:text-slate-700"}`}>
                                        <Icon size={14} />
                                        {label}
                                        {id === "accounts" && (
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1
                                                ${orgSubTab === id ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-400"}`}>
                                                {usersList.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Sub-tab content */}
                            <div className="flex-1 p-8 animate-in fade-in duration-200">
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
                        <div className="p-8">
                            <TabAI aiModel={aiModel} setAiModel={setAiModel} aiTone={aiTone} setAiTone={setAiTone} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
