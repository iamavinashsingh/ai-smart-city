export default function HowItWorks() {
  return (
    <section className="py-32 bg-surface-container-low" id="how-it-works">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-24">
          <h2 className="text-4xl font-headline font-bold mb-4">Precision Workflow</h2>
          <div className="h-1 w-20 bg-primary mx-auto rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-4 gap-12 relative">
          {/* Step 1 */}
          <div className="relative z-10 text-center group">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl">photo_camera</span>
            </div>
            <h3 className="text-xl font-headline font-bold mb-3">1. Capture</h3>
            <p className="text-on-surface-variant text-sm px-4">Take a high-res photo of the road damage using any smartphone.</p>
          </div>
          {/* Step 2 */}
          <div className="relative z-10 text-center group">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
            </div>
            <h3 className="text-xl font-headline font-bold mb-3">2. Upload</h3>
            <p className="text-on-surface-variant text-sm px-4">Sync images directly to our secure cloud processing engine.</p>
          </div>
          {/* Step 3 */}
          <div className="relative z-10 text-center group">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
            </div>
            <h3 className="text-xl font-headline font-bold mb-3">3. AI Detection</h3>
            <p className="text-on-surface-variant text-sm px-4">YOLOv12 models scan for potholes with precision.</p>
          </div>
          {/* Step 4 */}
          <div className="relative z-10 text-center group">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl">map</span>
            </div>
            <h3 className="text-xl font-headline font-bold mb-3">4. Map Sync</h3>
            <p className="text-on-surface-variant text-sm px-4">Coordinates are instantly pinned to the city's live dashboard.</p>
          </div>
          {/* Timeline Line */}
          <div className="hidden md:block absolute top-8 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent -z-0"></div>
        </div>
      </div>
    </section>
  );
}
