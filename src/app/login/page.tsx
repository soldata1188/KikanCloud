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

            if (authError) setError('ログインIDまたはパスワードが正しくありません。')
            else { router.push('/'); router.refresh(); }
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800 selection:bg-blue-500/20">
            <div className="w-full max-w-[400px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                <div className="p-8 text-center bg-slate-50 border-b border-slate-200">
                    <div className="w-14 h-14 bg-[#0067b8] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-700">
                        <Hexagon size={28} className="text-white fill-white/20" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-800">KikanCloud</h1>
                    <p className="text-[13px] text-slate-500 mt-1 font-medium">基幹システム ログイン</p>
                </div>

                <div className="p-8 pb-10">
                    {error && <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-[13px] font-bold rounded-lg flex items-center gap-2"><ShieldAlert size={16} className="shrink-0" /> {error}</div>}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">ログインID (Login ID)</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input required value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-[14px] font-mono outline-none focus:border-[#0067b8] focus:bg-white focus:ring-1 focus:ring-[#0067b8] transition-all" placeholder="例: staff_01" autoCapitalize="none" autoCorrect="off" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">パスワード (Password)</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-[14px] font-mono outline-none focus:border-[#0067b8] focus:bg-white focus:ring-1 focus:ring-[#0067b8] transition-all" placeholder="••••••••" />
                            </div>
                        </div>
                        <button type="submit" disabled={isPending} className="w-full h-12 bg-[#0067b8] text-white font-bold rounded-lg text-[14px] hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60 shadow-md">
                            {isPending ? <Loader2 size={18} className="animate-spin" /> : 'システムにログイン'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-[11px] text-slate-400 leading-relaxed max-w-[280px] mx-auto">アカウントの発行やログイン方法は、<br className="hidden sm:block" />システム管理者（監理団体）にお問い合わせください。</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
