'use client'
import { useState, useCallback } from 'react'
import { APIProvider, Map, AdvancedMarker, useMap, InfoWindow } from '@vis.gl/react-google-maps'
import {
    MapPin as MapPinIcon, Building2, User, Search, X,
    ChevronDown, Filter, Navigation, Layers,
    Eye, EyeOff, List, AlertTriangle, Loader2, RefreshCw
} from 'lucide-react'
import { useEffect } from 'react'

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
}

/** Only locations that have valid DB coordinates are renderable on map */
interface MappableLocation extends RawLocation {
    latitude: number
    longitude: number
}

interface FilterCompany { id: string; name: string }

// ── Layer config ─────────────────────────────────────────────────
const LAYER_CONFIG: Record<string, {
    label: string
    labelJa: string
    icon: React.ReactNode
    color: string
    bg: string
    pinColor: string
    ring: string
    textColor: string
    badgeBg: string
    badgeText: string
}> = {
    company: {
        label: 'Company',
        labelJa: '受入企業',
        icon: <Building2 size={13} />,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        pinColor: '#ca8a04',
        ring: 'ring-yellow-400',
        textColor: 'text-yellow-700',
        badgeBg: 'bg-yellow-100',
        badgeText: 'text-yellow-700',
    },
    worker: {
        label: 'Resident',
        labelJa: '対象者 (在留者)',
        icon: <User size={13} />,
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        pinColor: '#f97316',
        ring: 'ring-orange-400',
        textColor: 'text-orange-600',
        badgeBg: 'bg-orange-100',
        badgeText: 'text-orange-600',
    },
}

// ── Separate mappable from unmapped ──────────────────────────────
function partitionLocations(locs: RawLocation[]): {
    mappable: MappableLocation[]
    unmapped: RawLocation[]
} {
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

// ── Map panner ───────────────────────────────────────────────────
function MapPanner({ center }: { center: { lat: number; lng: number } | null }) {
    const map = useMap()
    useEffect(() => {
        if (map && center) {
            map.panTo(center)
            map.setZoom(15)
        }
    }, [map, center])
    return null
}

// ── Custom Map Pin ───────────────────────────────────────────────
function LocationPin({ type, isActive, label }: { type: LocationType; isActive: boolean; label?: string }) {
    const cfg = LAYER_CONFIG[type]
    const bgColor = cfg.pinColor
    return (
        <div
            className={`relative flex flex-col items-center transition-transform duration-150 ${isActive ? 'scale-125 z-50' : 'hover:scale-110'}`}
            style={{ filter: isActive ? `drop-shadow(0 4px 6px ${bgColor}88)` : undefined }}
        >
            <div
                className={`flex items-center justify-center rounded-full border-2 border-white text-white font-bold shadow-lg cursor-pointer
                    ${type === 'company' ? 'w-6 h-6' : 'w-5 h-5'}`}
                style={{ backgroundColor: bgColor }}
            >
                {type === 'company' ? <Building2 size={10} /> : <User size={9} />}
            </div>
            {/* Needle */}
            <div
                className="w-0 h-0"
                style={{
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: `6px solid ${bgColor}`,
                    marginTop: '-1px',
                }}
            />
            {/* Label bubble (only on active) */}
            {isActive && label && (
                <div
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 rounded-xl px-2.5 py-1 text-[11px] font-bold text-white whitespace-nowrap shadow-xl"
                    style={{ backgroundColor: bgColor }}
                >
                    {label}
                </div>
            )}
        </div>
    )
}

// ── Main component ───────────────────────────────────────────────
export default function RoutingClient({ initialLocations, filterCompanies, googleMapsKey }: {
    initialLocations: RawLocation[]
    filterCompanies: FilterCompany[]
    googleMapsKey: string
}) {
    // Partition ONCE at mount — no runtime geocoding
    const { mappable, unmapped } = partitionLocations(initialLocations)

    // Layers visibility
    const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({
        company: true, worker: true
    })

    // Filter state
    const [companyFilter, setCompanyFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Map state
    const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null)
    const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    // Backfill state
    const [isBackfilling, setIsBackfilling] = useState(false)
    const [backfillResult, setBackfillResult] = useState<string | null>(null)

    const handleBackfill = async () => {
        setIsBackfilling(true)
        setBackfillResult(null)
        try {
            // Last 12 chars of the public anon key — simple shared secret for this internal route
            const token = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').slice(-12)
            const res = await fetch('/api/geocode-backfill', {
                method: 'POST',
                headers: { 'x-backfill-secret': token }
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'エラー')
            setBackfillResult(
                `完了！企業 ${json.companies.updated}件・実習生 ${json.workers.updated}件 của tọa độ đã được đăng ký. Đang tải lại trang...`
            )
            setTimeout(() => window.location.reload(), 1500)
        } catch (e: unknown) {
            setBackfillResult(`エラー: ${e instanceof Error ? e.message : '不明'}`)
        } finally {
            setIsBackfilling(false)
        }
    }

    const defaultCenter = mappable.length > 0
        ? { lat: mappable[0].latitude, lng: mappable[0].longitude }
        : { lat: 34.5733, lng: 135.4814 }

    const flyTo = useCallback((loc: MappableLocation) => {
        setPanTarget({ lat: loc.latitude, lng: loc.longitude })
        setActiveMarkerId(loc.id)
    }, [])

    const toggleLayer = (type: LocationType) => {
        setVisibleLayers(prev => ({ ...prev, [type]: !prev[type] }))
    }

    // ── Filter helpers ───────────────────────────────────────────
    const applyFilters = (locs: RawLocation[]) => locs.filter(loc => {
        if (!visibleLayers[loc.type]) return false
        if (companyFilter !== 'all') {
            if (loc.type === 'company' && loc.id !== companyFilter) return false
            if (loc.type === 'worker' && loc.companyId !== companyFilter) return false
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            if (!loc.name.toLowerCase().includes(q) && !(loc.address ?? '').toLowerCase().includes(q)) return false
        }
        return true
    })

    const filteredMappable = applyFilters(mappable) as MappableLocation[]
    const filteredUnmapped = applyFilters(unmapped)

    // Counts (all, not just filtered)
    const counts = {
        company: initialLocations.filter(l => l.type === 'company').length,
        worker: initialLocations.filter(l => l.type === 'worker').length,
    }
    const unmappedCount = unmapped.length
    // True if any workers exist but have no coords yet (just added columns back)
    const hasWorkersWithNoCoords = initialLocations.some(l => l.type === 'worker' && (l.latitude === null || l.longitude === null))

    if (!googleMapsKey) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 p-6">
                <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <MapPinIcon size={40} className="mx-auto text-slate-300 mb-4" />
                    <h2 className="text-base font-bold text-slate-800 mb-2">Google Maps Key Missing</h2>
                    <p className="text-[13px] text-slate-500">
                        <code className="bg-slate-50 px-1.5 py-0.5 rounded text-red-500 border border-slate-200 text-[11px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> を .env.local に追加してください。
                    </p>
                </div>
            </div>
        )
    }

    return (
        <APIProvider apiKey={googleMapsKey}>
            {/* ── Full layout ── */}
            <div className="flex h-[calc(100vh-56px)] w-full overflow-hidden relative">

                {/* ══════════════ SIDEBAR ══════════════ */}
                <div className={`
                    flex flex-col bg-white border-r border-slate-200 h-full z-20 shadow-lg
                    transition-all duration-300 ease-in-out shrink-0
                    ${isSidebarOpen ? 'w-[340px]' : 'w-0 overflow-hidden border-r-0'}
                `}>
                    {/* Sidebar header */}
                    <div className="px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                                    <Layers size={13} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-[13px] font-black text-slate-800 tracking-tight">位置情報マップ</h2>
                                    <p className="text-[10px] text-slate-400 leading-none mt-0.5">Location Overview</p>
                                </div>
                            </div>
                        </div>

                        {/* Layer toggles */}
                        <div className="flex gap-1.5 flex-wrap">
                            {(Object.keys(LAYER_CONFIG) as LocationType[]).map(type => {
                                const cfg = LAYER_CONFIG[type]
                                const on = visibleLayers[type]
                                return (
                                    <button
                                        key={type}
                                        onClick={() => toggleLayer(type)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all
                                            ${on ? `${cfg.badgeBg} ${cfg.badgeText} border-transparent` : 'bg-white text-slate-400 border-slate-200 opacity-60'}`}
                                    >
                                        {cfg.icon}
                                        {cfg.labelJa}
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${on ? 'bg-white/60' : 'bg-slate-100'}`}>
                                            {counts[type]}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Search + filter */}
                    <div className="px-3 py-2.5 border-b border-slate-100 space-y-2 shrink-0">
                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="名前・住所で検索..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-7 py-2 text-[12px] outline-none focus:border-slate-400 focus:bg-white transition-all"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Company filter */}
                        <div className="relative">
                            <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                value={companyFilter}
                                onChange={e => setCompanyFilter(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-7 py-2 text-[12px] font-medium text-slate-700 outline-none appearance-none cursor-pointer focus:border-slate-400 focus:bg-white transition-all"
                            >
                                <option value="all">🏭 全ての受入企業</option>
                                <optgroup label="受入企業で絞り込む">
                                    {filterCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </optgroup>
                            </select>
                            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Result count */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                                <span className="font-bold text-slate-600">{filteredMappable.length}</span> 件表示中
                                {unmappedCount > 0 && (
                                    <span className="ml-2 text-amber-500 font-bold">({unmappedCount} 件 座標未登録)</span>
                                )}
                            </span>
                            {(searchQuery || companyFilter !== 'all') && (
                                <button
                                    onClick={() => { setSearchQuery(''); setCompanyFilter('all') }}
                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                                >
                                    <X size={9} /> クリア
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Backfill banner: always show if any worker has no coords ── */}
                    {(unmappedCount > 0 || hasWorkersWithNoCoords) && (
                        <div className="mx-3 my-2 p-3 bg-amber-50 border border-amber-200 rounded-xl shrink-0">
                            <div className="flex items-start gap-2 mb-2">
                                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] font-black text-amber-700">
                                        {unmappedCount > 0 ? `${unmappedCount} 件が地図に未表示` : `対象者の座標を登録してください`}
                                    </p>
                                    <p className="text-[10px] text-amber-600 mt-0.5 leading-snug">
                                        住所から座標を自動取得してマップに表示します。
                                    </p>
                                </div>
                            </div>
                            {backfillResult ? (
                                <p className={`text-[10px] font-bold px-2 py-1.5 rounded-lg ${backfillResult.startsWith('エラー') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                                    {backfillResult}
                                </p>
                            ) : (
                                <button
                                    onClick={handleBackfill}
                                    disabled={isBackfilling}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] font-black rounded-lg transition-colors"
                                >
                                    {isBackfilling ? (
                                        <><Loader2 size={11} className="animate-spin" /> 座標を取得中...</>
                                    ) : (
                                        <><RefreshCw size={11} /> 座標を一括登録（住所→地図）</>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {/* List */}
                    <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2" style={{ scrollbarWidth: 'thin' }}>
                        {filteredMappable.length === 0 && filteredUnmapped.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                                <Search size={24} className="mb-2" />
                                <p className="text-[11px]">該当する場所がありません</p>
                            </div>
                        )}

                        {/* Group mappable by type */}
                        {(Object.keys(LAYER_CONFIG) as LocationType[]).map(type => {
                            if (!visibleLayers[type]) return null
                            const group = filteredMappable.filter(l => l.type === type)
                            if (group.length === 0) return null
                            const cfg = LAYER_CONFIG[type]
                            return (
                                <div key={type}>
                                    <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg mx-0.5 mb-0.5 ${cfg.badgeBg}`}>
                                        <span className={cfg.badgeText}>{cfg.icon}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${cfg.badgeText}`}>{cfg.labelJa}</span>
                                        <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/70 ${cfg.textColor}`}>{group.length}</span>
                                    </div>
                                    {group.map(loc => {
                                        const isActive = activeMarkerId === loc.id
                                        return (
                                            <button
                                                key={loc.id}
                                                className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 group mb-0.5
                                                    ${isActive
                                                        ? `${cfg.badgeBg} ring-1 ${cfg.ring}`
                                                        : 'hover:bg-slate-50 cursor-pointer'
                                                    }`}
                                                onClick={() => flyTo(loc)}
                                            >
                                                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5
                                                    ${isActive ? cfg.badgeBg : 'bg-slate-100 group-hover:' + cfg.bg}`}
                                                    style={{ color: cfg.pinColor }}
                                                >
                                                    {cfg.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-[12px] font-bold truncate ${isActive ? cfg.textColor : 'text-slate-800'}`}>
                                                        {loc.name}
                                                        {loc.badge && (
                                                            <span className={`ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md
                                                                ${loc.badge === '対応中'
                                                                    ? 'bg-amber-100 text-amber-600'
                                                                    : loc.badge === '未入国'
                                                                        ? 'bg-blue-100 text-blue-600'
                                                                        : 'bg-emerald-100 text-emerald-600'}`}>
                                                                {loc.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 truncate mt-0.5 leading-snug">
                                                        {loc.address || '住所なし'}
                                                    </div>
                                                    {loc.companyName && loc.type === 'worker' && (
                                                        <div className={`text-[9px] font-bold mt-0.5 ${isActive ? cfg.textColor : 'text-slate-300'}`}>
                                                            {loc.companyName}
                                                        </div>
                                                    )}
                                                </div>
                                                <Navigation
                                                    size={12}
                                                    className={`shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${cfg.color}`}
                                                />
                                            </button>
                                        )
                                    })}
                                    <div className="h-2" />
                                </div>
                            )
                        })}

                        {/* Unmapped section — shown but not clickable on map */}
                        {filteredUnmapped.length > 0 && (
                            <div>
                                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg mx-0.5 mb-0.5 bg-amber-50">
                                    <AlertTriangle size={11} className="text-amber-500" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">座標未登録</span>
                                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/70 text-amber-600">{filteredUnmapped.length}</span>
                                </div>
                                {filteredUnmapped.map(loc => {
                                    const cfg = LAYER_CONFIG[loc.type]
                                    return (
                                        <div
                                            key={loc.id}
                                            className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl opacity-50 mb-0.5"
                                            title="企業フォームで住所を保存すると座標が自動登録されます"
                                        >
                                            <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 bg-amber-50"
                                                style={{ color: cfg.pinColor }}
                                            >
                                                {cfg.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[12px] font-bold truncate text-slate-600">{loc.name}</div>
                                                <div className="text-[10px] text-slate-400 truncate mt-0.5">{loc.address || '住所なし'}</div>
                                                <div className="text-[9px] font-bold text-amber-500 mt-0.5 flex items-center gap-1">
                                                    <AlertTriangle size={8} /> 地図未表示（座標未登録）
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div className="h-2" />
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════════ MAP ══════════════ */}
                <div className="flex-1 h-full relative bg-slate-200">
                    <Map
                        mapId="KIKANCLOUD_MAP"
                        defaultCenter={defaultCenter}
                        defaultZoom={10}
                        gestureHandling="greedy"
                        disableDefaultUI={false}
                        mapTypeControl={false}
                        streetViewControl={false}
                        fullscreenControl={false}
                        zoomControl={true}
                        className="w-full h-full"
                    >
                        <MapPanner center={panTarget} />

                        {/* Markers — ONLY pre-stored coordinates from DB */}
                        {filteredMappable
                            .filter(l => visibleLayers[l.type])
                            .map(loc => (
                                <AdvancedMarker
                                    key={loc.id}
                                    position={{ lat: loc.latitude, lng: loc.longitude }}
                                    onClick={() => {
                                        setActiveMarkerId(loc.id)
                                        setPanTarget({ lat: loc.latitude, lng: loc.longitude })
                                    }}
                                    zIndex={loc.type === 'company' ? 20 : 10}
                                >
                                    <LocationPin
                                        type={loc.type}
                                        isActive={activeMarkerId === loc.id}
                                        label={loc.name}
                                    />
                                </AdvancedMarker>
                            ))}

                        {/* Info window */}
                        {activeMarkerId && (() => {
                            const loc = filteredMappable.find(l => l.id === activeMarkerId)
                            if (!loc) return null
                            const cfg = LAYER_CONFIG[loc.type]
                            return (
                                <InfoWindow
                                    position={{ lat: loc.latitude, lng: loc.longitude }}
                                    onCloseClick={() => { setActiveMarkerId(null); setPanTarget(null) }}
                                    headerDisabled
                                >
                                    <div className="p-2.5 min-w-[220px] max-w-[280px]">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: cfg.pinColor + '20', color: cfg.pinColor }}
                                            >
                                                {cfg.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-[11px] font-black uppercase tracking-wider ${cfg.textColor}`}>{cfg.labelJa}</div>
                                                <h3 className="font-bold text-[13px] text-slate-800 leading-tight truncate">{loc.name}</h3>
                                            </div>
                                        </div>
                                        {loc.companyName && loc.type === 'worker' && (
                                            <p className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                                                <Building2 size={9} /> {loc.companyName}
                                            </p>
                                        )}
                                        <p className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-1.5">
                                            <MapPinIcon size={11} className="shrink-0 mt-0.5 text-slate-400" />
                                            {loc.address || '住所なし'}
                                        </p>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address || loc.name)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold text-white transition-colors"
                                            style={{ backgroundColor: cfg.pinColor }}
                                        >
                                            <Navigation size={11} /> Googleマップで開く
                                        </a>
                                    </div>
                                </InfoWindow>
                            )
                        })()}
                    </Map>

                    {/* ── Sidebar toggle button ── */}
                    <button
                        onClick={() => setIsSidebarOpen(v => !v)}
                        className="absolute top-3 left-3 z-30 w-9 h-9 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all"
                        title={isSidebarOpen ? 'サイドバーを隠す' : 'サイドバーを表示'}
                    >
                        <List size={16} />
                    </button>


                    {/* Powered by */}
                    <div className="absolute bottom-6 right-3 z-20 bg-white/90 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-xl pointer-events-none shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Navigation size={11} className="text-blue-500" /> Powered by Google Maps
                        </p>
                    </div>
                </div>
            </div>
        </APIProvider>
    )
}