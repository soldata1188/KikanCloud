'use client'

import React from 'react';
import { User } from 'lucide-react';

interface Worker {
    id: string;
    full_name_romaji: string;
    full_name_kana: string;
    companies?: { name_jp: string };
    zairyu_exp: string;
    status: string;
    avatar_url: string | null;
    visa_status?: string;
    entry_batch?: string;
    entry_date?: string;
    passport_exp?: string;
    insurance_exp?: string;
    nationality?: string;
    japan_residence?: string;
    industry_field?: string;
}

interface WorkerListColumnProps {
    workers: Worker[];
    selectedIds: string[];
    onSelect: (id: string, event: React.MouseEvent) => void;
}

// ─── Visa status display order & labels ────────────────────────────────────
const VISA_ORDER = ['実習生1号', '実習生2号', '実習生3号', '特定活動', '育成就労', '特定1号', '特定2号', '技能実習', '特定技能'];
const VISA_LABEL_MAP: Record<string, string> = {
    'ikusei_shuro': '育成就労',
    'ginou_jisshu': '技能実習',
    'tokuteigino': '特定技能',
};
function resolveVisaLabel(v?: string) {
    if (!v) return '未設定';
    return VISA_LABEL_MAP[v] || v;
}

function WorkerListColumn({ workers, selectedIds, onSelect }: WorkerListColumnProps) {
    const fmtDate = (d?: string) => {
        if (!d || d === '---') return '---';
        return d.replace(/-/g, '/');
    };

    const fmtInJapanDuration = (dateStr?: string) => {
        if (!dateStr || dateStr === '---') return '---';
        const entry = new Date(dateStr);
        const today = new Date();
        if (entry > today) return '---';
        let years = today.getFullYear() - entry.getFullYear();
        let months = today.getMonth() - entry.getMonth();
        if (months < 0) { years--; months += 12; }
        if (years === 0) return `${months}ヶ月`;
        if (months === 0) return `${years}年`;
        return `${years}年${months}ヶ月`;
    };

    // ─── Group by visa_status ─────────────────────────────────────────────
    const grouped = React.useMemo(() => {
        const map = new Map<string, Worker[]>();
        workers.forEach(w => {
            const key = resolveVisaLabel(w.visa_status);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(w);
        });
        const sorted: { label: string; workers: Worker[] }[] = [];
        VISA_ORDER.forEach(v => {
            if (map.has(v)) sorted.push({ label: v, workers: map.get(v)! });
        });
        map.forEach((ws, label) => {
            if (!VISA_ORDER.includes(label)) sorted.push({ label, workers: ws });
        });
        return sorted;
    }, [workers]);

    // ─── Pre-compute global index per worker ─────────────────────────────────
    // Must be before early return to satisfy Rules of Hooks
    const globalIndexMap = React.useMemo(() => {
        const map = new Map<string, number>();
        let counter = 1;
        grouped.forEach(({ workers: gw }) => {
            gw.forEach(w => { map.set(w.id, counter++); });
        });
        return map;
    }, [grouped]);

    if (workers.length === 0) {
        return (
            <div className="py-20 text-center bg-white lg:bg-transparent rounded-lg">
                <User size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-[13px] font-normal text-gray-300">該当する人材はいません</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-white lg:bg-transparent overflow-hidden">
            <div className="flex-1 overflow-y-auto thin-scrollbar lg:bg-white space-y-0">

                {grouped.map(({ label, workers: groupWorkers }) => (
                    <div key={label}>
                        {/* ── Group Header ── */}
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 border-b border-t border-gray-100 sticky top-0 z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                                {groupWorkers.length}
                            </span>
                        </div>

                        {/* ── Worker Rows ── */}
                        {groupWorkers.map(worker => {
                            const isSelected = selectedIds.includes(worker.id);
                            const rowNum = globalIndexMap.get(worker.id) ?? 0;
                            return (
                                <div key={worker.id} className="relative group">
                                    {/* Desktop List Layout */}
                                    <button
                                        onClick={(e) => onSelect(worker.id, e)}
                                        className={`hidden lg:flex w-full text-left pl-1.5 pr-1.5 py-1.5 border-b border-gray-100 border-l-[3px] transition-all duration-150 items-center gap-3
                                            ${isSelected
                                                ? 'bg-blue-50 border-l-blue-500'
                                                : 'hover:bg-gray-50 border-l-transparent'}`}
                                    >
                                        {/* Row Number */}
                                        <span className="text-[10px] font-mono text-gray-300 shrink-0 w-[20px] text-center select-none">{rowNum}</span>

                                        {/* Section 1: Avatar & Name */}
                                        <div className="flex-[2] min-w-[180px] flex items-center gap-3.5 overflow-hidden">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-normal
                                                ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                {worker.avatar_url
                                                    ? <img src={worker.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                                    : (worker.full_name_romaji || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col min-w-0 justify-center">
                                                <span className={`text-sm font-semibold truncate uppercase tracking-tight leading-none
                                                    ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                                    {worker.full_name_romaji || '---'}
                                                </span>
                                                <span className="text-[11px] font-normal truncate leading-none mt-1 text-gray-400">
                                                    {worker.full_name_kana || '---'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Section 2: 受入企業 & 社宅住所 */}
                                        <div className="flex-[1.8] min-w-[160px] flex flex-col justify-center overflow-hidden pr-2">
                                            <span className="text-[13px] font-normal truncate block leading-none text-gray-700">
                                                {worker.companies?.name_jp
                                                    ? worker.companies.name_jp.replace(/株式会社|有限会社|（株）|\(株\)/g, '').trim()
                                                    : '---'}
                                            </span>
                                            {worker.japan_residence && (
                                                <span className="text-[10px] font-normal truncate block leading-none mt-1.5 text-gray-400">
                                                    {worker.japan_residence}
                                                </span>
                                            )}
                                        </div>

                                        {/* Section 2.5: 職種区分 & 入国期生 */}
                                        <div className="flex-[1.2] min-w-[100px] flex flex-col justify-center overflow-hidden pr-2">
                                            <span className="text-[11px] font-semibold truncate block leading-none text-gray-700">
                                                {worker.industry_field || '---'}
                                            </span>
                                            {worker.entry_batch && (
                                                <span className="text-[10px] font-bold truncate block leading-none mt-1.5 uppercase tracking-wider text-gray-400">
                                                    {worker.entry_batch}
                                                </span>
                                            )}
                                        </div>

                                        {/* Section 3: 入国日 & 在日期間 */}
                                        <div className="flex-[1.2] min-w-[130px] flex flex-col justify-center gap-0.5 items-end pr-2 ml-auto">
                                            <span className="text-sm font-mono tracking-tighter leading-none text-right text-gray-600">
                                                {fmtDate(worker.entry_date)}
                                            </span>
                                            <span className="text-xs font-normal leading-none tracking-tight text-right text-gray-400">
                                                {fmtInJapanDuration(worker.entry_date)}
                                            </span>
                                        </div>

                                        {/* Spacer */}
                                        <div className="flex-[0.2] shrink-0" />
                                    </button>

                                    {/* Mobile Card Layout */}
                                    <button
                                        onClick={(e) => onSelect(worker.id, e)}
                                        className={`lg:hidden w-full flex flex-col bg-white p-3 transition-all border-b border-slate-200
                                            ${isSelected ? 'bg-[#0067b8]/5' : ''}`}
                                    >
                                        <div className="flex gap-4 mb-3 w-full">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-normal shadow-sm
                                                ${isSelected ? 'bg-[#0067b8] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {worker.avatar_url
                                                    ? <img src={worker.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                                    : (worker.full_name_romaji || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-base font-medium text-slate-900 uppercase truncate pr-2">
                                                        {worker.full_name_romaji || '---'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400 mb-1">{worker.full_name_kana}</div>
                                                <div className="text-sm font-medium text-[#0067b8] truncate">
                                                    {worker.companies?.name_jp || '---'}
                                                </div>
                                                {worker.entry_batch && (
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                        {worker.entry_batch}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-3 border-t border-slate-50 pt-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">在留資格</span>
                                                <span className="text-sm font-medium text-gray-700">{label}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest text-right">在日期間 / 入国日</span>
                                                <span className="text-sm font-medium text-gray-700 text-right">
                                                    {fmtInJapanDuration(worker.entry_date)} ({fmtDate(worker.entry_date)})
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default React.memo(WorkerListColumn);
