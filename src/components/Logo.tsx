export function Logo({ className = "w-6 h-6", variant = "color", unfold = false }: { className?: string, variant?: "color" | "white", unfold?: boolean }) {
    const polyClass = unfold ? "transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]" : "";
    const style: React.CSSProperties = unfold ? { transformOrigin: "center", transformBox: "fill-box" } : {};

    if (variant === "white") {
        return (
            <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon className={`${polyClass} ${unfold ? 'group-hover:-translate-x-[20%] group-hover:-translate-y-[10%] group-hover:-rotate-[15deg]' : ''}`} style={style} points="10,80 30,40 40,60" fill="#ffffff" opacity="0.6" />
                <polygon className={`${polyClass} ${unfold ? 'group-hover:-translate-x-[25%] group-hover:translate-y-[15%] group-hover:-rotate-[10deg]' : ''}`} style={style} points="10,80 40,60 40,80" fill="#ffffff" opacity="0.4" />
                <polygon className={`${polyClass} ${unfold ? 'group-hover:-translate-x-[15%] group-hover:-translate-y-[25%]' : ''}`} style={style} points="30,40 50,20 40,60" fill="#ffffff" opacity="0.9" />
                <polygon className={`${polyClass} ${unfold ? 'group-hover:-translate-y-[30%] group-hover:scale-110' : ''}`} style={style} points="40,60 50,20 60,60" fill="#ffffff" opacity="1" />
                <polygon className={`${polyClass} ${unfold ? 'group-hover:-translate-x-[5%] group-hover:translate-y-[20%]' : ''}`} style={style} points="40,60 60,60 40,80" fill="#ffffff" opacity="0.5" />
                <polygon className={`${polyClass} ${unfold ? 'group-hover:-translate-x-[10%] group-hover:translate-y-[35%]' : ''}`} style={style} points="40,80 60,60 60,80" fill="#ffffff" opacity="0.3" />
                <polygon className={`${polyClass} ${unfold ? 'group-hover:translate-x-[15%] group-hover:-translate-y-[25%]' : ''}`} style={style} points="50,20 70,40 60,60" fill="#ffffff" opacity="0.8" />
                <polygon className={`${polyClass} ${unfold ? 'group-hover:translate-x-[20%] group-hover:-translate-y-[10%] group-hover:rotate-[15deg]' : ''}`} style={style} points="60,60 70,40 90,80" fill="#ffffff" opacity="0.6" />
                <polygon className={`${polyClass} ${unfold ? 'group-hover:translate-x-[25%] group-hover:translate-y-[15%] group-hover:rotate-[10deg]' : ''}`} style={style} points="60,60 90,80 60,80" fill="#ffffff" opacity="0.4" />
            </svg>
        )
    }
    return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon className={`${polyClass} ${unfold ? 'group-hover:-translate-x-[15%] group-hover:-translate-y-[10%] group-hover:-rotate-[12deg] group-hover:opacity-80' : ''}`} style={style} points="10,80 30,40 40,60" fill="#34d399" />
            <polygon className={`${polyClass} ${unfold ? 'group-hover:-translate-x-[20%] group-hover:translate-y-[10%] group-hover:-rotate-[8deg] group-hover:opacity-70' : ''}`} style={style} points="10,80 40,60 40,80" fill="#10b981" />
            <polygon className={`${polyClass} ${unfold ? 'group-hover:-translate-x-[10%] group-hover:-translate-y-[20%] group-hover:opacity-80' : ''}`} style={style} points="30,40 50,20 40,60" fill="#6ee7b7" />
            <polygon className={`${polyClass} ${unfold ? 'group-hover:-translate-y-[25%] group-hover:scale-105 group-hover:opacity-100' : ''}`} style={style} points="40,60 50,20 60,60" fill="#24b47e" />
            <polygon className={`${polyClass} ${unfold ? 'group-hover:-translate-x-[5%] group-hover:translate-y-[15%] group-hover:opacity-90' : ''}`} style={style} points="40,60 60,60 40,80" fill="#059669" />
            <polygon className={`${polyClass} ${unfold ? 'group-hover:-translate-x-[10%] group-hover:translate-y-[25%] group-hover:rotate-[5deg] group-hover:opacity-70' : ''}`} style={style} points="40,80 60,60 60,80" fill="#047857" />
            <polygon className={`${polyClass} ${unfold ? 'group-hover:translate-x-[10%] group-hover:-translate-y-[20%] group-hover:opacity-80' : ''}`} style={style} points="50,20 70,40 60,60" fill="#10b981" />
            <polygon className={`${polyClass} ${unfold ? 'group-hover:translate-x-[15%] group-hover:-translate-y-[10%] group-hover:rotate-[12deg] group-hover:opacity-80' : ''}`} style={style} points="60,60 70,40 90,80" fill="#34d399" />
            <polygon className={`${polyClass} ${unfold ? 'group-hover:translate-x-[20%] group-hover:translate-y-[10%] group-hover:rotate-[8deg] group-hover:opacity-70' : ''}`} style={style} points="60,60 90,80 60,80" fill="#059669" />
        </svg>
    )
}
