'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MessageSquare, Clock } from 'lucide-react'

// Define the shape of our data
interface RecentChat {
    company_id: string
    company_name: string
    last_message_time: string
    last_message_text: string
    unread_count?: number
}

export default function RecentChats({ tenantId }: { tenantId?: string }) {
    const [chats, setChats] = useState<RecentChat[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        async function fetchRecentChats() {
            try {
                // Fetch the latest messages to determine the recent companies
                // Assuming we want the recent companies the user (or anyone in tenant) has chatted with
                // For simplicity, we query messages, order by created_at, and get unique company_ids
                // Then we join or fetch the company names.
                let query = supabase
                    .from('messages')
                    .select('company_id, content, created_at')
                    .order('created_at', { ascending: false })
                    .limit(50)

                if (tenantId) {
                    query = query.eq('tenant_id', tenantId)
                }

                const { data: messagesData, error: messagesError } = await query

                if (messagesError) throw messagesError

                // Collect unique companies
                const uniqueCompanyIds: string[] = []
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const latestMessages = new Map<string, any>()

                if (messagesData) {
                    for (const msg of messagesData) {
                        if (!msg.company_id) continue
                        if (!uniqueCompanyIds.includes(msg.company_id)) {
                            uniqueCompanyIds.push(msg.company_id)
                            latestMessages.set(msg.company_id, msg)
                        }
                        if (uniqueCompanyIds.length >= 5) break
                    }
                }

                // Fetch company names
                const finalChats: RecentChat[] = []
                if (uniqueCompanyIds.length > 0) {
                    const { data: companiesData, error: companiesError } = await supabase
                        .from('companies')
                        .select('id, name_jp')
                        .in('id', uniqueCompanyIds)

                    if (companiesError) throw companiesError

                    const companyMap = new Map<string, string>()
                    companiesData?.forEach(c => {
                        companyMap.set(c.id, c.name_jp || '不明な企業')
                    })

                    // Build array respecting recency
                    for (const cid of uniqueCompanyIds) {
                        const msg = latestMessages.get(cid)
                        finalChats.push({
                            company_id: cid,
                            company_name: companyMap.get(cid) || '不明な企業',
                            last_message_time: msg.created_at,
                            last_message_text: msg.content || '添付ファイル',
                        })
                    }
                }

                setChats(finalChats)
            } catch (err) {
                console.error("Error fetching recent chats:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchRecentChats()

        // Setup real-time subscription
        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: tenantId ? `tenant_id=eq.${tenantId}` : undefined
                },
                () => {
                    // Re-fetch on payload to simplify getting the joined company name
                    // Alternatively, we could manually update the state if we fetched company info separately.
                    fetchRecentChats()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [tenantId])

    if (loading) {
        return (
            <div className="p-5 md:p-6 border-l-[6px] border-[#24b47e] flex flex-col h-full animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4 flex-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="h-4 w-48 bg-gray-100 rounded"></div>
                            <div className="h-3 w-64 bg-gray-50 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="p-5 md:p-6 border-l-[6px] border-[#24b47e] flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-500" />
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">最近の連絡</h2>
                </div>
                {chats.length > 0 && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100 shadow-sm animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        リアルタイム
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm text-left bg-white">
                    <thead className="text-xs text-gray-500 uppercase bg-white">
                        <tr>
                            <th className="border-b border-gray-200 px-4 py-3 font-bold tracking-widest whitespace-nowrap">企業名</th>
                            <th className="border-b border-gray-200 px-4 py-3 font-bold tracking-widest w-full">メッセージ</th>
                            <th className="border-b border-gray-200 px-4 py-3 font-bold tracking-widest whitespace-nowrap">時間</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chats.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="border-b border-gray-200 px-4 py-12 text-center text-gray-400 font-bold">
                                    最近のメッセージはありません
                                </td>
                            </tr>
                        ) : (
                            chats.map((chat) => (
                                <tr
                                    key={chat.company_id}
                                    className="bg-white text-gray-800 hover:bg-white transition-colors group cursor-pointer"
                                    onClick={() => window.location.href = `/b2b-chat?company=${chat.company_id}`}
                                >
                                    <td className="border-b border-gray-200 px-4 py-3 font-bold text-gray-900 whitespace-nowrap max-w-[150px] truncate group-hover:text-blue-600 transition-colors">
                                        {chat.company_name}
                                    </td>
                                    <td className="border-b border-gray-200 px-4 py-3">
                                        <p className="text-xs text-gray-500 line-clamp-1 group-hover:text-gray-700 transition-colors">
                                            {chat.last_message_text}
                                        </p>
                                    </td>
                                    <td className="border-b border-gray-200 px-4 py-3 text-[11px] text-gray-500 font-bold whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(chat.last_message_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <Link href="/b2b-chat" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    すべてのメッセージを見る →
                </Link>
            </div>
        </div>
    )
}
