import { useAuth } from "../../features/auth/AuthContext";
import { FeatureCard } from "../assets/FeatureCard";
import { ValuePropCard } from "../assets/ValuePropCard";
import { NavigationBar } from "../core/Navbar";
import Hero from "../core/Hero";
import Footer from "../core/Footer";
import {
  Zap,
  MapPin,
  Tablet,
  DollarSign,
  CheckCircle,
  LayoutGrid,
} from "lucide-react";

const MarketingPage = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const { theme } = useAuth();

  return (
    <main
      className={`min-h-screen selection:bg-amber-500/30 selection:text-black transition-colors duration-500 overflow-x-hidden custom-scrollbar
      ${theme === "dark" ? "bg-[#09090b] text-white" : "bg-zinc-100 text-zinc-900"}`}
    >
      <NavigationBar onAuthClick={onGetStarted} />

      {/* HERO SECTION */}
      <Hero onGetStarted={onGetStarted} />

      {/* HOW IT WORKS (Breathing Room Spacing) */}
      <section
        className={`py-24 sm:py-40 px-4 sm:px-6 border-y relative overflow-hidden transition-colors duration-500
        ${theme === "dark" ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
      >
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2
            className={`text-4xl sm:text-7xl font-black mb-16 sm:mb-32 tracking-tighter uppercase leading-none
            ${theme === "dark" ? "text-white" : "text-zinc-900"}`}
          >
            Measure. <span className="text-amber-500 italic">Estimate.</span>{" "}
            Certify.
          </h2>

          <div className="grid lg:grid-cols-3 gap-8 sm:gap-12">
            <FeatureCard
              theme={theme}
              icon={Tablet}
              title="1. Mobile Takeoff"
              description="Capture quantities directly on PDF drawings. Local Dexie encryption ensures data persists without signal in deep basements."
            />
            <FeatureCard
              theme={theme}
              icon={LayoutGrid}
              title="2. SMM BoQ"
              description="Generate compliant Bills of Quantities automatically. Built-in templates for regional concrete, walling, and civil works."
            />
            <FeatureCard
              theme={theme}
              icon={DollarSign}
              title="3. Valuations"
              description="Calculate monthly progress and generate interim payment certificates in minutes, formatted and ready for the Project Manager."
            />
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 sm:py-48 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-16 sm:mb-32 text-left">
            <div className="max-w-3xl">
              <h2
                className={`text-4xl sm:text-6xl font-black tracking-tight mb-8 uppercase leading-[1.1]
                ${theme === "dark" ? "text-white" : "text-zinc-900"}`}
              >
                Drafting-Grade Tools,
                <br className="hidden sm:block" /> Optimized for the site Node.
              </h2>
              <p
                className={`text-lg sm:text-xl font-medium ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}
              >
                Modern infrastructure demands high-speed precision. We’ve
                stripped away the complexity of legacy software to focus on pure
                quantity takeoff performance.
              </p>
            </div>
            <div
              className={`w-full lg:w-auto border p-6 sm:p-8 rounded-4xl shadow-xl transition-colors
              ${theme === "dark" ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-500/5 border-amber-500/10"}`}
            >
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-3">
                Compliance Engine
              </p>
              <p
                className={`text-2xl sm:text-3xl font-black italic ${theme === "dark" ? "text-white" : "text-zinc-900"}`}
              >
                SMM-KE / RICS 2026
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
            <ValuePropCard
              theme={theme}
              icon={Zap}
              title="Offline-First PWA"
              description="Basement sites or remote projects? Your measurements stay encrypted locally and sync the second you're online."
            />
            <ValuePropCard
              theme={theme}
              icon={MapPin}
              title="Localized Rules"
              description="Fully aligned with East African SMM for roads, buildings, and civil works. No more manual compliance checks."
            />
            <ValuePropCard
              theme={theme}
              icon={DollarSign}
              title="Waste Minimization"
              description="Precision takeoff logic minimizes material waste by providing exact component volumes from on-site measurements."
            />
            <ValuePropCard
              theme={theme}
              icon={LayoutGrid}
              title="Resource Intelligence"
              description="Automatically generate material schedules and labor estimates based on your quantified BoQ data streams."
            />
            <ValuePropCard
              theme={theme}
              icon={Tablet}
              title="Real-Time Sync"
              description="Collaborative project management. Share takeoff results with the office team in real-time when signal permits."
            />
            <ValuePropCard
              theme={theme}
              icon={CheckCircle}
              title="Site-Ready UX"
              description="A high-contrast interface designed for low-light site environments and high-glare outdoor site use."
            />
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section
        className={`py-24 sm:py-48 px-4 sm:px-6 overflow-hidden relative transition-colors duration-500
        ${theme === "dark" ? "bg-[#09090b]" : "bg-zinc-100"}`}
      >
        {theme === "dark" && (
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-amber-500/5 blur-[150px] rounded-full"></div>
        )}
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2
            className={`text-4xl sm:text-7xl font-black uppercase tracking-tighter mb-16 sm:mb-32 italic leading-none
            ${theme === "dark" ? "text-white" : "text-zinc-900"}`}
          >
            Trusted by the <span className="text-amber-500">Elite</span>
            <br className="hidden sm:block" /> Construction Nodes.
          </h2>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-16 text-left">
            <div
              className={`p-8 sm:p-12 rounded-[3rem] border transition-all duration-500 group
              ${theme === "dark" ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-xl"}`}
            >
              <p
                className={`font-medium italic mb-10 leading-relaxed text-base sm:text-xl
                ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}
              >
                "QS Vault is the only tool that actually understands the reality
                of site work in Kenya. The offline logic is absolutely
                bulletproof."
              </p>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-black text-xl shadow-lg shrink-0">
                  DD
                </div>
                <div>
                  <p
                    className={`font-black text-xs uppercase tracking-[0.2em] ${theme === "dark" ? "text-white" : "text-zinc-900"}`}
                  >
                    Denzel Damba
                  </p>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">
                    Lead QS / Centum RE
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`p-8 sm:p-12 rounded-[3rem] border transition-all duration-500 group
              ${theme === "dark" ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-xl"}`}
            >
              <p
                className={`font-medium italic mb-10 leading-relaxed text-base sm:text-xl
                ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}
              >
                "Interim certificate preparation used to take weeks. With this
                module, we are closing valuation nodes in just a few days."
              </p>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-amber-500 text-xl shadow-lg shrink-0">
                  NM
                </div>
                <div>
                  <p
                    className={`font-black text-xs uppercase tracking-[0.2em] ${theme === "dark" ? "text-white" : "text-zinc-900"}`}
                  >
                    Naff Mwaura
                  </p>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">
                    Chartered Project Manager
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />

      <style>{`
        /* Professional Thin Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; transition: background 0.3s; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        
        /* Smooth selection colors */
        ::selection { background: #f59e0b; color: black; }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fade-in 0.8s ease-out forwards; }
        
        /* Prevent layout shift on typewriter */
        .typewriter-container { min-height: 1.1em; }
      `}</style>
    </main>
  );
};

export default MarketingPage;
