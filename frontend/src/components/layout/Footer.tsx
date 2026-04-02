export default function Footer() {
  return (
    <footer className="bg-[#131315] w-full py-12 px-8 border-t border-outline-variant/10">
      <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto space-y-6 md:space-y-0">
        <div className="text-lg font-headline font-bold text-[#D6BAFF]">
          AI Pothole Detector
        </div>
        <div className="flex flex-wrap justify-center gap-8 font-body text-sm tracking-wide text-on-surface-variant/60">
          <a className="hover:text-[#D6BAFF] transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-[#D6BAFF] transition-colors" href="#">Terms of Service</a>
          <a className="hover:text-[#D6BAFF] transition-colors" href="#">Contact</a>
        </div>
        <p className="font-body text-sm tracking-wide text-on-surface-variant/60">
          © 2026 AI Pothole Detector. High-end Digital Architecture.
        </p>
      </div>
    </footer>
  );
}
