'use client'
import { useState, useTransition } from 'react'
import {
    Users, Plus, Loader2, Key, Lock, User, ShieldAlert, CheckCircle2,
    Building2, RefreshCw, Trash2, Copy, Check, Shield, UserCheck, X
} from 'lucide-react'
import { createProvisionedAccount, resetUserPassword, deleteProvisionedAccount } from '../actions/team'

// ── Role display config ────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    admin: { label: 'ADMIN', color: 'text-white', bg: 'bg-slate-900', icon: <Shield size={11} /> },
    union_admin: { label: '業務管理者', color: 'text-white', bg: 'bg-slate-900', icon: <Shield size={11} /> },
    staff: { label: '組合スタッフ', color: 'text-emerald-800', bg: 'bg-emerald-100', icon: <UserCheck size={11} /> },
    company_admin: { label: '受入企業 管理者', color: 'text-blue-800', bg: 'bg-blue-100', icon: <Building2 size={11} /> },
}

// ── Password generator ────────────────────────────────────────────
const genPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#'
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ── Copy button ────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <button type="button" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all ${copied ? 'border-emerald-300 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700 bg-white'}`}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
    )
}

export default function TeamManagerClient({
    staffList, companies, isAdmin
}: {
    staffList: any[]
    companies: any[]
    isAdmin: boolean
}) {
    // ── Create state ──────────────────────────────────────────────
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createMsg, setCreateMsg] = useState<{ type: string; text: string; loginId?: string; password?: string }>({ type: '', text: '' })
    const [selectedRole, setSelectedRole] = useState('staff')
    const [createPw, setCreatePw] = useState('')
    const [isPendingCreate, startCreate] = useTransition()

    // ── Reset state ───────────────────────────────────────────────
    const [resetTarget, setResetTarget] = useState<{ id: string; name: string; loginId: string } | null>(null)
    const [newPassword, setNewPassword] = useState('')
    const [resetMsg, setResetMsg] = useState({ type: '', text: '' })
    const [isPendingReset, startReset] = useTransition()

    // ── Delete state ──────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
    const [deleteMsg, setDeleteMsg] = useState({ type: '', text: '' })
    const [isPendingDelete, startDelete] = useTransition()

    // ── Handlers ──────────────────────────────────────────────────
    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setCreateMsg({ type: '', text: '' })
        const formData = new FormData(e.currentTarget)
        startCreate(async () => {
            const res = await createProvisionedAccount(formData)
            if (res.error) setCreateMsg({ type: 'error', text: res.error })
            else {
                setCreateMsg({ type: 'success', text: 'アカウントが発行されました。', loginId: res.loginId, password: res.password })
                setCreatePw('')
                e.currentTarget.reset()
                setSelectedRole('staff')
            }
        })
    }

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault()
        setResetMsg({ type: '', text: '' })
        if (!resetTarget || !newPassword) return
        startReset(async () => {
            const res = await resetUserPassword(resetTarget.id, newPassword)
            if (res.error) setResetMsg({ type: 'error', text: res.error })
            else setResetMsg({ type: 'success', text: `再発行完了！新しいパスワード: ${newPassword}` })
        })
    }

    const handleDelete = () => {
        if (!deleteTarget) return
        setDeleteMsg({ type: '', text: '' })
        startDelete(async () => {
            const res = await deleteProvisionedAccount(deleteTarget.id)
            if (res.error) setDeleteMsg({ type: 'error', text: res.error })
            else {
                setDeleteMsg({ type: 'success', text: 'アカウントを削除しました。' })
                setTimeout(() => setDeleteTarget(null), 1500)
            }
        })
    }

    // ── Summary counts ────────────────────────────────────────────
    const staffCount = staffList.filter(s => s.role === 'staff').length
    const companyAdminCount = staffList.filter(s => s.role === 'company_admin').length

    return (
        <div className="space-y-8 animate-in fade-in duration-300">

            {/* ── Header + Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-1">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">組合スタッフ</div>
                    <div className="text-4xl font-black text-slate-900">{staffCount}</div>
                    <div className="text-[12px] text-slate-400 mt-1">名のアカウントが発行済</div>
                    <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((staffCount / Math.max(staffList.length, 1)) * 100, 100)}%` }} />
                    </div>
                </div>
                <div className="col-span-1 md:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-1">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">受入企業 管理者</div>
                    <div className="text-4xl font-black text-slate-900">{companyAdminCount}</div>
                    <div className="text-[12px] text-slate-400 mt-1">社のポータルアクセスが有効</div>
                    <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((companyAdminCount / Math.max(staffList.length, 1)) * 100, 100)}%` }} />
                    </div>
                </div>
                <div className="col-span-1 md:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-2">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">ログイン方式</div>
                    <div className="text-[13px] text-slate-700 font-semibold leading-relaxed">
                        ① ログイン画面でIDを入力<br />
                        ② 発行したパスワードを入力<br />
                        ③ メールアドレス不要
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono bg-slate-50 border border-slate-200 rounded px-2 py-1">
                        ID@kikancloud.local (内部変換)
                    </div>
                </div>
            </div>

            {/* ── Account List ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-[15px] font-black text-slate-800 flex items-center gap-2">
                            <Users size={16} className="text-emerald-500" /> 発行済みアカウント
                        </h2>
                        <p className="text-[11px] text-slate-400 mt-0.5">全 {staffList.length} 件</p>
                    </div>
                    {isAdmin && (
                        <button onClick={() => { setIsCreateOpen(true); setCreateMsg({ type: '', text: '' }); setCreatePw('') }}
                            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[13px] font-bold hover:bg-emerald-600 transition-colors shadow-sm">
                            <Plus size={15} /> アカウント新規発行
                        </button>
                    )}
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-6 py-3">氏名 / 企業</th>
                            <th className="px-6 py-3">ログインID</th>
                            <th className="px-6 py-3">権限</th>
                            {isAdmin && <th className="px-6 py-3 text-right">操作</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {staffList.map((staff) => {
                            const rc = ROLE_CONFIG[staff.role] || ROLE_CONFIG.staff
                            return (
                                <tr key={staff.id} className="hover:bg-slate-50/70 group transition-colors">
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${rc.bg} ${rc.color}`}>
                                                {(staff.full_name || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-bold text-slate-900">{staff.full_name || 'N/A'}</div>
                                                {staff.companies?.name_jp && (
                                                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                                        <Building2 size={10} /> {staff.companies.name_jp}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="text-[13px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                            {staff.login_id || staff.email?.split('@')[0] || '---'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${rc.bg} ${rc.color}`}>
                                            {rc.icon} {rc.label}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-3.5 text-right">
                                            {staff.role !== 'admin' && (
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => { setResetTarget({ id: staff.id, name: staff.full_name, loginId: staff.login_id || staff.email }); setResetMsg({ type: '', text: '' }); setNewPassword('') }}
                                                        title="パスワード再発行"
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 bg-white transition-all">
                                                        <Key size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteTarget({ id: staff.id, name: staff.full_name }); setDeleteMsg({ type: '', text: '' }) }}
                                                        title="アカウント削除"
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 bg-white transition-all">
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                        {staffList.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-16 text-center text-[13px] text-slate-400">
                                    アカウントがまだ発行されていません。
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ════════════════════════════════════════
                MODAL — Create Account
            ════════════════════════════════════════ */}
            {isCreateOpen && isAdmin && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={() => !isPendingCreate && setIsCreateOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-[17px] font-black text-slate-900 flex items-center gap-2">
                                    <Plus size={17} className="text-emerald-500" /> アカウント発行
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">メールアドレス不要 — IDとパスワードで即ログイン可能</p>
                            </div>
                            <button onClick={() => setIsCreateOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 bg-white">
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {/* Feedback */}
                            {createMsg.text && createMsg.type === 'error' && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-bold rounded-xl flex items-start gap-2">
                                    <ShieldAlert size={14} className="shrink-0 mt-0.5" /> {createMsg.text}
                                </div>
                            )}
                            {createMsg.loginId && createMsg.type === 'success' && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-700 font-black text-[13px] mb-2">
                                        <CheckCircle2 size={15} /> アカウント発行成功！
                                    </div>
                                    <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-lg px-3 py-2">
                                        <div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ログインID</div>
                                            <div className="font-mono font-black text-[14px] text-slate-900">{createMsg.loginId}</div>
                                        </div>
                                        <CopyButton text={createMsg.loginId!} />
                                    </div>
                                    <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-lg px-3 py-2">
                                        <div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">パスワード</div>
                                            <div className="font-mono font-black text-[14px] text-slate-900">{createMsg.password}</div>
                                        </div>
                                        <CopyButton text={createMsg.password!} />
                                    </div>
                                    <p className="text-[10px] text-rose-600 font-bold">※ このパスワードは一度しか表示されません。必ずメモしてください。</p>
                                </div>
                            )}

                            {/* Role */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">権限 (Role)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'staff', label: '組合スタッフ', desc: '業務管理画面にアクセス', color: 'emerald' },
                                        { value: 'company_admin', label: '受入企業 管理者', desc: '企業ポータルにアクセス', color: 'blue' },
                                    ].map(opt => (
                                        <label key={opt.value}
                                            className={`flex flex-col gap-0.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === opt.value
                                                ? opt.color === 'emerald' ? 'border-emerald-500 bg-emerald-50' : 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                            <input type="radio" name="role" value={opt.value} className="sr-only" checked={selectedRole === opt.value} onChange={() => setSelectedRole(opt.value)} />
                                            <span className={`text-[12px] font-black ${selectedRole === opt.value ? (opt.color === 'emerald' ? 'text-emerald-800' : 'text-blue-800') : 'text-slate-700'}`}>{opt.label}</span>
                                            <span className="text-[10px] text-slate-400">{opt.desc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Company (only for company_admin) */}
                            {selectedRole === 'company_admin' && (
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">紐付ける受入企業 <span className="text-rose-500">*</span></label>
                                    <select name="companyId" required className="w-full h-11 px-3 bg-amber-50 border border-amber-300 rounded-xl text-[13px] font-bold outline-none focus:border-amber-500 text-slate-800">
                                        <option value="">-- 企業を選択 --</option>
                                        {companies.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name_jp}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Full name */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">氏名 / 担当者名 <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input name="fullName" required placeholder="例: 田中 太郎"
                                        className="w-full h-11 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-slate-400 focus:bg-white transition-colors" />
                                </div>
                            </div>

                            {/* Login ID */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">ログインID <span className="text-[9px] text-slate-400 normal-case font-normal">(英数字・ハイフン・アンダーバー)</span></label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">@</span>
                                    <input type="text" name="loginId" required pattern="[a-zA-Z0-9_-]+" autoCapitalize="none"
                                        placeholder="staff_tanaka"
                                        className="w-full h-11 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-mono font-bold outline-none focus:border-slate-400 focus:bg-white transition-colors tracking-wide" />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">初期パスワード <span className="text-rose-500">*</span></label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" name="password" required minLength={6} value={createPw} onChange={e => setCreatePw(e.target.value)} placeholder="6文字以上"
                                            className="w-full h-11 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-mono font-bold outline-none focus:border-slate-400 focus:bg-white transition-colors tracking-wider" />
                                    </div>
                                    <button type="button" onClick={() => setCreatePw(genPassword())} title="自動生成"
                                        className="h-11 px-3 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-400 hover:text-slate-700 text-slate-400 transition-all gap-1.5 text-[11px] font-bold whitespace-nowrap">
                                        <RefreshCw size={13} /> 自動生成
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-4">
                                <button type="button" onClick={() => setIsCreateOpen(false)} disabled={isPendingCreate}
                                    className="px-4 py-2.5 text-[13px] font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                                    閉じる
                                </button>
                                <button type="submit" disabled={isPendingCreate}
                                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50">
                                    {isPendingCreate ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                    アカウント発行
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════
                MODAL — Reset Password
            ════════════════════════════════════════ */}
            {resetTarget && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={() => !isPendingReset && setResetTarget(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-[17px] font-black text-slate-900 flex items-center gap-2">
                                    <Key size={17} className="text-blue-500" /> パスワード再発行
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    <strong className="text-slate-700">{resetTarget.name}</strong> 様のパスワードを変更します
                                </p>
                            </div>
                            <button onClick={() => setResetTarget(null)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 bg-white">
                                <X size={15} />
                            </button>
                        </div>
                        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                            {resetMsg.text && (
                                <div className={`p-3 text-[12px] font-bold rounded-xl flex items-start gap-2 ${resetMsg.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
                                    {resetMsg.type === 'error' ? <ShieldAlert size={14} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={14} className="shrink-0 mt-0.5" />}
                                    {resetMsg.text}
                                </div>
                            )}
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ログインID</span>
                                <span className="text-[13px] font-mono font-black text-slate-900">{resetTarget.loginId}</span>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">新しいパスワード</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} placeholder="6文字以上"
                                            className="w-full h-11 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-mono font-bold outline-none focus:border-blue-400 transition-colors tracking-wider" />
                                    </div>
                                    <button type="button" onClick={() => setNewPassword(genPassword())} title="自動生成"
                                        className="h-11 px-3 flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-400 text-slate-400 hover:text-slate-700 transition-all text-[11px] font-bold whitespace-nowrap">
                                        <RefreshCw size={13} /> 自動生成
                                    </button>
                                </div>
                                {newPassword && (
                                    <div className="mt-2 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                        <span className="font-mono font-black text-[13px] text-blue-900">{newPassword}</span>
                                        <CopyButton text={newPassword} />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-4">
                                <button type="button" onClick={() => setResetTarget(null)} className="px-4 py-2.5 text-[13px] font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">キャンセル</button>
                                <button type="submit" disabled={isPendingReset || !newPassword}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
                                    {isPendingReset ? <Loader2 size={15} className="animate-spin" /> : <Key size={15} />}
                                    再発行する
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════
                MODAL — Delete Confirm
            ════════════════════════════════════════ */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={() => !isPendingDelete && setDeleteTarget(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-rose-100 bg-rose-50 rounded-t-2xl">
                            <h3 className="text-[17px] font-black text-rose-800 flex items-center gap-2">
                                <Trash2 size={17} /> アカウント削除確認
                            </h3>
                            <p className="text-[12px] text-rose-600 mt-1">
                                <strong>{deleteTarget.name}</strong> のアカウントを完全に削除します。この操作は取り消せません。
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            {deleteMsg.text && (
                                <div className={`p-3 text-[12px] font-bold rounded-xl flex items-start gap-2 ${deleteMsg.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                                    {deleteMsg.type === 'error' ? <ShieldAlert size={14} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={14} className="shrink-0 mt-0.5" />}
                                    {deleteMsg.text}
                                </div>
                            )}
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2.5 text-[13px] font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">キャンセル</button>
                                <button onClick={handleDelete} disabled={isPendingDelete}
                                    className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold hover:bg-rose-700 transition-colors disabled:opacity-50">
                                    {isPendingDelete ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                    削除する
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
