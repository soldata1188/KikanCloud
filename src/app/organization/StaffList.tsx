'use client'

import { UserCircle2, Plus, ShieldAlert, Building2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { removeStaff } from './actions'

export default function StaffList({ initialStaff, organizationId }: { initialStaff: any[], organizationId: string }) {
    const [isAddMode, setIsAddMode] = useState(false)

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-red-200 flex items-center gap-1 w-fit"><ShieldAlert size={10} /> 統括管理者 (System)</span>
            case 'union_admin': return <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-indigo-200 flex items-center gap-1 w-fit"><Building2 size={10} /> 機関管理者 (Admin)</span>
            case 'union_staff': return <span className="bg-white text-[#1f1f1f] px-2 py-0.5 rounded-[4px] text-[10px] font-bold border border-gray-200 flex items-center gap-1 w-fit"><UserCircle2 size={10} /> 担当職員 (Staff)</span>
            default: return <span className="bg-white text-[#878787] px-2 py-0.5 rounded-[4px] text-[10px] border border-gray-200 w-fit">{role}</span>
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-[15px] font-semibold text-[#1f1f1f]">在籍スタッフ一覧</h3>
                    <p className="text-[13px] text-[#878787]">所属するユーザーアカウント（スタッフ）を管理します。</p>
                </div>
                <button
                    onClick={() => setIsAddMode(!isAddMode)}
                    className="flex items-center gap-2 bg-[#1f1f1f] hover:bg-black text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                    <Plus size={16} /> {isAddMode ? 'キャンセル' : 'スタッフ追加'}
                </button>
            </div>

            {isAddMode && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                    <h4 className="text-sm font-medium mb-4">新規アカウントの作成</h4>
                    <form action="/api/organization/staff/create" method="POST" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[#878787] mb-1">氏名 (Full Name)</label>
                            <input name="fullName" required className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#878787]" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#878787] mb-1">ログイン Email</label>
                            <input name="email" type="email" required className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#878787]" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#878787] mb-1">仮パスワード (Min 6 chars)</label>
                            <input name="password" type="password" required minLength={6} className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#878787]" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#878787] mb-1">権限 (Role)</label>
                            <select name="role" className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#878787]">
                                <option value="union_staff">担当職員 (Staff)</option>
                                <option value="union_admin">機関管理者 (Admin)</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 pt-2 text-right">
                            <button type="submit" className="bg-[#24b47e] text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-[#1e9a6a] transition-colors">アカウントを作成</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-xs font-medium text-[#878787] uppercase tracking-wider border-b border-gray-200">
                        <tr>
                            <th className="px-5 py-3">氏名</th>
                            <th className="px-5 py-3">Email Address</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3 text-right">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ededed] bg-white">
                        {initialStaff.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-5 py-3.5 font-medium text-[#1f1f1f]">{s.full_name}</td>
                                <td className="px-5 py-3.5 text-xs font-mono text-[#878787]">{s.email}</td>
                                <td className="px-5 py-3.5">{getRoleBadge(s.role)}</td>
                                <td className="px-5 py-3.5 text-right">
                                    {s.role !== 'admin' && (
                                        <form action={removeStaff} className="inline-block">
                                            <input type="hidden" name="userId" value={s.id} />
                                            <button type="submit" className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors" title="アカウント削除">
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
