import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createCompany } from '../actions'
import { ArrowLeft, Sparkles, Building2 } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { SaveButton } from '@/components/SubmitButtons'
import { redirect } from 'next/navigation'

export default async function NewCompanyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="flex h-screen bg-[#f0f4f9] font-sans text-[#1f1f1f] overflow-hidden selection:bg-blue-100">
            <Sidebar active="companies" />
            <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                <div className="flex-1 flex flex-col px-4 pb-12 w-full max-w-[800px] mx-auto mt-4 md:mt-8">
                    <form action={createCompany} className="flex flex-col h-full relative">
                        {/* Top Menu Sticky Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pl-2 sticky top-0 bg-[#f0f4f9] z-20 py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                            <div className="flex items-center gap-4">
 <Link href="/companies" className="w-10 h-10 flex items-center justify-center rounded-[32px] hover:bg-black/5 transition-colors text-[#444746]"><ArrowLeft size={24} strokeWidth={1.5} /></Link>
                                <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#1f1f1f]">受入企業 新規登録</h2>
                            </div>
                            <div className="flex items-center gap-3">
 <Link href="/companies" className="px-6 py-3 text-[#444746] bg-white font-medium hover:bg-gray-50 rounded-[32px] transition-colors">キャンセル</Link> 
                                <SaveButton />
                            </div>
                        </div>

                        <div className="space-y-6">
 <div className="bg-white rounded-[32px] p-8"> 
                                <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><Building2 className="text-[#4285F4]" size={20} /> 法人基本情報</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="md:col-span-2"><label className="block text-sm font-medium text-[#444746] mb-2">企業名（日本語） <span className="text-red-500">*</span></label><input name="name_jp" type="text" required placeholder="例：株式会社ミライ" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
 <div><label className="block text-sm font-medium text-[#444746] mb-2">企業名（ローマ字）</label><input name="name_romaji" type="text" placeholder="例：MIRAI CO., LTD" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none uppercase text-[#1f1f1f] transition-all" /></div> 
 <div><label className="block text-sm font-medium text-[#444746] mb-2">法人番号（13桁）</label><input name="corporate_number" type="text" maxLength={13} placeholder="例：1234567890123" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none font-mono text-[#1f1f1f] transition-all" /></div> 
 <div className="md:col-span-2"><label className="block text-sm font-medium text-[#444746] mb-2">業種 (Industry)</label><input name="industry" type="text" placeholder="例：製造業、建設業..." className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
                                </div>
                            </div>

 <div className="bg-white rounded-[32px] p-8"> 
                                <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><Sparkles className="text-[#34A853]" size={20} /> 連絡先・所在地</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div><label className="block text-sm font-medium text-[#444746] mb-2">郵便番号</label><input name="postal_code" type="text" placeholder="例：160-0022" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
 <div><label className="block text-sm font-medium text-[#444746] mb-2">電話番号</label><input name="phone" type="text" placeholder="例：03-1234-5678" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
 <div className="md:col-span-2"><label className="block text-sm font-medium text-[#444746] mb-2">所在地（住所）</label><input name="address" type="text" placeholder="例：東京都新宿区新宿1-1-1" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
                                </div>
                            </div>

 <div className="bg-white rounded-[32px] p-8"> 
                                <h3 className="text-lg font-medium text-[#1f1f1f] mb-6 flex items-center gap-2"><Sparkles className="text-[#EA4335]" size={20} /> 担当者情報（監査用）</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="md:col-span-2"><label className="block text-sm font-medium text-[#444746] mb-2">代表者名</label><input name="representative" type="text" placeholder="例：山田 太郎" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
 <div><label className="block text-sm font-medium text-[#444746] mb-2">責任者</label><input name="manager_name" type="text" placeholder="例：田中 健太" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
 <div><label className="block text-sm font-medium text-[#444746] mb-2">連絡・実習担当者</label><input name="pic_name" type="text" placeholder="例：鈴木 一郎" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
 <div><label className="block text-sm font-medium text-[#444746] mb-2">生活指導員</label><input name="life_advisor" type="text" placeholder="例：佐藤 花子" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
 <div><label className="block text-sm font-medium text-[#444746] mb-2">技能指導員</label><input name="tech_advisor" type="text" placeholder="例：高橋 次郎" className="w-full bg-[#f0f4f9] focus:bg-white -transparent focus: rounded-[32px] px-4 py-3 outline-none text-[#1f1f1f] transition-all" /></div> 
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
