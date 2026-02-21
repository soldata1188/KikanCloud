import { login } from './actions'
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/Logo'

export const dynamic = 'force-dynamic';

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#fbfcfd] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#24b47e]/20">
            <div className="w-full max-w-[400px] bg-white rounded-xl shadow-sm border border-[#ededed] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <div className="p-8 md:p-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-white border border-[#ededed] rounded-[20px] flex items-center justify-center shadow-sm">
                            <Logo className="w-10 h-10 drop-shadow-sm" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-semibold text-center text-[#1f1f1f] tracking-tight mb-1">KikanCloud</h1>
                    <p className="text-sm text-center text-[#878787] mb-8 font-medium">監理団体向け 統合管理システム</p>

                    <form action={login} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-medium text-[#878787] mb-1.5 uppercase tracking-wider">メールアドレス</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" size={16} />
                                <input type="email" name="email" required placeholder="admin@kikancloud.com" className="w-full h-[40px] bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#878787] rounded-md pl-10 pr-3 text-[13px] outline-none transition-colors text-[#1f1f1f]" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-[#878787] mb-1.5 uppercase tracking-wider">パスワード</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" size={16} />
                                <input type="password" name="password" required placeholder="••••••••" className="w-full h-[40px] bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#878787] rounded-md pl-10 pr-3 text-[13px] outline-none transition-colors text-[#1f1f1f]" />
                            </div>
                        </div>

                        <button type="submit" className="w-full h-[40px] bg-[#24b47e] hover:bg-[#1e9a6a] text-white font-medium text-[14px] rounded-md transition-colors flex items-center justify-center gap-2 mt-4">
                            ログイン <ArrowRight size={16} />
                        </button>
                    </form>
                </div>

                <div className="bg-[#fbfcfd] p-6 border-t border-[#ededed]">
                    <div className="flex items-start gap-2 text-[#878787]">
                        <ShieldCheck size={16} className="text-[#24b47e] shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                            本システムは正規の権限を持つユーザー専用です。不正アクセスは厳しく監視・記録されています。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
