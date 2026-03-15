'use client'

import React, { useState } from 'react';
import {
    Plus,
    X,
    AlertCircle,
    CheckCircle2,
    User,
    Building2,
    Calendar,
    ArrowLeft,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import { addTask, updateTaskStatus, deleteTask } from './actions';
import { Company, Worker } from '@/types/schema';

interface KanbanClientProps {
    initialTasks: any[];
    companies: Pick<Company, 'id' | 'name_jp'>[];
    workers: Pick<Worker, 'id' | 'full_name_romaji'>[];
    staff: any[];
}

const COLUMNS = [
    { id: 'todo', label: '未着手', color: 'text-gray-400', bg: 'bg-gray-200', activeTab: 'border-gray-200 bg-gray-50' },
    { id: 'in_progress', label: '進行中', color: 'text-blue-500', bg: 'bg-blue-400', activeTab: 'border-blue-100 bg-blue-50' },
    { id: 'done', label: '完了済', color: 'text-emerald-500', bg: 'bg-emerald-400', activeTab: 'border-emerald-100 bg-emerald-50' }
];

const PRIORITY_STYLES: Record<string, string> = {
    low: 'bg-gray-50 text-gray-500 border-gray-100',
    medium: 'bg-blue-50 text-blue-600 border-blue-100',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    urgent: 'bg-red-50 text-red-700 border-red-200'
};

export default function KanbanClient({ initialTasks, companies, workers, staff }: KanbanClientProps) {
    const [tasks, setTasks] = useState(initialTasks);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleMove = async (taskId: string, newStatus: string) => {
        const originalTasks = [...tasks];
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        try {
            await updateTaskStatus(taskId, newStatus);
        } catch (err) {
            setTasks(originalTasks);
            alert('Status update failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('タスクを削除しますか？')) return;
        setTasks(tasks.filter(t => t.id !== id));
        try {
            await deleteTask(id);
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        try {
            await addTask(formData);
            window.location.reload();
        } catch (err) {
            alert('Error adding task');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-transparent anim-page overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 h-[72px] bg-white border-b border-gray-100 z-20">
                <div className="flex items-center gap-4">
                    <Link href="/operations" className="p-2.5 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors border border-gray-100">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="space-y-0.5">
                        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">
                            業務進捗・タスク管理
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Kanban Board</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    新規タスク
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 flex gap-8 px-8 py-8 overflow-x-auto no-scrollbar bg-[var(--background)]">
                {COLUMNS.map(col => (
                    <div key={col.id} className="flex-1 min-w-[320px] max-w-[400px] flex flex-col gap-4">
                        <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl border-x border-t border-gray-100 bg-white`}>
                            <div className="flex items-center gap-2.5">
                                <span className={`w-2 h-2 rounded-full ${col.bg}`} />
                                <h3 className="text-[14px] font-bold text-gray-800 tracking-tight">{col.label}</h3>
                                <div className="ml-1 bg-gray-50 text-[11px] font-bold text-gray-400 px-2.5 py-0.5 rounded-full border border-gray-100">
                                    {tasks.filter(t => t.status === col.id).length}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-10 px-0">
                            {tasks.filter(t => t.status === col.id).map(task => (
                                <div
                                    key={task.id}
                                    className="app-card p-5 hover:shadow-md transition-all group anim-card relative border-none"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className={`px-2 py-0.5 rounded border text-xs font-black uppercase tracking-widest ${PRIORITY_STYLES[task.priority]}`}>
                                            {task.priority === 'urgent' && <AlertCircle size={10} className="inline mr-1 -mt-0.5" />}
                                            {task.priority}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDelete(task.id)}
                                                className="p-1 text-gray-300 hover:text-rose-500"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    <h4 className="text-[14px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug mb-3">
                                        {task.title}
                                    </h4>

                                    <div className="space-y-2 mb-4">
                                        {task.companies && (
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                                                <Building2 size={12} className="text-blue-400" />
                                                <span className="truncate">{task.companies.name_jp}</span>
                                            </div>
                                        )}
                                        {task.workers && (
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                                                <User size={12} className="text-gray-300" />
                                                <span className="truncate">{task.workers.full_name_romaji}</span>
                                            </div>
                                        )}
                                        {task.due_date && (
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-white bg-blue-600 px-2 py-1 rounded inline-flex shadow-sm shadow-blue-200">
                                                <Calendar size={12} />
                                                <span>期日: {task.due_date.replace(/-/g, '/')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            {task.assigned_user ? (
                                                <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-50 rounded-lg text-[11px] font-bold text-gray-600 border border-gray-100">
                                                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                                        {task.assigned_user.full_name.charAt(0)}
                                                    </div>
                                                    {task.assigned_user.full_name}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] font-medium text-gray-300 italic">未割当</span>
                                            )}
                                        </div>

                                        <div className="flex gap-1">
                                            {COLUMNS.filter(c => c.id !== col.id).map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => handleMove(task.id, c.id)}
                                                    className={`w-6 h-6 flex items-center justify-center rounded border border-gray-100 hover:border-[#0067b8] hover:bg-blue-50 transition-colors text-gray-300 hover:text-[#0067b8]`}
                                                    title={`${c.label}へ移動`}
                                                >
                                                    <CheckCircle2 size={12} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {task.task_type.startsWith('auto_') && (
                                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#0067b8] rounded-full shadow-sm shadow-[#0067b8]/50" title="自動生成タスク" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/10 backdrop-blur-[2px] anim-fade">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden anim-modal">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">新規タスクの追加</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">タスク名</label>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="例: 加藤さんのビザ更新書類作成"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-[13px] font-bold focus:bg-white focus:border-[#0067b8] outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">重要度</label>
                                    <select name="priority" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-[13px] font-bold outline-none focus:bg-white focus:border-[#0067b8]">
                                        <option value="low">Low</option>
                                        <option value="medium" selected>Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">期限</label>
                                    <input type="date" name="due_date" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-[13px] font-bold outline-none focus:bg-white focus:border-[#0067b8]" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">担当担当</label>
                                <select name="assigned_to" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-[13px] font-bold outline-none focus:bg-white focus:border-[#0067b8]">
                                    <option value="">未割当</option>
                                    {staff.map(s => (
                                        <option key={s.id} value={s.id}>{s.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">関連企業・実習生 (任意)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select name="company_id" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-[11px] font-bold outline-none">
                                        <option value="">企業選択</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name_jp}</option>)}
                                    </select>
                                    <select name="worker_id" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-[11px] font-bold outline-none">
                                        <option value="">実習生選択</option>
                                        {workers.map(w => <option key={w.id} value={w.id}>{w.full_name_romaji}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">備考</label>
                                <textarea name="description" rows={3} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-[13px] font-bold outline-none focus:bg-white focus:border-[#0067b8] resize-none" />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
                                    キャンセル
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-blue-600 text-white text-[13px] font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm active:scale-95 disabled:opacity-50">
                                    {isSubmitting ? '保存中...' : 'タスクを追加'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
