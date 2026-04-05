import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

type PageState = "idle" | "loading" | "success" | "error";

export default function ScanRoad() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Geolocation on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: 26.4499, lng: 80.3319 }) // Kanpur fallback
    );
  }, []);

  // Draw image + bounding boxes on canvas
  useEffect(() => {
    if (!preview || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = preview;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      if (ctx && result?.detections) {
        result.detections.forEach((det) => {
          const [x1, y1, x2, y2] = det.bbox;
          const w = x2 - x1;
          const h = y2 - y1;
          ctx.strokeStyle = "#ffb4ab";
          ctx.lineWidth = Math.max(img.width / 100, 3);
          ctx.strokeRect(x1, y1, w, h);
          const label = `${(det.confidence * 100).toFixed(1)}%`;
          ctx.font = `bold ${Math.max(img.width / 45, 14)}px Inter`;
          const textW = ctx.measureText(label).width;
          ctx.fillStyle = "rgba(147, 0, 10, 0.85)";
          ctx.fillRect(x1, y1 - 26, textW + 12, 26);
          ctx.fillStyle = "#ffdad6";
          ctx.fillText(label, x1 + 6, y1 - 7);
        });
      }
    };
  }, [preview, result]);

  const processFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      setErrorMsg("Invalid file type. Please upload a JPEG or PNG image.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg("Image exceeds 10 MB limit.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setErrorMsg(null);
    setPageState("idle");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleScan = async () => {
    if (!file || !location) {
      setErrorMsg("Please select an image and allow location access.");
      return;
    }
    setPageState("loading");
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("latitude", location.lat.toString());
    formData.append("longitude", location.lng.toString());

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/detect`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${response.status}`);
      }
      const data: ScanResult = await response.json();
      setResult(data);
      setPageState("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setPageState("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setErrorMsg(null);
    setPageState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const severityClass =
    result && result.detections.length > 3
      ? "text-[#ffb4ab] border-[#ffb4ab]/30 bg-[#93000a]/20"
      : result && result.detections.length > 0
      ? "text-primary border-primary/30 bg-primary/10"
      : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";

  return (
    <main className="min-h-screen bg-[#0D0D0F] pt-28 px-6 pb-20 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-error/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/15 text-primary text-[10px] font-bold tracking-[0.15em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            YOLOv12 Inference Engine
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold">Neural Road Analysis</h1>
          <p className="text-on-surface-variant max-w-xl mx-auto">
            Upload an image to trigger sub-500ms serverless inference. Hazards are geo-logged with precision telemetry.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* ── Upload Zone ── */}
          <div
            id="image-upload-zone"
            role="button"
            tabIndex={0}
            aria-label="Upload road image"
            className={`relative border-2 border-dashed rounded-2xl p-4 aspect-square flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden group
              ${isDragOver ? "border-primary bg-primary/10 scale-[1.01]" : ""}
              ${file ? "border-primary/40 bg-surface-container-low" : "border-outline-variant/30 bg-surface-container-low hover:border-primary/40 hover:bg-surface-container-high"}`}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="w-full h-full relative">
                <canvas ref={canvasRef} className="w-full h-full object-contain rounded-xl" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-xl flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-4xl">edit</span>
                    <span className="text-sm font-label font-semibold">Replace Image</span>
                  </div>
                </div>
                {/* File name badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 px-3 py-2 bg-[#0D0D0F]/80 backdrop-blur-md rounded-xl border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary text-sm">image</span>
                  <span className="text-[11px] text-on-surface-variant truncate flex-1">{file?.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="text-on-surface-variant/50 hover:text-error transition-colors"
                    aria-label="Remove image"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-18 h-18 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <span className="material-symbols-outlined text-5xl text-primary/70 group-hover:text-primary transition-colors" style={{ fontVariationSettings: "'FILL' 0" }}>
                    add_a_photo
                  </span>
                </div>
                <h3 className="font-headline font-bold text-lg mb-1 text-[#E5E1E4]">Drop Image Here</h3>
                <p className="text-on-surface-variant text-sm text-center max-w-[200px]">
                  or click to browse · JPG, PNG, WebP
                </p>
                <p className="text-on-surface-variant/40 text-[11px] mt-2">Max 10 MB</p>
              </>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
          </div>

          {/* ── Results Panel ── */}
          <div className="glass-panel rounded-2xl border border-outline-variant/10 shadow-2xl flex flex-col min-h-[400px]">
            {/* Panel header */}
            <div className="px-6 pt-6 pb-4 border-b border-outline-variant/10 flex items-center justify-between shrink-0">
              <h2 className="font-headline font-bold text-lg text-[#E5E1E4]">Grid Intelligence</h2>
              {location && (
                <div className="flex items-center gap-1.5 text-[10px] bg-primary/10 text-primary font-bold px-2.5 py-1.5 rounded-lg border border-primary/20">
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>gps_fixed</span>
                  {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
                </div>
              )}
            </div>

            {/* Panel body */}
            <div className="flex-1 p-6 flex flex-col">
              <AnimatePresence mode="wait">
                {pageState === "idle" && !result && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-4 text-on-surface-variant/40 rounded-xl border border-outline-variant/10 bg-surface-container-lowest/30"
                  >
                    <span className="material-symbols-outlined text-5xl">analytics</span>
                    <p className="text-sm">Ready for telemetry ingestion</p>
                  </motion.div>
                )}

                {pageState === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-5"
                  >
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-primary font-bold uppercase tracking-widest text-xs animate-pulse">Running YOLOv12...</p>
                      <p className="text-on-surface-variant/50 text-[11px] mt-1">Processing inference pipeline</p>
                    </div>
                  </motion.div>
                )}

                {pageState === "success" && result && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 space-y-4"
                  >
                    {/* Severity badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${severityClass}`}>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {result.detections.length > 0 ? "warning" : "check_circle"}
                      </span>
                      {result.detections.length > 3 ? "Critical Severity" : result.detections.length > 0 ? "High Severity" : "Road Clear"}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
                        <p className="text-[10px] text-on-surface-variant/50 uppercase font-bold mb-1">Detections</p>
                        <p className="font-headline font-bold text-2xl text-primary">{result.detections.length}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
                        <p className="text-[10px] text-on-surface-variant/50 uppercase font-bold mb-1">Max Confidence</p>
                        <p className="font-headline font-bold text-2xl text-[#E5E1E4]">
                          {result.detections.length > 0
                            ? `${(Math.max(...result.detections.map((d) => d.confidence)) * 100).toFixed(0)}%`
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {result.detections.length > 0 && (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
                        <p className="text-[10px] text-primary/70 uppercase font-bold mb-2">Confidence Distribution</p>
                        <div className="space-y-2">
                          {result.detections.slice(0, 3).map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-[10px] text-on-surface-variant/50 w-4">#{i + 1}</span>
                              <div className="flex-1 bg-primary/10 h-1.5 rounded-full overflow-hidden">
                                <motion.div
                                  className="bg-primary h-full rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${d.confidence * 100}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                />
                              </div>
                              <span className="text-[10px] text-on-surface-variant/70 w-8 text-right">{(d.confidence * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
                      <p className="text-[10px] text-on-surface-variant/50 uppercase font-bold mb-1">Timestamp</p>
                      <p className="font-label text-sm text-[#E5E1E4]">{format(new Date(result.timestamp), "PPP · p")}</p>
                    </div>
                  </motion.div>
                )}

                {(pageState === "error" || errorMsg) && pageState !== "loading" && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-bold flex items-start gap-3 mt-auto"
                  >
                    <span className="material-symbols-outlined shrink-0">error</span>
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Panel footer */}
            <div className="px-6 pb-6 shrink-0">
              <button
                id="scan-submit-btn"
                onClick={handleScan}
                disabled={pageState === "loading" || !file}
                className="w-full btn-gradient py-4 rounded-xl font-headline font-bold text-[#0D0D0F] disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {pageState === "loading" ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-[#0D0D0F]/30 border-t-[#0D0D0F] animate-spin" />
                    Running Inference...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
                    Initialize Neural Scan
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
