import { Loader2, Hexagon } from 'lucide-react'

export default function PortalLoading() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[60vh] animate-in fade-in duration-300 bg-[#fbfcfd]">
            <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 bg-[#1a73e8]/20 blur-xl rounded-full w-16 h-16 animate-pulse"></div>
                <div className="w-12 h-12 bg-white border border-[#ededed] rounded-xl shadow-sm flex items-center justify-center relative z-10">
                    <Hexagon className="text-[#1a73e8] animate-pulse" size={24} />
                </div>
            </div>
            <div className="flex items-center gap-2 text-[#878787] font-medium text-[12px] uppercase tracking-widest">
                <Loader2 size={16} className="animate-spin text-[#1a73e8]" />
                ポータルを読み込み中...
            </div>
        </div>
    )
}
