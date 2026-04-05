import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const benefits = [
  {
    icon: "speed",
    title: "Faster Maintenance",
    description: "Reduce reaction time from weeks to hours by eliminating manual road inspections.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/15",
    stat: "10×",
    statLabel: "faster response",
  },
  {
    icon: "groups",
    title: "Crowdsourced Power",
    description: "Enable citizens to contribute to city infrastructure health with a simple photo upload.",
    color: "text-cyan-300",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/15",
    stat: "50+",
    statLabel: "cities onboarded",
  },
  {
    icon: "insights",
    title: "Data-Driven Planning",
    description: "Predict future decay patterns and allocate budgets with pinpoint geospatial accuracy.",
    color: "text-emerald-300",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/15",
    stat: "98%",
    statLabel: "detection accuracy",
  },
];

export default function Benefits() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-32 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/15 text-primary text-[10px] font-bold tracking-[0.15em] uppercase mb-6">
            Why AI Smart City
          </div>
          <h2 className="text-4xl md:text-5xl font-headline font-bold">
            Empowering Smarter Cities
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative bg-surface-container-low border ${item.border} rounded-2xl p-8 card-hover overflow-hidden`}
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 ${item.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />

              <div className="relative z-10">
                {/* Stat */}
                <div className={`text-4xl font-headline font-bold ${item.color} mb-1`}>{item.stat}</div>
                <div className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest font-label mb-6">{item.statLabel}</div>

                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <span className={`material-symbols-outlined text-xl ${item.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {item.icon}
                    </span>
                  </div>
                  <h3 className="text-lg font-headline font-bold text-[#E5E1E4]">{item.title}</h3>
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
