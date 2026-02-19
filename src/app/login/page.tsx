import { login } from './actions'
import { Building2 } from 'lucide-react'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const sp = await searchParams; // Await the searchParams promise

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-100">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <Building2 size={32} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
                    Đăng nhập Kikan SaaS
                </h2>
                {sp?.error && (
                    <p className="text-red-500 text-sm text-center mb-4 bg-red-50 p-2 rounded border border-red-100">
                        Sai email hoặc mật khẩu!
                    </p>
                )}
                <form action={login} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            defaultValue="admin@mirai.com"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Mật khẩu
                        </label>
                        <input
                            name="password"
                            type="password"
                            defaultValue="password123"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition"
                    >
                        Đăng nhập
                    </button>
                </form>
            </div>
        </div>
    )
}
