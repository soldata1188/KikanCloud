import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, UserCircle2, Map, AlertCircle, FileText, FolderOpen } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { generateWorkerTimeline, inferAgency } from '@/lib/utils/timelineEngine'
import { TimelineInteractiveNode } from './TimelineInteractiveNode'
import { redirect, notFound } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default async function WorkerTimelinePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: worker } = await supabase.from('workers').select('id, full_name_romaji, companies(id, name_jp), system_type, entry_date').eq('id', id).eq('is_deleted', false).single()
    if (!worker) notFound()

    // 既存の行政手続データを取得して同期 (Sync)
    const { data: workerProcedures } = await supabase.from('procedures').select('*').eq('worker_id', id).eq('is_deleted', false)
    const timelineEvents = generateWorkerTimeline(worker.system_type, worker.entry_date);

    const getSystemTypeName = (type: string) => {
        if (type === 'tokuteigino') return '特定技能 (Specified Skilled)';
        if (type === 'ikusei_shuro') return '育成就労 (Training Employment)';
        return '技能実習 (Technical Intern)';
    };

    return (
        <div className="flex h-screen bg-white font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <div className="flex-1 flex flex-col px-4 pb-16 w-full max-w-[900px] mx-auto mt-4 md:mt-8">

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
                        <Link href={`/workers/${id}/documents`} className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-colors text-[#878787] hover:text-gray-800 hover:bg-gray-50"><FolderOpen size={18} /> 関連書類</Link>
                        <Link href={`/workers/${id}/timeline`} className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-colors bg-white text-[#24b47e] shadow-sm pointer-events-none"><Map size={18} /> 手続ロードマップ</Link>
                    </div>

                    {!worker.entry_date && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3 text-yellow-800 text-sm">
                            <AlertCircle size={20} className="shrink-0 text-yellow-600" />
                            <div><p className="font-bold text-yellow-800">入国日（起算日）が設定されていません</p><p className="mt-0.5 text-yellow-700">現在、仮の基準日でタイムラインを描画しています。基本情報タブから「入国日」を登録してください。</p></div>
                        </div>
                    )}

                    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-8 md:p-12">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-200">
                            <div>
                                <h3 className="text-2xl font-bold text-[#1f1f1f] flex items-center gap-3"><Map className="text-[#24b47e]" size={28} /> 法定ロードマップ (Timeline)</h3>
                                <p className="text-sm text-[#878787] mt-2">
                                    制度区分: <span className="font-bold text-[#24b47e] bg-white px-2 py-0.5 rounded">{getSystemTypeName(worker.system_type)}</span><br />
                                    基準日 (入国日): <span className="font-bold text-[#1f1f1f]">{worker.entry_date ? worker.entry_date.replace(/-/g, '/') : '未設定'}</span>
                                </p>
                            </div>
                        </div>

                        <div className="relative pl-6 sm:pl-10">
                            <div className="absolute left-[39px] sm:left-[55px] top-2 bottom-4 w-0.5 bg-gray-200"></div>
                            <div className="space-y-6 pb-24">
                                {timelineEvents.map((event) => {
                                    const existingProc = workerProcedures?.find(p => p.procedure_name === event.title);
                                    return <TimelineInteractiveNode key={event.id} event={event} workerId={id} companyId={(worker.companies as any)?.id || null} existingProcedure={existingProc} agency={inferAgency(event.title)} />
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
