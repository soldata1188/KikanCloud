import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createCompany } from '../actions'
import { Building2, MapPin, Users, Briefcase, MessageSquare, PlusCircle } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { redirect } from 'next/navigation'
import { FormSubmitButton } from './FormSubmitButton'
import { TopNav } from '@/components/TopNav'

const FormRow = ({ label, children, isLast = false }: { label: React.ReactNode, children: React.ReactNode, isLast?: boolean }) => (
    <div className={`flex justify-between items-center px-5 py-2.5 border-b border-gray-50 bg-white ${isLast ? 'border-0' : ''}`}>
        <span className="text-[11px] font-bold text-gray-400 shrink-0 min-w-[100px]">{label}</span>
        <div className="flex-1 flex w-full">
            {children}
        </div>
    </div>
);

function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
    return (
        <div className={`flex items-center gap-2 px-5 py-2.5 border-b ${color}`}>
            <span className="opacity-60">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">{label}</span>
        </div>
    );
}

export default async function NewCompanyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    const inputClass = "w-full h-8 px-2 bg-white border border-indigo-200 rounded text-[12px] font-bold text-gray-800 outline-none focus:border-indigo-500 transition-colors";

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden selection:bg-emerald-500/20">
            <Sidebar active="companies" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="受入企業 新規登録" role={userProfile?.role} />

                <form action={createCompany} className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                    <div className="w-full max-w-[900px] h-full overflow-y-auto p-4 md:p-6 mx-auto no-scrollbar pb-24 bg-white">

                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[12px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">NEW COMPANY</span>
                                <span className="text-[14px] font-black text-gray-900 tracking-tight">受入企業 新規登録</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/companies"
                                    className="h-8 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-md text-[11px] font-bold transition-all flex items-center justify-center"
                                >
                                    キャンセル
                                </Link>
                                <FormSubmitButton />
                            </div>
                        </div>

                        {/* 2-Column Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">

                            {/* --- Left Column --- */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-white rounded border border-slate-200 overflow-hidden">
                                    <SectionHeader icon={<Building2 size={13} />} label="企業情報・連絡先 / Corporate & Contact" color="bg-blue-600 text-white" />
                                    <div className="flex flex-col">
                                        <FormRow label={<span>企業名<span className="text-[10px] text-red-600 ml-1">必須</span></span>}>
                                            <input name="name_jp" type="text" required placeholder="例：株式会社ミライ" className={inputClass} />
                                        </FormRow>
                                        <FormRow label="フリガナ">
                                            <input name="name_kana" type="text" placeholder="例：カブシキガイシャミライ" className={inputClass} />
                                        </FormRow>
                                        <FormRow label="ローマ字">
                                            <input name="name_romaji" type="text" placeholder="例：MIRAI CO., LTD" className={`${inputClass} uppercase`} />
                                        </FormRow>
                                        <FormRow label="法人番号(13桁)">
                                            <input name="corporate_number" type="text" maxLength={13} placeholder="例：1234567890123" className={`${inputClass} font-mono`} />
                                        </FormRow>
                                        <FormRow label="登録支援機関番号">
                                            <input name="registration_number" type="text" placeholder="例：20登-000001" className={`${inputClass} font-mono`} />
                                        </FormRow>



                                        <FormRow label="郵便番号">
                                            <input name="postal_code" type="text" placeholder="例：160-0022" className={`${inputClass} font-mono`} />
                                        </FormRow>
                                        <FormRow label="所在地（住所）">
                                            <input name="address" type="text" placeholder="例：東京都新宿区新宿1-1-1" className={inputClass} />
                                        </FormRow>
                                        <FormRow label="電話番号">
                                            <input name="phone" type="text" placeholder="例：03-1234-5678" className={`${inputClass} font-mono`} />
                                        </FormRow>
                                        <FormRow label="メールアドレス">
                                            <input name="email" type="email" placeholder="例：example@domain.com" className={inputClass} />
                                        </FormRow>
                                        <FormRow label="担当者" isLast>
                                            <input name="pic_name" type="text" placeholder="例：鈴木 一郎" className={inputClass} />
                                        </FormRow>
                                    </div>
                                </div>
                            </div>

                            {/* --- Right Column --- */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-white rounded border border-slate-200 overflow-hidden">
                                    <SectionHeader icon={<Users size={13} />} label="役員・業種・受入 / Reps & Business" color="bg-blue-600 text-white" />
                                    <div className="flex flex-col">
                                        <FormRow label="代表者名">
                                            <input name="representative" type="text" placeholder="例：山田 太郎" className={inputClass} />
                                        </FormRow>
                                        <FormRow label="代表者フリガナ">
                                            <input name="representative_kana" type="text" placeholder="例：ヤマダ タロウ" className={inputClass} />
                                        </FormRow>
                                        <FormRow label="責任者">
                                            <input name="manager_name" type="text" placeholder="例：田中 健太" className={inputClass} />
                                        </FormRow>
                                        <FormRow label="講習受講日">
                                            <input name="training_date" type="date" className={inputClass} />
                                        </FormRow>
                                        <FormRow label="生活指導員">
                                            <input name="life_advisor" type="text" placeholder="例：佐藤 花子" className={inputClass} />
                                        </FormRow>
                                        <FormRow label="技能指導員">
                                            <input name="tech_advisor" type="text" placeholder="例：高橋 次郎" className={inputClass} />
                                        </FormRow>



                                        <FormRow label="業種">
                                            <input name="industry" list="industry-datalist" placeholder="例：建設業、製造業..." className={inputClass} />
                                            <datalist id="industry-datalist">
                                                <option value="建設業" />
                                                <option value="製造業" />
                                                <option value="農業" />
                                            </datalist>
                                        </FormRow>
                                        <FormRow label="受入職種">
                                            <input name="accepted_occupations" placeholder="例：機械加工、溶接..." className={inputClass} />
                                        </FormRow>
                                        <FormRow label="従業員数" isLast>
                                            <input name="employee_count" type="number" placeholder="例：50" className={inputClass} />
                                        </FormRow>
                                    </div>
                                </div>
                            </div>


                            {/* Remarks - Full Width below columns */}
                            <div className="bg-white rounded border border-slate-200 overflow-hidden col-span-1 lg:col-span-2">
                                <SectionHeader icon={<MessageSquare size={13} />} label="備考 / Remarks" color="bg-slate-50 text-slate-500" />
                                <div className="p-3">
                                    <textarea
                                        name="remarks"
                                        className="w-full min-h-[90px] p-3 border border-indigo-200 bg-white rounded text-[12px] outline-none focus:border-indigo-500 font-medium text-gray-800 transition-colors"
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
