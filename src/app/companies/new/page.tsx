import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createCompany } from '../actions'
import { ArrowLeft, Building2, MapPin, Users } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { redirect } from 'next/navigation'
import { FormSubmitButton } from './FormSubmitButton'
import { TopNav } from '@/components/TopNav'
import { CompanyDocumentKanban } from './CompanyDocumentKanban'

export default async function NewCompanyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden selection:bg-emerald-500/20">
            <Sidebar active="companies" />
            <div className="flex-1 flex flex-col relative min-w-0">
                <TopNav title="受入企業 新規登録" role={userProfile?.role} />
                <form action={createCompany} className="flex-1 flex flex-col overflow-hidden min-h-0 bg-white">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-6 h-12 border-b border-gray-100 bg-white z-20 shrink-0">
                        <div className="flex items-center gap-4">
                            <Link href="/companies" className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors">
                                <ArrowLeft size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest leading-none">戻る</span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/companies" className="px-3 py-1.5 text-gray-500 text-[11px] font-bold bg-white hover:bg-gray-50 rounded-md transition-colors border border-gray-200">
                                キャンセル
                            </Link>
                            <FormSubmitButton />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200 no-scrollbar pb-24 bg-white">
                            <div className="space-y-6 max-w-3xl mx-auto">

                                {/* SECTION 1: 法人基本情報 */}
                                <div className="bg-white rounded-none border border-[#c4c8cf] overflow-hidden mb-6">
                                    <div className="px-6 py-4 border-b border-[#c4c8cf] bg-[#f8fcfd]/10">
                                        <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">
                                            <Building2 size={18} className="text-[#24b47e]" />
                                            法人基本情報
                                        </h3>
                                    </div>
                                    <div className="flex flex-col">
                                        <FormRow label="企業名" required>
                                            <input name="name_jp" type="text" required placeholder="例：株式会社ミライ" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="会社名（フリガナ）">
                                            <input name="name_kana" type="text" placeholder="例：カブシキガイシャミライ" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="企業名（ローマ字）">
                                            <input name="name_romaji" type="text" placeholder="例：MIRAI CO., LTD" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none uppercase text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="法人番号（13桁）">
                                            <input name="corporate_number" type="text" maxLength={13} placeholder="例：1234567890123" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none font-mono text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="業種 (Industry)">
                                            <input
                                                name="industry"
                                                list="industry-datalist"
                                                placeholder="例：製造業、建設業..."
                                                className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0"
                                            />
                                            <datalist id="industry-datalist">
                                                <option value="建設業" />
                                                <option value="製造業" />
                                                <option value="農業" />
                                            </datalist>
                                        </FormRow>
                                        <FormRow label="受入職種">
                                            <input
                                                name="accepted_occupations"
                                                placeholder="例：機械加工、溶接..."
                                                className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0"
                                            />
                                        </FormRow>
                                        <FormRow label="従業員数" isLast>
                                            <input
                                                name="employee_count"
                                                type="number"
                                                placeholder="例：50"
                                                className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0"
                                            />
                                        </FormRow>
                                    </div>
                                </div>

                                {/* SECTION 2: 連絡先・所在地 */}
                                <div className="bg-white rounded-none border border-[#c4c8cf] overflow-hidden mb-6">
                                    <div className="px-6 py-4 border-b border-[#c4c8cf] bg-[#f8fcfd]/10">
                                        <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">
                                            <MapPin size={18} className="text-[#24b47e]" />
                                            連絡先・所在地
                                        </h3>
                                    </div>
                                    <div className="flex flex-col">
                                        <FormRow label="郵便番号">
                                            <input name="postal_code" type="text" placeholder="例：160-0022" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="電話番号">
                                            <input name="phone" type="text" placeholder="例：03-1234-5678" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="所在地（住所）">
                                            <input name="address" type="text" placeholder="例：東京都新宿区新宿1-1-1" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="連絡・実習担当者">
                                            <input name="pic_name" type="text" placeholder="例：鈴木 一郎" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="メールアドレス" isLast>
                                            <input name="email" type="email" placeholder="例：example@domain.com" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                    </div>
                                </div>

                                {/* SECTION 3: 担当者情報（監査用） */}
                                <div className="bg-white rounded-none border border-[#c4c8cf] overflow-hidden mb-6">
                                    <div className="px-6 py-4 border-b border-[#c4c8cf] bg-[#f8fcfd]/10">
                                        <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">
                                            <Users size={18} className="text-[#24b47e]" />
                                            担当者情報（監査用）
                                        </h3>
                                    </div>
                                    <div className="flex flex-col">
                                        <FormRow label="代表者名">
                                            <input name="representative" type="text" placeholder="例：山田 太郎" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="代表者名（ローマ字）">
                                            <input name="representative_romaji" type="text" placeholder="例：YAMADA TARO" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none uppercase text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="責任者">
                                            <input name="manager_name" type="text" placeholder="例：田中 健太" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="講習受講日">
                                            <input name="training_date" type="date" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="生活指導員">
                                            <input name="life_advisor" type="text" placeholder="例：佐藤 花子" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="技能指導員" isLast>
                                            <input name="tech_advisor" type="text" placeholder="例：高橋 次郎" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                    </div>
                                </div>
                                {/* SECTION 4: 保険・登録・費用情報 */}
                                <div className="bg-white rounded-none border border-[#c4c8cf] overflow-hidden mb-6">
                                    <div className="px-6 py-4 border-b border-[#c4c8cf] bg-[#f8fcfd]/10">
                                        <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">
                                            <Building2 size={18} className="text-[#24b47e]" />
                                            保険・登録・費用情報
                                        </h3>
                                    </div>
                                    <div className="flex flex-col">
                                        <FormRow label="労働保険番号">
                                            <input name="labor_insurance_number" type="text" placeholder="例：12-345-678901-234" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="雇用保険番号">
                                            <input name="employment_insurance_number" type="text" placeholder="例：1234-567890-1" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="受理届出番号">
                                            <input name="acceptance_notification_number" type="text" placeholder="例：2023-12345" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="受理届出日">
                                            <input name="acceptance_notification_date" type="date" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="一般監理費（円）">
                                            <input name="general_supervision_fee" type="number" placeholder="例：30000" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="3号監理費（円）">
                                            <input name="category_3_supervision_fee" type="number" placeholder="例：20000" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                        <FormRow label="支援料（円）" isLast>
                                            <input name="support_fee" type="number" placeholder="例：25000" className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-1.5 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0" />
                                        </FormRow>
                                    </div>
                                </div>

                                {/* SECTION 5: 備考・特記事項 */}
                                <div className="bg-white rounded-none border border-[#c4c8cf] overflow-hidden mb-6">
                                    <div className="px-6 py-4 border-b border-[#c4c8cf] bg-[#f8fcfd]/10">
                                        <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">
                                            備考・特記事項
                                        </h3>
                                    </div>
                                    <div className="flex flex-col">
                                        <FormRow label="備考" isLast>
                                            <textarea name="remarks" rows={5} placeholder="企業に関する特記事項やメモを自由に入力してください..." className="w-full bg-transparent focus:bg-gray-50/80 border-none rounded-none px-3 py-2 text-sm outline-none text-[#1f1f1f] transition-all duration-300 shadow-none ring-0 focus:ring-0 resize-y min-h-[100px]" />
                                        </FormRow>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* RIGHT PANE: Document Kanban Flow */}
                        <CompanyDocumentKanban />
                    </div>
                </form>
            </div>
        </div>
    )
}

function FormRow({ label, children, isLast = false, required = false }: { label: React.ReactNode, children: React.ReactNode, isLast?: boolean, required?: boolean }) {
    return (
        <div className={`flex flex-col sm:flex-row ${!isLast ? 'border-b border-[#c4c8cf]' : ''} hover:bg-gray-50/50 transition-colors`}>
            <div className="w-full sm:w-[160px] lg:w-[200px] bg-[#f8fcfd]/40 px-3 py-2 flex items-center border-b sm:border-b-0 sm:border-r border-[#c4c8cf] shrink-0">
                <label className="text-sm font-bold text-[#1f1f1f] flex flex-row items-center gap-2 w-full relative">
                    {label}
                    {required && <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 border border-red-100 rounded-none shrink-0">必須</span>}
                </label>
            </div>
            <div className="flex-1 px-2 py-0.5 flex items-center bg-transparent relative">
                {children}
            </div>
        </div>
    )
}
