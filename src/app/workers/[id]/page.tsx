import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { UserMenu } from '@/components/UserMenu'
import { WorkerDetailActions } from './WorkerDetailActions'
import { Calendar, Building2, MapPin, Globe2, Briefcase, GraduationCap, FileText, FileCheck2, User as UserIcon } from 'lucide-react'

export default async function WorkerDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('full_name, role, avatar_url').eq('id', user.id).single()
    const displayName = userProfile?.full_name?.split(' ').pop() || '管理者'

    const { data: worker } = await supabase.from('workers')
        .select('*, companies(name_jp)')
        .eq('id', id)
        .eq('is_deleted', false)
        .single()

    if (!worker) return notFound()

    const sysTypeLabels = { 'tokuteigino': '特定技能', 'ginoshisshu': '技能実習', 'ikusei_shuro': '育成就労' }
    const statusLabels = { 'working': '就業中', 'missing': '失踪', 'returned': '帰国', 'waiting': '入国待ち' }

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="workers" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar print:bg-white lg:print:ml-64 print:ml-0">
                {/* Header (Hidden when printing) */}
                <header className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 sticky top-0 bg-[#fbfcfd] z-10 print:hidden">
                    <h1 className="text-[22px] font-normal text-[#1f1f1f] tracking-tight">KikanCloud</h1>
                    <div className="flex items-center gap-2">
                        <UserMenu displayName={displayName} email={user.email || ''} role={userProfile?.role} avatarUrl={userProfile?.avatar_url} />
                    </div>
                </header>

                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[900px] mx-auto mt-4 md:mt-6 print:m-0 print:p-0 print:w-full print:max-w-none">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
                        <div className="flex items-center gap-4">
                            <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">人材詳細</h2>
                        </div>
                        <WorkerDetailActions id={worker.id} />
                    </div>

                    {/* Print Header (Visible only when printing) */}
                    <div className="hidden print:block text-center mb-6 pt-8">
                        <h2 className="text-2xl font-bold border-b-2 border-black pb-3 mb-2">外国人材 基本情報詳細</h2>
                        <div className="text-right text-xs text-[#878787]">出力日: {new Date().toLocaleDateString('ja-JP')}</div>
                    </div>

                    <div className="bg-white rounded-[24px] print:rounded-none p-6 md:p-10 shadow-[0_4px_16px_rgba(0,0,0,0.04)] print:shadow-none border border-[#ededed] print:border-none space-y-10">
                        {/* 1. Header Section */}
                        <div className="flex flex-col md:flex-row gap-8 items-start pb-8 border-b border-[#ededed] print:border-b-2 print:border-black/20">
 <div className="w-32 h-32 rounded-lg bg-[#fbfcfd] border border-[#ededed] overflow-hidden flex items-center justify-center shrink-0 print:border-gray-300 print:rounded-md">
                                {worker.avatar_url ? <img src={worker.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon size={48} className="text-gray-300" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`px-3 py-1 rounded-md text-xs font-bold border ${worker.status === 'working' ? 'bg-green-50 text-green-700 border-green-200' : worker.status === 'missing' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-[#ededed]'} print:border-gray-500 print:text-black print:bg-transparent`}>
                                        {statusLabels[worker.status as keyof typeof statusLabels] || worker.status}
                                    </span>
 <span className="text-sm font-semibold text-blue-600 bg-[#fbfcfd] px-3 py-1 rounded-md border border-blue-100 print:border-gray-500 print:text-black print:bg-transparent">
                                        ID: {worker.id.split('-')[0]}
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-2 uppercase break-all">
                                    {worker.full_name_romaji}
                                </h1>
                                <p className="text-lg text-[#878787] font-medium tracking-widest mb-5">{worker.full_name_kana || 'カナ未設定'}</p>

                                <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-600 print:text-black">
                                    <span className="flex items-center gap-2 bg-[#fbfcfd] px-3 py-1.5 rounded-lg border border-[#ededed] print:border-gray-300 print:bg-transparent"><Globe2 size={16} className="text-[#878787] print:text-black" /> {worker.nationality || '未設定'}</span>
                                    <span className="flex items-center gap-2 bg-[#fbfcfd] px-3 py-1.5 rounded-lg border border-[#ededed] print:border-gray-300 print:bg-transparent"><Briefcase size={16} className="text-[#878787] print:text-black" /> {sysTypeLabels[worker.system_type as keyof typeof sysTypeLabels] || worker.system_type}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Employment Form */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 border-l-4 border-blue-500 pl-3 mb-5 flex items-center gap-2 print:border-black print:text-black"><Building2 size={20} className="text-blue-500 print:text-black" /> 受入・就業情報</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem label="受入企業" value={worker.companies?.name_jp || <span className="text-[#878787] italic">未割当</span>} />
                                <DetailItem label="業種・職種" value={worker.industry_field || '-'} />
                                <DetailItem label="住所" value={worker.address || '-'} />
                                <DetailItem label="送出機関" value={worker.sending_org || '-'} />
                            </div>
                        </div>

                        {/* 3. Personal Docs Form */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 border-l-4 border-emerald-500 pl-3 mb-5 flex items-center gap-2 print:border-black print:text-black"><FileCheck2 size={20} className="text-emerald-500 print:text-black" /> 在留資格・身分証情報</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem label="在留カード番号" value={<span className="font-mono tracking-wider">{worker.zairyu_no || '-'}</span>} />
                                <DetailItem label="生年月日" value={worker.dob ? worker.dob.replace(/-/g, '/') : '-'} />
                                <DetailItem label="パスポート番号" value={worker.passport_no || '-'} />
                                <DetailItem label="パスポート有効期限" value={worker.passport_exp ? worker.passport_exp.replace(/-/g, '/') : '-'} highlightExp={worker.passport_exp} />
                                <DetailItem label="在留期間 (開始)" value={worker.cert_start_date ? worker.cert_start_date.replace(/-/g, '/') : '-'} />
                                <DetailItem label="在留期間 (満了)" value={worker.cert_end_date ? worker.cert_end_date.replace(/-/g, '/') : '-'} highlightExp={worker.cert_end_date} />
                            </div>
                        </div>

                        {/* 4. Dates & Levels */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 border-l-4 border-purple-500 pl-3 mb-5 flex items-center gap-2 print:border-black print:text-black"><GraduationCap size={20} className="text-purple-500 print:text-black" /> スケジュール・その他</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem label="入国日" value={worker.entry_date ? worker.entry_date.replace(/-/g, '/') : '-'} />
                                <DetailItem label="入国期生" value={worker.entry_batch || '-'} />
                                <DetailItem label="保険有効期限" value={worker.insurance_exp ? worker.insurance_exp.replace(/-/g, '/') : '-'} highlightExp={worker.insurance_exp} />
                                <DetailItem label="日本語レベル" value={worker.japanese_level || '-'} />
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}

function DetailItem({ label, value, highlightExp }: { label: string, value: React.ReactNode, highlightExp?: string }) {
    let expStatus = 'normal'
    if (highlightExp) {
        const expDate = new Date(highlightExp)
        const ninetyDays = new Date()
        ninetyDays.setDate(ninetyDays.getDate() + 90)

        if (expDate < new Date()) expStatus = 'expired'
        else if (expDate <= ninetyDays) expStatus = 'warning'
    }

    return (
 <div className="flex flex-col gap-1.5 p-4 bg-[#fbfcfd]/70 rounded-md border border-[#ededed] print:bg-transparent print:border-b print:border-t-0 print:border-l-0 print:border-r-0 print:border-gray-400 print:rounded-none print:p-2">
            <span className="text-[11px] font-bold text-[#878787] tracking-wider uppercase print:text-gray-600">{label}</span>
            <div className={`text-[15px] font-medium print:text-[14px] ${expStatus === 'expired' ? 'text-red-600 font-bold' : expStatus === 'warning' ? 'text-orange-600 font-bold' : 'text-gray-900'}`}>
                {value}
            </div>
        </div>
    )
} 
