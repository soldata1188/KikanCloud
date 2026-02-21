'use client'
import React, { useRef, useTransition } from 'react'
import { Sparkles, ImagePlus, Loader2 } from 'lucide-react'
import { extractDocumentAI } from '@/app/actions/ai'

export function AIScannerZone() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isPending, startTransition] = useTransition()

    const setInputValue = (name: string, value: string) => {
        if (!value) return;
        const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement;
        if (el) {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    const handleAIScan = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        startTransition(() => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64String = reader.result as string;
                const res = await extractDocumentAI(base64String, file.type);

                if (res.success && res.data) {
                    setInputValue('full_name_romaji', res.data.full_name_romaji);
                    setInputValue('full_name_kana', res.data.full_name_kana);
                    setInputValue('nationality', res.data.nationality);
                    setInputValue('dob', res.data.date_of_birth);
                    setInputValue('zairyu_no', res.data.zairyu_no);
                    setInputValue('address', res.data.address);
                    setInputValue('visa_status', res.data.visa_status);
                    setInputValue('zairyu_exp', res.data.zairyu_exp);
                    alert('✨ AIスキャンが完了しました！内容を確認してください。');
                } else {
                    alert('❌ エラー: ' + res.error);
                }
                if (fileInputRef.current) fileInputRef.current.value = '';
            };
        });
    }

    return (
        <div className="bg-[#fbfcfd] border border-[#24b47e]/30 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group mb-6">
            <div className="absolute -right-10 -top-10 text-[#24b47e]/5 transform rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Sparkles size={120} />
            </div>
            <div className="relative z-10 w-full">
                <h3 className="text-[14px] font-bold text-[#1f1f1f] flex items-center gap-2 mb-1">
                    <Sparkles size={16} className="text-[#24b47e]" /> AI スマート入力（在留カード・パスポート解析）
                </h3>
                <p className="text-[12px] text-[#666666]">画像をアップロードすると、AIが情報を抽出しフォームに自動入力します。</p>
            </div>

            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAIScan} />

            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                className="shrink-0 relative z-10 flex items-center gap-2 px-6 py-3 bg-white border border-[#ededed] hover:border-[#24b47e] text-[#1f1f1f] hover:text-[#24b47e] rounded-md text-[13px] font-bold transition-all shadow-sm disabled:opacity-50"
            >
                {isPending ? (
                    <><Loader2 size={16} className="animate-spin text-[#24b47e]" /> 解析中...</>
                ) : (
                    <><ImagePlus size={16} className="text-[#24b47e]" /> 画像を選択</>
                )}
            </button>
        </div>
    )
}
