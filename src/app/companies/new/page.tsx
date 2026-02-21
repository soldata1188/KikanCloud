import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createCompany } from '../actions'
import { ArrowLeft } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { SaveButton } from '@/components/SubmitButtons'
import { redirect } from 'next/navigation'

export default async function NewCompanyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="flex h-screen bg-[#fbfcfd] font-sans text-[#1f1f1f] overflow-hidden selection:bg-[#24b47e]/20">
            <Sidebar active="companies" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[800px] mx-auto mt-4 md:mt-8">
                    <form action={createCompany} className="flex flex-col h-full relative space-y-6">
                        {/* Top Menu Sticky Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pl-2 sticky top-0 bg-[#fbfcfd] z-20 py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                            <div className="flex items-center gap-4">
                                <Link href="/companies" className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors text-[#1f1f1f]">
                                    <ArrowLeft size={24} strokeWidth={1.5} />
                                </Link>
                                <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">受入企業 新規登録</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link href="/companies" className="px-6 py-3 text-[#1f1f1f] bg-white font-medium hover:bg-[#fbfcfd] rounded-md transition-colors border border-[#ededed]">キャンセル</Link>
                                <SaveButton />
                            </div>
                        </div>

                        {/* SECTION 1: 法人基本情報 */}
                        <div className="bg-white rounded-md p-6 sm:p-8 border border-[#ededed] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#24b47e]"></div>
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-8 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#24b47e]/10 text-[#24b47e] text-sm font-bold">1</span>
                                法人基本情報
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        企業名（日本語）
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">必須</span>
                                    </label>
                                    <input name="name_jp" type="text" required placeholder="例：株式会社ミライ" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        企業名（ローマ字）
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="name_romaji" type="text" placeholder="例：MIRAI CO., LTD" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none uppercase text-[#1f1f1f] transition-all" />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        法人番号（13桁）
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="corporate_number" type="text" maxLength={13} placeholder="例：1234567890123" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none font-mono text-[#1f1f1f] transition-all" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        業種 (Industry)
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="industry" type="text" list="industry-suggestions" placeholder="例：製造業、建設業..." className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" />
                                    <datalist id="industry-suggestions">
                                        <option value="建設業"></option>
                                        <option value="製造業"></option>
                                        <option value="農業"></option>
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: 連絡先・所在地 */}
                        <div className="bg-white rounded-md p-6 sm:p-8 border border-[#ededed] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#34A853]"></div>
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-8 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#34A853]/10 text-[#34A853] text-sm font-bold">2</span>
                                連絡先・所在地
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        郵便番号
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="postal_code" type="text" placeholder="例：160-0022" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        電話番号
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="phone" type="text" placeholder="例：03-1234-5678" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        所在地（住所）
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="address" type="text" placeholder="例：東京都新宿区新宿1-1-1" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: 担当者情報（監査用） */}
                        <div className="bg-white rounded-md p-6 sm:p-8 border border-[#ededed] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#EA4335]"></div>
                            <h3 className="text-lg font-medium text-[#1f1f1f] mb-8 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#EA4335]/10 text-[#EA4335] text-sm font-bold">3</span>
                                担当者情報（監査用）
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-1">
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        代表者名
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="representative" type="text" placeholder="例：山田 太郎" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        代表者名（ローマ字）
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="representative_romaji" type="text" placeholder="例：YAMADA TARO" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none uppercase text-[#1f1f1f] transition-all" />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        責任者
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="manager_name" type="text" placeholder="例：田中 健太" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        講習受講日
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="training_date" type="date" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        生活指導員
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="life_advisor" type="text" placeholder="例：佐藤 花子" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        技能指導員
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="tech_advisor" type="text" placeholder="例：高橋 次郎" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#1f1f1f] mb-2">
                                        連絡・実習担当者
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ededed] text-[#878787] bg-[#fbfcfd]">任意</span>
                                    </label>
                                    <input name="pic_name" type="text" placeholder="例：鈴木 一郎" className="w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 outline-none text-[#1f1f1f] transition-all" />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
