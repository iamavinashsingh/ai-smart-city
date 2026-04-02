import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

// Define MongoDB Schema Mock
interface MongoPothole {
  _id: string;
  lat: number;
  lng: number;
  city: string;
  location: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  timestamp: string; // ISO String
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

  useEffect(() => {
    // Simulate Asynchronous MongoDB Data Fetch
    const fetchMongoData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockDatabase: MongoPothole[] = [
        { _id: '64a1b', lat: 19.0760, lng: 72.8777, city: 'Mumbai', location: 'Andheri West Link Road', severity: 'Critical', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
        { _id: '64a1c', lat: 19.1025, lng: 72.8453, city: 'Mumbai', location: 'JVLR Junction', severity: 'High', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
        { _id: '64a1d', lat: 28.7041, lng: 77.1025, city: 'New Delhi', location: 'Connaught Place', severity: 'Medium', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
        { _id: '64a1e', lat: 28.6139, lng: 77.2090, city: 'New Delhi', location: 'India Gate Circle', severity: 'Critical', timestamp: new Date(Date.now() - 115 * 60000).toISOString() },
        { _id: '64a1f', lat: 12.9716, lng: 77.5946, city: 'Bangalore', location: 'Outer Ring Road (Bellandur)', severity: 'Critical', timestamp: new Date(Date.now() - 150 * 60000).toISOString() },
        { _id: '64a20', lat: 12.9352, lng: 77.6245, city: 'Bangalore', location: 'Koramangala 100ft Road', severity: 'High', timestamp: new Date(Date.now() - 190 * 60000).toISOString() },
        { _id: '64a21', lat: 13.0827, lng: 80.2707, city: 'Chennai', location: 'Marina Beach Road', severity: 'Low', timestamp: new Date(Date.now() - 300 * 60000).toISOString() },
        { _id: '64a22', lat: 19.0222, lng: 72.8561, city: 'Mumbai', location: 'Dadar TT Circle', severity: 'Critical', timestamp: new Date(Date.now() - 360 * 60000).toISOString() },
      ];
      
      setPotholes(mockDatabase);
      setLoading(false);
    };

    fetchMongoData();
  }, []);

  // Format the heatmap points matrix [lat, lng, intensity]
  const heatPoints: [number, number, number][] = potholes.map(p => {
    let intensity = 0.5;
    if (p.severity === 'Critical') intensity = 1.0;
    if (p.severity === 'High') intensity = 0.8;
    return [p.lat, p.lng, intensity * 50];
  });

  const getSeverityStyle = (sev: string) => {
    switch(sev) {
      case 'Critical': return 'text-[#ffb4ab] border-[#ffb4ab]/30 bg-[#93000a]/20';
      case 'High': return 'text-primary border-primary/30 bg-primary/20';
      default: return 'text-on-surface-variant border-on-surface-variant/30 bg-surface-variant/50';
    }
  };

  const getRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
    if (diff < 60) return `${diff} mins ago`;
    const hours = Math.floor(diff / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  // Truncate feed to 4 items on mobile
  const displayedPotholes = (window.innerWidth < 768) ? potholes.slice(0, 4) : potholes;

  return (
    <main className="md:h-[calc(100vh-72px)] flex flex-col bg-[#08080A] md:overflow-hidden">
      {/* Live Feed Header Grid Section */}
      <div className="px-8 py-3 bg-surface z-10 border-b border-outline-variant/10 shadow-xl flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-headline font-bold mb-0.5">Live Infrastructure Grid</h1>
          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold opacity-60">National Monitoring Node — INDIA</p>
        </div>
        {!loading && (
          <div className="flex items-center text-emerald-400 text-[10px] font-bold tracking-widest bg-emerald-400/5 px-3 py-1.5 rounded-full border border-emerald-400/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-2"></div>
            LIVE FEED ACTIVE
          </div>
        )}
      </div>
      
      {/* Container containing two divs: i) Map div ii) Recent (flex-row on desktop) */}
      <div className="flex-1 flex flex-col md:flex-row relative z-0 md:min-h-0">
        
        {/* i) Map Div - High-end Immersive Frame */}
        <div className="w-full h-[400px] md:h-full md:flex-1 relative border-b md:border-b-0 md:border-r border-outline-variant/10 bg-[#08080A]">
          <MapContainer center={[20.5937, 78.9629]} zoom={5} className="w-full h-full absolute inset-0 bg-[#08080A]">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {!loading && <HeatmapLayer points={heatPoints} />}
          </MapContainer>
        </div>
        
        {/* ii) Recent Potholes Section - Balanced Sidebar */}
        <div className="w-full md:w-[380px] bg-[#0c0c0e] flex flex-col md:overflow-y-auto">
          <div className="p-5 border-b border-outline-variant/5 sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-md z-10 shrink-0">
            <h3 className="font-headline font-bold text-lg text-[#E5E1E4] flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">history</span>
              Recent Detections
            </h3>
          </div>
          
          <div className="p-4 space-y-3">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="animate-pulse bg-surface-container-low rounded-xl h-24"></div>)
            ) : (
              displayedPotholes.map(pothole => (
                <div key={pothole._id} className="glass-panel p-4 rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[9px] uppercase tracking-tighter font-bold px-1.5 py-0.5 rounded-sm border ${getSeverityStyle(pothole.severity)}`}>
                      {pothole.severity}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/70 italic">{getRelativeTime(pothole.timestamp)}</span>
                  </div>
                  <h4 className="font-headline font-bold text-[#E5E1E4] text-sm mb-1">{pothole.location}</h4>
                  <div className="text-[10px] text-on-surface-variant">[{pothole.lat.toFixed(2)}, {pothole.lng.toFixed(2)}] &middot; {pothole.city}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
