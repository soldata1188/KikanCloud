'use client'
import { Printer } from 'lucide-react'

export function PrintButton() {
 return (
 <button
 onClick={() => window.print()}
 className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-md font-bold hover:bg-emerald-600 hover:scale-105 transition-all outline-none print:hidden"
 >
 <Printer size={24} strokeWidth={2} />
 印刷する
 </button>
 )
}
