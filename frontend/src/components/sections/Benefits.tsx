export default function Benefits() {
  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-headline font-bold mb-4">Empowering Smarter Cities</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-surface-container-low p-10 rounded-xl hover:bg-surface-container-high transition-colors group">
            <span className="material-symbols-outlined text-primary text-4xl mb-6 group-hover:scale-110 transition-transform block">speed</span>
            <h3 className="text-xl font-headline font-bold mb-4">Faster Maintenance</h3>
            <p className="text-on-surface-variant leading-relaxed">Reduce reaction time from weeks to hours by eliminating manual road inspections.</p>
          </div>
          {/* Card 2 */}
          <div className="bg-surface-container-low p-10 rounded-xl hover:bg-surface-container-high transition-colors group">
            <span className="material-symbols-outlined text-primary text-4xl mb-6 group-hover:scale-110 transition-transform block">groups</span>
            <h3 className="text-xl font-headline font-bold mb-4">Crowdsourced Power</h3>
            <p className="text-on-surface-variant leading-relaxed">Enable citizens to contribute to infrastructure health with a simple photo upload.</p>
          </div>
          {/* Card 3 */}
          <div className="bg-surface-container-low p-10 rounded-xl hover:bg-surface-container-high transition-colors group">
            <span className="material-symbols-outlined text-primary text-4xl mb-6 group-hover:scale-110 transition-transform block">insights</span>
            <h3 className="text-xl font-headline font-bold mb-4">Data-Driven Planning</h3>
            <p className="text-on-surface-variant leading-relaxed">Predict future decay patterns and allocate budgets with pinpoint accuracy.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
