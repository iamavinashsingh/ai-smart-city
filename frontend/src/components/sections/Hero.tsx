import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const stats = [
  { value: "50+", label: "Cities Live" },
  { value: "<500ms", label: "Inference" },
  { value: "99.9%", label: "Uptime" },
];

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    const particleCount = 80;
    const mouse = { x: -500, y: -500, radius: 120 };
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    }

    class Particle {
      x: number; y: number; size: number;
      baseX: number; baseY: number;
      density: number; opacity: number;

      constructor() {
        this.x = Math.random() * (canvas?.width || window.innerWidth);
        this.y = Math.random() * (canvas?.height || window.innerHeight);
        this.size = Math.random() * 1.5 + 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = Math.random() * 25 + 5;
        this.opacity = Math.random() * 0.4 + 0.1;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(214, 186, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          this.x -= (dx / distance) * force * this.density;
          this.y -= (dy / distance) * force * this.density;
        } else {
          if (this.x !== this.baseX) this.x -= (this.x - this.baseX) / 12;
          if (this.y !== this.baseY) this.y -= (this.y - this.baseY) / 12;
        }
      }
    }

    function initParticles() {
      particles = Array.from({ length: particleCount }, () => new Particle());
    }

    function connect() {
      if (!ctx) return;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 130) {
            ctx.strokeStyle = `rgba(214, 186, 255, ${(1 - distance / 130) * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => { p.draw(); p.update(); });
      connect();
      animationFrameId = requestAnimationFrame(animate);
    }

    resizeCanvas();
    animate();
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", resizeCanvas, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#0D0D0F]">
      {/* Interactive Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Deep background radial glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-error/5 rounded-full blur-[100px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(214,186,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(214,186,255,1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 w-full text-center py-24">
        <div className="space-y-8 max-w-5xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-[0.15em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Powered by YOLOv12 Neural Engine
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-headline font-bold leading-[1.04] tracking-tight"
          >
            Fix Roads Faster with
            <br />
            <span className="text-gradient">AI‑Powered</span>{" "}
            <span className="text-on-surface/90">Detection</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed"
          >
            Upload a photo. Let AI detect potholes in under 500ms. Instantly geo-log road damage to a live city dashboard.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap gap-4 justify-center pt-2"
          >
            <Link
              to="/scan"
              id="hero-scan-cta"
              className="btn-gradient px-10 py-4 rounded-xl font-headline font-bold text-[#0D0D0F] text-base shadow-2xl shadow-primary/25 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
              Upload Image →
            </Link>
            <Link
              to="/map"
              id="hero-map-cta"
              className="btn-outline-primary px-10 py-4 rounded-xl font-headline font-bold text-base flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">map</span>
              View Live Map
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex justify-center gap-10 pt-6 border-t border-outline-variant/10 mt-8"
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-headline font-bold text-primary">{value}</div>
                <div className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest mt-0.5 font-label">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-on-surface-variant/30"
        >
          <span className="text-[10px] uppercase tracking-widest font-label">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
