import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  {
    id: "01",
    icon: "photo_camera",
    title: "Capture",
    description: "Take a high-resolution photo of road damage using any smartphone camera.",
    color: "from-violet-500/20 to-violet-500/5",
    border: "border-violet-500/20",
    iconColor: "text-violet-300",
  },
  {
    id: "02",
    icon: "cloud_upload",
    title: "Upload",
    description: "Sync images directly to our secure, high-throughput cloud processing engine.",
    color: "from-primary/20 to-primary/5",
    border: "border-primary/20",
    iconColor: "text-primary",
  },
  {
    id: "03",
    icon: "psychology",
    title: "AI Detection",
    description: "YOLOv12 neural network scans every pixel for potholes in under 500ms.",
    color: "from-cyan-500/20 to-cyan-500/5",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-300",
  },
  {
    id: "04",
    icon: "map",
    title: "Map Sync",
    description: "GPS coordinates are instantly pinned to the city's live intelligence dashboard.",
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-300",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 bg-surface-container-lowest relative overflow-hidden" id="how-it-works">
      {/* Background decoration */}
      <div className="absolute inset-0 neural-mesh opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-8 relative z-10" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/15 text-primary text-[10px] font-bold tracking-[0.15em] uppercase mb-6">
            How It Works
          </div>
          <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4">
            Precision Workflow
          </h2>
          <p className="text-on-surface-variant max-w-xl mx-auto">
            From capture to city dashboard in four seamless steps.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-outline-variant/20 to-transparent z-0" />

          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10"
            >
              <div className={`group bg-gradient-to-b ${step.color} border ${step.border} rounded-2xl p-8 text-center card-hover h-full`}>
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-[#0D0D0F] border border-outline-variant/20 rounded-full text-[10px] font-mono text-on-surface-variant/50 font-bold">
                  {step.id}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5">
                  <span className={`material-symbols-outlined text-3xl ${step.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {step.icon}
                  </span>
                </div>

                <h3 className="text-lg font-headline font-bold mb-3 text-[#E5E1E4]">{step.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
