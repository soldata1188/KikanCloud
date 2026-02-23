'use client'

export function AnimatedLogo({ logoOnly = false }: { logoOnly?: boolean }) {
 return (
 <div className={`${logoOnly ? 'flex items-center justify-center cursor-default group' : 'mb-6 flex items-center justify-center h-16 cursor-default group'}`}>
 <div className={`flex items-center bg-transparent rounded-md overflow-visible transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${logoOnly ? '' : ''}`}>
 <div className={`${logoOnly ? 'w-auto h-auto' : 'w-16 h-16'} bg-transparent flex items-center justify-center shrink-0 z-10 relative`}>
 <style>{`
 .origami-logo { transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
 .origami-poly { transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); transform-origin: center; }
 .group:hover .origami-logo { transform: scale(1.05) translateY(-2px); filter: (0 6px 10px rgba(36, 180, 126, 0.25)); }
 .group:hover .poly-1 { transform: translate(-4px, -2px); }
 .group:hover .poly-2 { transform: translate(-3px, 3px); }
 .group:hover .poly-3 { transform: translate(-2px, -4px); }
 .group:hover .poly-4 { transform: translate(0px, -2px); }
 .group:hover .poly-5 { transform: translate(-1px, 3px); }
 .group:hover .poly-6 { transform: translate(2px, 4px); }
 .group:hover .poly-7 { transform: translate(2px, -4px); }
 .group:hover .poly-8 { transform: translate(4px, -2px); }
 .group:hover .poly-9 { transform: translate(3px, 3px); }
`}</style>
 <svg width="40"height="40"viewBox="0 0 100 100"fill="none"xmlns="http://www.w3.org/2000/svg"className="origami-logo relative z-20">
 <g stroke="#ffffff"strokeWidth="0.5"strokeLinejoin="round">
 <polygon points="10,80 30,40 40,60"fill="#34d399"className="origami-poly poly-1"/>
 <polygon points="10,80 40,60 40,80"fill="#10b981"className="origami-poly poly-2"/>
 <polygon points="30,40 50,20 40,60"fill="#6ee7b7"className="origami-poly poly-3"/>
 <polygon points="40,60 50,20 60,60"fill="#24b47e"className="origami-poly poly-4"/>
 <polygon points="40,60 60,60 40,80"fill="#059669"className="origami-poly poly-5"/>
 <polygon points="40,80 60,60 60,80"fill="#047857"className="origami-poly poly-6"/>
 <polygon points="50,20 70,40 60,60"fill="#10b981"className="origami-poly poly-7"/>
 <polygon points="60,60 70,40 90,80"fill="#34d399"className="origami-poly poly-8"/>
 <polygon points="60,60 90,80 60,80"fill="#059669"className="origami-poly poly-9"/>
 </g>
 </svg>
 </div>
 {!logoOnly && (
 <div className="w-0 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:w-[150px] opacity-0 group-hover:opacity-100 flex items-center justify-center bg-transparent pr-4">
 <span className="text-[20px] font-black tracking-tight text-[#1f1f1f] whitespace-nowrap pl-2">
 Kikan<span className="text-[#24b47e]">Cloud</span>
 </span>
 </div>
 )}
 </div>
 </div>
 )
}
