'use client'
import { Printer } from 'lucide-react'

export function PrintButton() {
 return (
 <button
 onClick={() => window.print()}
 className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-[#24b47e] text-white rounded-md font-bold hover:bg-[#1e9a6a] hover:scale-105 transition-all outline-none print:hidden"
 >
 <Printer size={24} strokeWidth={2} />
 印刷する
 </button>
 )
}
