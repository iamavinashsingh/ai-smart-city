import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", to: "/", id: "home" },
  { label: "How It Works", to: "/#how-it-works", id: "how-it-works", isHash: true },
  { label: "Map", to: "/map", id: "map" },
];

export default function Header() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const path = location.pathname;
  const hash = location.hash;

  const getActiveId = () => {
    if (path === "/" && hash === "#how-it-works") return "how-it-works";
    if (path === "/map") return "map";
    if (path === "/") return "home";
    return "";
  };
  const activeId = getActiveId();

  // Scroll shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location]);

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#0D0D0F]/90 backdrop-blur-2xl shadow-[0_1px_0_rgba(214,186,255,0.06)]"
            : "bg-transparent"
        }`}
      >
        <nav className="flex justify-between items-center w-full px-6 md:px-10 py-4 max-w-7xl mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Home">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/80 to-primary-container flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <span className="material-symbols-outlined text-[16px] text-[#0D0D0F] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                my_location
              </span>
            </div>
            <span className="text-base font-headline font-bold text-[#E5E1E4] tracking-tight group-hover:text-primary transition-colors">
              AI Smart City
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, to, id, isHash }) => {
              const isActive = activeId === id;
              return (
                <div key={id} className="relative px-1">
                  {isHash ? (
                    <a
                      href={to}
                      className={`relative px-3 py-1.5 text-sm font-medium font-headline tracking-tight rounded-md transition-colors duration-200 ${
                        isActive ? "text-primary" : "text-on-surface-variant/70 hover:text-on-surface"
                      }`}
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      to={to}
                      className={`relative px-3 py-1.5 text-sm font-medium font-headline tracking-tight rounded-md transition-colors duration-200 ${
                        isActive ? "text-primary" : "text-on-surface-variant/70 hover:text-on-surface"
                      }`}
                    >
                      {label}
                    </Link>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-primary/10 rounded-md -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            <Link
              to="/scan"
              id="header-scan-cta"
              className="hidden md:flex btn-gradient px-5 py-2 rounded-lg font-headline font-bold text-[#0D0D0F] text-sm items-center gap-1.5 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                camera
              </span>
              Scan Road
            </Link>

            {/* Mobile hamburger */}
            <button
              id="mobile-menu-toggle"
              className="md:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined">
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Slide-Down Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[64px] left-0 right-0 z-40 bg-[#0D0D0F]/95 backdrop-blur-2xl border-b border-outline-variant/10 px-6 py-6 space-y-2 md:hidden"
          >
            {navLinks.map(({ label, to, id, isHash }) =>
              isHash ? (
                <a
                  key={id}
                  href={to}
                  className="block py-3 px-4 rounded-xl text-sm font-headline font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={id}
                  to={to}
                  className="block py-3 px-4 rounded-xl text-sm font-headline font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
                >
                  {label}
                </Link>
              )
            )}
            <Link
              to="/scan"
              className="block mt-4 btn-gradient text-center py-3 rounded-xl font-headline font-bold text-[#0D0D0F] text-sm shadow-lg"
            >
              Scan Road Now
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
