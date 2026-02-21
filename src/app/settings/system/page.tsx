import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Globe, Palette, Bell } from 'lucide-react'

export default async function SystemSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="max-w-3xl">
            <h3 className="text-2xl font-semibold mb-6">システム設定</h3>

            <div className="flex flex-col gap-8 text-[#1f1f1f]">
                {/* Visual Settings */}
                <div className="bg-white p-6 rounded-[24px]">
                    <h4 className="flex items-center gap-2 font-semibold mb-4 text-base">
                        <Palette className="text-[#24b47e]" size={20} /> 表示とテーマ
                    </h4>
                    <div className="flex flex-col gap-4 pl-7">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">ダークモード (Dark Mode)</p>
                                <p className="text-sm text-[#878787]">画面背景を暗くして目の疲れを軽減します。</p>
                            </div>
                            <input type="checkbox" className="toggle-switch w-10 h-5" disabled />
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">フラットデザイン (Flat UI)</p>
                                <p className="text-sm text-[#878787]">影を消してモダンなKikanCloudデザインを適用します。</p>
                            </div>
                            <input type="checkbox" className="toggle-switch w-10 h-5" defaultChecked disabled />
                        </div>
                    </div>
                </div>

                {/* Language Settings */}
                <div className="bg-white p-6 rounded-[24px]">
                    <h4 className="flex items-center gap-2 font-semibold mb-4 text-base">
                        <Globe className="text-green-500" size={20} /> 言語・地域
                    </h4>
                    <div className="flex flex-col gap-4 pl-7">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">システム言語</p>
                                <p className="text-sm text-[#878787]">KikanCloud 全体の表示言語を選択します。</p>
                            </div>
                            <select className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1f1f1f]" disabled>
                                <option>日本語 (Japanese)</option>
                                <option>English</option>
                                <option>Tiếng Việt</option>
                            </select>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <div>
                                <p className="font-medium">タイムゾーン</p>
                            </div>
                            <span className="text-sm text-[#878787] bg-white px-3 py-1.5 rounded-lg border border-gray-200">Asia/Tokyo</span>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white p-6 rounded-[24px]">
                    <h4 className="flex items-center gap-2 font-semibold mb-4 text-base">
                        <Bell className="text-orange-500" size={20} /> 通知設定
                    </h4>
                    <div className="flex flex-col gap-4 pl-7">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">メール通知</p>
                                <p className="text-sm text-[#878787]">監査期限や在留カード更新の警告メールを受け取ります。</p>
                            </div>
                            <input type="checkbox" className="toggle-switch w-10 h-5" defaultChecked disabled />
                        </div>
                    </div>
                </div>

                <div className="text-center text-sm text-[#878787] italic mt-4">
                    ※ システム設定は現在開発中のため、すべての項目がロックされています。
                </div>

            </div>
        </div>
    )
}
