'use client'

import React from 'react';

interface OperationListItemProps {
    worker: {
        id: string;
        full_name_romaji: string;
        full_name_kana: string;
        company_name: string;
        visa_status: string;
        zairyu_exp: string;
        entry_date: string;
        address: string;
        kikou_status?: { progress: string, type: string, application_date: string, assignee: string };
        nyukan_status?: { progress: string, application_date: string, receipt_number: string };
        remarks: string;
    };
    onEditMemo?: (id: string) => void;
}

export default function OperationListItem({ worker, onEditMemo }: OperationListItemProps) {
    // Calculate duration in Japan
    const entryDate = new Date(worker.entry_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - entryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    // Check expiry alert
    const expDate = new Date(worker.zairyu_exp);
    const daysUntilExp = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isWarnExp = daysUntilExp <= 30;

    return (
        <div className="bg-white border border-gray-200 rounded-md shadow-sm flex flex-col md:flex-row hover:border-blue-300 transition-colors pointer-events-none md:pointer-events-auto">

            {/* Cột 1: Thông tin */}
            <div className="w-full md:w-[380px] shrink-0 border-b md:border-b-0 md:border-r border-gray-200 p-4 flex flex-col md:flex-row gap-3 relative">
                {/* Checkbox: Ẩn trên Mobile */}
                <input type="checkbox" className="hidden md:block mt-1 rounded border-gray-300 text-[#0067b8] cursor-pointer pointer-events-auto" />

                {/* Badges */}
                <div className="absolute top-4 right-4 flex gap-1">
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-sm border border-green-200">在籍中</span>
                    {isWarnExp && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-sm border border-red-200">
                            期限まで{daysUntilExp}日
                        </span>
                    )}
                </div>

                <div className="flex-1 mt-6 md:mt-0">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full border border-gray-200 bg-slate-100 flex items-center justify-center text-slate-400 font-normal">
                            {worker.full_name_romaji.charAt(0)}
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 font-normal">{worker.full_name_kana}</div>
                            <div className="text-sm font-normal text-gray-900 leading-tight">{worker.full_name_romaji}</div>
                            <div className="text-xs text-[#0067b8] font-bold mt-0.5">{worker.company_name}</div>
                        </div>
                    </div>

                    {/* Grid data 2A: Full info, 1 cột trên Mobile, 2 cột trên Desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-[11px]">
                        <div><span className="text-gray-400">資格:</span> <span className="font-normal text-[#0067b8]">{worker.visa_status}</span></div>
                        <div><span className="text-gray-400">期限:</span> <span className={`font-normal ${isWarnExp ? 'text-red-600' : 'text-gray-700'}`}>{worker.zairyu_exp}</span></div>
                        <div><span className="text-gray-400">入国:</span> <span className="font-normal text-gray-700">{worker.entry_date}</span></div>
                        <div><span className="text-gray-400">経過:</span> <span className="font-normal text-gray-900">{years}年 {months}ヶ月</span></div>
                        <div className="col-span-1 md:col-span-2 flex items-start gap-1 mt-1 text-gray-500">
                            <i className="fas fa-map-marker-alt mt-0.5 text-gray-400"></i>
                            <span className="truncate">{worker.address}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cột 2: 機構業務 */}
            <div className="w-full md:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-gray-200 p-4 relative md:group md:cursor-pointer md:hover:bg-gray-50 transition-colors">
                {/* Nút điều hướng/mở rộng: Ẩn trên Mobile */}
                <i className="hidden md:block fas fa-chevron-down absolute top-4 right-4 text-gray-300 md:group-hover:text-gray-500 text-xs"></i>
                <div className="flex items-center gap-2 mb-3">
                    <i className={`fas ${worker.kikou_status?.progress === '完了' ? 'fa-check-circle text-green-600' : 'fa-clock text-blue-600'}`}></i>
                    <span className="text-xs font-normal text-gray-900">機構業務</span>
                    <span className={`px-1.5 py-0.5 text-xs font-bold rounded border ${worker.kikou_status?.progress === '完了'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                        {worker.kikou_status?.progress || '未着手'}
                    </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span className="text-gray-400">申請内容:</span> <span className="font-normal text-gray-800">{worker.kikou_status?.type || '---'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">申請日:</span> <span className="font-normal text-gray-700">{worker.kikou_status?.application_date || '---'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">担当者:</span> <span className="font-normal text-gray-700">{worker.kikou_status?.assignee || '---'}</span></div>
                </div>
            </div>

            {/* Cột 3: 入管業務 */}
            <div className="w-full md:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-gray-200 p-4 relative md:group md:cursor-pointer md:hover:bg-gray-50 transition-colors">
                {/* Nút điều hướng/mở rộng: Ẩn trên Mobile */}
                <i className="hidden md:block fas fa-chevron-down absolute top-4 right-4 text-gray-300 md:group-hover:text-gray-500 text-xs"></i>
                <div className="flex items-center gap-2 mb-3">
                    <i className={`fas ${worker.nyukan_status?.progress === '審査中' ? 'fa-spinner fa-spin text-[#0067b8]' : 'fa-check-circle text-green-600'}`}></i>
                    <span className="text-xs font-normal text-gray-900">入管業務</span>
                    <span className={`px-1.5 py-0.5 text-xs font-bold rounded border ${worker.nyukan_status?.progress === '審査中'
                            ? 'bg-blue-100 text-[#0067b8] border-blue-200'
                            : 'bg-green-100 text-green-700 border-green-200'
                        }`}>
                        {worker.nyukan_status?.progress || '未着手'}
                    </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span className="text-gray-400">申請日:</span> <span className="font-normal text-[#0067b8]">{worker.nyukan_status?.application_date || '---'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">受理番号:</span> <span className="font-normal text-gray-700">{worker.nyukan_status?.receipt_number || '---'}</span></div>
                </div>
            </div>

            {/* Cột 4: メモ */}
            <div className="flex-1 p-4 bg-gray-50/30">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-normal text-gray-500">メモ (Memo)</span>
                    {/* Nút Sửa: Ẩn trên Mobile, khôi phục tương tác trên Desktop */}
                    <button
                        onClick={() => onEditMemo?.(worker.id)}
                        className="hidden md:block text-gray-400 hover:text-[#0067b8] cursor-pointer pointer-events-auto"
                    >
                        <i className="fas fa-edit text-xs"></i>
                    </button>
                </div>
                <div className="bg-[#fff9c4] border border-[#fbc02d] rounded-sm p-2 text-[11px] text-gray-800 h-20 overflow-y-auto leading-relaxed shadow-sm pointer-events-auto">
                    {worker.remarks || 'メモなし'}
                </div>
            </div>
        </div>
    );
}
