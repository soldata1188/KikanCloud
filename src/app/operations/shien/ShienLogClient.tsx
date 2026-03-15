'use client'

import React, { useState } from 'react';
import {
    User,
    Building2,
    MessageSquare,
    Plus,
    X,
    Phone,
    Users,
    Monitor,
    Trash2,
    Search,
    Filter,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { addShienLog, deleteShienLog } from './actions';
import { Company, Worker } from '@/types/schema';

interface ShienLogClientProps {
    initialLogs: any[];
    companies: Pick<Company, 'id' | 'name_jp'>[];
    workers: Pick<Worker, 'id' | 'full_name_romaji'>[];
}

const TYPE_ICONS: Record<string, any> = {
    visit: Users,
    phone: Phone,
    online: Monitor,
    other: MessageSquare
};

const TYPE_LABELS: Record<string, string> = {
    visit: '訪問訪問',
    phone: '電話相談',
    online: 'オンライン',
    other: 'その他'
};

export default function ShienLogClient({ initialLogs, companies, workers }: ShienLogClientProps) {
    const [logs, setLogs] = useState(initialLogs);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCompany, setSelectedCompany] = useState<string>('all');

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.companies?.name_jp.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.workers?.full_name_romaji.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = selectedCompany === 'all' || log.company_id === selectedCompany;
        return matchesSearch && matchesCompany;
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        try {
            await addShienLog(formData);
            window.location.reload(); // Simple way to refresh for now
        } catch (err) {
            alert('Error adding log');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            await deleteShienLog(id);
            setLogs(logs.filter(l => l.id !== id));
        } catch (err) {
            alert('Error deleting log');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-transparent anim-page">
            {/* --- Header Area --- */}
            <div className="flex items-center justify-between px-8 h-[72px] bg-white border-b border-gray-100 z-20">
                <div className="flex items-center gap-4">
                    <Link href="/operations" className="p-2.5 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors border border-gray-100">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="space-y-0.5">
                        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">
                            支援・定期巡回記録
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Support Activities</p>
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                    <Plus size={15} strokeWidth={2.5} />
                    新規記録作成
                </button>
            </div>

            {/* --- Filter Bar --- */}
            <div className="px-8 py-4 bg-white/40 border-b border-gray-100 flex flex-wrap items-center gap-6">
                <div className="relative flex-1 min-w-[280px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="キーワードで検索 (内容、企業名、実習生)..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Filter size={16} className="text-gray-400" />
                    <select
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-bold text-gray-700 outline-none focus:border-blue-500 shadow-sm"
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                    >
                        <option value="all">すべての企業</option>
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name_jp}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* --- Main Content: Grid or List --- */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                <div className="max-w-4xl mx-auto space-y-4 anim-stagger">
                    {filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                            <MessageSquare size={48} strokeWidth={1} />
                            <p className="mt-4 text-[13px] font-bold">該当する記録が見つかりません</p>
                        </div>
                    ) : (
                        filteredLogs.map((log: any) => {
                            const Icon = TYPE_ICONS[log.support_type] || MessageSquare;
                            return (
                                <div key={log.id} className="app-card overflow-hidden hover:shadow-md transition-all group border-none">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Left Side: Type & Date */}
                                        <div className="md:w-[200px] p-6 bg-gray-50/30 border-b md:border-b-0 md:border-r border-gray-50 flex md:flex-col items-center justify-between md:justify-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-gray-100 group-hover:scale-110 transition-transform">
                                                <Icon size={20} />
                                            </div>
                                            <div className="text-center md:mt-2">
                                                <div className="text-[16px] font-bold text-gray-900 mb-1">
                                                    {log.support_date}
                                                </div>
                                                <span className="badge badge-primary">{TYPE_LABELS[log.support_type]}</span>
                                            </div>
                                        </div>

                                        {/* Right Side: Content */}
                                        <div className="flex-1 p-5 relative">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="badge badge-primary flex items-center gap-1">
                                                    <Building2 size={10} />
                                                    {log.companies?.name_jp}
                                                </span>
                                                {log.workers && (
                                                    <span className="badge badge-success flex items-center gap-1">
                                                        <User size={10} />
                                                        {log.workers?.full_name_romaji}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-[13px] text-gray-800 font-bold leading-relaxed whitespace-pre-wrap mb-4">
                                                {log.content}
                                            </p>

                                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <User size={10} className="text-gray-400" />
                                                    </div>
                                                    記録者: {log.author?.full_name || '不明'}
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(log.id)}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* --- Add Log Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm anim-fade">
                    <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden anim-modal">
                        <div className="px-5 py-4 bg-[#0067b8] flex items-center justify-between">
                            <h3 className="text-[12px] font-black text-white uppercase tracking-widest">新規支援記録の登録</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">実施日</label>
                                    <input
                                        type="date"
                                        name="support_date"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-[13px] font-bold focus:bg-white focus:border-[#0067b8] outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">支援種別</label>
                                    <select
                                        name="support_type"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-[13px] font-bold focus:bg-white focus:border-[#0067b8] outline-none"
                                    >
                                        <option value="visit">訪問・面談</option>
                                        <option value="phone">電話相談</option>
                                        <option value="online">オンライン面談</option>
                                        <option value="other">その他</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">対象企業</label>
                                <select
                                    name="company_id"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-[13px] font-bold focus:bg-white focus:border-[#0067b8] outline-none"
                                    required
                                >
                                    <option value="">企業を選択してください</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name_jp}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">対象実習生 (任意)</label>
                                <select
                                    name="worker_id"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-[13px] font-bold focus:bg-white focus:border-[#0067b8] outline-none"
                                >
                                    <option value="">全体・未選択</option>
                                    {workers.map(w => (
                                        <option key={w.id} value={w.id}>{w.full_name_romaji}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">支援内容・詳細</label>
                                <textarea
                                    name="content"
                                    rows={5}
                                    placeholder="巡回時の様子、相談内容、指導事項などを詳細に入力してください..."
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-[13px] font-bold focus:bg-white focus:border-[#0067b8] outline-none resize-none"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-[11px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-[#0067b8] text-white text-[11px] font-black rounded-md hover:bg-[#005a91] transition-all disabled:opacity-50 uppercase tracking-widest"
                                >
                                    {isSubmitting ? '保存中...' : '記録を保存する'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
