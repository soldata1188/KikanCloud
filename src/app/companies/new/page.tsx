import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createCompany } from '../actions'
import { Building2, Users, MessageSquare } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { redirect } from 'next/navigation'
import { FormSubmitButton } from './FormSubmitButton'
import { TopNav } from '@/components/TopNav'

// ─── Design System (same as /workers/new) ───────────────────────────────────
const LABEL_CLS = "text-[11px] font-semibold text-gray-400 shrink-0 w-[130px] uppercase tracking-tight";
const INPUT_CLS = "w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-gray-800 outline-none focus:border-[#0067b8] transition-colors";

const FormRow = ({ label, children, isLast = false }: { label: React.ReactNode, children: React.ReactNode, isLast?: boolean }) => (
    <div className={`flex items-center px-5 py-2 border-b border-gray-50 bg-white ${isLast ? 'border-0' : ''}`}>
        <span className={LABEL_CLS}>{label}</span>
        <div className="flex-1 min-w-0">
            {children}
        </div>
    </div>
);

function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
    return (
        <div className={`flex items-center gap-2 px-5 py-2.5 border-b ${color}`}>
            <span className="opacity-70">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
        </div>
    );
}

export default async function NewCompanyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden">
            <Sidebar active="companies" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="受入企業 新規登録" role={userProfile?.role} />

                <form action={createCompany} className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                    <div className="w-full max-w-[900px] h-full overflow-y-auto p-4 md:p-6 mx-auto no-scrollbar pb-24 bg-white">

                        {/* ── Page Header ── */}
                        <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 uppercase tracking-widest">NEW COMPANY</span>
                                <span className="text-[15px] font-black text-gray-900 tracking-tight">受入企業 新規登録</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/companies"
                                    className="h-9 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-md text-[12px] font-semibold transition-colors flex items-center justify-center"
                                >
                                    キャンセル
                                </Link>
                                <FormSubmitButton />
                            </div>
                        </div>

                        {/* ── 2-Column Grid ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">

                            {/* Left Column: 企業情報・連絡先 */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
                                    <SectionHeader icon={<Building2 size={12} />} label="企業情報・連絡先" color="bg-[#0067b8] text-white" />
                                    <FormRow label={<span>企業名<span className="text-[10px] text-red-500 ml-1">必須</span></span>}>
                                        <input name="name_jp" type="text" required placeholder="例：株式会社ミライ" className={INPUT_CLS} />
                                    </FormRow>
                                    <FormRow label="フリガナ">
                                        <input name="name_kana" type="text" placeholder="例：カブシキガイシャミライ" className={INPUT_CLS} />
                                    </FormRow>
                                    <FormRow label="ローマ字">
                                        <input name="name_romaji" type="text" placeholder="例：MIRAI CO., LTD" className={`${INPUT_CLS} uppercase`} />
                                    </FormRow>
                                    <FormRow label="法人番号(13桁)">
                                        <input name="corporate_number" type="text" maxLength={13} placeholder="例：1234567890123" className={`${INPUT_CLS} font-mono`} />
                                    </FormRow>
                                    <FormRow label="支援機関番号">
                                        <input name="registration_number" type="text" placeholder="例：20登-000001" className={`${INPUT_CLS} font-mono`} />
                                    </FormRow>
                                    <FormRow label="郵便番号">
                                        <input name="postal_code" type="text" placeholder="例：160-0022" className={`${INPUT_CLS} font-mono`} />
                                    </FormRow>
                                    <FormRow label="所在地">
                                        <input name="address" type="text" placeholder="例：東京都新宿区新宿1-1-1" className={INPUT_CLS} />
                                    </FormRow>
                                    <FormRow label="電話番号">
                                        <input name="phone" type="text" placeholder="例：03-1234-5678" className={`${INPUT_CLS} font-mono`} />
                                    </FormRow>
                                    <FormRow label="メール">
                                        <input name="email" type="email" placeholder="例：example@domain.com" className={INPUT_CLS} />
                                    </FormRow>
                                    <FormRow label="担当者" isLast>
                                        <input name="pic_name" type="text" placeholder="例：鈴木 一郎" className={INPUT_CLS} />
                                    </FormRow>
                                </div>
                            </div>

                            {/* Right Column: 役員・業種・受入 */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
                                    <SectionHeader icon={<Users size={12} />} label="役員・業種・受入" color="bg-[#0067b8] text-white" />
                                    <FormRow label="代表者名">
                                        <input name="representative" type="text" placeholder="例：山田 太郎" className={INPUT_CLS} />
                                    </FormRow>
                                    <FormRow label="代表者フリガナ">
                                        <input name="representative_kana" type="text" placeholder="例：ヤマダ タロウ" className={INPUT_CLS} />
                                    </FormRow>
                                    <FormRow label="責任者">
                                        <input name="manager_name" type="text" placeholder="例：田中 健太" className={INPUT_CLS} />
                                    </FormRow>
                                    <FormRow label="講習受講日">
                                        <input name="training_date" type="date" className={INPUT_CLS} />
                                    </FormRow>
                                    <FormRow label="生活指導員">
                                        <input name="life_advisor" type="text" placeholder="例：佐藤 花子" className={INPUT_CLS} />
                                    </FormRow>
                                    <FormRow label="技能指導員">
                                        <input name="tech_advisor" type="text" placeholder="例：高橋 次郎" className={INPUT_CLS} />
                                    </FormRow>
                                    <FormRow label="業種">
                                        <input name="industry" list="industry-datalist" placeholder="例：建設業、製造業..." className={INPUT_CLS} />
                                        <datalist id="industry-datalist">
                                            <option value="建設業" />
                                            <option value="製造業" />
                                            <option value="農業" />
                                            <option value="食品加工業" />
                                            <option value="介護" />
                                        </datalist>
                                    </FormRow>
                                    <FormRow label="受入職種">
                                        <input name="accepted_occupations" placeholder="例：機械加工、溶接..." className={INPUT_CLS} />
                                    </FormRow>
                                    <FormRow label="従業員数" isLast>
                                        <input name="employee_count" type="number" placeholder="例：50" className={INPUT_CLS} />
                                    </FormRow>
                                </div>
                            </div>

                            {/* Remarks - Full Width */}
                            <div className="bg-white rounded-md border border-slate-200 overflow-hidden col-span-1 lg:col-span-2">
                                <SectionHeader icon={<MessageSquare size={12} />} label="備考 / Remarks" color="bg-slate-50 text-slate-500" />
                                <div className="p-4">
                                    <textarea
                                        name="remarks"
                                        className="w-full min-h-[100px] p-3 border border-slate-200 bg-white rounded-md text-sm outline-none focus:border-[#0067b8] font-medium text-gray-800 transition-colors"
                                        placeholder="企業に関する特記事項やメモを自由に入力してください..."
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    )
}
