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
        <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 font-sans text-gray-900 selection:bg-blue-600/20 anim-page">
            <div className="w-full max-w-[420px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden anim-modal">
                <div className="p-10 text-center bg-white border-b border-gray-50">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-100 transition-transform hover:scale-105 duration-300">
                        <Hexagon size={32} className="text-white fill-white/20" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-gray-900 italic">Kikan<span className="text-blue-600 NOT-italic">Cloud</span></h1>
                    <p className="text-[14px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Operator Portal</p>
                </div>

                <div className="p-10">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[13px] font-black rounded-xl flex items-center gap-3 anim-badge">
                            <ShieldAlert size={18} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="group">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2 px-1">ログインID</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    required
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-[15px] font-bold outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all placeholder:text-gray-300"
                                    placeholder="admin"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2 px-1">パスワード</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-[15px] font-bold outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all placeholder:text-gray-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-14 bg-blue-600 text-white font-black rounded-xl text-[15px] hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60 shadow-lg shadow-blue-200 uppercase tracking-widest"
                        >
                            {isPending ? <Loader2 size={20} className="animate-spin" /> : 'システムにログイン'}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                        <p className="text-[12px] text-gray-400 font-bold leading-relaxed max-w-[300px] mx-auto opacity-60">
                            Enterprise Resource Planning System<br />
                            © 2026 KikanCloud Security Global
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
