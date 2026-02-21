'use client'
import { useState, useTransition, useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { Sparkles, MapPin, Building2, User, Loader2, Navigation, Clock, CheckCircle2, Coffee } from 'lucide-react'
import { optimizeRouteWithAI } from '../actions/routeAi'

// Component vẽ đường đi (Directions)
function DirectionsRendererComponent({ itinerary, locations }: { itinerary: any[], locations: any[] }) {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

    useEffect(() => {
        if (!routesLibrary || !map) return;
        setDirectionsService(new routesLibrary.DirectionsService());
        const renderer = new routesLibrary.DirectionsRenderer({ map, suppressMarkers: true, polylineOptions: { strokeColor: '#24b47e', strokeWeight: 5, strokeOpacity: 0.8 } });
        setDirectionsRenderer(renderer);
        return () => renderer.setMap(null);
    }, [routesLibrary, map]);

    useEffect(() => {
        if (!directionsService || !directionsRenderer || itinerary.length < 2) return;

        // Lọc ra các điểm dừng hợp lệ có trong locations (Bỏ qua điểm nghỉ trưa nếu ID không map)
        const sortedLocs = itinerary.map(item => locations.find(l => l.id === item.id)).filter(Boolean);
        if (sortedLocs.length < 2) return;

        const origin = { lat: sortedLocs[0].latitude, lng: sortedLocs[0].longitude };
        const destination = { lat: sortedLocs[sortedLocs.length - 1].latitude, lng: sortedLocs[sortedLocs.length - 1].longitude };

        // Các điểm ở giữa
        const waypoints = sortedLocs.slice(1, -1).map(loc => ({ location: { lat: loc.latitude, lng: loc.longitude }, stopover: true }));

        directionsService.route({ origin, destination, waypoints, travelMode: google.maps.TravelMode.DRIVING })
            .then(response => directionsRenderer.setDirections(response))
            .catch(e => console.error('Directions request failed', e));
    }, [directionsService, directionsRenderer, itinerary, locations]);

    return null;
}

export default function RoutingClient({ initialLocations, googleMapsKey }: { initialLocations: any[], googleMapsKey: string }) {
    const [selectedIds, setSelectedIds] = useState<string[]>(initialLocations.map(l => l.id)); // Default chọn tất
    const [aiData, setAiData] = useState<any>(null);
    const [isPending, startTransition] = useTransition();

    const handleOptimize = () => {
        const locsToVisit = initialLocations.filter(l => selectedIds.includes(l.id));
        if (locsToVisit.length < 2) return alert('ルートを作成するには、少なくとも2つの場所を選択してください。(Select at least 2 locations)');

        startTransition(async () => {
            const res = await optimizeRouteWithAI(locsToVisit);
            if (res.success && res.data) setAiData(res.data);
            else alert('AI Error: ' + res.error);
        });
    };

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id));
        else setSelectedIds(prev => [...prev, id]);
    }

    if (!googleMapsKey) {
        return (
            <div className="h-full flex items-center justify-center bg-[#fbfcfd] p-6">
                <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-[#ededed] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#d93025]"></div>
                    <MapPin size={48} className="mx-auto text-[#878787] mb-4" />
                    <h2 className="text-lg font-bold text-[#1f1f1f] mb-2">Google Maps Key Missing</h2>
                    <p className="text-[13px] text-[#666666] leading-relaxed">Please add <code className="bg-[#fbfcfd] px-1.5 py-0.5 rounded text-[#d93025] border border-[#ededed]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your .env.local file to enable the interactive map & AI Routing.</p>
                </div>
            </div>
        )
    }

    // Tọa độ trung tâm (Sakai, Osaka)
    const center = initialLocations[0] ? { lat: initialLocations[0].latitude, lng: initialLocations[0].longitude } : { lat: 34.5733, lng: 135.4814 };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-56px)] w-full overflow-hidden">
            {/* KHỐI TRÁI: AI ROUTE PLANNER */}
            <div className="w-full md:w-[400px] bg-white border-r border-[#ededed] flex flex-col h-[50vh] md:h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0">
                <div className="p-6 border-b border-[#ededed] bg-[#fbfcfd] shrink-0">
                    <h2 className="text-[18px] font-black text-[#1f1f1f] flex items-center gap-2 tracking-tight mb-2"><Sparkles size={18} className="text-[#24b47e]" /> 巡回ルート最適化 (Route Planner)</h2>
                    <p className="text-[12px] text-[#878787]">AIが訪問先を分析し、最も効率的な監査ルートとスケジュールを自動生成します。</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!aiData ? (
                        <div className="animate-in fade-in duration-300 h-full flex flex-col">
                            <h3 className="text-[11px] font-bold text-[#878787] uppercase tracking-widest mb-3 flex items-center justify-between">
                                訪問先を選択
                                <span className="text-[10px] bg-[#24b47e]/10 text-[#24b47e] px-2 py-0.5 rounded">{selectedIds.length} Selected</span>
                            </h3>
                            <div className="space-y-2 flex-1 overflow-y-auto pr-2 mb-4">
                                {initialLocations.map(loc => (
                                    <label key={loc.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedIds.includes(loc.id) ? 'bg-[#fbfcfd] border-[#24b47e]/50 shadow-sm' : 'bg-white border-[#ededed] hover:border-[#878787]'}`}>
                                        <input type="checkbox" checked={selectedIds.includes(loc.id)} onChange={() => toggleSelection(loc.id)} className="mt-1 accent-[#24b47e]" />
                                        <div>
                                            <div className="text-[13px] font-bold text-[#1f1f1f] flex items-center gap-1.5">
                                                {loc.type === 'company' || loc.type === 'office' ? <Building2 size={14} className="text-[#878787]" /> : <User size={14} className="text-[#878787]" />} {loc.name}
                                            </div>
                                            <div className="text-[11px] text-[#878787] mt-0.5 truncate max-w-[240px]">{loc.address}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <button onClick={handleOptimize} disabled={isPending || selectedIds.length < 2} className="w-full flex justify-center items-center gap-2 py-3 bg-[#1f1f1f] hover:bg-[#333] disabled:opacity-50 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm shrink-0">
                                {isPending ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />} {isPending ? 'AIが計算中...' : '最適化スタート (Optimize Route)'}
                            </button>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-[#e8f5e9] border border-[#24b47e]/20 rounded-xl p-4 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#24b47e]"></div>
                                <h4 className="text-[12px] font-bold text-[#1e8e3e] uppercase tracking-widest mb-1">AI INSIGHT</h4>
                                <p className="text-[13px] text-[#1f1f1f] font-medium leading-relaxed">{aiData.summary}</p>
                                <p className="text-[11px] text-[#878787] mt-2 font-mono">Total Time: {aiData.total_time}</p>
                            </div>

                            <h3 className="text-[11px] font-bold text-[#878787] uppercase tracking-widest mb-4 flex items-center gap-1.5"><Clock size={14} className="text-[#24b47e]" /> AI Schedule</h3>
                            <div className="space-y-4 relative">
                                <div className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-[#ededed] -z-10"></div>
                                {aiData.itinerary.map((step: any, idx: number) => (
                                    <div key={idx} className="relative pl-6">
                                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-2 border-[#24b47e] flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-[#24b47e]"></div></div>
                                        <div className={`bg-white border p-3 rounded-lg shadow-sm transition-colors ${step.type === 'break' ? 'border-orange-200 bg-orange-50/50' : 'border-[#ededed] hover:border-[#24b47e]'}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[13px] font-bold text-[#1f1f1f] flex items-center gap-1.5">
                                                    {step.type === 'break' ? <Coffee size={14} className="text-orange-500" /> : null} {step.name}
                                                </span>
                                                <span className="text-[10px] font-mono font-bold text-[#878787] bg-[#fbfcfd] border border-[#ededed] px-1.5 py-0.5 rounded">{step.arrivalTime} - {step.departureTime}</span>
                                            </div>
                                            {step.notes && <p className="text-[11px] text-[#666666] leading-relaxed flex items-start gap-1 mt-2"><CheckCircle2 size={12} className="text-[#24b47e] shrink-0 mt-0.5" /> {step.notes}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-4 border-t border-[#ededed]">
                                <button onClick={() => setAiData(null)} className="w-full text-center text-[12px] font-bold text-[#878787] hover:text-[#1f1f1f] py-2 transition-colors">← 再設定 (Reset Planner)</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* KHỐI PHẢI: GOOGLE MAPS & POLYLINE */}
            <div className="flex-1 h-[50vh] md:h-full relative bg-[#e5e3df]">
                <APIProvider apiKey={googleMapsKey}>
                    <Map mapId="KIKANCLOUD_MAP" defaultCenter={center} defaultZoom={12} gestureHandling={'greedy'} disableDefaultUI={true} className="w-full h-full">

                        {/* Vẽ các Pin lên bản đồ */}
                        {initialLocations.filter(l => selectedIds.includes(l.id)).map((loc, index) => {
                            // Lấy số thứ tự hiển thị từ AI nếu có (bỏ qua break)
                            const itinIndex = aiData ? aiData.itinerary.filter((i: any) => i.type !== 'break').findIndex((i: any) => i.id === loc.id) : index;
                            const badgeNum = itinIndex !== -1 ? itinIndex + 1 : index + 1;
                            const isCompany = loc.type === 'company' || loc.type === 'office';

                            return (
                                <AdvancedMarker key={loc.id} position={{ lat: loc.latitude, lng: loc.longitude }}>
                                    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-white text-white font-bold text-xs cursor-pointer transform hover:scale-110 transition-transform ${isCompany ? 'bg-[#1f1f1f]' : 'bg-[#24b47e]'}`}>
                                        {badgeNum}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r-2 border-b-2 border-white" style={{ backgroundColor: isCompany ? '#1f1f1f' : '#24b47e' }}></div>
                                    </div>
                                </AdvancedMarker>
                            )
                        })}

                        {/* Khi AI trả về lộ trình, gọi Directions API vẽ đường Polyline */}
                        {aiData && <DirectionsRendererComponent itinerary={aiData.itinerary.filter((i: any) => i.type !== 'break')} locations={initialLocations} />}
                    </Map>
                </APIProvider>

                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-[#ededed] px-3 py-1.5 rounded-md shadow-sm pointer-events-none">
                    <p className="text-[10px] font-bold text-[#878787] uppercase tracking-widest flex items-center gap-1.5"><Navigation size={12} className="text-[#4285F4]" /> Powered by Google Maps</p>
                </div>
            </div>
        </div>
    )
}
