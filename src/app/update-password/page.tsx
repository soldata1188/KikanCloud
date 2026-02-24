'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const handleSession = async () => {
            const url = new URL(window.location.href)
            const code = url.searchParams.get('code')

            if (code) {
                // PKCE flow code exchange
                const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
                if (sessionError) {
                    setError('認証エラー: ' + sessionError.message)
                } else {
                    url.searchParams.delete('code')
                    window.history.replaceState({}, document.title, url.pathname + url.search)
                }
            } else {
                // Check hash for specific errors (e.g., token expired)
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const hashError = hashParams.get('error_description') || hashParams.get('error')
                if (hashError) {
                    setError('リンクが無効または期限切れです: ' + decodeURIComponent(hashError.replace(/\+/g, ' ')))
                }
            }
        }
        handleSession()
    }, [supabase.auth])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (password !== confirmPassword) {
            setError("パスワードが一致しません。")
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError("パスワードは6文字以上で設定してください。")
            setLoading(false)
            return
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            })

            if (updateError) throw updateError

            setSuccess(true)
            setTimeout(() => {
                router.push('/')
                router.refresh()
            }, 2000)

        } catch (err: any) {
            console.error('Update password error:', err)
            if (err.message && err.message.toLowerCase().includes('session missing')) {
                setError('認証セッションが見つかりません。リンクが期限切れか、すでに使用されています。')
            } else {
                setError(`エラー: ${err.message || 'パスワードの更新に失敗しました。'}`)
            }
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
                <div className="w-full max-w-[400px] bg-white rounded-md border border-gray-350 overflow-hidden p-8 md:p-10 text-center flex flex-col items-center shadow-none">
                    <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">設定完了</h2>
                    <p className="text-[13px] text-gray-600">パスワードの設定が完了しました。ホーム画面へ移動します...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-[400px] bg-white rounded-md border border-gray-350 overflow-hidden shadow-none">
                <div className="p-8 md:p-10">
                    <h1 className="text-2xl font-bold text-center text-gray-900 tracking-tight mb-2">
                        パスワードの設定
                    </h1>
                    <p className="text-[13px] text-gray-600 text-center mb-8 leading-relaxed">
                        KikanCloudへようこそ。アカウントを有効化するために、新しいパスワードを設定してください。
                    </p>

                    {error && (
                        <div className="mb-6 text-sm font-medium text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                                新しいパスワード
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-[40px] bg-white border border-gray-350 focus:border-primary-500 rounded-md pl-10 pr-3 text-[13px] outline-none transition-colors text-gray-900"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                                パスワード（確認用）
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-[40px] bg-white border border-gray-350 focus:border-primary-500 rounded-md pl-10 pr-3 text-[13px] outline-none transition-colors text-gray-900"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password || !confirmPassword}
                            className="w-full h-[40px] bg-primary-600 hover:bg-primary-700 text-white font-bold text-[14px] rounded-md transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed border-transparent shadow-none"
                        >
                            {loading ? "処理中..." : "設定してログイン"} {!loading && <ArrowRight size={16} />}
                        </button>
                    </form>
                </div>

                <div className="bg-gray-50 p-6 border-t border-gray-350">
                    <div className="flex items-start gap-2 text-gray-500">
                        <ShieldCheck size={16} className="text-primary-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                            弊社は情報セキュリティ基準を厳格に遵守しております。パスワードは安全に暗号化の上、保存されます。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
