'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Hexagon, Lock, User, ShieldAlert, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [loginId, setLoginId] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault(); setError('')
        startTransition(async () => {
            const supabase = createClient()
            const emailForAuth = loginId.includes('@') ? loginId : `${loginId.trim().toLowerCase()}@kikancloud.local`
            const { error: authError } = await supabase.auth.signInWithPassword({ email: emailForAuth, password: password })

            if (authError) {
                if (authError.message === 'Failed to fetch') {
                    setError('サーバーに接続できません。(Supabase/Dockerが起動していない可能性があります)')
                } else if (authError.status === 400 || authError.status === 401) {
                    setError('ログインIDまたはパスワードが正しくありません。')
                } else {
                    setError(`エラー: ${authError.message}`)
                }
            } else { router.push('/'); router.refresh(); }
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-900 selection:bg-blue-600/10">
            <div className="w-full max-w-[380px] bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                {/* Header Section */}
                <div className="pt-10 pb-8 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5 transition-transform hover:scale-105 duration-300"
                        style={{
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            boxShadow: "0 4px 12px rgba(16,185,129,0.25)"
                        }}>
                        <Hexagon size={24} className="text-white fill-white/10" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                        Kikan<span className="text-emerald-600">Cloud</span>
                    </h1>
                    <p className="text-sm text-slate-600 mt-3 font-medium tracking-tight">
                        ソリューション協同組合 内部管理システム
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-[0.25em]">Operation Portal</p>
                </div>

                <div className="px-8 pb-10">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
                            <ShieldAlert size={18} className="shrink-0 text-rose-400" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block px-1">ログインID</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    required
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0067b8] focus:bg-white focus:ring-2 focus:ring-[#0067b8]/10 transition-all"
                                    placeholder="IDを入力..."
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block px-1">パスワード</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0067b8] focus:bg-white focus:ring-2 focus:ring-[#0067b8]/10 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 bg-[#0067b8] text-white font-bold rounded-xl text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 shadow-lg shadow-slate-200"
                        >
                            {isPending ? <Loader2 size={20} className="animate-spin" /> : 'ログイン'}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                        <p className="text-xs text-slate-400 font-medium leading-relaxed tracking-tight">
                            ERP System Internal Access Only<br />
                            © 2026 KikanCloud Security
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
