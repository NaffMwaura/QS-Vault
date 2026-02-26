import { useEffect, useState } from "react";
// Standard relative path for local VS Code structure
import { useAuth } from "../../features/auth/AuthContext";
import {
  Zap,
  MapPin,
  Tablet,
  DollarSign,
  CheckCircle,
  LayoutGrid,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  HardHat,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

// --- CUSTOM TYPEWRITER HOOK ---
const useTypewriter = (words: string[], speed = 70, deleteSpeed = 50, delay = 1500) => {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(currentWord.substring(0, text.length + 1));
        if (text.length === currentWord.length) {
          setTimeout(() => setIsDeleting(true), delay);
        }
      } else {
        setText(currentWord.substring(0, text.length - 1));
        if (text.length === 0) {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? deleteSpeed : speed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, speed, deleteSpeed, delay]);

  return text;
};

/* ======================================================
    REUSABLE COMPONENTS (Enhanced Glass Morphism)
   ====================================================== */

interface CardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: CardProps) => (
  <div className="p-10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl transition-all hover:scale-[1.02] hover:border-amber-500/50 text-center group">
    <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-amber-500 transition-all duration-500">
      <Icon size={36} className="text-amber-500 group-hover:text-black transition-colors" />
    </div>
    <h3 className="text-xl font-black uppercase tracking-tight mb-4 dark:text-white">{title}</h3>
    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed font-medium">{description}</p>
  </div>
);

const ValuePropCard = ({ icon: Icon, title, description }: CardProps) => (
  <div className="p-8 bg-zinc-100/50 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl shadow-sm transition hover:shadow-xl hover:border-amber-500/30 space-y-4 flex flex-col items-start text-left group">
    <div className="p-3 bg-amber-500/10 rounded-2xl group-hover:scale-110 transition-transform">
      <Icon size={22} className="text-amber-500" />
    </div>
    <div>
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] dark:text-white mb-2">{title}</h3>
      <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed font-bold">{description}</p>
    </div>
  </div>
);

/* ======================================================
    NAVIGATION BAR
   ====================================================== */

const NavigationBar = ({ onAuthClick }: { onAuthClick: () => void }) => {
  const { theme, toggleTheme } = useAuth();
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  return (
    <nav className={`
      fixed top-0 inset-x-0 z-50 transition-all duration-500
      ${scrolled 
        ? "bg-zinc-100/80 dark:bg-black/70 backdrop-blur-2xl py-4 border-b border-zinc-200/50 dark:border-zinc-800/50 shadow-lg" 
        : "bg-transparent py-8"}
    `}>
      <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-xl shadow-xl shadow-amber-500/20">
              <HardHat size={22} className="text-black" />
            </div>
            <span className="text-2xl font-black uppercase tracking-tighter italic dark:text-white">
              QS VAULT<span className="text-amber-500">.</span>
            </span>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black transition-all duration-500 uppercase tracking-[0.2em] ${
            isOnline 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500" 
              : "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"
          }`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="hidden md:inline">{isOnline ? "Vault Synced" : "Offline Ready"}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 hover:text-amber-500 transition-all active:scale-90 border border-transparent hover:border-amber-500/20"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button
            onClick={onAuthClick}
            className="hidden sm:block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-amber-500 transition-colors"
          >
            Vault Access
          </button>
          
          <button
            onClick={onAuthClick}
            className="bg-amber-500 text-black px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all hover:-translate-y-0.5"
          >
            Initialize
          </button>
        </div>
      </div>
    </nav>
  );
};

/* ======================================================
    MARKETING PAGE
   ====================================================== */

const MarketingPage = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const typewriterText = useTypewriter([
    "Precision Cost Control.",
    "Automated BoQ Generation.",
    "Localized SMM Compliance.",
    "Offline Site Takeoffs.",
  ]);

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-[#09090b] selection:bg-amber-500/30 selection:text-black transition-colors duration-500">
      <NavigationBar onAuthClick={onGetStarted} />

      {/* HERO SECTION */}
      <header className="relative min-h-screen flex items-center justify-center px-6 pt-24 overflow-hidden">
        {/* Dynamic Background Mesh */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-amber-500/5 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4" />
           <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-zinc-500/5 rounded-full blur-[120px] translate-y-1/4 -translate-x-1/4" />
           <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.07]" 
                style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-12 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">
              The Professional standard for East African QS
            </span>
          </div>

          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black mb-10 leading-[0.85] tracking-tighter dark:text-white">
            <span className="block min-h-[1.1em] text-transparent bg-clip-text bg-linear-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-600 transition-all">
              {typewriterText}<span className="animate-pulse text-amber-500">_</span>
            </span>
            <span className="block mt-6 italic text-amber-500 drop-shadow-2xl">On-Site Mastery.</span>
          </h1>

          <p className="text-xl sm:text-2xl mb-16 max-w-4xl mx-auto font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Eliminate errors in takeoffs and valuations. Fully compliant with local SMM standards, operating at peak performance even in deep basements.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="group bg-amber-500 text-black font-black py-6 px-16 rounded-4xl text-xs uppercase tracking-[0.3em] shadow-2xl shadow-amber-500/30 hover:bg-amber-400 transition-all flex items-center gap-4 hover:scale-105"
            >
              Start Free Trial 
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-16 py-6 rounded-4xl text-xs font-black uppercase tracking-[0.3em] border border-zinc-300 dark:border-zinc-800 dark:text-white hover:bg-white dark:hover:bg-zinc-900 transition-all shadow-sm">
              View Specs
            </button>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section className="py-40 px-6 bg-zinc-200/30 dark:bg-zinc-900/30 border-y border-zinc-200 dark:border-zinc-800 backdrop-blur-sm relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-5xl sm:text-7xl font-black mb-24 tracking-tighter dark:text-white uppercase leading-none">
            Measure. <span className="text-amber-500 italic">Estimate.</span> Certify.
          </h2>

          <div className="grid lg:grid-cols-3 gap-10">
            <FeatureCard
              icon={Tablet}
              title="1. Mobile Takeoff"
              description="Capture quantities directly on drawings using your tablet. Local Dexie encryption ensures data persists without signal."
            />
            <FeatureCard
              icon={LayoutGrid}
              title="2. SMM BoQ"
              description="Generate compliant Bills of Quantities automatically. Built-in templates for regional concrete and walling rules."
            />
            <FeatureCard
              icon={DollarSign}
              title="3. Valuations"
              description="Calculate monthly progress and generate interim payment certificates in minutes, signed and ready for submission."
            />
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-24 text-left">
            <div className="max-w-3xl">
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight dark:text-white mb-8 uppercase leading-tight">
                Drafting-Grade Tools,<br />Optimized for site.
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xl font-medium">
                Modern construction demands high-speed accuracy. We’ve removed the complexity of legacy BIM to focus on pure takeoff performance.
              </p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-3xl backdrop-blur-md shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-3">Certified standard</p>
              <p className="text-2xl font-black dark:text-white italic">SMM-KE / RICS 2026</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <ValuePropCard
              icon={Zap}
              title="Offline-First PWA"
              description="Remote rural projects? Basement site? Your measurements stay encrypted locally and sync the second you're online."
            />
            <ValuePropCard
              icon={MapPin}
              title="Localized Rules"
              description="Fully aligned with East African SMM for roads, buildings, and civil works. No more manual compliance checks."
            />
            <ValuePropCard
              icon={DollarSign}
              title="Zero-Waste Estimating"
              description="Precision takeoff logic minimizes material waste by providing exact component volumes from on-site measurements."
            />
            <ValuePropCard
              icon={LayoutGrid}
              title="Resource Intelligence"
              description="Automatically generate material schedules and labor estimates based on your quantified BoQ data."
            />
            <ValuePropCard
              icon={Tablet}
              title="Cloud Synchronization"
              description="Collaborative project management. Share takeoff results with the office team in real-time when signal permits."
            />
            <ValuePropCard
              icon={CheckCircle}
              title="Technical UX"
              description="A clean, dark-mode optimized interface designed for low-light site environments and high-glare outdoor use."
            />
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="py-40 px-6 bg-zinc-950 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-amber-500/10 blur-[150px] rounded-full"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-24 italic leading-none">
            Trusted by Construction<br />Professionals.
          </h2>

          <div className="grid md:grid-cols-2 gap-12 text-left">
            <div className="p-10 border border-zinc-800/50 rounded-[3rem] bg-white/5 backdrop-blur-xl hover:border-amber-500/30 transition-all group">
              <p className="text-zinc-400 font-medium italic mb-10 leading-relaxed text-lg">
                "QS Vault is the only tool that actually understands the reality of site work in Kenya. The offline logic is bulletproof."
              </p>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-black text-xl shadow-lg">JM</div>
                <div>
                  <p className="font-black text-[11px] uppercase tracking-[0.2em]">Jane Mwangi</p>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">Lead QS / Centum RE</p>
                </div>
              </div>
            </div>
            <div className="p-10 border border-zinc-800/50 rounded-[3rem] bg-white/5 backdrop-blur-xl hover:border-amber-500/30 transition-all group">
              <p className="text-zinc-400 font-medium italic mb-10 leading-relaxed text-lg">
                "Final account preparation used to take weeks. With the interim certification module, we’re closing projects in days."
              </p>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center font-black text-amber-500 text-xl border border-zinc-700 shadow-lg">MO</div>
                <div>
                  <p className="font-black text-[11px] uppercase tracking-[0.2em]">Michael Otieno</p>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">Chartered Project Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-24 text-center bg-zinc-100 dark:bg-black border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-500">
        <div className="mb-10 flex items-center justify-center gap-3">
            <div className="bg-amber-500 p-2 rounded-xl shadow-xl shadow-amber-500/20">
              <HardHat size={22} className="text-black" />
            </div>
            <span className="text-3xl font-black uppercase tracking-tighter italic dark:text-white">
              QS VAULT<span className="text-amber-500">.</span>
            </span>
        </div>
        <div className="space-y-6">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">
            © {new Date().getFullYear()} PRECISION TAKEOFF SYSTEM / DEVELOPED FOR AFRICA.
          </p>
          <div className="flex justify-center gap-8 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">
             <span className="hover:text-amber-500 cursor-pointer transition-colors">Integrity</span>
             <span className="text-amber-500/20">•</span>
             <span className="hover:text-amber-500 cursor-pointer transition-colors">Accuracy</span>
             <span className="text-amber-500/20">•</span>
             <span className="hover:text-amber-500 cursor-pointer transition-colors">Innovation</span>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default MarketingPage;