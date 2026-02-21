import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, UserCircle2, FolderOpen, Building2, Download, Map, FileText } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { DocumentManager } from './DocumentManager'
import { redirect, notFound } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default async function WorkerDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    const { data: worker } = await supabase.from('workers').select('full_name_romaji, companies(name_jp)').eq('id', id).eq('is_deleted', false).single()
    if (!worker) notFound()

    // 1. Worker Documents (機関)
    const { data: documents } = await supabase.from('worker_documents').select('*').eq('worker_id', id).eq('is_deleted', false).order('created_at', { ascending: false })
    let docsWithUrls = []
    if (documents && documents.length > 0) {
        const { data: signedUrls } = await supabase.storage.from('worker_docs').createSignedUrls(documents.map(d => d.file_path), 3600)
        docsWithUrls = documents.map((doc, index) => ({ ...doc, signedUrl: signedUrls?.[index]?.signedUrl }))
    }

    // 2. Client Documents (Xí nghiệp nộp)
    const { data: clientDocs } = await supabase.from('client_documents').select('*').eq('worker_id', id).order('created_at', { ascending: false })
    let clientDocsUrls = []
    if (clientDocs && clientDocs.length > 0) {
        const { data: cSignedUrls } = await supabase.storage.from('client_docs').createSignedUrls(clientDocs.map(d => d.file_path), 3600)
        clientDocsUrls = clientDocs.map((doc, index) => ({ ...doc, signedUrl: cSignedUrls?.[index]?.signedUrl }))
    }

    return (
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[1100px] mx-auto mt-4 md:mt-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pl-2">
                        <div className="flex items-center gap-4">
                            <Link href="/workers" className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 text-[#1f1f1f] transition-colors"><ArrowLeft size={20} /></Link>
                            <div>
                                <h2 className="text-[28px] md:text-[32px] font-bold tracking-tight text-[#1f1f1f]">人材プロファイル</h2>
                                <p className="text-[#1f1f1f] mt-1 text-sm flex items-center gap-2"><UserCircle2 size={16} /> <span className="font-bold">{worker.full_name_romaji}</span> <span className="text-gray-300">|</span> <span>{(worker.companies as any)?.name_jp || '未配属'}</span></p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-8 p-1.5 bg-white border border-gray-200 rounded-[20px] w-fit shadow-sm">
                        <Link href={`/workers/${id}/edit`} className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-colors text-[#878787] hover:text-gray-800 hover:bg-gray-50"><FileText size={18} /> 基本情報</Link>
                        <Link href={`/workers/${id}/documents`} className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-colors bg-white text-[#24b47e] shadow-sm pointer-events-none"><FolderOpen size={18} /> 関連書類</Link>
                        <Link href={`/workers/${id}/timeline`} className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-colors text-[#878787] hover:text-gray-800 hover:bg-gray-50"><Map size={18} /> 手続ロードマップ</Link>
                    </div>

                    <DocumentManager workerId={id} documents={docsWithUrls} role={userData?.role || 'staff'} />

                    <div className="mt-8 bg-white rounded-md shadow-sm border border-teal-100 overflow-hidden mb-8">
                        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-white/30">
                            <h3 className="text-base font-bold text-teal-800 flex items-center gap-2"><Building2 size={20} className="text-teal-500" /> 企業からの提出書類 (賃金台帳・出勤簿など)</h3>
                            <span className="text-xs font-bold text-teal-600 bg-teal-100 px-3 py-1 rounded-full">{clientDocsUrls.length}件</span>
                        </div>
                        {clientDocsUrls.length === 0 ? <div className="p-8 text-center text-sm text-[#878787]">提出された書類はありません。</div> : (
                            <ul className="divide-y divide-gray-100">
                                {clientDocsUrls.map(doc => (
                                    <li key={doc.id} className="p-4 hover:bg-gray-50/30 transition-colors flex items-center justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-100 text-teal-700 font-bold">[{doc.target_month}] {doc.doc_type === 'payroll' ? '賃金台帳' : doc.doc_type === 'timesheet' ? '出勤簿' : '作業日報'}</span>
                                                <span className="font-bold text-[#1f1f1f] text-sm truncate">{doc.file_name}</span>
                                            </div>
                                            <p className="text-[11px] text-[#878787]">{new Date(doc.created_at).toLocaleDateString('ja-JP')} • {doc.uploaded_by}</p>
                                        </div>
                                        {doc.signedUrl && <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white border border-gray-200 text-teal-600 hover:bg-gray-50 rounded-xl transition-colors font-bold text-xs flex items-center gap-1 shadow-sm shrink-0"><Download size={14} /> 開く</a>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
