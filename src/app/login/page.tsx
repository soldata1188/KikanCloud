"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError("メールアドレスまたはパスワードが正しくありません。");
            setLoading(false);
        } else {
            router.push('/operations');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-[400px] bg-white rounded-md border border-gray-350 overflow-hidden shadow-none">
                <div className="p-8 md:p-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-white border border-gray-350 rounded-[24px] flex items-center justify-center">
                            <Logo className="w-14 h-14" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center text-gray-900 tracking-tight mb-8">
                        Kikan<span className="text-[#24b47e]">Cloud</span>
                    </h1>

                    {error && (
                        <div className="mb-4 text-sm font-medium text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                                メールアドレス
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@kikancloud.com"
                                    className="w-full h-[40px] bg-white border border-gray-350 focus:border-primary-500 rounded-md pl-10 pr-3 text-[13px] outline-none transition-colors text-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                                パスワード
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
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-[40px] bg-primary-600 hover:bg-primary-700 text-white font-bold text-[14px] rounded-md transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-none border-transparent"
                        >
                            {loading ? "ログイン中..." : "ログイン"} {!loading && <ArrowRight size={16} />}
                        </button>
                    </form>
                </div>

                <div className="bg-gray-50 p-6 border-t border-gray-350">
                    <div className="flex items-start gap-2 text-gray-500">
                        <ShieldCheck size={16} className="text-primary-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                            本システムは正規の権限を持つユーザー専用です。不正アクセスは厳しく監視・記録されています。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
