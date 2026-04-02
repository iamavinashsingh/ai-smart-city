export default function TechHighlight() {
  return (
    <section className="py-32 relative bg-surface-container-lowest">
      <div className="absolute inset-0 neural-mesh opacity-20"></div>
      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1">
            <div className="inline-block px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-6">
              Next-Gen Vision
            </div>
            <h2 className="text-4xl md:text-5xl font-headline font-bold mb-8 leading-tight">YOLOv12 Core <br/>Neural Engine</h2>
            <div className="grid gap-6">
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary">bolt</span>
                <div>
                  <h4 className="font-bold">Real-time Inference</h4>
                  <p className="text-on-surface-variant text-sm">Processed in milliseconds directly at the edge or on our dedicated high-GPU cloud nodes.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary">hub</span>
                <div>
                  <h4 className="font-bold">Seamless API</h4>
                  <p className="text-on-surface-variant text-sm">Integrate directly with existing municipal management software and IoT ecosystems.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="aspect-square relative flex items-center justify-center">
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                {/* Ripple Rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute rounded-full border border-primary/40 bg-primary/5 shadow-xl animate-[ripple_3s_ease-in-out_infinite]" style={{ width: 100, height: 100 }}></div>
                  <div className="absolute rounded-full border border-primary/30 bg-primary/5 animate-[ripple_3s_ease-in-out_infinite]" style={{ width: 100, height: 100, animationDelay: '0.6s' }}></div>
                  <div className="absolute rounded-full border border-primary/20 bg-primary/5 animate-[ripple_3s_ease-in-out_infinite]" style={{ width: 100, height: 100, animationDelay: '1.2s' }}></div>
                  <div className="absolute rounded-full border border-primary/10 bg-primary/5 animate-[ripple_3s_ease-in-out_infinite]" style={{ width: 100, height: 100, animationDelay: '1.8s' }}></div>
                  <div className="absolute rounded-full border border-primary/5 bg-primary/5 animate-[ripple_3s_ease-in-out_infinite]" style={{ width: 100, height: 100, animationDelay: '2.4s' }}></div>
                </div>
                {/* Central Icon Node */}
                <div className="relative z-10 w-40 h-40 glass-panel rounded-full flex items-center justify-center border border-primary/40 shadow-[0_0_50px_rgba(214,186,255,0.2)]">
                  <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>neurology</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
