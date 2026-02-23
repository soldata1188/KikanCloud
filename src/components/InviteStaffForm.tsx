'use client'

import React, { useState } from 'react';
import { Mail, Check, AlertCircle } from 'lucide-react';
import { inviteUser } from '@/actions/auth-actions';

export function InviteStaffForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            await inviteUser(email);
            setStatus('success');
            setEmail('');
            // Reset state to original to allow inviting more staff
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || '招待に失敗しました。');
        }
    };

    return (
        <div className="bg-white border border-gray-350 rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-6">新規スタッフ招待</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                        メールアドレス
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="taro.yamada@example.com"
                            className="w-full h-[40px] bg-white border border-gray-350 focus:border-primary-500 rounded-md pl-10 pr-3 text-[13px] outline-none transition-colors text-gray-900"
                            disabled={status === 'loading'}
                        />
                    </div>
                </div>

                {status === 'success' && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm flex items-start gap-2 border border-green-200">
                        <Check className="shrink-0 mt-0.5" size={16} />
                        <span>招待メールを送信しました。スタッフに確認を依頼してください。</span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start gap-2 border border-red-200">
                        <AlertCircle className="shrink-0 mt-0.5" size={16} />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={status === 'loading' || !email}
                        className="w-full h-[40px] bg-primary-600 hover:bg-primary-700 text-white font-bold text-[14px] rounded-md transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-none border-transparent"
                    >
                        {status === 'loading' ? '送信中...' : '招待メールを送信する'}
                    </button>
                </div>
            </form>
        </div>
    );
}
