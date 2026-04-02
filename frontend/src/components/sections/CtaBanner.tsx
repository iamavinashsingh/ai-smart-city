import { Link } from "react-router-dom";

export default function CtaBanner() {
  return (
    <section className="py-24 px-8">
      <div className="max-w-7xl mx-auto relative overflow-hidden rounded-[2rem] bg-[#131315] border border-outline-variant/10 group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-container/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="relative py-20 px-8 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-headline font-bold max-w-2xl mx-auto">Make Your City Smarter Today</h2>
          <p className="text-on-surface-variant text-lg">Join 50+ municipalities already using AI to optimize infrastructure.</p>
          <Link to="/scan" className="btn-gradient px-12 py-5 rounded-md font-headline font-bold text-on-primary-container text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/20 inline-block text-center">
            Start Detecting
          </Link>
        </div>
      </div>
    </section>
  );
}
