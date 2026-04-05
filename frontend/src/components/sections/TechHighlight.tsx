import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    icon: "bolt",
    title: "Sub-500ms Inference",
    description: "Processed on dedicated GPU nodes. Results returned before users can blink.",
  },
  {
    icon: "hub",
    title: "RESTful API",
    description: "Integrate directly with municipal management software and existing IoT ecosystems.",
  },
  {
    icon: "security",
    title: "Secure by Default",
    description: "End-to-end encrypted storage via Cloudinary CDN. GDPR-compliant data handling.",
  },
  {
    icon: "location_on",
    title: "Geospatial Logging",
    description: "Every detection is logged with precise GPS coordinates to MongoDB GeoJSON format.",
  },
];

export default function TechHighlight() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-32 relative bg-surface-container-lowest overflow-hidden">
      <div className="absolute inset-0 neural-mesh opacity-25 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-8 relative z-10" ref={ref}>
        <div className="flex flex-col lg:flex-row gap-16 items-center">

          {/* Left — Text */}
          <div className="flex-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/15 text-primary text-[10px] font-bold tracking-[0.15em] uppercase mb-6">
                Next-Gen Vision
              </div>
              <h2 className="text-4xl md:text-5xl font-headline font-bold leading-tight">
                YOLOv12 Core<br />
                <span className="text-gradient">Neural Engine</span>
              </h2>
            </motion.div>

            <div className="grid gap-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -24 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-container-high/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors">
                    <span className="material-symbols-outlined text-primary text-xl">{f.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-sm text-[#E5E1E4] mb-1">{f.title}</h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{f.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — Animated Neural Node */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="relative w-80 h-80 flex items-center justify-center">
              {/* Ripple rings */}
              {[0, 0.6, 1.2, 1.8, 2.4].map((delay, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-primary/30 animate-[ripple_3.5s_ease-in-out_infinite]"
                  style={{
                    width: 100 + i * 0,
                    height: 100 + i * 0,
                    animationDelay: `${delay}s`,
                    opacity: 0.6 - i * 0.1,
                  }}
                />
              ))}

              {/* Orbiting dot */}
              <motion.div
                className="absolute w-3 h-3 bg-primary rounded-full shadow-[0_0_20px_rgba(214,186,255,0.8)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "0 -100px", top: "50%", left: "50%" }}
              />

              {/* Central node */}
              <div className="relative z-10 w-44 h-44 glass-panel rounded-full flex flex-col items-center justify-center border border-primary/30 shadow-[0_0_60px_rgba(214,186,255,0.15)]">
                <span
                  className="material-symbols-outlined text-6xl text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  neurology
                </span>
                <div className="text-[9px] text-primary/70 uppercase tracking-widest mt-2 font-label">YOLOv12</div>
              </div>

              {/* Corner feature chips */}
              {[
                { label: "99.9% Uptime", pos: "top-4 -right-8" },
                { label: "<500ms", pos: "bottom-4 -left-8" },
              ].map(({ label, pos }) => (
                <div key={label} className={`absolute ${pos} px-3 py-1.5 glass-panel rounded-full border border-primary/15 text-[10px] text-primary font-bold uppercase tracking-wider whitespace-nowrap`}>
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
