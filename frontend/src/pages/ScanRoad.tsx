import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";

interface Detection {
  bbox: [number, number, number, number];
  confidence: number;
}

interface ScanResult {
  success: boolean;
  message: string;
  image_url: string;
  detections: Detection[];
  timestamp: string;
  location: { lat: number; lng: number };
}

export default function ScanRoad() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Logic - Geolocation: Capture user coordinates on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Location access denied. Using fallback coordinates.");
          // Fallback to Kanpur as specified in requirements for map center
          setLocation({ lat: 26.4499, lng: 80.3319 });
        }
      );
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  // 2. Logic - Fetch Upload: Send image and coordinates to backend
  const handleScan = async () => {
    if (!file || !location) {
      setError("Please select an image and allow location access.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("latitude", location.lat.toString());
    formData.append("longitude", location.lng.toString());

    try {
      // Assuming backend is on port 8000 during dev
      const response = await fetch("http://localhost:8000/api/v1/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Detection failed. Please check backend connection.");

      const data: ScanResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during scanning.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Logic - Drawing: Render bounding boxes over the image on canvas
  useEffect(() => {
    if (result && preview && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = preview;
      
      img.onload = () => {
        // Set canvas to image dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        // Draw boxes
        if (ctx) {
          ctx.strokeStyle = "#ffb4ab"; // Reddish-pink for visibility
          ctx.lineWidth = Math.max(img.width / 100, 4);
          ctx.font = `${Math.max(img.width / 40, 16)}px Courier New`;
          
          result.detections.forEach(det => {
            const [x1, y1, x2, y2] = det.bbox;
            const w = x2 - x1;
            const h = y2 - y1;
            
            ctx.strokeRect(x1, y1, w, h);
            
            // Draw confidence tag
            const label = `${(det.confidence * 100).toFixed(1)}%`;
            ctx.fillStyle = "#ffb4ab";
            ctx.fillRect(x1, y1 - 25, ctx.measureText(label).width + 10, 25);
            ctx.fillStyle = "#000000";
            ctx.fillText(label, x1 + 5, y1 - 5);
          });
        }
      };
    }
  }, [result, preview]);

  return (
    <main className="min-h-screen bg-surface pt-32 px-8 pb-20">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-headline font-bold">Neural Road Analysis</h1>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            Upload an image to trigger a sub-second serverless inference using YOLOv12 architecture. 
            All hazards are logged with precise geospatial telemetry.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* File Input Container */}
          <div 
            className={`border-2 border-dashed rounded-2xl p-6 text-center aspect-square flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden ${
              file ? 'border-primary bg-primary/5' : 'border-outline-variant hover:bg-surface-container-high'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="relative w-full h-full">
                <canvas ref={canvasRef} className="w-full h-full object-contain rounded-lg" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 text-4xl">edit</span>
                </div>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-6xl text-primary/50 mb-4 group-hover:text-primary transition-colors">add_a_photo</span>
                <h3 className="font-headline font-bold text-xl mb-2 text-[#E5E1E4]">Capture Damage</h3>
                <p className="text-on-surface-variant text-sm px-8">Drag imagery here or click to select from system storage (JPG/PNG)</p>
              </>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg, image/png"
              onChange={handleFileChange} 
            />
          </div>

          {/* Results Display Panel */}
          <div className="glass-panel rounded-2xl p-8 flex flex-col border border-outline-variant/10 shadow-xl shadow-primary/5">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-bold text-xl text-[#E5E1E4]">Grid Intelligence</h3>
                {location && (
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-1 rounded border border-primary/20">
                    GPS LOCKED: {location.lat.toFixed(2)}, {location.lng.toFixed(2)}
                  </span>
                )}
              </div>

              {!result && !loading && (
                <div className="flex flex-col items-center justify-center h-48 space-y-4 text-on-surface-variant/50 border border-outline-variant/10 rounded-xl bg-surface-container-low/30">
                  <span className="material-symbols-outlined text-4xl">analytics</span>
                  <p className="text-sm">Ready for telemetry ingestion.</p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center h-48 space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-primary font-bold animate-pulse uppercase tracking-widest text-xs">Processing Inference...</p>
                </div>
              )}

              {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1 opacity-60">Status</p>
                      <p className="font-headline font-bold text-[#E5E1E4]">{result.detections.length > 0 ? 'Hazards Found' : 'Clean Grid'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1 opacity-60">Detected</p>
                      <p className="font-headline font-bold text-primary">{result.detections.length}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1 opacity-60">Timestamp</p>
                    <p className="font-headline font-bold text-[#E5E1E4] text-sm">
                      {format(new Date(result.timestamp), "PPPP p")}
                    </p>
                  </div>
                  
                  {result.detections.length > 0 && (
                     <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-[10px] text-primary uppercase font-bold mb-2">Max Confidence</p>
                      <div className="w-full bg-primary/10 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-1000" 
                          style={{ width: `${Math.max(...result.detections.map(d => d.confidence)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-bold mt-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}
            </div>

            <div className="mt-8">
              <button 
                onClick={handleScan}
                disabled={loading || !file}
                className="w-full btn-gradient py-4 rounded-xl font-headline font-bold text-on-primary-container disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95"
              >
                {loading ? 'RUNNING YOLOv12...' : 'INITIALIZE NEURAL SCAN'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
