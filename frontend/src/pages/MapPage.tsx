import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// Fix Leaflet default markers in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const potholeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

interface Detection {
  bbox: number[];
  confidence: number;
}

interface MongoPothole {
  _id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  severity: "Critical" | "High" | "Normal";
  timestamp: string;
  detections: Detection[];
}

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || points.length === 0) return;
    // @ts-ignore
    const heat = L.heatLayer(points, {
      radius: 35, blur: 25, maxZoom: 17,
      gradient: { 0.4: "#6c1ecd", 0.65: "#d6baff", 0.85: "#ffb4ab", 1.0: "#93000a" },
    }).addTo(map);
    return () => { map.removeLayer(heat); };
  }, [map, points]);
  return null;
}

function getSeverityStyle(sev: string) {
  switch (sev) {
    case "Critical": return { text: "text-[#ffb4ab]", border: "border-[#ffb4ab]/30", bg: "bg-[#93000a]/20", dot: "bg-[#ffb4ab]" };
    case "High":     return { text: "text-primary", border: "border-primary/30", bg: "bg-primary/20", dot: "bg-primary" };
    default:         return { text: "text-emerald-400", border: "border-emerald-400/30", bg: "bg-emerald-400/10", dot: "bg-emerald-400" };
  }
}

const formatDateIST = (dateStr: string) => {
  const date = new Date(dateStr);
  const timeStr = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date).toUpperCase();
  const dateStrFormatted = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
  }).format(date);
  return `${timeStr}, ${dateStrFormatted}`;
};

function MapSyncHandler({ selected, potholes }: { selected: string | null, potholes: MongoPothole[] }) {
  const map = useMap();
  useEffect(() => {
    if (selected) {
      const pothole = potholes.find(p => p._id === selected);
      if (pothole) {
        map.flyTo([pothole.latitude, pothole.longitude], 18, { animate: true, duration: 1.5 });
      }
    }
  }, [selected, potholes, map]);
  return null;
}

function PotholeMarker({ p, isSelected }: { p: MongoPothole, isSelected: boolean }) {
  const markerRef = useRef<L.Marker>(null);
  
  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  return (
    <Marker ref={markerRef} position={[p.latitude, p.longitude]} icon={potholeIcon}>
      <Popup className="custom-popup">
        <div className="p-1 space-y-2 min-w-[140px]">
          <img src={p.image_url} alt="Detection" className="w-full h-20 object-cover rounded-lg shadow" loading="lazy" />
          <div className={`text-xs font-bold ${getSeverityStyle(p.severity).text}`}>{p.severity} Severity</div>
          <div className="text-[10px] text-gray-500">{formatDateIST(p.timestamp)}</div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapPage() {
  const [potholes, setPotholes] = useState<MongoPothole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [modalPothole, setModalPothole] = useState<MongoPothole | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/potholes?limit=50`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      if (json.success) setPotholes(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect to Infrastructure Grid.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, retryCount]);

  const heatPoints: [number, number, number][] = potholes.map((p) => [
    p.latitude,
    p.longitude,
    p.severity === "Critical" ? 50 : p.severity === "High" ? 35 : 20,
  ]);

  const criticalCount = potholes.filter((p) => p.severity === "Critical").length;
  const highCount = potholes.filter((p) => p.severity === "High").length;

  const handleLogClick = (p: MongoPothole) => {
    setSelected(p._id);
    setModalPothole(p);
  };

  return (
    <main className="md:h-[calc(100vh-72px)] flex flex-col bg-[#08080A] md:overflow-hidden pt-[72px]">
      {/* ── Topbar ── */}
      <div className="px-6 md:px-8 py-3 bg-[#0D0D0F]/95 backdrop-blur-xl z-10 border-b border-outline-variant/10 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div>
          <h1 className="text-base font-headline font-bold text-[#E5E1E4] flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
            Infrastructure Intelligence Grid
          </h1>
          <p className="text-on-surface-variant/50 text-[10px] uppercase tracking-widest font-label mt-0.5">
            Active Monitoring Nodes — Global Live Stream
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Stats pills */}
          {!loading && !error && (
            <>
              {criticalCount > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#ffb4ab] bg-[#93000a]/20 border border-[#ffb4ab]/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
                  {criticalCount} Critical
                </div>
              )}
              {highCount > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {highCount} High
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {potholes.length} Total Logged
              </div>
            </>
          )}

          {/* Refresh */}
          <button
            id="refresh-map-btn"
            onClick={() => setRetryCount((c) => c + 1)}
            disabled={loading}
            className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant/60 hover:text-on-surface hover:border-primary/40 transition-all disabled:opacity-40"
            title="Refresh data"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? "animate-spin" : ""}`}>refresh</span>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col md:flex-row relative z-0 md:min-h-0">

        {/* ── Map ── */}
        <div className="w-full h-[50vh] md:h-full md:flex-1 relative border-b md:border-b-0 md:border-r border-outline-variant/10">
          {!loading && (
            <MapContainer
              center={[26.4499, 80.3319]}
              zoom={13}
              className="w-full h-full absolute inset-0"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <MapSyncHandler selected={selected} potholes={potholes} />
              <HeatmapLayer points={heatPoints} />
              {potholes.map((p) => (
                <PotholeMarker key={p._id} p={p} isSelected={selected === p._id} />
              ))}
            </MapContainer>
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#08080A]">
              <div className="space-y-3 text-center">
                <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-on-surface-variant/50 text-xs uppercase tracking-widest">Loading Grid...</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar Feed ── */}
        <div className="w-full md:w-[380px] bg-[#0c0c0e] flex flex-col md:overflow-y-auto shrink-0 z-10">
          <div className="p-5 border-b border-outline-variant/5 sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-md z-10">
            <h2 className="font-headline font-bold text-base text-[#E5E1E4] flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">database</span>
              Neural Log Registry
              {!loading && potholes.length > 0 && (
                <span className="ml-auto text-[10px] bg-surface-container border border-outline-variant/20 px-2 py-0.5 rounded-full text-on-surface-variant/50 font-label">
                  {potholes.length} records
                </span>
              )}
            </h2>
          </div>

          <div className="p-4 space-y-2.5 flex-1 shadow-inner">
            <AnimatePresence>
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse bg-surface-container-low rounded-2xl h-[88px]" />
                ))
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4 text-center"
                >
                  <span className="material-symbols-outlined text-5xl text-error/60">cloud_off</span>
                  <p className="text-xs font-bold text-error/80 uppercase tracking-widest">{error}</p>
                  <button
                    onClick={() => setRetryCount((c) => c + 1)}
                    className="px-4 py-2 text-xs font-bold btn-gradient rounded-lg text-[#0D0D0F]"
                  >
                    Retry Connection
                  </button>
                </motion.div>
              ) : potholes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant/40"
                >
                  <span className="material-symbols-outlined text-5xl">info</span>
                  <p className="text-xs">No hazards logged in the current grid.</p>
                </motion.div>
              ) : (
                potholes.map((p, i) => {
                  const s = getSeverityStyle(p.severity);
                  const isSelected = selected === p._id;
                  return (
                    <motion.div
                      key={p._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                      onClick={() => handleLogClick(p)}
                      className={`glass-panel p-3 rounded-2xl border transition-all cursor-pointer group flex gap-3 relative ${
                        isSelected ? `${s.border} ${s.bg}` : "border-outline-variant/10 hover:border-primary/30"
                      }`}
                    >
                      {/* Active Indicator Line */}
                      {isSelected && (
                        <motion.div layoutId="activeLog" className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl shadow-[0_0_8px_rgba(var(--color-primary),0.8)]" />
                      )}
                      {/* Thumbnail */}
                      <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 border border-outline-variant/20">
                        <img
                          src={p.image_url}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt="Pothole detection"
                          loading="lazy"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className={`text-[8px] uppercase tracking-tight font-bold px-1.5 py-0.5 rounded border ${s.text} ${s.border} ${s.bg} flex items-center gap-1`}>
                            <span className={`w-1 h-1 rounded-full ${s.dot}`} />
                            {p.severity}
                          </span>
                          <span className="text-[9px] text-on-surface-variant/60 font-semibold" title={formatDistanceToNow(new Date(p.timestamp), { addSuffix: true })}>
                            {formatDateIST(p.timestamp)}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-on-surface-variant/60 flex items-center gap-0.5 mt-1">
                          <span className="material-symbols-outlined text-[10px]">location_on</span>
                          {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] text-on-surface-variant/40 font-mono">
                            ID: {p._id.slice(-6).toUpperCase()}
                          </span>
                          <div className="flex gap-0.5 ml-auto">
                            {p.detections.slice(0, 5).map((_, j) => (
                              <div key={j} className={`w-1.5 h-1.5 rounded-full ${s.dot} opacity-60`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Modal for Deep Linking ── */}
      <AnimatePresence>
        {modalPothole && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#08080A]/60 p-4 sm:p-6 md:p-12"
            onClick={() => setModalPothole(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              className="bg-[#0C0C0E] border border-outline-variant/20 rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl flex flex-col md:flex-row relative"
              onClick={(e) => e.stopPropagation()} // stop close on inner click
            >
              {/* Close Button */}
              <button 
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white backdrop-blur-md transition-all"
                onClick={() => {
                  setModalPothole(null);
                  setIsZoomed(false);
                }}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>

              {/* Image Section */}
              <div 
                className="w-full md:w-[60%] lg:w-[65%] h-[40vh] md:h-[70vh] bg-black relative cursor-zoom-in overflow-hidden group"
                onClick={() => setIsZoomed(!isZoomed)}
              >
                <motion.img 
                  animate={{ scale: isZoomed ? 1.5 : 1 }}
                  transition={{ type: "tween", duration: 0.4 }}
                  src={modalPothole.image_url} 
                  alt="Pothole" 
                  className={`w-full h-full object-contain ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                />
                {!isZoomed && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/20">
                    <span className="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 backdrop-blur-md">
                      <span className="material-symbols-outlined text-lg">zoom_in</span>
                      Click to Zoom
                    </span>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary">analytics</span>
                      <h3 className="text-sm font-bold text-on-surface-variant/80 uppercase tracking-widest font-label">Hazard Log</h3>
                    </div>
                    <h2 className="text-3xl font-headline font-bold text-[#E5E1E4]">Detection Details</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Severity */}
                    <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
                      <div className="text-xs text-on-surface-variant/50 uppercase tracking-wider mb-1">Assigned Severity</div>
                      <div className="text-lg font-bold flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${getSeverityStyle(modalPothole.severity).dot} animate-pulse`} />
                        <span className={getSeverityStyle(modalPothole.severity).text}>{modalPothole.severity}</span>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
                      <div className="text-xs text-on-surface-variant/50 uppercase tracking-wider mb-1">Timestamp (IST)</div>
                      <div className="text-base font-medium text-[#E5E1E4] flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-on-surface-variant/60">schedule</span>
                        {formatDateIST(modalPothole.timestamp)}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
                      <div className="text-xs text-on-surface-variant/50 uppercase tracking-wider mb-1">Exact Coordinates</div>
                      <div className="text-base font-mono text-primary flex items-center gap-2 bg-[#0c0c0e] p-2 rounded-lg mt-1 border border-primary/20">
                        <span className="material-symbols-outlined text-lg">pin_drop</span>
                        {modalPothole.latitude.toFixed(6)}, {modalPothole.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-outline-variant/10 flex items-center justify-between text-xs text-on-surface-variant/50 font-mono">
                  <span>Record ID: {modalPothole._id.slice(-6).toUpperCase()}</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">memory</span>
                    Analysis Complete
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
