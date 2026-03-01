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
        <div className="min-h-screen bg-[#fbfcfd] flex items-center justify-center p-4 font-sans text-[#1f1f1f] selection:bg-[#24b47e]/20">
            <div className="w-full max-w-[400px] bg-white border border-[#ededed] rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 text-center bg-[#fbfcfd] border-b border-[#ededed]">
                    <div className="w-14 h-14 bg-[#1f1f1f] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Hexagon size={28} className="text-[#24b47e] fill-[#24b47e]/20" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">KikanCloud</h1>
                    <p className="text-[13px] text-[#878787] mt-1 font-medium">基幹システム ログイン</p>
                </div>

                <div className="p-8">
                    {error && <div className="mb-6 p-3 bg-[#fff9f9] border border-[#fce8e6] text-[#d93025] text-[13px] font-bold rounded-lg flex items-center gap-2"><ShieldAlert size={16} className="shrink-0" /> {error}</div>}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="text-[11px] font-bold text-[#878787] uppercase tracking-widest block mb-1.5">ログインID (Login ID)</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
                                <input required value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full h-12 pl-10 pr-4 bg-[#fbfcfd] border border-[#ededed] rounded-xl text-[14px] font-mono outline-none focus:border-[#24b47e] focus:bg-white transition-colors" placeholder="例: staff_01" autoCapitalize="none" autoCorrect="off" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-[#878787] uppercase tracking-widest block mb-1.5">パスワード (Password)</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
                                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 pl-10 pr-4 bg-[#fbfcfd] border border-[#ededed] rounded-xl text-[14px] font-mono outline-none focus:border-[#24b47e] focus:bg-white transition-colors" placeholder="••••••••" />
                            </div>
                        </div>
                        <button type="submit" disabled={isPending} className="w-full h-12 bg-[#1f1f1f] text-white font-bold rounded-xl text-[14px] hover:bg-[#24b47e] transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 shadow-sm">
                            {isPending ? <Loader2 size={18} className="animate-spin" /> : 'システムにログイン'}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-[#ededed] text-center">
                        <p className="text-[11px] text-[#878787] leading-relaxed">アカウントの発行はシステム管理者（監理団体）にお問い合わせください。</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
