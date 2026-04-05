import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { label: "Scan Road", to: "/scan" },
    { label: "Live Map", to: "/map" },
    { label: "How It Works", to: "/#how-it-works" },
  ],
  Company: [
    { label: "About", to: "#" },
    { label: "Contact", to: "#" },
    { label: "Privacy Policy", to: "#" },
  ],
};

const stats = [
  { value: "50+", label: "Municipalities" },
  { value: "<500ms", label: "Inference Speed" },
  { value: "YOLOv12", label: "AI Architecture" },
  { value: "99.9%", label: "Uptime SLA" },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#0D0D0F] border-t border-outline-variant/10 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-8 py-16 relative z-10">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-outline-variant/10 rounded-2xl overflow-hidden mb-16">
          {stats.map(({ value, label }) => (
            <div key={label} className="bg-[#0D0D0F] p-6 text-center hover:bg-surface-container-low transition-colors">
              <div className="text-2xl font-headline font-bold text-primary mb-1">{value}</div>
              <div className="text-[11px] text-on-surface-variant/60 uppercase tracking-widest font-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary-container flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-[18px] text-[#0D0D0F]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  my_location
                </span>
              </div>
              <span className="font-headline font-bold text-[#E5E1E4]">AI Smart City</span>
            </Link>
            <p className="text-sm text-on-surface-variant/60 leading-relaxed max-w-xs">
              Real-time crowdsourced road surface monitoring powered by YOLOv12 neural networks. Making cities smarter, one pothole at a time.
            </p>
            {/* Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">All Systems Operational</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-4 font-label">
                {section}
              </h3>
              <ul className="space-y-2.5">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    {to.startsWith("/") && !to.startsWith("/#") ? (
                      <Link
                        to={to}
                        className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors link-underline"
                      >
                        {label}
                      </Link>
                    ) : (
                      <a
                        href={to}
                        className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors link-underline"
                      >
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-outline-variant/10">
          <p className="text-xs text-on-surface-variant/40">
            © {new Date().getFullYear()} AI Smart City. Built with YOLOv12, FastAPI & React.
          </p>
          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/30 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 inline-block" />
            Edge-to-Cloud Architecture
          </div>
        </div>
      </div>
    </footer>
  );
}
