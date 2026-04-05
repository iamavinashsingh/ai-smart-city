import { useEffect, useState, useCallback } from "react";
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

export default function MapPage() {
  const [potholes, setPotholes] = useState<MongoPothole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
              <HeatmapLayer points={heatPoints} />
              {potholes.map((p) => (
                <Marker
                  key={p._id}
                  position={[p.latitude, p.longitude]}
                  icon={potholeIcon}
                  eventHandlers={{ click: () => setSelected(p._id) }}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 space-y-2 min-w-[140px]">
                      <img src={p.image_url} alt="Detection" className="w-full h-20 object-cover rounded-lg shadow" loading="lazy" />
                      <div className={`text-xs font-bold ${getSeverityStyle(p.severity).text}`}>{p.severity} Severity</div>
                      <div className="text-[10px] text-gray-500">{new Date(p.timestamp).toLocaleString()}</div>
                    </div>
                  </Popup>
                </Marker>
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
        <div className="w-full md:w-[380px] bg-[#0c0c0e] flex flex-col md:overflow-y-auto shrink-0">
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

          <div className="p-4 space-y-2.5 flex-1">
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
                      onClick={() => setSelected(isSelected ? null : p._id)}
                      className={`glass-panel p-3 rounded-2xl border transition-all cursor-pointer group flex gap-3 ${
                        isSelected ? `${s.border} ${s.bg}` : "border-outline-variant/10 hover:border-primary/30"
                      }`}
                    >
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
                          <span className="text-[9px] text-on-surface-variant/60">
                            {formatDistanceToNow(new Date(p.timestamp), { addSuffix: true })}
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
    </main>
  );
}
