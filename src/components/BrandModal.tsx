'use client'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

export function BrandModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [show, setShow] = useState(false)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            setShow(true)
            document.body.style.overflow = 'hidden'
        } else {
            setShow(false)
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose()
        }

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose])

    if (!isOpen && !show) return null

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 ${isOpen ? 'bg-[#1f1f1f]/40 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}>
            <div
                ref={modalRef}
                className={`relative bg-white w-full max-w-[800px] rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col md:flex-row transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
            >
                <button onClick={onClose} className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 border border-gray-200 text-[#878787] hover:text-[#1f1f1f] hover:bg-gray-50 transition-colors shadow-sm md:hidden">
                    <X size={16} strokeWidth={2.5} />
                </button>

                {/* 左ブロック: 折り紙クラウド */}
                <div className="md:w-5/12 p-8 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col items-center justify-center relative group min-h-[250px] md:min-h-[350px]">
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#1f1f1f 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <style>{`
              .origami-modal { filter: drop-shadow(0 15px 25px rgba(36, 180, 126, 0.25)); transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
              .origami-modal:hover { transform: scale(1.05) translateY(-5px); }
              .poly { transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); transform-origin: center; }
              .origami-modal:hover .poly-1 { transform: translate(-4px, -2px); }
              .origami-modal:hover .poly-2 { transform: translate(-3px, 3px); }
              .origami-modal:hover .poly-3 { transform: translate(-2px, -4px); }
              .origami-modal:hover .poly-4 { transform: translate(0px, -2px); }
              .origami-modal:hover .poly-5 { transform: translate(-1px, 3px); }
              .origami-modal:hover .poly-6 { transform: translate(2px, 4px); }
              .origami-modal:hover .poly-7 { transform: translate(2px, -4px); }
              .origami-modal:hover .poly-8 { transform: translate(4px, -2px); }
              .origami-modal:hover .poly-9 { transform: translate(3px, 3px); }
            `}</style>

                        <p className="text-[9px] font-bold text-[#878787] uppercase tracking-[0.2em] mb-6 transition-opacity duration-300 animate-pulse group-hover:opacity-0 hidden md:block">Hover to unfold</p>

                        <svg width="130" height="130" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="origami-modal cursor-crosshair">
                            <g stroke="#ffffff" strokeWidth="0.5" strokeLinejoin="round">
                                <polygon points="10,80 30,40 40,60" fill="#34d399" className="poly poly-1" />
                                <polygon points="10,80 40,60 40,80" fill="#10b981" className="poly poly-2" />
                                <polygon points="30,40 50,20 40,60" fill="#6ee7b7" className="poly poly-3" />
                                <polygon points="40,60 50,20 60,60" fill="#24b47e" className="poly poly-4" />
                                <polygon points="40,60 60,60 40,80" fill="#059669" className="poly poly-5" />
                                <polygon points="40,80 60,60 60,80" fill="#047857" className="poly poly-6" />
                                <polygon points="50,20 70,40 60,60" fill="#10b981" className="poly poly-7" />
                                <polygon points="60,60 70,40 90,80" fill="#34d399" className="poly poly-8" />
                                <polygon points="60,60 90,80 60,80" fill="#059669" className="poly poly-9" />
                            </g>
                        </svg>

                        <div className="mt-8 flex items-center tracking-tight font-sans">
                            <span className="text-2xl font-black text-[#1f1f1f]">Kikan</span>
                            <span className="text-2xl font-black text-[#24b47e]">Cloud</span>
                        </div>
                    </div>
                </div>

                {/* 右ブロック: マニフェスト */}
                <div className="md:w-7/12 p-8 md:p-10 flex flex-col justify-center bg-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 z-50 w-8 h-8 hidden md:flex items-center justify-center rounded-full bg-white border border-transparent text-[#878787] hover:text-[#1f1f1f] hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm">
                        <X size={16} strokeWidth={2.5} />
                    </button>

                    <span className="px-3 py-1 bg-[#24b47e]/10 text-[#24b47e] text-[9px] font-bold uppercase tracking-[0.2em] rounded-full border border-[#24b47e]/20 w-fit mb-4">Brand Identity</span>

                    <div className="mb-6">
                        <h1 className="text-2xl md:text-[28px] font-black tracking-tight text-[#1f1f1f] mb-2 leading-tight" style={{ background: 'linear-gradient(135deg, #1f1f1f 0%, #4a4a4a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', paddingBottom: '0.1em', paddingTop: '0.1em', lineHeight: '1.2' }}>
                            The Origami Cloud
                        </h1>
                        <p className="text-[13px] text-[#1f1f1f] font-bold border-l-2 border-[#24b47e] pl-3 py-0.5 mt-2">
                            「複雑な手続きを、美しく、シンプルに。」
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5"><div className="w-1.5 h-1.5 bg-[#24b47e] rounded-full"></div><h3 className="text-[11px] font-bold text-[#878787] uppercase tracking-wider">01. Concept & Shape</h3></div>
                            <p className="text-[12px] text-[#666666] leading-relaxed pl-3.5">膨大な書類を日本の「折り紙」のように美しく整理しクラウドへ。直線のデザインは妥協なきコンプライアンスの厳格さと高い堅牢性を象徴します。</p>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1.5"><div className="w-1.5 h-1.5 bg-[#24b47e] rounded-full"></div><h3 className="text-[11px] font-bold text-[#878787] uppercase tracking-wider">02. Our Mission</h3></div>
                            <p className="text-[12px] text-[#666666] leading-relaxed pl-3.5">書類業務を完全にデジタル化・自動化し、担当者が本来すべき「実習生や受入企業への支援」に注力できる世界を創り出します。</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-5 border-t border-gray-200">
                        <p className="text-[11px] font-bold text-[#444746] mb-1 flex items-center gap-1.5">
                            本製品は <span className="text-[#1f1f1f] font-black">Arata-Biz</span> によって開発・所有されています。
                        </p>
                        <p className="text-[9px] font-bold text-[#878787] uppercase tracking-widest mt-2">Product Developed & Owned By Arata-Biz Inc.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
