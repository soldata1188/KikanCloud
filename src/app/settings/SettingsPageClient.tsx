"use client";

import { useState } from"react";
import {
 User,
 Bell,
 Users,
 Bot,
 Save,
 Plus,
 ShieldAlert,
 UserCircle2,
 Building2,
 UserPlus,
} from"lucide-react";
import { createAccount, deleteAccount } from"./actions";
import { SaveButton, DeleteButton } from"@/components/SubmitButtons";

type TabId ="account"|"notifications"|"team"|"ai";

interface SettingsProps {
 currentUser: { id: string; full_name: string; email: string };
 userRole: string;
 usersList: any[];
 companiesList: any[];
}

export default function SettingsPageClient({
 currentUser,
 userRole,
 usersList,
 companiesList,
}: SettingsProps) {
 console.log("SettingsPageClient received userRole:", userRole);
 const [activeTab, setActiveTab] = useState<TabId>("account");

 // States for Account Tab
 const [name, setName] = useState(currentUser.full_name ||"");
 const [email, setEmail] = useState(currentUser.email ||"");

 // States for Notifications
 const [emailAlerts, setEmailAlerts] = useState(true);
 const [pushAlerts, setPushAlerts] = useState(false);

 // States for AI
 const [aiModel, setAiModel] = useState("gemini-2.5-flash");
 const [aiTone, setAiTone] = useState("professional");

 const TABS = [
 { id:"account", label:"アカウント", icon: User },
 { id:"notifications", label:"通知", icon: Bell },
 ...(userRole ==="admin"
 ? [{ id:"team", label:"チーム", icon: Users }]
 : []),
 { id:"ai", label:"AI設定", icon: Bot },
 ];

 const getRoleBadge = (role: string) => {
 switch (role) {
 case"admin":
 return (
 <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-red-200 flex items-center gap-1 w-fit">
 <ShieldAlert size={10} /> 統括管理者
 </span>
 );
 case"staff":
 return (
 <span className="bg-white text-[#1f1f1f] px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-gray-350 flex items-center gap-1 w-fit">
 <UserCircle2 size={10} /> 団体職員
 </span>
 );
 case"company_admin":
 return (
 <span className="bg-white text-emerald-700 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-emerald-200 flex items-center gap-1 w-fit">
 <Building2 size={10} /> 企業管理者
 </span>
 );
 case"company_user":
 return (
 <span className="bg-white text-[#878787] px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-gray-350 flex items-center gap-1 w-fit">
 <UserCircle2 size={10} /> 企業ユーザー
 </span>
 );
 case"worker":
 return (
 <span className="bg-white text-[#878787] px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-gray-350 flex items-center gap-1 w-fit">
 実習生・労働者
 </span>
 );
 default:
 return null;
 }
 };

 const TabContentAccount = () => (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div>
 <h3 className="text-lg font-medium text-gray-900">アカウント情報</h3>
 <p className="mt-1 text-sm text-gray-500">
 個人情報とメールアドレスを更新します。
 </p>
 </div>

 <div className="space-y-4 max-w-xl">
 <div>
 <label className="block text-sm font-medium text-gray-700">
 氏名
 </label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="mt-1 block w-full rounded-md border border-gray-350 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700">
 メールアドレス
 </label>
 <input
 type="email"
 value={email}
 disabled
 onChange={(e) => setEmail(e.target.value)}
 className="mt-1 block w-full rounded-md border border-gray-350 bg-gray-50 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700">
 パスワード
 </label>
 <input
 type="password"
 placeholder="••••••••"
 className="mt-1 block w-full rounded-md border border-gray-350 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
 />
 </div>

 <div className="pt-4">
 <button className="flex items-center justify-center gap-2 bg-[#24b47e] text-white px-4 py-2 rounded-md hover:bg-[#1e9668] transition-colors font-medium">
 <Save size={18} /> 変更を保存
 </button>
 </div>
 </div>
 </div>
 );

 const TabContentNotifications = () => (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div>
 <h3 className="text-lg font-medium text-gray-900">通知</h3>
 <p className="mt-1 text-sm text-gray-500">
 システムからの通知の受け取り方法を管理します。
 </p>
 </div>

 <div className="space-y-4 max-w-xl">
 <div className="flex items-center justify-between p-4 border border-gray-350 rounded-lg bg-gray-50">
 <div>
 <p className="font-medium text-gray-900">メール通知</p>
 <p className="text-sm text-gray-500">
 新しいメッセージやイベントがあった際にメールで通知を受け取ります。
 </p>
 </div>
 <button
 onClick={() => setEmailAlerts(!emailAlerts)}
 className={`relative inline-flex h-6 w-11 items-center rounded-md transition-colors ${emailAlerts ?"bg-[#24b47e]":"bg-gray-200"}`}
 >
 <span
 className={`inline-block h-4 w-4 transform rounded-md bg-white transition-transform ${emailAlerts ?"translate-x-6":"translate-x-1"}`}
 />
 </button>
 </div>

 <div className="flex items-center justify-between p-4 border border-gray-350 rounded-lg bg-gray-50">
 <div>
 <p className="font-medium text-gray-900">プッシュ通知</p>
 <p className="text-sm text-gray-500">
 ブラウザ上で直接プッシュ通知を受け取ります。
 </p>
 </div>
 <button
 onClick={() => setPushAlerts(!pushAlerts)}
 className={`relative inline-flex h-6 w-11 items-center rounded-md transition-colors ${pushAlerts ?"bg-[#24b47e]":"bg-gray-200"}`}
 >
 <span
 className={`inline-block h-4 w-4 transform rounded-md bg-white transition-transform ${pushAlerts ?"translate-x-6":"translate-x-1"}`}
 />
 </button>
 </div>
 </div>
 </div>
 );

 const TabContentTeam = () => {
 if (userRole !=="admin") return null;
 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div>
 <h3 className="text-lg font-medium text-gray-900">
 システム権限管理
 </h3>
 <p className="mt-1 text-sm text-gray-500">
 最高管理者専用のセキュリティコントロールパネルです。
 </p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-1">
 <div className="bg-white rounded-lg p-6 border border-gray-350">
 <h3 className="text-[14px] font-medium mb-6 flex items-center gap-2 text-[#1f1f1f] uppercase tracking-wider">
 <UserPlus size={16} className="text-[#878787]"/>{""}
 新規アカウント発行
 </h3>
 <form action={createAccount} className="space-y-4">
 <div>
 <label className="block text-[11px] font-medium text-[#878787] mb-1.5 uppercase tracking-wider">
 氏名
 </label>
 <input
 type="text"
 name="fullName"
 required
 className="w-full h-[36px] bg-white border border-gray-350 focus:bg-white focus:border-[#878787] rounded-md px-3 text-[13px] text-[#1f1f1f] outline-none transition-colors"
 />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-[#878787] mb-1.5 uppercase tracking-wider">
 ログイン ID
 </label>
 <input
 type="email"
 name="email"
 required
 className="w-full h-[36px] bg-white border border-gray-350 focus:bg-white focus:border-[#878787] rounded-md px-3 text-[13px] text-[#1f1f1f] outline-none transition-colors"
 />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-[#878787] mb-1.5 uppercase tracking-wider">
 パスワード
 </label>
 <input
 type="password"
 name="password"
 required
 minLength={6}
 className="w-full h-[36px] bg-white border border-gray-350 focus:bg-white focus:border-[#878787] rounded-md px-3 text-[13px] text-[#1f1f1f] outline-none transition-colors"
 />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-[#878787] mb-1.5 uppercase tracking-wider">
 権限ロール
 </label>
 <select
 name="role"
 required
 className="w-full h-[36px] bg-white border border-gray-350 focus:bg-white focus:border-[#878787] rounded-md px-3 text-[13px] text-[#1f1f1f] outline-none"
 >
 <option value="staff">団体職員 (Staff)</option>
 <option value="company_admin">企業管理者 (Admin)</option>
 <option value="company_user">企業ユーザー (User)</option>
 <option value="worker">実習生・労働者 (Connect)</option>
 <option value="admin">統括管理者 (Super Admin)</option>
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-[#878787] mb-1.5 uppercase tracking-wider">
 所属企業
 </label>
 <select
 name="companyId"
 className="w-full h-[36px] bg-white border border-gray-350 focus:bg-white focus:border-[#878787] rounded-md px-3 text-[13px] text-[#878787] outline-none"
 >
 <option value="null">-- 選択不要 --</option>
 {companiesList?.map((c) => (
 <option key={c.id} value={c.id}>
 {c.name_jp}
 </option>
 ))}
 </select>
 </div>
 <div className="pt-2 flex justify-center">
 <SaveButton />
 </div>
 </form>
 </div>
 </div>

 <div className="lg:col-span-2">
 <div className="bg-white rounded-lg border border-gray-350 overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-350 bg-white flex items-center justify-between">
 <h3 className="font-medium text-[13px] text-[#1f1f1f] uppercase tracking-wider">
 発行済みアカウント一覧
 </h3>
 <span className="text-[10px] font-mono text-[#878787] bg-white px-2 py-0.5 rounded border border-gray-350">
 {usersList?.length || 0} 名
 </span>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-[13px] whitespace-nowrap">
 <thead className="bg-white text-[11px] font-medium text-[#878787] uppercase tracking-wider border-b border-gray-350">
 <tr>
 <th className="px-5 py-3 font-medium">氏名 / 所属</th>
 <th className="px-5 py-3 font-medium">メールアドレス</th>
 <th className="px-5 py-3 font-medium">権限ロール</th>
 <th className="px-5 py-3 font-medium text-right">操作</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#ededed]">
 {usersList?.map((u: any) => (
 <tr
 key={u.id}
 className="hover:bg-gray-50 transition-colors"
 >
 <td className="px-5 py-3.5">
 <div className="font-medium text-[#1f1f1f]">
 {u.full_name}
 </div>
 <div className="text-[11px] text-[#878787] mt-0.5 flex items-center gap-1">
 {u.companies ? (
 <>
 <Building2 size={10} /> {u.companies.name_jp}
 </>
 ) : (
"内部 (Internal)"
 )}
 </div>
 </td>
 <td className="px-5 py-3.5 text-[12px] font-mono text-[#878787]">
 {u.email}
 </td>
 <td className="px-5 py-3.5">{getRoleBadge(u.role)}</td>
 <td className="px-5 py-3.5 text-right">
 {u.id !== currentUser.id && u.role !=="admin"&& (
 <form
 action={deleteAccount}
 className="inline-block"
 >
 <input type="hidden"name="id"value={u.id} />
 <DeleteButton />
 </form>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
 };

 const TabContentAI = () => (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div>
 <h3 className="text-lg font-medium text-gray-900">AI設定 (Gemini)</h3>
 <p className="mt-1 text-sm text-gray-500">
 KikanCloud AI アシスタントの動作とモデルをカスタマイズします。
 </p>
 </div>

 <div className="space-y-4 max-w-xl">
 <div>
 <label className="block text-sm font-medium text-gray-700">
 AI モデル
 </label>
 <select
 value={aiModel}
 onChange={(e) => setAiModel(e.target.value)}
 className="mt-1 block w-full rounded-md border border-gray-350 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
 >
 <option value="gemini-2.5-flash">
 Gemini 2.5 Flash (高速・推奨)
 </option>
 <option value="gemini-1.5-pro">
 Gemini 1.5 Pro (高度な論理推論)
 </option>
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700">
 トーン (Tone of voice)
 </label>
 <select
 value={aiTone}
 onChange={(e) => setAiTone(e.target.value)}
 className="mt-1 block w-full rounded-md border border-gray-350 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
 >
 <option value="professional">プロフェッショナル、丁寧</option>
 <option value="friendly">フレンドリー、親しみやすい</option>
 <option value="concise">簡潔、端的</option>
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700">
 デフォルトプロンプト (システム指示)
 </label>
 <textarea
 rows={4}
 className="mt-1 block w-full rounded-md border border-gray-350 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
 defaultValue="あなたはKikanCloudのスマートバーチャルアシスタントです..."
 />
 </div>

 <div className="pt-4">
 <button className="flex items-center justify-center gap-2 bg-[#24b47e] text-white px-4 py-2 rounded-md hover:bg-[#1e9668] transition-colors font-medium">
 <Save size={18} /> AI設定を更新
 </button>
 </div>
 </div>
 </div>
 );

 return (
 <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
 <div className="flex items-center gap-4 mb-8 border-b pb-4">
 <h1 className="text-2xl font-bold text-gray-900">システム設定</h1>
 <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-mono font-medium border border-gray-350">
 Current Role: {userRole}
 </span>
 </div>

 <div className="flex flex-col md:flex-row gap-8">
 {/* Vertical Tabs Sidebar */}
 <div className="w-full md:w-64 shrink-0">
 <nav className="flex flex-col space-y-1">
 {TABS.map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as TabId)}
 className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
 ${
 isActive
 ?"bg-green-50 text-[#24b47e]"
 :"text-gray-600 hover:bg-gray-100 hover:text-gray-900"
 }`}
 >
 <Icon
 size={20}
 className={isActive ?"text-[#24b47e]":"text-gray-400"}
 />
 {tab.label}
 </button>
 );
 })}
 </nav>
 </div>

 {/* Tab Content Area */}
 <div className="flex-1 bg-white p-6 md:p-8 rounded-md border border-gray-350 min-h-[500px]">
 {activeTab ==="account"&& <TabContentAccount />}
 {activeTab ==="notifications"&& <TabContentNotifications />}
 {activeTab ==="team"&& <TabContentTeam />}
 {activeTab ==="ai"&& <TabContentAI />}
 </div>
 </div>
 </div>
 );
}
