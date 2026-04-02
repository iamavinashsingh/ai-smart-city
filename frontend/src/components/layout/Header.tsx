import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function Header() {
  const location = useLocation();
  const path = location.pathname;
  const hash = location.hash;

  // Derive active states based on path and hash
  const isHomeActive = path === '/' && hash !== '#how-it-works';
  const isHowItWorksActive = path === '/' && hash === '#how-it-works';
  const isMapActive = path === '/map';

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-variant/40 backdrop-blur-xl shadow-[0_40px_10px_-10px_rgba(229,225,228,0.04)]">
      <nav className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
        <Link to="/" className="text-xl font-headline font-bold text-[#E5E1E4] tracking-wider">
          AI Pothole Detector
        </Link>
        <div className="hidden md:flex items-center space-x-10">
          <div className="relative">
            <Link 
              to="/" 
              className={`font-headline font-bold tracking-tight pb-1 transition-colors duration-300 ${isHomeActive ? 'text-primary' : 'text-on-surface-variant/70 hover:text-on-surface hover:opacity-80'}`}
            >
              Home
            </Link>
            {isHomeActive && (
              <motion.div 
                layoutId="nav-underline"
                className="absolute -bottom-[6px] left-0 right-0 h-[2px] bg-primary/50  rounded-full" 
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </div>
          <div className="relative">
            <a 
              href="/#how-it-works"
              className={`font-headline font-bold tracking-tight pb-1 transition-colors duration-300 ${isHowItWorksActive ? 'text-primary' : 'text-on-surface-variant/70 hover:text-on-surface hover:opacity-80'}`} 
            >
              How It Works
            </a>
            {isHowItWorksActive && (
              <motion.div 
                layoutId="nav-underline"
                className="absolute -bottom-[6px] left-0 right-0 h-[2px] bg-primary/50 rounded-full" 
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </div>
          <div className="relative">
            <Link 
              to="/map" 
              className={`font-headline font-bold tracking-tight pb-1 transition-colors duration-300 ${isMapActive ? 'text-primary' : 'text-on-surface-variant/70 hover:text-on-surface hover:opacity-80'}`}
            >
              Map
            </Link>
            {isMapActive && (
              <motion.div 
                layoutId="nav-underline"
                className="absolute -bottom-[6px] left-0 right-0 h-[2px] bg-primary/50 rounded-full" 
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </div>
        </div>
        <Link to="/scan" className="btn-gradient px-6 py-2 rounded-md font-headline font-bold text-on-primary-container hover:brightness-110 active:scale-95 transition-all">
          Scan Road
        </Link>
      </nav>
    </header>
  );
}
