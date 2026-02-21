import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default async function EmploymentNoticePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    const supabase = await createClient();
    const { data: worker } = await supabase.from('workers').select('*, companies(*)').eq('id', id).single();

    if (!worker) return notFound();

    return (
        <div className="bg-gray-100 min-h-screen py-8 print:bg-white print:py-0 font-serif text-[#1f1f1f]">
            <div className="max-w-[210mm] mx-auto bg-white p-[20mm] shadow-lg print:shadow-none print:p-0">
                {/* 雇用条件通知書 content */}
                <h1 className="text-2xl font-bold text-center mb-12 tracking-[0.3em] border-b-2 border-black pb-4">雇用条件書（兼）雇入通知書</h1>

                <div className="flex justify-between mb-12">
                    <div className="text-lg flex flex-col justify-end">
                        <div className="text-[12px] text-[#666] mb-1">労働者氏名</div>
                        <div className="border-b border-black pb-1 px-4 text-xl font-bold">{worker.full_name_romaji} <span className="text-base font-normal ml-2">様</span></div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm mb-4">作成日: {new Date().toLocaleDateString('ja-JP')} 宛</p>
                        <p className="text-sm text-[#666]">事業所名称</p>
                        <p className="mt-1 text-xl font-bold tracking-wider">{worker.companies?.name_jp || '未設定'}</p>
                        <p className="mt-2 text-sm">代表者氏名: {worker.companies?.representative || '________________'}</p>
                        <p className="mt-2 text-sm">所在地: {worker.companies?.address || '________________________________'}</p>
                    </div>
                </div>

                <div className="border-2 border-black p-8 space-y-4 text-[15px] leading-relaxed relative">
                    <p className="font-bold mb-6">以下の通り、雇用条件を通知します。</p>

                    <table className="w-full border-collapse border border-black mt-4">
                        <tbody>
                            <tr className="border-b border-black">
                                <th className="border-r border-black p-3 bg-gray-50 text-left w-[30%]">雇用期間</th>
                                <td className="p-3">
                                    期間の定めあり: <span className="font-bold">{worker.entry_date ? new Date(worker.entry_date).toLocaleDateString('ja-JP') : '令和____年__月__日'}</span> から <span className="font-bold">{worker.cert_end_date ? new Date(worker.cert_end_date).toLocaleDateString('ja-JP') : '令和____年__月__日'}</span> まで
                                </td>
                            </tr>
                            <tr className="border-b border-black">
                                <th className="border-r border-black p-3 bg-gray-50 text-left">就業の場所</th>
                                <td className="p-3">{worker.companies?.address || worker.companies?.name_jp || '未設定'}</td>
                            </tr>
                            <tr className="border-b border-black">
                                <th className="border-r border-black p-3 bg-gray-50 text-left">従事すべき業務</th>
                                <td className="p-3 font-medium">{worker.industry_field || '関連法令で定める業務'} ({worker.system_type === 'tokuteigino' ? '特定技能' : worker.system_type === 'ikusei_shuro' ? '育成就労' : '技能実習'})</td>
                            </tr>
                            <tr className="border-b border-black">
                                <th className="border-r border-black p-3 bg-gray-50 text-left">就業時間</th>
                                <td className="p-3">
                                    始業: 08時00分 ～ 終業: 17時00分<br />
                                    <span className="text-sm text-[#666]">(休憩時間: 60分 / 所定労働時間: 8時間)</span>
                                </td>
                            </tr>
                            <tr className="border-b border-black">
                                <th className="border-r border-black p-3 bg-gray-50 text-left">休日・休暇</th>
                                <td className="p-3">日曜日、祝祭日、その他会社カレンダーによる<br /><span className="text-sm text-[#666]">年次有給休暇: 法定通り付与</span></td>
                            </tr>
                            <tr className="border-b border-black">
                                <th className="border-r border-black p-3 bg-gray-50 text-left">基本賃金</th>
                                <td className="p-3">基本給: 月給 ____________ 円<br /><span className="text-sm text-[#666]">（時間外割増: 25%、深夜割増: 25%、休日割増: 35%）</span></td>
                            </tr>
                            <tr>
                                <th className="border-r border-black p-3 bg-gray-50 text-left">社会保険の加入</th>
                                <td className="p-3">健康保険・厚生年金・雇用保険・労災保険：加入</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="mt-12">
                        <p className="mb-4">※ 本通知書の内容に相違ないことを確認しました。</p>
                        <div className="flex justify-end mt-16 pt-8 pr-12">
                            <div className="text-center w-64 border-t border-black pt-2 font-bold flex justify-between pr-4">
                                <span>労働者 署名</span><span>㊞</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Auto-print script */}
                <script dangerouslySetInnerHTML={{ __html: 'window.onload = function() { setTimeout(function() { window.print(); }, 500); }' }} />
            </div>

            {/* Global Print Styles to enforce A4 Paper and hide browser headers */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0; size: A4; }
                    body { margin: 1.6cm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}} />
        </div>
    );
}
