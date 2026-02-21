import { login } from './actions'
import { Building2, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#f0f4f9] flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-100">
            <div className="w-full max-w-[400px] bg-white rounded-[32px] shadow-xl border border-[#e1e5ea] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <div className="p-8 md:p-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-tr from-[#4285F4] to-[#3367d6] rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <Building2 size={32} strokeWidth={1.5} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center text-[#1f1f1f] tracking-tight mb-1">KikanCloud</h1>
                    <p className="text-sm text-center text-gray-500 mb-8 font-medium">監理団体向け 統合管理システム</p>

                    <form action={login} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1 uppercase tracking-wider">メールアドレス</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="email" name="email" required placeholder="admin@kikancloud.com" className="w-full bg-[#f0f4f9] border border-transparent focus:bg-white focus:border-[#4285F4] rounded-2xl pl-11 pr-4 py-3.5 text-[15px] outline-none transition-all text-[#1f1f1f] font-medium" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1 uppercase tracking-wider">パスワード</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="password" name="password" required placeholder="••••••••" className="w-full bg-[#f0f4f9] border border-transparent focus:bg-white focus:border-[#4285F4] rounded-2xl pl-11 pr-4 py-3.5 text-[15px] outline-none transition-all text-[#1f1f1f] font-medium" />
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-[#4285F4] hover:bg-[#3367d6] text-white font-bold rounded-2xl py-3.5 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
                            ログイン <ArrowRight size={18} />
                        </button>
                    </form>
                </div>

                <div className="bg-gray-50 p-6 border-t border-gray-100">
                    <div className="flex items-start gap-2 text-gray-500">
                        <ShieldCheck size={16} className="text-[#4285F4] shrink-0 mt-0.5" />
                        <p className="text-[10px] leading-relaxed font-medium">
                            本システムは正規の権限を持つユーザー専用です。不正アクセスは厳しく監視・記録されています。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
