'use client'

import { UserCircle2, Plus, ShieldAlert, Building2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { removeStaff } from './actions'
import { InviteStaffForm } from '@/components/InviteStaffForm'

export default function StaffList({ initialStaff, organizationId }: { initialStaff: any[], organizationId: string }) {
    const [isAddMode, setIsAddMode] = useState(false)

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <span className="badge badge-danger flex items-center gap-1"><ShieldAlert size={10} /> 統括管理者</span>
            case 'union_admin': return <span className="badge badge-primary flex items-center gap-1"><Building2 size={10} /> 機関管理者</span>
            case 'union_staff': return <span className="badge badge-muted flex items-center gap-1"><UserCircle2 size={10} /> 担当職員</span>
            default: return <span className="badge badge-muted">{role}</span>
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-[15px] font-normal text-gray-900">在籍スタッフ一覧</h3>
                    <p className="text-[13px] text-gray-500 font-normal">所属するユーザーアカウント（スタッフ）を管理します。</p>
                </div>
                <button onClick={() => setIsAddMode(!isAddMode)} className={isAddMode ? 'btn btn-secondary' : 'btn btn-primary'}>
                    <Plus size={15} /> {isAddMode ? 'キャンセル' : 'スタッフ追加'}
                </button>
            </div>

            {isAddMode && (
                <div className="mb-8 flex justify-start">
                    <InviteStaffForm />
                </div>
            )}

            <div className="border border-[var(--color-border)] rounded-[var(--radius-card)] overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--color-bg-page)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border)]">
                        <tr>
                            <th className="px-5 py-3">氏名</th>
                            <th className="px-5 py-3">メールアドレス</th>
                            <th className="px-5 py-3">権限</th>
                            <th className="px-5 py-3 text-right">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] bg-white">
                        {initialStaff.map(s => (
                            <tr key={s.id} className="hover:bg-[var(--color-bg-page)] transition-colors">
                                <td className="px-5 py-3.5 font-medium text-[var(--color-text-primary)]">{s.full_name}</td>
                                <td className="px-5 py-3.5 text-[12px] font-mono text-[var(--color-text-secondary)]">{s.email}</td>
                                <td className="px-5 py-3.5">{getRoleBadge(s.role)}</td>
                                <td className="px-5 py-3.5 text-right">
                                    {s.role !== 'admin' && (
                                        <form action={removeStaff} className="inline-block">
                                            <input type="hidden" name="userId" value={s.id} />
                                            <button type="submit" className="text-[var(--color-danger)] hover:bg-red-50 p-1.5 rounded-md transition-colors" title="アカウント削除">
                                                <Trash2 size={16} />
                                            </button>
                                        </form>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}