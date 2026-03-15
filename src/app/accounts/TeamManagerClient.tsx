'use client'
import { useState, useTransition } from 'react'
import {
    Users, Plus, Key,
    Building2, RefreshCw, Trash2, Copy, Check, Shield, UserCheck, X
} from 'lucide-react'
import { createProvisionedAccount, resetUserPassword, deleteProvisionedAccount } from '../actions/team'

// ── Role display config ────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    admin: { label: 'ADMIN', color: 'text-white', bg: 'bg-emerald-900', icon: <Shield size={11} /> },
    union_admin: { label: '業務管理者', color: 'text-white', bg: 'bg-emerald-800', icon: <Shield size={11} /> },
    staff: { label: '組合スタッフ', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <UserCheck size={11} /> },
    company_admin: { label: '受入企業 管理者', color: 'text-amber-800', bg: 'bg-amber-50', icon: <Building2 size={11} /> },
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
            className={`w-7 h-7 flex items-center justify-center rounded border transition-all ${copied ? 'border-emerald-300 text-emerald-600 bg-emerald-50' : 'border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-700 bg-white'}`}>
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
        const form = e.currentTarget
        const formData = new FormData(form)
        startCreate(async () => {
            const res = await createProvisionedAccount(formData)
            if (res.error) setCreateMsg({ type: 'error', text: res.error })
            else {
                setCreateMsg({ type: 'success', text: 'アカウントが発行されました。', loginId: res.loginId, password: res.password })
                setCreatePw('')
                form.reset()
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
        <div className="space-y-8">

            {/* ── Header + Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="text-[10px] font-normal text-gray-400 uppercase tracking-wider mb-1">組合スタッフ</div>
                    <div className="text-3xl font-normal text-gray-900">{staffCount}</div>
                    <div className="text-xs text-gray-400 mt-1">名のアカウントが有効</div>
                    <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600" style={{ width: `${Math.min((staffCount / Math.max(staffList.length, 1)) * 100, 100)}%` }} />
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="text-[10px] font-normal text-gray-400 uppercase tracking-wider mb-1">受入企業 管理者</div>
                    <div className="text-3xl font-normal text-gray-900">{companyAdminCount}</div>
                    <div className="text-xs text-gray-400 mt-1">社のポータルアクセスが有効</div>
                    <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min((companyAdminCount / Math.max(staffList.length, 1)) * 100, 100)}%` }} />
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-center">
                    <div className="text-[10px] font-normal text-gray-400 uppercase tracking-wider mb-2 text-center">ログインID</div>
                    <div className="text-[11px] text-center font-mono text-gray-500 bg-gray-50 py-2 rounded border border-gray-100">
                        ID@kikancloud.local
                    </div>
                </div>
            </div>

            {/* ── Account List ── */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-normal text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                        <Users size={16} className="text-emerald-600" /> 発行済みアカウント
                    </h2>
                    {isAdmin && (
                        <button onClick={() => { setIsCreateOpen(true); setCreateMsg({ type: '', text: '' }); setCreatePw('') }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-xs font-normal transition-colors uppercase tracking-widest">
                            <Plus size={14} className="inline mr-1" /> 新規発行
                        </button>
                    )}
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-normal text-gray-400 uppercase tracking-wider">
                            <th className="px-6 py-3">氏名 / 企業</th>
                            <th className="px-6 py-3">ログインID</th>
                            <th className="px-6 py-3">権限</th>
                            {isAdmin && <th className="px-6 py-3 text-right">操作</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {staffList.map((staff) => {
                            const rc = ROLE_CONFIG[staff.role] || ROLE_CONFIG.staff
                            return (
                                <tr key={staff.id} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-normal shrink-0 ${rc.bg} ${rc.color}`}>
                                                {(staff.full_name || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-normal text-gray-900">{staff.full_name || 'N/A'}</div>
                                                {staff.companies?.name_jp && (
                                                    <div className="text-[10px] text-gray-400 flex items-center gap-1 font-normal">
                                                        <Building2 size={10} /> {staff.companies.name_jp}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="text-xs font-mono font-normal text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                            {staff.login_id || staff.email?.split('@')[0] || '---'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-normal uppercase tracking-widest ${rc.bg} ${rc.color}`}>
                                            {rc.icon} {rc.label}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-3.5 text-right">
                                            {staff.role !== 'admin' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => { setResetTarget({ id: staff.id, name: staff.full_name, loginId: staff.login_id || staff.email }); setResetMsg({ type: '', text: '' }); setNewPassword('') }}
                                                        className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
                                                        <Key size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteTarget({ id: staff.id, name: staff.full_name }); setDeleteMsg({ type: '', text: '' }) }}
                                                        className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:border-rose-400 hover:text-rose-600 transition-colors">
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* MODALS remain largely the same but with standardized colors/rounding */}
            {/* Create Account Modal */}
            {isCreateOpen && isAdmin && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-normal text-gray-900 uppercase tracking-tight">アカウント新規発行</h3>
                            <button onClick={() => setIsCreateOpen(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {createMsg.text && (
                                <div className={`p-3 text-xs font-normal rounded-md border ${createMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                    <div>{createMsg.text}</div>
                                    {createMsg.type === 'success' && createMsg.loginId && (
                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-600">ログインID:</span>
                                                <span className="font-mono">{createMsg.loginId}</span>
                                                <CopyButton text={createMsg.loginId} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-600">パスワード:</span>
                                                <span className="font-mono">{createMsg.password}</span>
                                                <CopyButton text={createMsg.password!} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <input type="hidden" name="role" value={selectedRole} />
                            <div>
                                <label className="block text-[10px] font-normal text-gray-400 uppercase mb-1 tracking-wider">権限</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setSelectedRole('staff')}
                                        className={`px-3 py-2 text-xs font-normal border rounded-md transition-colors uppercase tracking-widest ${selectedRole === 'staff' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-500'}`}>組合スタッフ</button>
                                    <button type="button" onClick={() => setSelectedRole('company_admin')}
                                        className={`px-3 py-2 text-xs font-normal border rounded-md transition-colors uppercase tracking-widest ${selectedRole === 'company_admin' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-gray-200 text-gray-500'}`}>企業管理者</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-normal text-gray-400 uppercase mb-1 tracking-wider">氏名</label>
                                <input name="fullName" required className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-[#0067b8] font-normal" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-normal text-gray-400 uppercase mb-1 tracking-wider">ログインID</label>
                                <input name="loginId" required className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm font-mono outline-none focus:border-[#0067b8] font-normal" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-normal text-gray-400 uppercase mb-1 tracking-wider">初期パスワード</label>
                                <div className="flex gap-2">
                                    <input name="password" value={createPw} onChange={e => setCreatePw(e.target.value)} required className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm font-mono outline-none focus:border-[#0067b8] font-normal" />
                                    <button type="button" onClick={() => setCreatePw(genPassword())} className="px-3 bg-gray-100 border border-gray-200 rounded-md text-xs font-normal"><RefreshCw size={14} /></button>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-xs font-normal text-gray-500 uppercase tracking-widest">キャンセル</button>
                                <button type="submit" disabled={isPendingCreate} className="bg-emerald-600 text-white px-6 py-2 rounded-md text-xs font-normal uppercase tracking-widest">発行</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetTarget && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-sm">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-normal text-gray-900 uppercase tracking-tight">パスワード再発行</h3>
                            <button onClick={() => setResetTarget(null)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                            {resetMsg.text && (
                                <div className={`p-3 text-xs font-normal rounded-md border ${resetMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                    {resetMsg.text}
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-normal text-gray-400 uppercase mb-1 tracking-wider">新しいパスワード</label>
                                <div className="flex gap-2">
                                    <input value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm font-mono outline-none focus:border-[#0067b8] font-normal" />
                                    <button type="button" onClick={() => setNewPassword(genPassword())} className="px-3 bg-gray-100 border border-gray-200 rounded-md text-xs font-normal"><RefreshCw size={14} /></button>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setResetTarget(null)} className="px-4 py-2 text-xs font-normal text-gray-500 uppercase tracking-widest">キャンセル</button>
                                <button type="submit" disabled={isPendingReset || !newPassword} className="bg-emerald-600 text-white px-6 py-2 rounded-md text-xs font-normal uppercase tracking-widest">再発行</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-rose-100 bg-rose-50">
                            <h3 className="font-normal text-rose-800 uppercase tracking-tight">アカウント削除確認</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-6">
                                <strong>{deleteTarget.name}</strong> のアカウントを完全に削除しますか？
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-xs font-normal text-gray-500 uppercase tracking-widest">キャンセル</button>
                                <button onClick={handleDelete} disabled={isPendingDelete} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-md text-xs font-normal transition-colors uppercase tracking-widest">削除</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
