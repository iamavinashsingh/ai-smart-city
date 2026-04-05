import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import { formatDistanceToNow } from 'date-fns';

// Create custom marker icon for potholes
const potholeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// Define MongoDB Schema from Backend
interface Detection {
  bbox: number[];
  confidence: number;
}

interface MongoPothole {
  _id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  severity: 'Critical' | 'High' | 'Normal';
  timestamp: string;
  detections: Detection[];
}

// React Leaflet Wrapper for leaflet.heat
function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map || points.length === 0) return;
    
    // @ts-ignore - leaflet.heat dynamically adds heatLayer to L
    const heatLayer = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      gradient: { 0.4: '#6c1ecd', 0.6: '#d6baff', 0.8: '#ffb4ab', 1.0: '#93000a' }
    });
    
    heatLayer.addTo(map);
    
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);
  
  return null;
}

export default function MapPage() {
  const [potholes, setPotholes] = useState<MongoPothole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/potholes?limit=50`);
        if (!response.ok) throw new Error("Faulty connection to Infrastructure Grid.");
        
        const result = await response.json();
        if (result.success) {
          setPotholes(result.data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format the heatmap points matrix [lat, lng, intensity]
  const heatPoints: [number, number, number][] = potholes.map(p => {
    let intensity = 0.5;
    if (p.severity === 'Critical') intensity = 1.0;
    if (p.severity === 'High') intensity = 0.8;
    return [p.latitude, p.longitude, intensity * 50];
  });

  const getSeverityStyle = (sev: string) => {
    switch(sev) {
      case 'Critical': return 'text-[#ffb4ab] border-[#ffb4ab]/30 bg-[#93000a]/20';
      case 'High': return 'text-primary border-primary/30 bg-primary/20';
      default: return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
    }
  };

  return (
    <main className="md:h-[calc(100vh-72px)] flex flex-col bg-[#08080A] md:overflow-hidden pt-20">
      {/* Live Feed Header Grid Section */}
      <div className="px-8 py-4 bg-surface z-10 border-b border-outline-variant/10 shadow-xl flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-headline font-bold mb-0.5 text-[#E5E1E4]">Infrastructure Intelligence Grid</h1>
          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold opacity-60">Active Monitoring Nodes — Global Stream</p>
        </div>
        {!loading && !error && (
          <div className="flex items-center text-primary text-[10px] font-bold tracking-widest bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-2"></div>
            SYNCED WITH MONGODB
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row relative z-0 md:min-h-0">
        
        {/* Map Div */}
        <div className="w-full h-[50vh] md:h-full md:flex-1 relative border-b md:border-b-0 md:border-r border-outline-variant/10 bg-[#08080A]">
          <MapContainer center={[26.4499, 80.3319]} zoom={13} className="w-full h-full absolute inset-0 bg-[#08080A]">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {!loading && <HeatmapLayer points={heatPoints} />}
            
            {potholes.map(p => (
              <Marker key={p._id} position={[p.latitude, p.longitude]} icon={potholeIcon}>
                <Popup className="custom-popup">
                  <div className="p-2 space-y-2">
                    <img src={p.image_url} alt="Detection" className="w-full h-24 object-cover rounded shadow" />
                    <p className="text-xs font-bold text-primary">{p.severity} Severity</p>
                    <p className="text-[10px] text-gray-500">{new Date(p.timestamp).toLocaleString()}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        {/* Sidebar Feed */}
        <div className="w-full md:w-[400px] bg-[#0c0c0e] flex flex-col md:overflow-y-auto">
          <div className="p-5 border-b border-outline-variant/5 sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-md z-10 shrink-0">
            <h3 className="font-headline font-bold text-lg text-[#E5E1E4] flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">database</span>
              Neural Log Registry
            </h3>
          </div>
          
          <div className="p-4 space-y-3">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="animate-pulse bg-surface-container-low rounded-xl h-24"></div>)
            ) : error ? (
              <div className="p-8 text-center text-error space-y-2">
                <span className="material-symbols-outlined text-4xl">cloud_off</span>
                <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
              </div>
            ) : (
              potholes.map(p => (
                <div key={p._id} className="glass-panel p-3 rounded-xl border border-outline-variant/10 hover:border-primary/40 transition-all cursor-pointer group flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-outline-variant/20 shadow-inner">
                    <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Pothole" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[8px] uppercase tracking-tighter font-bold px-1.5 py-0.5 rounded-sm border ${getSeverityStyle(p.severity)}`}>
                        {p.severity}
                      </span>
                      <span className="text-[9px] text-on-surface-variant/70">
                        {formatDistanceToNow(new Date(p.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <h4 className="font-headline font-bold text-[#E5E1E4] text-xs truncate">Geospatial Token: {p._id.slice(-6).toUpperCase()}</h4>
                    <div className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-1 font-mono">
                      <span className="material-symbols-outlined text-[12px]">location_on</span>
                      {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                    </div>
                    <div className="mt-2 flex gap-1">
                      {p.detections.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {!loading && potholes.length === 0 && !error && (
              <div className="p-12 text-center text-on-surface-variant/50 space-y-2">
                <span className="material-symbols-outlined text-4xl">info</span>
                <p className="text-xs">No hazards logged in the current grid.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
