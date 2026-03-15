'use client'
import { useState, useCallback, useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { MapPin as MapPinIcon, Building2, User, Search, X, Navigation, AlertTriangle } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────
export type LocationType = 'company' | 'worker'

export interface RawLocation {
    id: string
    name: string
    type: LocationType
    address: string | null
    latitude: number | null
    longitude: number | null
    companyId?: string
    companyName?: string
    badge?: string
    workerCount?: number
    daysUntilExpiry?: number | null
}

interface MappableLocation extends RawLocation {
    latitude: number
    longitude: number
}

interface FilterCompany { id: string; name: string }

// ── Helpers ───────────────────────────────────────────────────────
function partitionLocations(locs: RawLocation[]): { mappable: MappableLocation[]; unmapped: RawLocation[] } {
    const mappable: MappableLocation[] = []
    const unmapped: RawLocation[] = []
    for (const loc of locs) {
        if (loc.latitude != null && loc.longitude != null && loc.latitude !== 0 && loc.longitude !== 0) {
            mappable.push(loc as MappableLocation)
        } else {
            unmapped.push(loc)
        }
    }
    return { mappable, unmapped }
}

function initials(name: string): string {
    return name.trim().slice(0, 2).toUpperCase()
}

// ── Map Panner ───────────────────────────────────────────────────
function MapPanner({ center }: { center: { lat: number; lng: number } | null }) {
    const map = useMap()
    useEffect(() => {
        if (map && center) { map.panTo(center); map.setZoom(15) }
    }, [map, center])
    return null
}

// ── Zoom Controls ─────────────────────────────────────────────────
function ZoomControls({ mappable }: { mappable: { latitude: number; longitude: number }[] }) {
    const map = useMap()
    const handleZoomIn = () => map && map.setZoom((map.getZoom() ?? 10) + 1)
    const handleZoomOut = () => map && map.setZoom(Math.max(1, (map.getZoom() ?? 10) - 1))
    const handleCurrentLocation = () => {
        if (!navigator.geolocation || !map) return
        navigator.geolocation.getCurrentPosition(pos => {
            map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            map.setZoom(14)
        })
    }
    const handleFitAll = () => {
        if (!map || mappable.length === 0) return
        const bounds = new google.maps.LatLngBounds()
        mappable.forEach(l => bounds.extend({ lat: l.latitude, lng: l.longitude }))
        map.fitBounds(bounds, 60)
    }
    const ctrlBtn = 'w-[32px] h-[32px] flex items-center justify-center text-[#475569] hover:bg-[#f8fafc] hover:text-[#0067b8] transition-all'
    return (
        <div className="absolute top-3 right-3 flex flex-col gap-[6px] z-[100]">
            {/* Zoom In + Out in same group */}
            <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,.15)] border border-[#e2e8f0] overflow-hidden">
                <button title="ズームイン" onClick={handleZoomIn} className={`${ctrlBtn} border-b border-[#f1f5f9]`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                </button>
                <button title="ズームアウト" onClick={handleZoomOut} className={ctrlBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" d="M5 12h14" />
                    </svg>
                </button>
            </div>
            {/* Current location */}
            <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,.15)] border border-[#e2e8f0] overflow-hidden">
                <button title="現在地" onClick={handleCurrentLocation} className={ctrlBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    </svg>
                </button>
            </div>
            {/* Fit all */}
            <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,.15)] border border-[#e2e8f0] overflow-hidden">
                <button title="全体表示" onClick={handleFitAll} className={ctrlBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

// ── Location Pin ─────────────────────────────────────────────────
function LocationPin({ type, isAlert, isActive, name }: { type: LocationType; isAlert?: boolean; isActive: boolean; name: string }) {
    const color = isAlert ? '#dc2626' : type === 'company' ? '#d97706' : '#0067b8'
    return (
        <div className={`relative flex flex-col items-center group cursor-pointer transition-transform duration-150 ${isActive ? 'scale-125' : 'hover:scale-110'}`}>
            {/* Hover label */}
            <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 bg-black/75 text-white text-[9px] px-[6px] py-[2px] rounded-[4px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
                {name}
            </div>
            {/* Teardrop pin body */}
            <div className="w-7 h-7 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,.3)]"
                style={{ backgroundColor: color, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid rgba(255,255,255,0.8)' }}>
                <div style={{ transform: 'rotate(45deg)' }}>
                    {type === 'company' ? <Building2 size={11} className="text-white" /> : <User size={10} className="text-white" />}
                </div>
            </div>
        </div>
    )
}

// ── Geocode Modal ─────────────────────────────────────────────────
function GeocodeModal({
    unmappedCount,
    onClose,
    onConfirm,
    isProcessing,
    progress,
}: {
    unmappedCount: number
    onClose: () => void
    onConfirm: () => void
    isProcessing: boolean
    progress: { done: number; total: number } | null
}) {
    const estimatedMinutes = Math.max(1, Math.ceil(unmappedCount / 40))
    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-white rounded-[12px] p-5 w-[320px] shadow-[0_8px_30px_rgba(0,0,0,.2)]">
                <div className="text-[15px] font-semibold text-[#0f172a] mb-[6px]">住所から座標を一括変換</div>
                <div className="text-[12px] text-[#64748b] leading-[1.6] mb-[14px]">
                    Google Geocoding APIを使用して、登録済みの住所から緯度・経度を自動取得し、地図に表示できるようにします。
                </div>
                <div className="flex gap-2 mb-4">
                    {[
                        { n: unmappedCount, l: '変換対象', c: '#0f172a' },
                        { n: `~${estimatedMinutes}分`, l: '予想時間', c: '#d97706' },
                        { n: '無料', l: 'API使用料', c: '#16a34a' },
                    ].map(({ n, l, c }) => (
                        <div key={l} className="flex-1 bg-[#f8fafc] rounded-[8px] p-[10px] text-center border border-[#e2e8f0]">
                            <div className="text-[20px] font-bold" style={{ color: c }}>{n}</div>
                            <div className="text-[10px] text-[#94a3b8] mt-0.5">{l}</div>
                        </div>
                    ))}
                </div>
                {isProcessing && progress && (
                    <div className="mb-4">
                        <div className="flex justify-between text-[11px] text-[#d97706] mb-1">
                            <span>変換中...</span>
                            <span>{progress.done} / {progress.total}</span>
                        </div>
                        <div className="h-[4px] bg-[#e2e8f0] rounded-[2px] overflow-hidden">
                            <div className="h-full bg-[#d97706] rounded-[2px] transition-all"
                                style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                        </div>
                    </div>
                )}
                <div className="flex gap-2">
                    <button onClick={onClose} disabled={isProcessing}
                        className="flex-1 h-[34px] rounded-[8px] bg-[#f1f5f9] text-[#475569] text-[12px] font-medium border border-[#e2e8f0] hover:border-[#94a3b8] transition-all disabled:opacity-50">
                        キャンセル
                    </button>
                    <button onClick={onConfirm} disabled={isProcessing}
                        className="flex-1 h-[34px] rounded-[8px] bg-[#0067b8] text-white text-[12px] font-medium hover:bg-[#004a8c] transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                        {isProcessing ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                        {isProcessing ? '変換中...' : '一括変換を開始'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────
export default function RoutingClient({ initialLocations, filterCompanies, googleMapsKey }: {
    initialLocations: RawLocation[]
    filterCompanies: FilterCompany[]
    googleMapsKey: string
}) {
    const [locations, setLocations] = useState(initialLocations)
    const { mappable, unmapped } = partitionLocations(locations)

    const [searchQuery, setSearchQuery] = useState('')
    const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null)
    const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(null)

    // Geocode modal state
    const [showGeocodeModal, setShowGeocodeModal] = useState(false)
    const [isGeocoding, setIsGeocoding] = useState(false)
    const [geocodeProgress, setGeocodeProgress] = useState<{ done: number; total: number } | null>(null)
    const [geocodeDone, setGeocodeDone] = useState(false)

    const defaultCenter = mappable.length > 0
        ? { lat: mappable[0].latitude, lng: mappable[0].longitude }
        : { lat: 34.5733, lng: 135.4814 }

    const flyTo = useCallback((loc: MappableLocation) => {
        setPanTarget({ lat: loc.latitude, lng: loc.longitude })
        setActiveMarkerId(loc.id)
    }, [])

    // Filter by search
    const q = searchQuery.toLowerCase()
    const filteredMappable = mappable.filter(l =>
        !q || l.name.toLowerCase().includes(q) || (l.address ?? '').toLowerCase().includes(q)
    )
    const filteredUnmapped = unmapped.filter(l =>
        !q || l.name.toLowerCase().includes(q) || (l.address ?? '').toLowerCase().includes(q)
    )

    // Counts
    const companyCount = locations.filter(l => l.type === 'company').length
    const workerCount = locations.filter(l => l.type === 'worker').length
    // Alert = workers (not companies) with expiry within 60 days
    const alertCount = locations.filter(l => l.type === 'worker' && l.daysUntilExpiry != null && l.daysUntilExpiry <= 60).length
    const unmappedCount = unmapped.length

    // Sort helpers
    const urgencyScore = (loc: RawLocation) => {
        if (loc.daysUntilExpiry == null) return 999
        if (loc.daysUntilExpiry <= 30) return loc.daysUntilExpiry          // most urgent first
        if (loc.daysUntilExpiry <= 60) return loc.daysUntilExpiry + 100
        return 999
    }

    const sortedMappable = [...filteredMappable].sort((a, b) => urgencyScore(a) - urgencyScore(b))
    const sortedUnmapped = [...filteredUnmapped]

    // Geocode handler
    const handleGeocode = async () => {
        if (!googleMapsKey) { alert('Google Maps API keyが設定されていません'); return }
        const targets = unmapped.filter(l => l.address)
        if (targets.length === 0) { setShowGeocodeModal(false); return }

        setIsGeocoding(true)
        setGeocodeProgress({ done: 0, total: targets.length })

        const updated: RawLocation[] = [...locations]

        for (let i = 0; i < targets.length; i++) {
            const loc = targets[i]
            try {
                const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(loc.address ?? '')}&key=${googleMapsKey}&language=ja&region=JP`
                const res = await fetch(url)
                const data = await res.json()
                if (data.status === 'OK' && data.results[0]) {
                    const { lat, lng } = data.results[0].geometry.location
                    // Update in Supabase via our API
                    await fetch('/api/geocode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: loc.id, type: loc.type, latitude: lat, longitude: lng })
                    })
                    // Update local state
                    const idx = updated.findIndex(l => l.id === loc.id)
                    if (idx !== -1) { updated[idx] = { ...updated[idx], latitude: lat, longitude: lng } }
                }
            } catch { /* skip failed */ }
            setGeocodeProgress({ done: i + 1, total: targets.length })
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 120))
        }

        setLocations([...updated])
        setIsGeocoding(false)
        setGeocodeDone(true)
        setTimeout(() => { setShowGeocodeModal(false); setGeocodeDone(false); setGeocodeProgress(null) }, 2000)
    }

    // Map type state
    const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap')
    const mapTypeLabels: { key: 'roadmap' | 'satellite' | 'terrain'; label: string }[] = [
        { key: 'roadmap', label: '地図' },
        { key: 'satellite', label: '航空' },
        { key: 'terrain', label: '地形' },
    ]

    if (!googleMapsKey) {
        return (
            <div className="h-full flex items-center justify-center bg-[#f8fafc]">
                <div className="text-center max-w-md bg-white p-8 rounded-[10px] border border-[#e2e8f0] shadow-sm">
                    <MapPinIcon size={40} className="mx-auto text-gray-300 mb-4" />
                    <h2 className="text-sm font-semibold text-gray-800 mb-2">Google Maps Key Missing</h2>
                    <p className="text-[12px] text-gray-500">
                        <code className="bg-gray-50 px-1.5 py-0.5 rounded text-red-500 border border-gray-200 text-[11px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> を .env.local に追加してください。
                    </p>
                </div>
            </div>
        )
    }

    return (
        <APIProvider apiKey={googleMapsKey}>
            {/* Geocode Modal */}
            {showGeocodeModal && (
                <GeocodeModal
                    unmappedCount={unmappedCount}
                    onClose={() => !isGeocoding && setShowGeocodeModal(false)}
                    onConfirm={handleGeocode}
                    isProcessing={isGeocoding}
                    progress={geocodeProgress}
                />
            )}

            {/* map-area: left-panel (340px) + map-container (flex-1) */}
            <div className="flex h-full overflow-hidden">

                {/* ══ LEFT PANEL (340px) ══ */}
                <div className="w-[340px] bg-white border-r border-[#e2e8f0] flex flex-col shrink-0 z-10">

                    {/* Panel Header */}
                    <div className="px-[14px] py-3 border-b border-[#e2e8f0] shrink-0">
                        {/* Title row */}
                        <div className="flex items-center gap-2 mb-[10px]">
                            <div className="w-[30px] h-[30px] rounded-[8px] bg-[#e6f1fb] flex items-center justify-center shrink-0">
                                <MapPinIcon size={16} className="text-[#0067b8]" />
                            </div>
                            <div>
                                <div className="text-[14px] font-semibold text-[#0f172a]">位置情報マップ</div>
                                <div className="text-[11px] text-[#94a3b8]">Location Overview</div>
                            </div>
                        </div>

                        {/* Stats badges */}
                        <div className="flex gap-[6px] mb-[10px] flex-wrap">
                            <span className="flex items-center gap-[5px] px-[10px] py-1 rounded-[20px] text-[11px] font-medium bg-[#fef3c7] text-[#d97706] border border-[#d97706]">
                                <Building2 size={11} /> 受入企業 {companyCount}
                            </span>
                            <span className="flex items-center gap-[5px] px-[10px] py-1 rounded-[20px] text-[11px] font-medium bg-[#e6f1fb] text-[#0067b8] border border-[#0067b8]">
                                <User size={11} /> 対象者 {workerCount}
                            </span>
                            {alertCount > 0 && (
                                <span className="flex items-center gap-[5px] px-[10px] py-1 rounded-[20px] text-[11px] font-medium bg-[#fee2e2] text-[#dc2626] border border-[#dc2626]">
                                    <AlertTriangle size={11} /> 期限警告 {alertCount}
                                </span>
                            )}
                        </div>

                        {/* Geocode alert bar */}
                        {unmappedCount > 0 && !geocodeDone && (
                            <div className="bg-[#fef3c7] border border-[#d97706] rounded-[8px] px-3 py-2 flex items-start gap-2 mb-[10px]">
                                <AlertTriangle size={14} className="text-[#d97706] shrink-0 mt-[1px]" />
                                <div className="text-[11px] text-[#d97706] flex-1 leading-[1.5]">
                                    {unmappedCount}件 座標未登録。AIで住所から自動変換できます
                                </div>
                                <button onClick={() => setShowGeocodeModal(true)}
                                    className="h-[24px] px-[10px] rounded-[6px] bg-[#d97706] text-white text-[10px] font-medium whitespace-nowrap shrink-0 hover:bg-[#b45309] transition-colors">
                                    一括変換
                                </button>
                            </div>
                        )}
                        {geocodeDone && (
                            <div className="bg-[#dcfce7] border border-[#16a34a] rounded-[8px] px-3 py-2 flex items-center gap-2 mb-[10px] text-[11px] text-[#16a34a] font-medium">
                                ✓ 座標変換が完了しました
                            </div>
                        )}

                        {/* Search */}
                        <div className="flex gap-[6px]">
                            <div className="flex-1 relative">
                                <Search size={12} className="absolute left-[9px] top-[11px] text-[#94a3b8] pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="名前・住所で検索..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full h-[34px] border border-[#e2e8f0] rounded-[8px] pl-[30px] pr-[28px] text-[12px] text-[#0f172a] bg-[#f8fafc] outline-none focus:border-[#0067b8] focus:bg-white transition-all"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')}
                                        className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Panel List */}
                    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>

                        {/* Group 1: 地図表示済み */}
                        {sortedMappable.length > 0 && (
                            <div>
                                <div className="px-[14px] py-2 flex items-center justify-between sticky top-0 bg-white z-[1] border-b border-[#f1f5f9]">
                                    <div className="flex items-center gap-[5px] text-[10px] font-bold text-[#94a3b8] uppercase tracking-[.3px]">
                                        <span className="w-2 h-2 rounded-full bg-[#16a34a] inline-block shrink-0" />
                                        地図表示済み
                                    </div>
                                    <span className="text-[10px] text-[#94a3b8]">{sortedMappable.length}件</span>
                                </div>
                                {sortedMappable.map(loc => {
                                    const isActive = activeMarkerId === loc.id
                                    const days = loc.daysUntilExpiry
                                    const isUrgent = days != null && days <= 30
                                    const isWarn = days != null && days > 30 && days <= 60
                                    const isCompany = loc.type === 'company'
                                    return (
                                        <button
                                            key={loc.id}
                                            onClick={() => flyTo(loc)}
                                            className={`w-full flex items-center gap-[10px] px-[14px] py-[9px] border-b border-[#f1f5f9] transition-all text-left cursor-pointer ${isActive ? 'bg-[#e6f1fb] border-l-[3px] border-l-[#0067b8]' : 'hover:bg-[#f8fafc]'}`}
                                        >
                                            {/* Marker avatar */}
                                            <div className={`w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0 text-[11px] font-bold ${isUrgent ? 'bg-[#fee2e2] text-[#dc2626]' : isCompany ? 'bg-[#fef3c7] text-[#d97706]' : 'bg-[#e6f1fb] text-[#0067b8]'}`}>
                                                {initials(loc.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[12px] font-medium text-[#0f172a] truncate">{loc.name}</div>
                                                <div className="text-[11px] text-[#94a3b8] truncate mt-[1px]">
                                                    {!isCompany && loc.companyName ? loc.companyName : (loc.address || '住所なし')}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-[3px] shrink-0 ml-1">
                                                {isCompany && loc.workerCount != null && loc.workerCount > 0 && (
                                                    <span className="text-[9px] px-[6px] py-[2px] rounded-[8px] font-semibold bg-[#dcfce7] text-[#16a34a] whitespace-nowrap">
                                                        {loc.workerCount}名在籍
                                                    </span>
                                                )}
                                                {isUrgent && days != null && (
                                                    <span className="text-[9px] px-[6px] py-[2px] rounded-[8px] font-semibold bg-[#fee2e2] text-[#dc2626] whitespace-nowrap">
                                                        {days}日後期限
                                                    </span>
                                                )}
                                                {isWarn && days != null && (
                                                    <span className="text-[9px] px-[6px] py-[2px] rounded-[8px] font-semibold bg-[#fef3c7] text-[#d97706] whitespace-nowrap">
                                                        {days}日後期限
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* Group 2: 座標未登録 */}
                        {sortedUnmapped.length > 0 && (
                            <div>
                                <div className="px-[14px] py-2 flex items-center justify-between sticky top-0 bg-white z-[1] border-b border-[#f1f5f9]">
                                    <div className="flex items-center gap-[5px] text-[10px] font-bold text-[#94a3b8] uppercase tracking-[.3px]">
                                        <span className="w-2 h-2 rounded-full bg-[#d97706] inline-block shrink-0" />
                                        座標未登録
                                    </div>
                                    <button onClick={() => setShowGeocodeModal(true)}
                                        className="text-[10px] text-[#0067b8] hover:underline cursor-pointer">
                                        {sortedUnmapped.length}件 一括変換
                                    </button>
                                </div>
                                {sortedUnmapped.map(loc => {
                                    const isCompany = loc.type === 'company'
                                    return (
                                        <div
                                            key={loc.id}
                                            className="flex items-center gap-[10px] px-[14px] py-[9px] border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-all"
                                        >
                                            {/* No-geo marker */}
                                            <div className={`w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0 text-[11px] font-bold bg-[#f1f5f9] text-[#94a3b8]`}>
                                                {initials(loc.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[12px] font-medium text-[#0f172a] truncate">{loc.name}</div>
                                                <div className="text-[11px] text-[#94a3b8] truncate mt-[1px]">
                                                    {!isCompany && loc.companyName ? loc.companyName : (loc.address || '住所なし')}
                                                </div>
                                            </div>
                                            <button onClick={() => setShowGeocodeModal(true)}
                                                className="text-[10px] text-[#d97706] whitespace-nowrap hover:underline shrink-0">
                                                座標登録 →
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {filteredMappable.length === 0 && filteredUnmapped.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-[#94a3b8]">
                                <Search size={24} className="mb-2" />
                                <p className="text-[11px]">該当する場所がありません</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══ MAP CONTAINER (flex-1) ══ */}
                <div className="flex-1 relative overflow-hidden">
                    <Map
                        mapId="KIKANCLOUD_MAP"
                        defaultCenter={defaultCenter}
                        defaultZoom={10}
                        gestureHandling="greedy"
                        disableDefaultUI
                        mapTypeId={mapType}
                        className="w-full h-full"
                    >
                        <MapPanner center={panTarget} />

                        {/* Map pins */}
                        {filteredMappable.map(loc => {
                            const isAlert = loc.daysUntilExpiry != null && loc.daysUntilExpiry <= 60
                            return (
                                <AdvancedMarker
                                    key={loc.id}
                                    position={{ lat: loc.latitude, lng: loc.longitude }}
                                    onClick={() => { setActiveMarkerId(loc.id); setPanTarget({ lat: loc.latitude, lng: loc.longitude }) }}
                                    zIndex={loc.type === 'company' ? 20 : isAlert ? 30 : 10}
                                >
                                    <LocationPin type={loc.type} isAlert={isAlert} isActive={activeMarkerId === loc.id} name={loc.name} />
                                </AdvancedMarker>
                            )
                        })}

                        {/* Info window */}
                        {activeMarkerId && (() => {
                            const loc = filteredMappable.find(l => l.id === activeMarkerId)
                            if (!loc) return null
                            const isAlert = loc.daysUntilExpiry != null && loc.daysUntilExpiry <= 60
                            const pinColor = isAlert ? '#dc2626' : loc.type === 'company' ? '#d97706' : '#0067b8'
                            return (
                                <InfoWindow
                                    position={{ lat: loc.latitude, lng: loc.longitude }}
                                    onCloseClick={() => { setActiveMarkerId(null); setPanTarget(null) }}
                                    headerDisabled
                                >
                                    <div className="p-[12px] min-w-[200px]">
                                        <div className="text-[13px] font-semibold text-[#0f172a] mb-1">{loc.name}</div>
                                        <div className="text-[11px] text-[#64748b] leading-[1.4] mb-2">{loc.address || '住所なし'}</div>
                                        {loc.type === 'company' && loc.workerCount != null && (
                                            <div className="flex items-center gap-[6px] text-[11px] text-[#64748b] mb-1">
                                                <User size={11} /> 在籍労働者 {loc.workerCount}名
                                            </div>
                                        )}
                                        {isAlert && loc.daysUntilExpiry != null && (
                                            <div className="flex items-center gap-[6px] text-[11px] text-[#dc2626] mb-1">
                                                <AlertTriangle size={11} /> ビザ期限 {loc.daysUntilExpiry}日後
                                            </div>
                                        )}
                                        <div className="flex gap-[5px] mt-2">
                                            <a
                                                href={`/${loc.type === 'company' ? 'companies' : 'workers'}/${loc.id}`}
                                                className="flex-1 h-[26px] rounded-[6px] bg-[#f1f5f9] text-[#475569] text-[11px] font-medium flex items-center justify-center hover:bg-[#e2e8f0] transition-colors"
                                            >
                                                詳細を見る
                                            </a>
                                        </div>
                                    </div>
                                </InfoWindow>
                            )
                        })()}
                    </Map>

                    {/* Geocoding progress overlay (top-left on map) */}
                    {isGeocoding && geocodeProgress && (
                        <div className="absolute top-3 left-3 bg-white rounded-[8px] px-[14px] py-[10px] shadow-[0_2px_8px_rgba(0,0,0,.15)] border border-[#d97706] flex items-center gap-[10px] z-[100] min-w-[240px]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                            <div className="flex-1">
                                <div className="text-[11px] text-[#d97706] mb-1">住所から座標を変換中...</div>
                                <div className="h-[4px] bg-[#e2e8f0] rounded-[2px] overflow-hidden">
                                    <div className="h-full bg-[#d97706] rounded-[2px] transition-all"
                                        style={{ width: `${(geocodeProgress.done / geocodeProgress.total) * 100}%` }} />
                                </div>
                            </div>
                            <div className="text-[11px] text-[#d97706] whitespace-nowrap font-medium">
                                {geocodeProgress.done} / {geocodeProgress.total}
                            </div>
                        </div>
                    )}

                    {/* Map type toggle bottom-right */}
                    <div className="absolute bottom-[50px] right-3 bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,.15)] border border-[#e2e8f0] flex overflow-hidden z-[100]">
                        {mapTypeLabels.map(({ key, label }) => (
                            <button key={key} onClick={() => setMapType(key)}
                                className={`px-3 py-[6px] text-[11px] transition-all ${mapType === key ? 'bg-[#0067b8] text-white' : 'bg-white text-[#475569] hover:bg-[#f8fafc]'}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Zoom controls top-right */}
                    <ZoomControls mappable={filteredMappable} />

                    {/* Attribution */}
                    <div className="absolute bottom-[6px] right-2 text-[10px] text-[#64748b] z-[100] pointer-events-none">
                        地図データ ©2026 Google
                    </div>
                </div>
            </div>
        </APIProvider>
    )
}
