import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, UserCircle2, FolderOpen, ShieldCheck } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { DocumentManager } from './DocumentManager'
import { redirect, notFound } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default async function WorkerDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 1. Lấy thông tin User & Worker
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    const { data: worker } = await supabase.from('workers').select('full_name_romaji, companies(name_jp)').eq('id', id).eq('is_deleted', false).single()
    if (!worker) notFound()

    // 2. Lấy danh sách tài liệu
    const { data: documents } = await supabase.from('worker_documents')
        .select('*').eq('worker_id', id).eq('is_deleted', false).order('created_at', { ascending: false })

    // 3. Tạo Signed URLs cho toàn bộ file (Hiệu lực 1 tiếng để bảo mật)
    let docsWithUrls = []
    if (documents && documents.length > 0) {
        const paths = documents.map(d => d.file_path)
        const { data: signedUrls } = await supabase.storage.from('worker_docs').createSignedUrls(paths, 3600) // 3600 giây = 1 giờ

        docsWithUrls = documents.map((doc, index) => ({
            ...doc,
            signedUrl: signedUrls?.[index]?.signedUrl || null
        }))
    }

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[1100px] mx-auto mt-4 md:mt-8">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pl-2">
                        <div className="flex items-center gap-4">
                            <Link href={`/workers/${id}/edit`} className="w-10 h-10 flex items-center justify-center rounded-[32px] bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors text-[#444746]"><ArrowLeft size={20} strokeWidth={2} /></Link>
                            <div>
                                <h2 className="text-[28px] md:text-[32px] font-bold tracking-tight text-[#1f1f1f] flex items-center gap-3">
                                    <FolderOpen className="text-[#4285F4]" size={32} /> 関連書類・ファイル管理
                                </h2>
                                <p className="text-[#444746] mt-1 text-sm flex items-center gap-2">
                                    <UserCircle2 size={16} /> <span className="font-bold text-[#1f1f1f]">{worker.full_name_romaji}</span>
                                    <span className="text-gray-300">|</span>
                                    <span>{(worker.companies as any)?.name_jp || '未配属'}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-[32px] border border-blue-100 mb-6 flex items-start gap-3">
                        <ShieldCheck className="text-[#4285F4] shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-[#444746] space-y-1">
                            <p className="font-bold text-[#1f1f1f]">セキュアなファイル保管庫 (Secure Vault)</p>
                            <p>パスポートや在留カードなどの機密ファイルは、高度に暗号化されたプライベート領域に保管されます。表示・ダウンロード用のURLは1時間で自動的に無効化され、情報漏洩を防ぎます。</p>
                        </div>
                    </div>

                    <DocumentManager workerId={id} documents={docsWithUrls} role={userData?.role || 'staff'} />

                </div>
            </main>
        </div>
    )
}
