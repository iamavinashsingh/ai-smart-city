import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";

export default function CtaBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-24 px-8 bg-surface relative overflow-hidden">
      <div ref={ref} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1025] via-[#131315] to-[#0D0D0F] border border-outline-variant/15 group">
          {/* Glow blobs */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/15 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/25 transition-colors duration-700" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-error/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-error/15 transition-colors duration-700" />

          {/* Grid lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(214,186,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(214,186,255,1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative z-10 py-24 px-8 text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-[0.15em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Join the Network
            </div>

            <h2 className="text-4xl md:text-6xl font-headline font-bold max-w-2xl mx-auto leading-tight">
              Make Your City{" "}
              <span className="text-gradient">Smarter</span>{" "}
              Today
            </h2>

            <p className="text-on-surface-variant text-lg max-w-md mx-auto">
              Join 50+ municipalities already using AI to optimize infrastructure maintenance.
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-2">
              <Link
                to="/scan"
                id="cta-scan-link"
                className="btn-gradient px-12 py-5 rounded-xl font-headline font-bold text-[#0D0D0F] text-lg shadow-2xl shadow-primary/30 flex items-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
                Start Detecting Now
              </Link>
              <Link
                to="/map"
                id="cta-map-link"
                className="btn-outline-primary px-10 py-5 rounded-xl font-headline font-bold text-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined">explore</span>
                Explore Live Map
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex justify-center items-center gap-6 pt-4 text-[11px] text-on-surface-variant/40 uppercase tracking-widest">
              <span>No credit card</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant/40" />
              <span>Open source</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant/40" />
              <span>GDPR compliant</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
