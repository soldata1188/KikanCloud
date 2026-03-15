// Shared badge for audit type — used in AuditScheduleColumn & AuditTimelineBoard
export const AUDIT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    homon: { label: '社宅訪問', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
    kansa: { label: '監査訪問', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    rinji: { label: '臨時対応', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
};

export default function AuditTypeBadge({ type, size = 'sm' }: { type: string; size?: 'xs' | 'sm' }) {
    const cfg = AUDIT_TYPE_CONFIG[type] || AUDIT_TYPE_CONFIG.homon;
    return (
        <span className={`inline-flex items-center rounded-[3px] font-semibold uppercase tracking-tighter border ${cfg.bg} ${cfg.color} ${cfg.border}
            ${size === 'xs' ? 'px-1 py-0 text-[10px]' : 'px-1.5 py-0.5 text-[11px]'}`}>
            {cfg.label}
        </span>
    );
}
