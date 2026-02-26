"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    User,
    Bell,
    Users,
    Bot,
    Save,
    ShieldAlert,
    UserCircle2,
    Building2,
    Settings,
} from "lucide-react";
import { updateProfile } from "./actions";
import { SaveButton } from "@/components/SubmitButtons";
import StaffList from "../organization/StaffList";
import OrganizationForm from "../organization/OrganizationForm";

type TabId = "account" | "notifications" | "organization" | "ai";

interface SettingsProps {
    currentUser: { id: string; full_name: string; email: string };
    userRole: string;
    usersList: any[];
    companiesList: any[];
    tenant: any;
}

const TabContentAccount = ({
    name, setName, email, updateProfile
}: {
    name: string, setName: (v: string) => void, email: string, updateProfile: any
}) => (
    <div className="max-w-3xl mx-auto py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">個人アカウント設定</h3>
            <p className="mt-1 text-sm text-gray-500">
                氏名やパスワードなど、あなたのプロフィールを管理します。
            </p>
        </div>

        <form action={updateProfile} className="space-y-6 max-w-md mx-auto bg-white p-8 border border-[#ededed] rounded-2xl shadow-sm">
            <div>
                <label className="block text-[11px] font-bold text-[#878787] uppercase tracking-widest mb-1.5">
                    フルネーム
                </label>
                <input
                    type="text"
                    name="fullName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full h-11 px-4 bg-[#fbfcfd] border border-[#ededed] rounded-xl text-[14px] outline-none focus:border-[#24b47e] transition-colors"
                />
            </div>
            <div>
                <label className="block text-[11px] font-bold text-[#878787] uppercase tracking-widest mb-1.5">
                    メールアドレス（通知用）
                </label>
                <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full h-11 px-4 bg-gray-50 border border-[#ededed] rounded-xl text-[14px] text-[#878787] cursor-not-allowed font-mono"
                />
            </div>
            <div>
                <label className="block text-[11px] font-bold text-[#878787] uppercase tracking-widest mb-1.5">
                    新しいパスワード
                </label>
                <input
                    type="password"
                    name="password"
                    placeholder="変更する場合のみ入力"
                    minLength={6}
                    className="w-full h-11 px-4 bg-[#fbfcfd] border border-[#ededed] rounded-xl text-[14px] outline-none focus:border-[#24b47e] transition-colors"
                />
            </div>

            <div className="pt-4 flex justify-center">
                <SaveButton />
            </div>
        </form>
    </div>
);

const TabContentNotifications = ({
    emailAlerts, setEmailAlerts, pushAlerts, setPushAlerts
}: {
    emailAlerts: boolean, setEmailAlerts: (v: boolean) => void,
    pushAlerts: boolean, setPushAlerts: (v: boolean) => void
}) => (
    <div className="max-w-3xl mx-auto py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">通知設定</h3>
            <p className="mt-1 text-sm text-gray-500">
                システムからの重要な更新や通知の受け取り方法を選択してください。
            </p>
        </div>

        <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between p-6 border border-[#ededed] rounded-2xl bg-white shadow-sm">
                <div>
                    <p className="font-bold text-gray-900">メール通知</p>
                    <p className="text-[12px] text-gray-500 mt-1">
                        書類の提出期限や新着メッセージをメールで受け取ります。
                    </p>
                </div>
                <button
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailAlerts ? "bg-[#24b47e]" : "bg-gray-200"}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailAlerts ? "translate-x-6" : "translate-x-1"}`}
                    />
                </button>
            </div>

            <div className="flex items-center justify-between p-6 border border-[#ededed] rounded-2xl bg-white shadow-sm">
                <div>
                    <p className="font-bold text-gray-900">ブラウザ通知</p>
                    <p className="text-[12px] text-gray-500 mt-1">
                        リアルタイムの更新情報をデスクトップに通知します。
                    </p>
                </div>
                <button
                    onClick={() => setPushAlerts(!pushAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pushAlerts ? "bg-[#24b47e]" : "bg-gray-200"}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushAlerts ? "translate-x-6" : "translate-x-1"}`}
                    />
                </button>
            </div>
        </div>
    </div>
);

export default function SettingsPageClient({
    currentUser,
    userRole,
    usersList,
    companiesList,
    tenant
}: SettingsProps) {
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get("tab") as TabId) || "account";

    const [activeTab, setActiveTab] = useState<TabId>(initialTab);
    const [subTab, setSubTab] = useState<"profile" | "staff">("profile");

    // States for Account Tab
    const [name, setName] = useState(currentUser.full_name || "");
    const [email, setEmail] = useState(currentUser.email || "");

    // States for Notifications
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [pushAlerts, setPushAlerts] = useState(false);

    // States for AI
    const [aiModel, setAiModel] = useState("gemini-1.5-flash");
    const [aiTone, setAiTone] = useState("professional");

    const isAdmin = userRole === "admin" || userRole === "union_admin";

    const TABS = [
        { id: "account", label: "個人設定", icon: UserCircle2 },
        { id: "notifications", label: "通知", icon: Bell },
        ...(isAdmin
            ? [{ id: "organization", label: "機関管理", icon: Building2 }]
            : []),
        { id: "ai", label: "AI設定", icon: Bot },
    ];

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8 border-b border-[#ededed] pb-6">
                <div>
                    <h1 className="text-2xl font-black text-[#1f1f1f]">システム設定</h1>
                    <p className="text-[13px] text-[#878787] mt-1">アカウント、機関、および環境設定を統合管理します。</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-[#1f1f1f] text-white rounded-md text-[10px] font-black uppercase tracking-widest">
                        {userRole.replace('_', ' ')}
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Horizontal / Vertical Tabs Menu */}
                <div className="w-full md:w-56 shrink-0">
                    <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabId)}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 whitespace-nowrap
                                    ${isActive
                                            ? "bg-[#1f1f1f] text-white shadow-lg shadow-[#1f1f1f]/10"
                                            : "text-[#878787] hover:bg-white hover:text-[#1f1f1f]"
                                        }`}
                                >
                                    <Icon size={18} className={isActive ? "text-[#24b47e]" : "text-[#878787] group-hover:text-[#1f1f1f]"} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 bg-white p-6 md:p-10 rounded-3xl border border-[#ededed] shadow-sm min-h-[600px] animate-in fade-in zoom-in-95 duration-300">
                    {activeTab === "account" && <TabContentAccount name={name} setName={setName} email={email} updateProfile={updateProfile} />}
                    {activeTab === "notifications" && <TabContentNotifications emailAlerts={emailAlerts} setEmailAlerts={setEmailAlerts} pushAlerts={pushAlerts} setPushAlerts={setPushAlerts} />}

                    {activeTab === "organization" && isAdmin && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-6 border-b border-[#ededed] pb-2 mb-6">
                                <button
                                    onClick={() => setSubTab("profile")}
                                    className={`relative py-4 text-sm font-black transition-colors ${subTab === 'profile' ? 'text-[#24b47e]' : 'text-[#878787] hover:text-[#1f1f1f]'}`}
                                >
                                    基本情報
                                    {subTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#24b47e] rounded-t-full"></div>}
                                </button>
                                <button
                                    onClick={() => setSubTab("staff")}
                                    className={`relative py-4 text-sm font-black transition-colors ${subTab === 'staff' ? 'text-[#24b47e]' : 'text-[#878787] hover:text-[#1f1f1f]'}`}
                                >
                                    スタッフ・チーム管理
                                    {subTab === 'staff' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#24b47e] rounded-t-full"></div>}
                                </button>
                            </div>

                            {subTab === 'profile' ? (
                                <OrganizationForm initialData={tenant} />
                            ) : (
                                <StaffList initialStaff={usersList} organizationId={tenant?.id} />
                            )}
                        </div>
                    )}

                    {activeTab === "ai" && (
                        <div className="max-w-3xl mx-auto py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-gray-900">AIアシスタント設定</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Gemini AIのモデルと応答のトーンをカスタマイズします。
                                </p>
                            </div>

                            <div className="space-y-6 max-w-md mx-auto bg-white p-8 border border-[#ededed] rounded-2xl">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#878787] uppercase tracking-widest mb-1.5">
                                        Core Engine
                                    </label>
                                    <select
                                        value={aiModel}
                                        onChange={(e) => setAiModel(e.target.value)}
                                        className="w-full h-11 px-4 bg-[#fbfcfd] border border-[#ededed] rounded-xl text-[14px] font-bold outline-none focus:border-[#24b47e]"
                                    >
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (高速・推奨)</option>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (高度な推論)</option>
                                        <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (次世代)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#878787] uppercase tracking-widest mb-1.5">
                                        応答スタイル (Tone)
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['professional', 'friendly'].map((tone) => (
                                            <button
                                                key={tone}
                                                onClick={() => setAiTone(tone)}
                                                className={`py-2 px-3 rounded-xl border text-[12px] font-bold transition-all ${aiTone === tone ? 'bg-[#1f1f1f] text-white border-[#1f1f1f]' : 'bg-white text-[#878787] border-[#ededed] hover:border-[#24b47e]'}`}
                                            >
                                                {tone === 'professional' ? 'プロフェッショナル' : 'フレンドリー'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-center">
                                    <button className="w-full flex items-center justify-center gap-2 bg-[#1f1f1f] text-white px-6 py-3 rounded-xl hover:bg-[#24b47e] transition-colors font-bold shadow-sm">
                                        <Save size={18} /> 設定を保存
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
