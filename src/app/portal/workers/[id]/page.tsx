import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, UserCircle2, ShieldCheck, Banknote, CalendarClock, Hammer } from 'lucide-react'
import { ClientSidebar } from '@/components/ClientSidebar'
import { SmartDrawer } from './SmartDrawer'
import { redirect, notFound } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default async function ClientWorkerProfile({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
    const { data: worker } = await supabase.from('workers').select('*').eq('id', id).eq('company_id', userProfile?.company_id).eq('is_deleted', false).single()
    if (!worker) notFound()

    // 1. 監理団体から共有された書類を取得 (worker_documents)
    const { data: unionDocs } = await supabase.from('worker_documents').select('*').eq('worker_id', id).eq('is_deleted', false).order('created_at', { ascending: false })
    let unionDocsUrls = []
    if (unionDocs && unionDocs.length > 0) {
        const { data: urls } = await supabase.storage.from('worker_docs').createSignedUrls(unionDocs.map(d => d.file_path), 3600)
        unionDocsUrls = unionDocs.map((doc, i) => ({ ...doc, signedUrl: urls?.[i]?.signedUrl }))
    }

    // 2. 受入企業の提出書類を取得 (client_documents)
    const { data: clientDocs } = await supabase.from('client_documents').select('*').eq('worker_id', id).order('created_at', { ascending: false })
    let clientDocsUrls = []
    if (clientDocs && clientDocs.length > 0) {
        const { data: urls } = await supabase.storage.from('client_docs').createSignedUrls(clientDocs.map(d => d.file_path), 3600)
        clientDocsUrls = clientDocs.map((doc, i) => ({ ...doc, signedUrl: urls?.[i]?.signedUrl }))
    }

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden">
            <ClientSidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar px-4 pb-12 w-full max-w-[1000px] mx-auto mt-4 md:mt-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/portal/workers" className="w-10 h-10 flex items-center justify-center rounded-md bg-white hover:bg-[#fbfcfd] text-[#1f1f1f]"><ArrowLeft size={20} /></Link>
                    <h2 className="text-[28px] font-bold text-teal-800">人材プロフィール・書類管理</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-md p-6 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-md bg-[#fbfcfd] flex items-center justify-center border border-[#ededed] overflow-hidden mb-4">
                                {worker.avatar_url ? <img src={worker.avatar_url} className="w-full h-full object-cover" /> : <UserCircle2 size={40} className="text-teal-400" />}
                            </div>
                            <h3 className="text-xl font-bold">{worker.full_name_romaji}</h3>
                            <p className="text-sm text-[#878787] mt-1">{worker.nationality} • {worker.system_type === 'tokuteigino' ? '特定技能' : '技能実習'}</p>
                            <div className="w-full mt-6 space-y-3 text-left bg-[#fbfcfd] p-4 rounded-md">
                                <div><p className="text-[10px] text-[#878787] font-bold">在留カード番号</p><p className="text-sm font-mono font-bold text-[#1f1f1f]">{worker.zairyu_no || '-'}</p></div>
                                <div><p className="text-[10px] text-[#878787] font-bold">パスポート期限</p><p className="text-sm font-bold text-red-600">{worker.passport_exp?.replace(/-/g, '/') || '-'}</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="mb-4 bg-[#fbfcfd] border border-teal-100 rounded-md p-4 text-sm text-teal-800 font-medium">
                            該当する引出しを開いて、毎月の法定書類をアップロードしてください。
                        </div>
                        {/* ダウンロード数 (機関から) */}
                        <SmartDrawer workerId={id} documents={unionDocsUrls} title="公式書類 (監理団体から共有)" docType="union" icon={<ShieldCheck />} allowUpload={false} />
                        {/* アップロード履歴 (受入企業より) */}
                        <SmartDrawer workerId={id} documents={clientDocsUrls} title="賃金台帳 (給与明細)" docType="payroll" icon={<Banknote />} allowUpload={userProfile?.role === 'company_admin'} />
                        <SmartDrawer workerId={id} documents={clientDocsUrls} title="出勤簿・タイムカード" docType="timesheet" icon={<CalendarClock />} allowUpload={userProfile?.role === 'company_admin'} />
                        <SmartDrawer workerId={id} documents={clientDocsUrls} title="作業日報・評価表" docType="worklog" icon={<Hammer />} allowUpload={userProfile?.role === 'company_admin'} />
                    </div>
                </div>
            </main>
        </div>
    )
}
