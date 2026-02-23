'use client';
import { Beaker } from 'lucide-react';
import React from 'react';

export function TestDataFiller() {
    // Only render in development
    if (process.env.NODE_ENV !== 'development') return null;

    const fillData = () => {
        const setNativeValue = (element: any, value: string) => {
            const valueSetter = Object.getOwnPropertyDescriptor(element.constructor.prototype, "value")?.set;
            if (valueSetter) {
                valueSetter.call(element, value);
            } else {
                element.value = value;
            }
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const elements = document.querySelectorAll('input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea');

        elements.forEach((el) => {
            const element = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            const name = (element.name || element.id || '').toLowerCase();
            const placeholder = (element.getAttribute('placeholder') || '').toLowerCase();

            let valueToSet = '';

            // Randomly select realistic data based on generic Japanese SaaS context
            if (element.tagName === 'SELECT') {
                const select = element as HTMLSelectElement;
                if (select.options.length > 2) {
                    const validOption = Array.from(select.options).find(opt => opt.value !== '' && opt.value !== '0' && !opt.disabled);
                    if (validOption) valueToSet = validOption.value;
                    else valueToSet = select.options[select.options.length - 1].value;
                } else if (select.options.length > 0) {
                    valueToSet = select.options[select.options.length - 1].value;
                }
            } else if (name.includes('postal')) valueToSet = '160-0022';
            else if (name.includes('phone') || name.includes('tel')) valueToSet = '03-1234-5678';
            else if (name.includes('email')) valueToSet = `test_${Date.now()}@example.com`;
            else if (name.includes('corporate_number')) valueToSet = '1234567890123';
            else if (name.includes('password')) valueToSet = 'password123';
            else if (name.includes('address')) valueToSet = '東京都新宿区テスト1-2-3';
            else if (name.includes('representative') && name.includes('romaji')) valueToSet = 'YAMADA TARO';
            else if (name.includes('representative')) valueToSet = '山田 太郎';
            else if (name.includes('manager')) valueToSet = '田中 健太';
            else if (name.includes('advisor') || name.includes('life') || name.includes('tech')) valueToSet = 'テスト 指導員';
            else if (name.includes('pic_name')) valueToSet = '鈴木 一郎';
            else if (name.includes('name_jp')) valueToSet = '株式会社テスト' + Math.floor(Math.random() * 100);
            else if (name.includes('name_romaji')) valueToSet = 'TEST CORP';
            else if (name.includes('full_name_romaji')) valueToSet = 'NGUYEN VAN TEST';
            else if (name.includes('full_name_kana')) valueToSet = 'グエン ヴァン テスト';
            else if (name.includes('passport_no')) valueToSet = 'C1234567';
            else if (name.includes('zairyu_no')) valueToSet = 'AB12345678CD';
            else if (name.includes('cert_no')) valueToSet = 'CERT-123';
            else if (name.includes('industry')) valueToSet = '建設業';
            else if (name.includes('occupations')) valueToSet = '機械加工';
            else if (name.includes('sending_org')) valueToSet = 'TEST VINA JSC';
            else if (name.includes('entry_batch')) valueToSet = '第1期生';
            else if (element.type === 'date') valueToSet = '2025-01-01';
            else if (element.type === 'number') valueToSet = '100';
            else if (element.type === 'checkbox') {
                (element as HTMLInputElement).click();
            } else {
                // Look at placeholder for hints
                if (placeholder.includes('例：') || placeholder.includes('例:')) {
                    valueToSet = placeholder.replace('例：', '').replace('例:', '').trim();
                } else if (placeholder.includes('例')) {
                    valueToSet = placeholder.replace('例', '').trim();
                } else {
                    valueToSet = 'テストデータ';
                }
            }

            if (valueToSet && element.type !== 'checkbox') {
                setNativeValue(element, valueToSet);
            }
        });
    };

    return (
        <button
            onClick={fillData}
            title="テスト用データ (Test)"
            className="fixed bottom-6 right-6 z-[9999] bg-[#24b47e] hover:bg-[#1e9a6a] text-white rounded-full p-4 shadow-xl shadow-[#24b47e]/30 transition-all flex items-center justify-center group border border-white/20 cursor-pointer"
        >
            <Beaker size={22} className="relative z-10" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300 ease-in-out whitespace-nowrap pl-0 group-hover:pl-2 text-sm font-bold relative z-10">
                Auto Fill Test
            </span>
            <span className="absolute w-full h-full rounded-full bg-[#24b47e] opacity-30 animate-ping pointer-events-none" style={{ animationDuration: '3s' }}></span>
        </button>
    );
}