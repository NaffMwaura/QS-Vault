import { useEffect, useState,  } from "react";
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

// --- CUSTOM TYPEWRITER HOOK (Self-contained) ---
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
    REUSABLE COMPONENTS
   ====================================================== */

interface CardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: CardProps) => (
  <div className="p-8 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl transition-all hover:scale-[1.02] hover:border-amber-500/50 text-center group">
    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-amber-500 transition-colors">
      <Icon size={32} className="text-amber-500 group-hover:text-black transition-colors" />
    </div>
    <h3 className="text-xl font-black uppercase tracking-tight mb-3 dark:text-white">{title}</h3>
    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{description}</p>
  </div>
);

const ValuePropCard = ({ icon: Icon, title, description }: CardProps) => (
  <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-md transition hover:shadow-xl space-y-3 flex items-start gap-4">
    <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
      <Icon size={20} className="text-amber-500" />
    </div>
    <div>
      <h3 className="text-sm font-black uppercase tracking-wider dark:text-white mb-1">{title}</h3>
      <p className="text-zinc-500 dark:text-zinc-400 text-[13px] leading-relaxed">{description}</p>
    </div>
  </div>
);

/* ======================================================
    NAVIGATION BAR
   ====================================================== */

const NavigationBar = ({ onAuthClick }: { onAuthClick: () => void }) => {
  const { theme, toggleTheme } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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
      fixed top-0 inset-x-0 z-50 transition-all duration-300
      ${scrolled ? "bg-white/80 dark:bg-black/80 backdrop-blur-md py-3 border-b border-zinc-200 dark:border-zinc-800" : "bg-transparent py-6"}
    `}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 p-1.5 rounded-lg">
              <HardHat size={20} className="text-black" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter italic dark:text-white">
              QS Pocket Knife
            </span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black transition-all duration-500 uppercase tracking-widest ${
            isOnline 
              ? "bg-green-500/10 border-green-500/20 text-green-500" 
              : "bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse"
          }`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="hidden sm:inline">{isOnline ? "Sync Ready" : "Offline Mode"}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-amber-500 transition-colors"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={onAuthClick}
            className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-amber-500 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onAuthClick}
            className="bg-amber-500 text-black px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all hover:scale-105"
          >
            Get Started
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
    "Real-Time Cost Control for Every Build.",
    "Automate Your Bills of Quantities in Minutes.",
    "Local SMM Compliance.",
    "Offline Site Takeoffs.",
  ]);

  return (
    <main className="min-h-screen bg-white dark:bg-[#09090b] selection:bg-amber-500 selection:text-black">
      <NavigationBar onAuthClick={onGetStarted} />

      {/* HERO SECTION */}
      <header className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.07]" 
             style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
              The Essential Mobile Toolkit for Quantity Surveyors
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter dark:text-white">
            <span className="block min-h-[1.2em] text-transparent bg-clip-text bg-linear-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-600">
              {typewriterText}<span className="animate-pulse text-amber-500">_</span>
            </span>
            <span className="block mt-4 italic text-amber-500">Delivered On-Site.</span>
          </h1>

          <p className="text-lg sm:text-xl mb-12 max-w-3xl mx-auto font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Automate takeoffs, Bills of Quantities, and valuations — fully compliant with local SMM standards, even in the most remote areas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="group bg-amber-500 text-black font-black py-5 px-12 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/30 hover:bg-amber-400 transition-all flex items-center gap-3"
            >
              Start Free Trial 
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] border border-zinc-200 dark:border-zinc-800 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              Watch Demo
            </button>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section className="py-32 px-6 bg-zinc-50 dark:bg-zinc-900/30 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl sm:text-6xl font-black mb-20 tracking-tighter dark:text-white uppercase">
            Measure. <span className="text-amber-500 italic">Estimate.</span> Certify.
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Tablet}
              title="1. Mobile Takeoff"
              description="Measure areas and volumes directly on-site using your tablet. Local Dexie storage ensures no data loss."
            />
            <FeatureCard
              icon={LayoutGrid}
              title="2. SMM BoQ"
              description="Generate compliant Bills of Quantities automatically. Built-in templates for East African construction."
            />
            <FeatureCard
              icon={DollarSign}
              title="3. Valuations"
              description="Certify payments and track financial progress against the master budget instantly in the field."
            />
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight dark:text-white mb-6 uppercase">
                Professional Tools,<br />Built for the Field.
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                Your practice demands accuracy and mobility. We've stripped the bloat of legacy software to give you exactly what you need.
              </p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Current Standard</p>
              <p className="text-xl font-black dark:text-white">SMM-KE / RICS 2024</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ValuePropCard
              icon={Zap}
              title="Offline-First PWA"
              description="Deep basement or remote rural site? Your data stays safe and syncs when you find signal."
            />
            <ValuePropCard
              icon={MapPin}
              title="Built for East Africa"
              description="Road, Bridge, and Building templates aligned with Kenya, Uganda, and Tanzania standards."
            />
            <ValuePropCard
              icon={DollarSign}
              title="Scalable Pricing"
              description="Local pricing models designed for small QS firms, not enterprise-only budgets."
            />
            <ValuePropCard
              icon={LayoutGrid}
              title="Resource Planning"
              description="Automatically generate labor and material breakdowns based on your takeoff data."
            />
            <ValuePropCard
              icon={Tablet}
              title="GPS Site Takeoffs"
              description="Attach GPS coordinates and photos directly to measurements for indisputable records."
            />
            <ValuePropCard
              icon={CheckCircle}
              title="Simple UX"
              description="A clean, drafting-inspired interface that feels natural to a surveyor, not an IT specialist."
            />
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="py-32 px-6 bg-zinc-950 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter mb-16 italic">
            Trusted by Quantity Surveyors<br />Across the Region
          </h2>

          <div className="grid md:grid-cols-2 gap-12 text-left">
            <div className="p-8 border border-zinc-800 rounded-3xl bg-white/5 backdrop-blur-sm">
              <p className="text-zinc-400 italic mb-6 leading-relaxed">
                "QS Pocket Knife revolutionized how we manage site measurements. Accurate, fast, and easy to use even when signal is non-existent."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center font-black text-black">JM</div>
                <div>
                  <p className="font-black text-[10px] uppercase tracking-widest">Jane Mwangi</p>
                  <p className="text-zinc-500 text-[9px] uppercase tracking-widest">Chartered Surveyor</p>
                </div>
              </div>
            </div>
            <div className="p-8 border border-zinc-800 rounded-3xl bg-white/5 backdrop-blur-sm">
              <p className="text-zinc-400 italic mb-6 leading-relaxed">
                "The integration with local standards saved us weeks of compliance headaches. Finally, a tool built for our specific market."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-black text-amber-500">MO</div>
                <div>
                  <p className="font-black text-[10px] uppercase tracking-widest">Michael Otieno</p>
                  <p className="text-zinc-500 text-[9px] uppercase tracking-widest">Project Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 text-center bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
        <div className="mb-6 flex items-center justify-center gap-2">
           <div className="bg-amber-500 p-1.5 rounded-lg">
              <HardHat size={20} className="text-black" />
            </div>
            <span className="text-2xl font-black uppercase tracking-tighter italic dark:text-white">
              QS Pocket Knife
            </span>
        </div>
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">
            © {new Date().getFullYear()} Developed for the African Construction Market.
          </p>
          <p className="text-[9px] uppercase tracking-[0.5em] font-bold text-amber-500">
            Accuracy • Integrity • Innovation
          </p>
        </div>
      </footer>
    </main>
  );
};

export default MarketingPage;