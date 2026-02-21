'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Search, Edit2, Trash2, Building2, MapPin, Users, Contact, Filter, RefreshCw } from 'lucide-react'
import { CompanyDeleteButton } from '@/components/SubmitButtons'
import { deleteCompany } from './actions'

export function CompaniesClient({ companies, userRole }: { companies: any[], userRole?: string }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filteredCompanies = useMemo(() => {
        return companies.filter(c => {
            const matchSearch = searchTerm === '' ||
                c.name_jp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.name_romaji?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.corporate_number?.includes(searchTerm)

            const activeWorkersCount = c.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false).length || 0;

            let matchStatus = true;
            if (statusFilter === 'active') {
                matchStatus = activeWorkersCount > 0;
            } else if (statusFilter === 'none') {
                matchStatus = activeWorkersCount === 0;
            }

            return matchSearch && matchStatus
        })
    }, [companies, searchTerm, statusFilter])

    return (
        <div className="flex-1 flex flex-col w-full max-w-[1200px] mx-auto mt-4 md:mt-8">
 <div className="bg-white rounded-[32px] p-4 mb-6 space-y-4"> 
 <div className="min-h-[48px] px-4 py-2 flex items-center gap-3 bg-[#f0f4f9] rounded-[32px] -transparent focus-within:bg-white focus-within: transition-colors"> 
                    <Search size={20} className="text-[#444746]" strokeWidth={1.5} />
                    <input
                        type="text"
                        placeholder="例：トヨタ自動車、または法人番号を入力..."
                        className="w-full bg-transparent outline-none text-[16px] text-[#1f1f1f] placeholder:text-[#444746]/70"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 px-1">
                    <div className="flex items-center gap-2 text-sm text-[#444746] font-medium mr-2">
                        <Filter size={16} /> 絞り込み:
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
 className="bg-white text-[#1f1f1f] text-sm rounded-[32px] px-4 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 transition-all font-medium appearance-none min-w-[140px] cursor-pointer" 
                    >
                        <option value="all">すべての受入状況</option>
                        <option value="active">受入中（在籍あり）</option>
                        <option value="none">受入なし</option>
                    </select>

                    {(searchTerm || statusFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                setStatusFilter('all')
                            }}
 className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-[32px] transition-colors"
                        >
                            <RefreshCw size={12} /> リセット
                        </button>
                    )}
                </div>
            </div>

 <div className="bg-white/80 rounded-[32px] overflow-hidden p-2"> 
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[#444746]">
                        <thead className="bg-transparent text-[12px] font-semibold text-[#444746]/60 border-b border-gray-200/50 uppercase tracking-widest whitespace-nowrap">
                            <tr>
                                <th className="px-4 py-2 font-medium">企業名 / 基本情報</th>
                                <th className="px-4 py-2 font-medium">所在地 / 代表者</th>
                                <th className="px-4 py-2 font-medium">受入情報 / 担当者</th>
                                <th className="px-4 py-2 font-medium text-right w-[120px]">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50">
                            {filteredCompanies.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-[#444746]/60 font-medium">
                                        <div className="flex flex-col items-center gap-3">
                                            <Search size={32} className="text-gray-300" />
                                            条件に一致する企業が見つかりません。
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filteredCompanies.map((c) => {
                                const activeWorkers = c.workers?.filter((w: any) => w.status === 'working' && w.is_deleted === false).length || 0;
                                return (
                                    <tr key={c.id} className="hover:bg-white transition-colors group">
                                        {/* 1. Name & Info */}
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-3.5">
 <div className="w-11 h-11 rounded-[32px] bg-[#f0f4f9] overflow-hidden flex items-center justify-center shrink-0 text-[#444746]">
                                                    <Building2 size={18} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <Link href={`/companies/${c.id}/edit`} className="block group-hover:text-[#4285F4] transition-colors" title="クリックして編集">
                                                        <div className="font-semibold text-[#1f1f1f] text-[15px] group-hover:text-[#4285F4] flex items-center gap-2 leading-tight mb-1">
                                                            {c.name_jp}
                                                            {c.name_romaji && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200 uppercase tracking-wide">{c.name_romaji}</span>}
                                                        </div>
                                                        <div className="text-[13px] text-gray-500 flex items-center gap-2">
                                                            <span className="font-mono text-xs tracking-wider flex items-center gap-1">■ 法人番号: {c.corporate_number || '未設定'}</span>
                                                        </div>
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 2. Address & Rep */}
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="font-medium text-[#1f1f1f] flex items-center gap-1.5 text-[13px]">
                                                    <MapPin size={14} className="text-[#4285F4] shrink-0" />
                                                    <span className="line-clamp-2 leading-relaxed max-w-[200px]">{c.address || <span className="text-gray-400 italic">住所未登録</span>}</span>
                                                </div>
                                                <div className="text-[12px] text-gray-500 font-medium inline-flex items-center gap-1">
                                                    <span className="px-2 py-0.5 bg-[#f0f4f9] rounded-md border border-gray-200 block w-fit">👤 {c.representative || '代表者未設定'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 3. PIC & Count */}
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col items-start gap-2">
                                                <span className={`px-2.5 py-1 rounded-[32px] text-[11px] font-bold border ${activeWorkers > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                    在籍: {activeWorkers}名
                                                </span>
                                                <div className="text-[12px] font-medium flex items-center gap-1.5 text-gray-700">
                                                    <span className={`w-1.5 h-1.5 rounded-[32px] shadow-sm bg-blue-500`}></span>
                                                    担当: {c.pic_name || '未設定'}
                                                </div>
                                            </div>
                                        </td>

                                        {/* 4. Actions */}
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
 <Link href={`/companies/${c.id}/edit`} className="px-3 py-1.5 flex items-center gap-1.5 rounded-[32px] text-xs font-medium text-[#444746] hover:text-[#4285F4] hover:bg-blue-50 transition-colors border border-transparent" title="編集">
                                                    <Edit2 size={14} strokeWidth={2} /> 編集
                                                </Link>
                                                {userRole === 'admin' && (
                                                    <form action={deleteCompany} className="inline-block">
                                                        <input type="hidden" name="id" value={c.id} />
 <button type="submit" className="px-3 py-1.5 flex items-center gap-1.5 rounded-[32px] text-xs font-medium text-[#444746] hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent" title="削除" onClick={(e) => { if (!confirm('この受入企業を削除してもよろしいですか？\n※所属している外国人材のデータは削除されません。')) e.preventDefault() }}>
                                                            <Trash2 size={14} strokeWidth={2} /> 削除
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="mt-4 text-right text-xs text-gray-400 font-medium px-2">
                全 <span className="text-[#1f1f1f]">{filteredCompanies.length}</span> 件を表示
            </div>
        </div>
    )
}
