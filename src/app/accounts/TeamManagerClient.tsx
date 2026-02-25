'use client'
import { useState, useTransition } from 'react'
import { Users, Plus, Loader2, Key, Lock, User, ShieldAlert, CheckCircle2, Building2, RefreshCw } from 'lucide-react'
import { createProvisionedAccount, resetUserPassword } from '../actions/team'

export default function TeamManagerClient({ staffList, companies, isAdmin }: { staffList: any[], companies: any[], isAdmin: boolean }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createMsg, setCreateMsg] = useState({ type: '', text: '' })
    const [selectedRole, setSelectedRole] = useState('staff')
    const [isPendingCreate, startCreate] = useTransition()

    const [resetTarget, setResetTarget] = useState<{ id: string, name: string, loginId: string } | null>(null)
    const [newPassword, setNewPassword] = useState('')
    const [resetMsg, setResetMsg] = useState({ type: '', text: '' })
    const [isPendingReset, startReset] = useTransition()

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setCreateMsg({ type: '', text: '' })
        const formData = new FormData(e.currentTarget)
        startCreate(async () => {
            const res = await createProvisionedAccount(formData)
            if (res.error) setCreateMsg({ type: 'error', text: res.error })
            else {
                setCreateMsg({ type: 'success', text: `アカウント発行成功！\nID: ${res.loginId}\nPW: ${res.password}\n※必ずメモして共有してください。` })
                e.currentTarget.reset(); setSelectedRole('staff')
            }
        })
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault(); setResetMsg({ type: '', text: '' })
        if (!resetTarget || !newPassword) return
        startReset(async () => {
            const res = await resetUserPassword(resetTarget.id, newPassword)
            if (res.error) setResetMsg({ type: 'error', text: res.error })
            else { setResetMsg({ type: 'success', text: `再発行完了！新しいパスワード: ${newPassword}` }); setNewPassword('') }
        })
    }

    const generateRandomPassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#"
        setNewPassword(Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join(''))
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-[18px] font-bold text-[#1f1f1f] flex items-center gap-2"><Users size={18} className="text-[#24b47e]" /> 発行済みアカウント</h2><p className="text-[12px] text-[#878787] mt-1">現在、{staffList.length}名のアカウントが登録されています。</p></div>
                {isAdmin && <button onClick={() => { setIsCreateOpen(true); setCreateMsg({ type: '', text: '' }) }} className="flex items-center gap-2 bg-[#1f1f1f] text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-[#24b47e] transition-colors shadow-sm"><Plus size={16} /> アカウント新規発行</button>}
            </div>

            <div className="bg-white border border-[#ededed] rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#fbfcfd] border-b border-[#ededed] text-[11px] font-bold text-[#878787] uppercase">
                            <th className="p-4">氏名 / 企業名</th><th className="p-4">ログインID</th><th className="p-4">権限</th><th className="p-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="text-[13px] text-[#1f1f1f]">
                        {staffList.map((staff) => (
                            <tr key={staff.id} className="border-b border-[#ededed] last:border-0 hover:bg-[#fbfcfd] group transition-colors">
                                <td className="p-4 font-bold flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm ${staff.role === 'admin' ? 'bg-[#1f1f1f] text-white' : staff.role === 'company_admin' ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'bg-[#e8f5e9] text-[#24b47e]'}`}>{staff.role === 'company_admin' ? <Building2 size={14} /> : <User size={14} />}</div>
                                    <div><div>{staff.full_name || 'N/A'}</div>{staff.companies?.name_jp && <div className="text-[11px] text-[#878787] font-medium">{staff.companies.name_jp}</div>}</div>
                                </td>
                                <td className="p-4 font-mono font-bold tracking-wide">{staff.login_id || staff.email}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${staff.role === 'admin' ? 'bg-[#1f1f1f] text-white' : staff.role === 'company_admin' ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'bg-[#fbfcfd] border border-[#ededed] text-[#444746]'}`}>{staff.role === 'company_admin' ? '受入企業 (PORTAL)' : staff.role.toUpperCase()}</span></td>
                                <td className="p-4 text-right">
                                    {isAdmin && staff.role !== 'admin' && <button onClick={() => { setResetTarget({ id: staff.id, name: staff.full_name, loginId: staff.login_id || staff.email }); setResetMsg({ type: '', text: '' }); setNewPassword('') }} className="w-8 h-8 rounded bg-white border border-[#ededed] text-[#878787] hover:border-[#1a73e8] hover:text-[#1a73e8] inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Key size={14} /></button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isCreateOpen && isAdmin && (
                <div className="fixed inset-0 bg-[#1f1f1f]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => !isPendingCreate && setIsCreateOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#ededed] bg-[#fbfcfd] relative"><div className="absolute top-0 left-0 w-full h-1 bg-[#24b47e]"></div><h3 className="text-[18px] font-black text-[#1f1f1f] flex items-center gap-2"><Plus size={18} className="text-[#24b47e]" /> アカウント発行</h3></div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {createMsg.text && <div className={`p-4 text-[13px] rounded-lg flex items-start gap-2 font-bold whitespace-pre-line ${createMsg.type === 'error' ? 'bg-[#fff9f9] text-[#d93025]' : 'bg-[#e8f5e9] text-[#1e8e3e]'}`}>{createMsg.type === 'error' ? <ShieldAlert size={16} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={16} className="shrink-0 mt-0.5" />} <div>{createMsg.text}</div></div>}
                            <div><label className="text-[11px] font-bold text-[#878787] uppercase block mb-1">権限 (Role)</label><select name="role" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="w-full h-11 px-3 bg-[#fbfcfd] border border-[#ededed] rounded-lg text-[13px] font-bold outline-none focus:border-[#24b47e]"><option value="staff">内部スタッフ</option><option value="company_admin">受入企業 (PORTAL)</option></select></div>
                            {selectedRole === 'company_admin' && (<div><label className="text-[11px] font-bold text-[#878787] uppercase block mb-1">紐付ける受入企業</label><select name="companyId" required className="w-full h-11 px-3 bg-[#fffcf0] border border-[#f59e0b]/30 rounded-lg text-[13px] font-bold outline-none focus:border-[#f59e0b]"><option value="">-- 企業を選択 --</option>{companies.map((c: any) => <option key={c.id} value={c.id}>{c.name_jp}</option>)}</select></div>)}
                            <div><label className="text-[11px] font-bold text-[#878787] uppercase block mb-1">氏名 / 担当者名</label><input name="fullName" required className="w-full h-11 px-3 bg-[#fbfcfd] border border-[#ededed] rounded-lg text-[13px] outline-none focus:border-[#24b47e]" placeholder="例: 田中 太郎" /></div>
                            <div><label className="text-[11px] font-bold text-[#878787] uppercase block mb-1">ログインID (英数字)</label><input type="text" name="loginId" required pattern="[a-zA-Z0-9_-]+" className="w-full h-11 px-3 bg-[#fbfcfd] border border-[#ededed] rounded-lg text-[14px] outline-none focus:border-[#24b47e] font-mono font-bold tracking-wider" placeholder="staff_01" autoCapitalize="none" /></div>
                            <div><label className="text-[11px] font-bold text-[#878787] uppercase block mb-1">初期パスワード</label><input type="text" name="password" required minLength={6} className="w-full h-11 px-3 bg-[#fbfcfd] border border-[#ededed] rounded-lg text-[14px] outline-none focus:border-[#24b47e] font-mono font-bold tracking-wider" placeholder="6文字以上" /></div>
                            <div className="pt-4 flex justify-end gap-3 mt-6"><button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2.5 text-[13px] font-bold text-[#878787] hover:bg-[#fbfcfd] rounded-lg transition-colors">閉じる</button><button type="submit" disabled={isPendingCreate} className="flex items-center gap-2 bg-[#1f1f1f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#24b47e] transition-colors">{isPendingCreate ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} アカウント発行</button></div>
                        </form>
                    </div>
                </div>
            )}

            {resetTarget && (
                <div className="fixed inset-0 bg-[#1f1f1f]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => !isPendingReset && setResetTarget(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#ededed] bg-[#fbfcfd] relative"><div className="absolute top-0 left-0 w-full h-1 bg-[#1a73e8]"></div><h3 className="text-[18px] font-black text-[#1f1f1f] flex items-center gap-2"><Key size={18} className="text-[#1a73e8]" /> パスワード再発行</h3><p className="text-[12px] text-[#878787] mt-1"><strong className="text-[#1f1f1f]">{resetTarget.name}</strong> 様の新しいパスワードを設定します。<br /><span className="text-[#d93025]">※データは一切失われません。</span></p></div>
                        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                            {resetMsg.text && <div className={`p-4 text-[13px] rounded-lg flex items-start gap-2 font-bold whitespace-pre-line ${resetMsg.type === 'error' ? 'bg-[#fff9f9] text-[#d93025] border border-[#fce8e6]' : 'bg-[#e8f0fe] text-[#1a73e8] border border-[#1a73e8]/20'}`}>{resetMsg.type === 'error' ? <ShieldAlert size={16} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={16} className="shrink-0 mt-0.5" />} <div>{resetMsg.text}</div></div>}
                            <div className="p-3 bg-[#fbfcfd] border border-[#ededed] rounded-lg flex justify-between items-center"><span className="text-[11px] font-bold text-[#878787] uppercase">ログインID</span><span className="text-[13px] font-mono font-bold text-[#1f1f1f]">{resetTarget.loginId}</span></div>
                            <div><label className="text-[11px] font-bold text-[#878787] uppercase block mb-1">新しいパスワード</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1"><Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" /><input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className="w-full h-11 pl-9 pr-3 bg-white border border-[#ededed] rounded-lg text-[14px] outline-none focus:border-[#1a73e8] font-mono font-bold tracking-wider" placeholder="6文字以上で入力" /></div>
                                    <button type="button" onClick={generateRandomPassword} title="自動生成" className="w-11 h-11 flex items-center justify-center bg-[#fbfcfd] border border-[#ededed] rounded-lg hover:border-[#1a73e8] hover:text-[#1a73e8] transition-colors"><RefreshCw size={16} /></button>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3 mt-6"><button type="button" onClick={() => setResetTarget(null)} className="px-4 py-2.5 text-[13px] font-bold text-[#878787] hover:bg-[#fbfcfd] rounded-lg transition-colors">キャンセル</button><button type="submit" disabled={isPendingReset || !newPassword} className="flex items-center gap-2 bg-[#1a73e8] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1557b0] transition-colors disabled:opacity-50">{isPendingReset ? <Loader2 size={16} className="animate-spin" /> : '再発行する'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
