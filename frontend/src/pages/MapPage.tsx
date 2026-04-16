import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { generateWorkOrderPDF } from "../lib/WorkOrderPDF";

// Fix Leaflet default markers in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Marker Icons ─────────────────────────────────────────────────────────────
const getMarkerIcon = (severity: string) => {
  let color = "#ef4444"; // Default to red
  if (/critical/i.test(severity)) color = "#dc2626";   // Red-600
  else if (/high/i.test(severity)) color = "#f97316";   // Orange-500
  else if (/moderate/i.test(severity)) color = "#eab308"; // Yellow-500
  else if (/low/i.test(severity)) color = "#9ca3af";     // Gray-400
  else if (/normal/i.test(severity)) color = "#22c55e";   // Green

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><circle fill="${['#eab308', '#22c55e'].includes(color) ? 'black' : 'white'}" cx="12" cy="9" r="2.5"/></svg>`;

  return L.divIcon({
    className: "custom-svg-icon",
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// ── Types ────────────────────────────────────────────────────────────────────
interface Detection {
  bbox: number[];
  confidence: number;
}

interface MongoPothole {
  _id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  severity: string;
  timestamp: string;
  detections: Detection[];
}

type SeverityTab = "Critical" | "High" | "Moderate" | "Low";
type MapMode = "markers" | "heatmap";

const SEVERITY_TABS: { key: SeverityTab; label: string; color: string; dot: string; bg: string; border: string; text: string; estSpan: string }[] = [
  { key: "Critical", label: "Critical", color: "bg-red-600", dot: "bg-red-500", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500", estSpan: "> 500mm" },
  { key: "High", label: "High", color: "bg-orange-500", dot: "bg-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-500", estSpan: "100–400mm" },
  { key: "Moderate", label: "Moderate", color: "bg-yellow-400", dot: "bg-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", text: "text-yellow-400", estSpan: "50–100mm" },
  { key: "Low", label: "Low", color: "bg-gray-400", dot: "bg-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/30", text: "text-gray-400", estSpan: "< 50mm" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getSeverityStyle(sev: string) {
  if (/critical/i.test(sev)) return { text: "text-red-500", border: "border-red-500/30", bg: "bg-red-500/10", dot: "bg-red-500" };
  if (/high/i.test(sev)) return { text: "text-orange-500", border: "border-orange-500/30", bg: "bg-orange-500/10", dot: "bg-orange-500" };
  if (/moderate/i.test(sev)) return { text: "text-yellow-400", border: "border-yellow-400/30", bg: "bg-yellow-400/10", dot: "bg-yellow-400" };
  if (/low/i.test(sev)) return { text: "text-gray-400", border: "border-gray-400/30", bg: "bg-gray-400/10", dot: "bg-gray-400" };
  return { text: "text-green-500", border: "border-green-500/30", bg: "bg-green-500/10", dot: "bg-green-500" };
}

function getEstSpan(severity: string): string {
  if (/critical/i.test(severity)) return "> 500mm";
  if (/high/i.test(severity)) return "100–400mm";
  if (/moderate/i.test(severity)) return "50–100mm";
  return "< 50mm";
}

const formatDateIST = (dateStr: string) => {
  let parseableStr = dateStr;
  if (!parseableStr.endsWith("Z") && !parseableStr.includes("+")) {
    parseableStr = parseableStr.replace(" ", "T");
    if (!parseableStr.includes("Z")) parseableStr += "Z";
  }
  const date = new Date(parseableStr);
  const timeStr = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(date).toUpperCase();
  const dateStrFormatted = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "long",
  }).format(date);
  return `${timeStr}, ${dateStrFormatted}`;
};

// ── PCI Calculation ──────────────────────────────────────────────────────────
function calculatePCI(potholes: MongoPothole[]): number {
  let score = 100;
  for (const p of potholes) {
    if (/critical/i.test(p.severity)) score -= 15;
    else if (/high/i.test(p.severity)) score -= 10;
    else if (/moderate/i.test(p.severity)) score -= 5;
    else if (/low/i.test(p.severity)) score -= 2;
  }
  return Math.max(0, score);
}

function getPCIColor(score: number): string {
  if (score >= 85) return "#22c55e";
  if (score >= 55) return "#eab308";
  return "#ef4444";
}

function getPCILabel(score: number): string {
  if (score >= 85) return "Good";
  if (score >= 55) return "Fair";
  return "Poor";
}

// ── PCI Gauge Component ──────────────────────────────────────────────────────
function PCIGauge({ score }: { score: number }) {
  const color = getPCIColor(score);
  const label = getPCILabel(score);
  // SVG arc gauge — 180 degrees
  const radius = 38;
  const strokeWidth = 7;
  const cx = 50;
  const circumference = Math.PI * radius; // half circle
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-0.5" title={`PCI: ${score}/100 — ${label}`}>
      <svg width="72" height="44" viewBox="0 0 100 56" className="overflow-visible">
        {/* Background arc */}
        <path
          d="M 12 50 A 38 38 0 0 1 88 50"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <motion.path
          d="M 12 50 A 38 38 0 0 1 88 50"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
        {/* Score text */}
        <text x={cx} y={46} textAnchor="middle" fill={color} fontSize="18" fontWeight="bold" fontFamily="Space Grotesk, sans-serif">
          {score}
        </text>
      </svg>
      <div className="text-[8px] uppercase tracking-widest font-bold" style={{ color }}>
        PCI — {label}
      </div>
    </div>
  );
}

// ── Heatmap Layer ────────────────────────────────────────────────────────────
function HeatmapLayer({ points, visible }: { points: [number, number, number][]; visible: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!map || points.length === 0 || !visible) return;
    // @ts-ignore
    const heat = L.heatLayer(points, {
      radius: 35, blur: 25, maxZoom: 17,
      gradient: { 0.4: "#6c1ecd", 0.65: "#d6baff", 0.85: "#ffb4ab", 1.0: "#93000a" },
    }).addTo(map);
    return () => { map.removeLayer(heat); };
  }, [map, points, visible]);
  return null;
}

// ── Map Sync Handler ─────────────────────────────────────────────────────────
function MapSyncHandler({ selected, potholes }: { selected: string | null; potholes: MongoPothole[] }) {
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

// ── Single Marker ────────────────────────────────────────────────────────────
function PotholeMarker({ p, isSelected }: { p: MongoPothole; isSelected: boolean }) {
  const markerRef = useRef<L.Marker>(null);
  useEffect(() => {
    if (isSelected && markerRef.current) markerRef.current.openPopup();
  }, [isSelected]);

  return (
    <Marker ref={markerRef} position={[p.latitude, p.longitude]} icon={getMarkerIcon(p.severity)}>
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

// ── Map Mode Toggle ──────────────────────────────────────────────────────────
function MapModeToggle({ mode, onChange }: { mode: MapMode; onChange: (m: MapMode) => void }) {
  return (
    <div className="absolute top-4 right-4 z-[1000] glass-panel rounded-xl border border-outline-variant/20 p-1 flex gap-1 shadow-xl">
      <button
        onClick={() => onChange("markers")}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
          mode === "markers"
            ? "bg-primary/20 text-primary border border-primary/30"
            : "text-on-surface-variant/50 hover:text-on-surface-variant"
        }`}
      >
        <span className="material-symbols-outlined text-sm">pin_drop</span>
        Markers
      </button>
      <button
        onClick={() => onChange("heatmap")}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
          mode === "heatmap"
            ? "bg-primary/20 text-primary border border-primary/30"
            : "text-on-surface-variant/50 hover:text-on-surface-variant"
        }`}
      >
        <span className="material-symbols-outlined text-sm">thermostat</span>
        Heatmap
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ██  MAP PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function MapPage() {
  const [potholes, setPotholes] = useState<MongoPothole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [modalPothole, setModalPothole] = useState<MongoPothole | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // New state
  const [activeTab, setActiveTab] = useState<SeverityTab>("Critical");
  const [mapMode, setMapMode] = useState<MapMode>("markers");
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

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

  // ── Derived data ────────────────────────────────────────────────────────────
  const heatPoints: [number, number, number][] = potholes.map((p) => [
    p.latitude,
    p.longitude,
    /critical/i.test(p.severity) ? 60 : /high/i.test(p.severity) ? 45 : /moderate/i.test(p.severity) ? 30 : 15,
  ]);

  const criticalCount = potholes.filter(p => /critical/i.test(p.severity)).length;
  const highCount = potholes.filter(p => /high/i.test(p.severity)).length;
  const moderateCount = potholes.filter(p => /moderate/i.test(p.severity)).length;
  const lowCount = potholes.filter(p => /low/i.test(p.severity)).length;

  const tabCounts: Record<SeverityTab, number> = {
    Critical: criticalCount,
    High: highCount,
    Moderate: moderateCount,
    Low: lowCount,
  };

  const filteredPotholes = potholes.filter(p => {
    const regex = new RegExp(activeTab, "i");
    return regex.test(p.severity);
  });

  const pciScore = calculatePCI(potholes);

  const handleLogClick = (p: MongoPothole) => {
    setSelected(p._id);
    setModalPothole(p);
  };

  const handleGeneratePDF = async (p: MongoPothole, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingPDF(p._id);
    try {
      await generateWorkOrderPDF(p, pciScore);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGeneratingPDF(null);
    }
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
          {/* PCI Gauge */}
          {!loading && !error && potholes.length > 0 && (
            <PCIGauge score={pciScore} />
          )}

          {/* Stats pills */}
          {!loading && !error && (
            <>
              {criticalCount > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {criticalCount} Critical
                </div>
              )}
              {highCount > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  {highCount} High
                </div>
              )}
              {moderateCount > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  {moderateCount} Moderate
                </div>
              )}
              {lowCount > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 bg-gray-400/10 border border-gray-400/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  {lowCount} Low
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
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
            <>
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
                <HeatmapLayer points={heatPoints} visible={mapMode === "heatmap"} />
                {mapMode === "markers" && potholes.map((p) => (
                  <PotholeMarker key={p._id} p={p} isSelected={selected === p._id} />
                ))}
              </MapContainer>
              <MapModeToggle mode={mapMode} onChange={setMapMode} />
            </>
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

        {/* ── Sidebar Feed (Tabbed) ── */}
        <div className="w-full md:w-[400px] bg-[#0c0c0e] flex flex-col md:overflow-y-auto shrink-0 z-10">
          {/* Sidebar Header */}
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

            {/* ── Severity Tabs ── */}
            {!loading && !error && potholes.length > 0 && (
              <div className="flex gap-1 mt-3">
                {SEVERITY_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                      activeTab === tab.key
                        ? `${tab.bg} ${tab.text} ${tab.border} border`
                        : "text-on-surface-variant/40 hover:text-on-surface-variant/60 border border-transparent"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeTab === tab.key ? tab.dot : "bg-on-surface-variant/20"}`} />
                    {tab.label}
                    {tabCounts[tab.key] > 0 && (
                      <span className={`ml-0.5 text-[8px] px-1 py-0 rounded-full ${
                        activeTab === tab.key ? `${tab.bg} ${tab.text}` : "bg-surface-container-high text-on-surface-variant/40"
                      }`}>
                        {tabCounts[tab.key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Tab Content ── */}
          <div className="p-4 space-y-2.5 flex-1 shadow-inner">
            <AnimatePresence mode="popLayout">
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
              ) : filteredPotholes.length === 0 ? (
                <motion.div
                  key={`empty-${activeTab}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant/40"
                >
                  <span className="material-symbols-outlined text-5xl">info</span>
                  <p className="text-xs">No {activeTab.toLowerCase()} severity hazards in the current grid.</p>
                </motion.div>
              ) : (
                filteredPotholes.map((p, i) => {
                  const s = getSeverityStyle(p.severity);
                  const isSelected = selected === p._id;
                  const isGenerating = generatingPDF === p._id;
                  return (
                    <motion.div
                      key={p._id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.2) }}
                      onClick={() => handleLogClick(p)}
                      className={`glass-panel p-3 rounded-2xl border transition-all cursor-pointer group flex gap-3 relative ${isSelected ? `${s.border} ${s.bg}` : "border-outline-variant/10 hover:border-primary/30"
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
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-[10px] font-mono text-on-surface-variant/60 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px]">location_on</span>
                            {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                          </div>
                          <div className={`text-[8px] font-bold ${s.text} uppercase`}>
                            Est. {getEstSpan(p.severity)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] text-on-surface-variant/40 font-mono">
                            ID: {p._id.slice(-6).toUpperCase()}
                          </span>
                          <div className="flex gap-0.5">
                            {p.detections.slice(0, 5).map((_, j) => (
                              <div key={j} className={`w-1.5 h-1.5 rounded-full ${s.dot} opacity-60`} />
                            ))}
                          </div>
                          {/* PDF Button */}
                          <button
                            onClick={(e) => handleGeneratePDF(p, e)}
                            disabled={isGenerating}
                            className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border border-outline-variant/20 text-on-surface-variant/50 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-40"
                            title="Generate Work Order PDF"
                          >
                            {isGenerating ? (
                              <div className="w-2.5 h-2.5 border border-primary/30 border-t-primary rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[11px]">description</span>
                            )}
                            PDF
                          </button>
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#08080A]/80 p-3 sm:p-6 md:p-12"
            onClick={() => setModalPothole(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              className="bg-[#0C0C0E] border border-outline-variant/20 rounded-2xl md:rounded-3xl overflow-hidden w-full max-w-5xl max-h-[100%] md:max-h-[90vh] shadow-2xl flex flex-col md:flex-row relative"
              onClick={(e) => e.stopPropagation()}
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
                className="w-full md:w-[50%] lg:w-[55%] shrink-0 h-[35vh] md:h-auto min-h-[300px] bg-black relative cursor-zoom-in overflow-hidden group flex items-center"
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
              <div className="flex-1 p-5 md:p-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary text-sm">analytics</span>
                      <h3 className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-widest font-label">Hazard Log</h3>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-headline font-bold text-[#E5E1E4]">Detection Details</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {/* Severity */}
                    <div className="bg-surface-container rounded-2xl p-3 md:p-4 border border-outline-variant/10">
                      <div className="text-[10px] md:text-xs text-on-surface-variant/50 uppercase tracking-wider mb-1">Assigned Severity</div>
                      <div className="text-base md:text-lg font-bold flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${getSeverityStyle(modalPothole.severity).dot} animate-pulse`} />
                        <span className={getSeverityStyle(modalPothole.severity).text}>{modalPothole.severity}</span>
                      </div>
                    </div>

                    {/* Est. Physical Span */}
                    <div className="bg-surface-container rounded-2xl p-3 md:p-4 border border-outline-variant/10">
                      <div className="text-[10px] md:text-xs text-on-surface-variant/50 uppercase tracking-wider mb-1">Estimated Physical Span</div>
                      <div className="text-sm md:text-base font-medium text-[#E5E1E4] flex items-center gap-2">
                        <span className="material-symbols-outlined text-base md:text-lg text-on-surface-variant/60">straighten</span>
                        {getEstSpan(modalPothole.severity)}
                      </div>
                    </div>

                    {/* PCI Context */}
                    <div className="bg-surface-container rounded-2xl p-3 md:p-4 border border-outline-variant/10">
                      <div className="text-[10px] md:text-xs text-on-surface-variant/50 uppercase tracking-wider mb-1">Pavement Condition Index</div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl md:text-2xl font-headline font-bold" style={{ color: getPCIColor(pciScore) }}>{pciScore}</span>
                        <span className="text-[10px] md:text-xs font-bold uppercase" style={{ color: getPCIColor(pciScore) }}>{getPCILabel(pciScore)}</span>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="bg-surface-container rounded-2xl p-3 md:p-4 border border-outline-variant/10">
                      <div className="text-[10px] md:text-xs text-on-surface-variant/50 uppercase tracking-wider mb-1">Timestamp (IST)</div>
                      <div className="text-sm md:text-base font-medium text-[#E5E1E4] flex items-center gap-2">
                        <span className="material-symbols-outlined text-base md:text-lg text-on-surface-variant/60">schedule</span>
                        {formatDateIST(modalPothole.timestamp)}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="bg-surface-container rounded-2xl p-3 md:p-4 border border-outline-variant/10">
                      <div className="text-[10px] md:text-xs text-on-surface-variant/50 uppercase tracking-wider mb-1">Exact Coordinates</div>
                      <div className="text-sm md:text-base font-mono text-primary flex items-center gap-2 bg-[#0c0c0e] p-2 rounded-lg mt-1 border border-primary/20">
                        <span className="material-symbols-outlined text-base md:text-lg">pin_drop</span>
                        <span className="break-all">{modalPothole.latitude.toFixed(6)}, {modalPothole.longitude.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 md:mt-8 pt-4 border-t border-outline-variant/10 space-y-3 shrink-0">
                  {/* Generate Work Order Button in Modal */}
                  <button
                    onClick={() => generateWorkOrderPDF(modalPothole, pciScore)}
                    className="w-full btn-gradient py-2.5 md:py-3 rounded-xl font-headline font-bold text-[#0D0D0F] flex items-center justify-center gap-2 text-sm transition-transform active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">description</span>
                    Generate Work Order PDF
                  </button>
                  <div className="flex items-center justify-between text-[10px] md:text-xs text-on-surface-variant/50 font-mono">
                    <span>ID: {modalPothole._id.slice(-6).toUpperCase()}</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] md:text-[14px]">memory</span>
                      Analysis Complete
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
