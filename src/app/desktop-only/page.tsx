import Link from "next/link";
import { MonitorX } from "lucide-react";

export default function DesktopOnlyPage() {
    return (
        <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 flex flex-col items-center justify-center border border-gray-350 shadow-none text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                    <MonitorX className="w-8 h-8 text-red-500" />
                </div>

                <h1 className="text-xl font-bold text-gray-900 mb-2">
                    このページはPC専用です
                </h1>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Trang này chỉ dành cho Máy tính (PC)
                </h2>

                <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                    Dữ liệu nghiệp vụ khá phức tạp, vui lòng mở KikanCloud trên thiết bị máy tính (Desktop/Laptop) để có trải nghiệm đọc và thao tác tốt nhất.
                </p>

                <Link
                    href="/"
                    className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-none"
                >
                    Quay lại Trang chủ
                </Link>
            </div>
        </div>
    );
}
