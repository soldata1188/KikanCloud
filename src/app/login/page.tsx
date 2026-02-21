import { login } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const sp = await searchParams;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f9] font-sans text-[#1f1f1f] p-4">

            {/* Branding Header */}
            <div className="mb-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                    {/* Gemini Sparkle Icon */}
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.6644 1.5033C11.8385 1.03875 12.5029 1.03875 12.6771 1.5033L14.7779 7.10495C14.8519 7.30232 15.008 7.45837 15.2053 7.53239L20.807 9.63318C21.2716 9.80731 21.2716 10.4717 20.807 10.6459L15.2053 12.7466C15.008 12.8207 14.8519 12.9767 14.7779 13.1741L12.6771 18.7758C12.5029 19.2403 11.8385 19.2403 11.6644 18.7758L9.56358 13.1741C9.48956 12.9767 9.33351 12.8207 9.13614 12.7466L3.53435 10.6459C3.0698 10.4717 3.0698 9.80731 3.53435 9.63318L9.13614 7.53239C9.33351 7.45837 9.48956 7.30232 9.56358 7.10495L11.6644 1.5033Z" fill="url(#paint0_linear)" />
                        <defs>
                            <linearGradient id="paint0_linear" x1="12" y1="1" x2="12" y2="19" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#4285F4" /><stop offset="0.33" stopColor="#EA4335" /><stop offset="0.66" stopColor="#FBBC05" /><stop offset="1" stopColor="#34A853" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <h1 className="text-[28px] font-medium text-[#444746] tracking-tight">KikanCloud</h1>
                </div>
                <p className="text-[#444746] text-sm">監理団体・登録支援機関向けプラットフォーム</p>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-[400px] bg-white p-10 rounded-[28px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#e1e5ea]">
                <h2 className="text-xl font-medium text-center text-[#1f1f1f] mb-8">ログイン</h2>

                {sp?.error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        <span>メールアドレスまたはパスワードが違います</span>
                    </div>
                )}

                <form action={login} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-[#444746] ml-1">メールアドレス</label>
                        <input
                            name="email"
                            type="email"
                            defaultValue="admin@mirai.com"
                            required
                            className="w-full px-5 py-3.5 bg-[#f0f4f9] border border-transparent rounded-[12px] text-[#1f1f1f] focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 outline-none transition-all placeholder:text-[#444746]/40"
                            placeholder="name@company.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-[#444746] ml-1">パスワード</label>
                        <input
                            name="password"
                            type="password"
                            defaultValue="password123"
                            required
                            className="w-full px-5 py-3.5 bg-[#f0f4f9] border border-transparent rounded-[12px] text-[#1f1f1f] focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 outline-none transition-all placeholder:text-[#444746]/40"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="pt-2">
 <button type="submit" className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium py-3.5 rounded-[32px] transition-all hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2">
                            ログイン
                        </button>
                    </div>

                    <div className="mt-8 flex flex-col gap-3">
 <div className="p-4 bg-blue-50/50 rounded-[32px] border border-blue-100 text-sm">
                            <p className="text-[#4285F4] mb-2 text-[13px] font-bold tracking-wider text-center flex items-center justify-center gap-1.5">👑 管理者 (Admin) アカウント</p>
                            <p className="text-center text-[11px] text-gray-500 mb-2">全権限あり（削除・Excel出力・一括登録可能）</p>
                            <div className="flex flex-col gap-1.5 items-center">
                                <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-200 flex justify-between w-[240px] shadow-sm"><span className="text-gray-400 text-xs font-bold w-10">Email</span><span className="text-[#1f1f1f] font-mono font-medium text-[13px]">demo@kikancloud.com</span></div>
                                <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-200 flex justify-between w-[240px] shadow-sm"><span className="text-gray-400 text-xs font-bold w-10">Pass</span><span className="text-[#1f1f1f] font-mono font-medium text-[13px]">demo123</span></div>
                            </div>
                        </div>
 <div className="p-4 bg-gray-50 rounded-[32px] border border-gray-200 text-sm">
                            <p className="text-gray-600 mb-2 text-[13px] font-bold tracking-wider text-center flex items-center justify-center gap-1.5">👤 一般スタッフ (Staff) アカウント</p>
                            <p className="text-center text-[11px] text-gray-500 mb-2">閲覧・進捗更新のみ（削除・出力等は不可）</p>
                            <div className="flex flex-col gap-1.5 items-center">
                                <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 flex justify-between w-[240px] shadow-sm"><span className="text-gray-400 text-xs font-bold w-10">Email</span><span className="text-[#1f1f1f] font-mono font-medium text-[13px]">staff@kikancloud.com</span></div>
                                <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 flex justify-between w-[240px] shadow-sm"><span className="text-gray-400 text-xs font-bold w-10">Pass</span><span className="text-[#1f1f1f] font-mono font-medium text-[13px]">staff123</span></div>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <a href="#" className="text-sm text-[#1a73e8] hover:underline">パスワードをお忘れですか？</a>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-[#444746]/60">
                &copy; 2026 Mirai Works Inc. All rights reserved.
            </div>
        </div>
    )
}
