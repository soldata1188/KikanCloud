export function Logo({ className = "w-6 h-6", variant = "color" }: { className?: string, variant?: "color" | "white" }) {
    if (variant === "white") {
        return (
            <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="10,80 30,40 40,60" fill="#ffffff" opacity="0.6" />
                <polygon points="10,80 40,60 40,80" fill="#ffffff" opacity="0.4" />
                <polygon points="30,40 50,20 40,60" fill="#ffffff" opacity="0.9" />
                <polygon points="40,60 50,20 60,60" fill="#ffffff" opacity="1" />
                <polygon points="40,60 60,60 40,80" fill="#ffffff" opacity="0.5" />
                <polygon points="40,80 60,60 60,80" fill="#ffffff" opacity="0.3" />
                <polygon points="50,20 70,40 60,60" fill="#ffffff" opacity="0.8" />
                <polygon points="60,60 70,40 90,80" fill="#ffffff" opacity="0.6" />
                <polygon points="60,60 90,80 60,80" fill="#ffffff" opacity="0.4" />
            </svg>
        )
    }
    return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="10,80 30,40 40,60" fill="#34d399" />
            <polygon points="10,80 40,60 40,80" fill="#10b981" />
            <polygon points="30,40 50,20 40,60" fill="#6ee7b7" />
            <polygon points="40,60 50,20 60,60" fill="#24b47e" />
            <polygon points="40,60 60,60 40,80" fill="#059669" />
            <polygon points="40,80 60,60 60,80" fill="#047857" />
            <polygon points="50,20 70,40 60,60" fill="#10b981" />
            <polygon points="60,60 70,40 90,80" fill="#34d399" />
            <polygon points="60,60 90,80 60,80" fill="#059669" />
        </svg>
    )
}
