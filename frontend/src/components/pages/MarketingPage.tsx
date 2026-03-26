/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Menu,
  X,
  type LucideIcon,
  ShieldCheck,
  TrendingUp,
  Cpu,
} from "lucide-react";

/* ======================================================
    OFFICE MODULE RESOLUTION (PRO DEV CONFIG)
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  theme: 'dark',
  toggleTheme: () => console.log("Theme Shift Requested"),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Button: any = ({ children, onClick, className}: any) => (
  <button onClick={onClick} className={className}>{children}</button>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GlassCard: any = ({ children, className }: any) => (
  <div className={className}>{children}</div>
);

const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const btnMod = await import("../ui/Button");
    if (btnMod.default) Button = btnMod.default;

    const glassMod = await import("../ui/GlassCard");
    if (glassMod.default) GlassCard = glassMod.default;
  } catch (e) {
    // Shims active for environment stability
  }
};

resolveModules();

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
    REUSABLE SECTION COMPONENTS
   ====================================================== */

interface CardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: CardProps) => (
  <GlassCard interactive className="p-10 sm:p-14 border text-center flex flex-col items-center h-full">
    <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mb-10 group-hover:bg-amber-500 transition-all duration-500 shadow-inner">
      <Icon size={36} className="text-amber-500 group-hover:text-black transition-colors" />
    </div>
    <h3 className="theme-title text-xl sm:text-2xl font-black uppercase tracking-tight mb-6">
      {title}
    </h3>
    <p className="theme-muted text-base leading-relaxed font-medium">
      {description}
    </p>
  </GlassCard>
);

const ValuePropCard = ({ icon: Icon, title, description }: CardProps) => (
  <div className="theme-surface-card-soft p-8 sm:p-10 border rounded-[2.5rem] transition-all duration-500 hover:border-amber-500/30 space-y-6 flex flex-col items-start text-left group">
    <div className="p-4 bg-amber-500/10 rounded-2xl group-hover:scale-110 transition-transform">
      <Icon size={24} className="text-amber-500" />
    </div>
    <div>
      <h3 className="theme-title text-[12px] font-black uppercase tracking-[0.2em] mb-3">
        {title}
      </h3>
      <p className="theme-muted text-xs sm:text-sm leading-relaxed font-bold">
        {description}
      </p>
    </div>
  </div>
);

/* ======================================================
    MAIN MARKETING PAGE COMPONENT
   ====================================================== */

const MarketingPage = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const { theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const typewriterText = useTypewriter([
    "Precision Cost Control.",
    "Automated BoQ Systems.",
    "Site Progress Tracking.",
    "Offline Daily Records.",
  ]);

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
    <main className="theme-page min-h-screen selection:bg-amber-500/30 transition-colors duration-500 overflow-x-hidden custom-scrollbar">
      
      {/* 1. PROFESSIONAL NAVIGATION BAR */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "theme-nav-solid border-b py-4 backdrop-blur-md" : "bg-transparent py-8 sm:py-10"}`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-10">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-xl shadow-xl">
                <HardHat size={20} className="text-black" />
              </div>
              <span className="theme-title text-2xl font-black uppercase tracking-tighter italic">
                QS VAULT<span className="text-amber-500">.</span>
              </span>
            </div>

            <div className={`hidden lg:flex items-center gap-3 px-5 py-2.5 rounded-full border text-[9px] font-black transition-all duration-500 uppercase tracking-widest ${
              isOnline ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" : "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"
            }`}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? "System Online" : "Offline Mode"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="theme-muted p-3 hover:text-amber-500 transition-all active:scale-90">
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Button variant="ghost" onClick={() => navigate('/login')} className="hidden sm:flex px-6!">
              Login
            </Button>
            <Button variant="primary" onClick={onGetStarted} className="px-8 py-3">
              Get Started
            </Button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="theme-muted lg:hidden p-2">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="theme-overlay fixed inset-0 z-45] lg:hidden backdrop-blur-2xl transition-all duration-300">
          <div className="flex flex-col items-center justify-center h-full space-y-8">
             <button onClick={onGetStarted} className="text-2xl font-black uppercase tracking-widest text-amber-500">Get Started</button>
             <button onClick={() => navigate('/login')} className="theme-title text-2xl font-black uppercase tracking-widest">Login</button>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <header className="relative min-h-screen flex items-center justify-center px-6 pt-32 overflow-hidden bg-transparent">
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="theme-glow-amber absolute top-0 right-0 w-2/3 h-2/3 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/4" />
           <div className="theme-glow-neutral absolute bottom-0 left-0 w-1/2 h-1/2 rounded-full blur-[140px] translate-y-1/4 -translate-x-1/4" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto text-center px-6">
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full border border-amber-500/20 bg-amber-500/10 mb-16 shadow-inner animate-in fade-in duration-700">
            <Cpu size={14} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 leading-none">
              The Digital Infrastructure for Construction
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-12 leading-[1.1] tracking-tighter transition-colors">
            <span className="theme-hero-gradient block min-h-[1.1em] text-transparent bg-clip-text transition-all duration-1000">
              {typewriterText}<span className="animate-pulse text-amber-500">_</span>
            </span>
            <span className="block mt-4 italic text-amber-500 drop-shadow-2xl">Site Mastery.</span>
          </h1>

          <p className="theme-muted text-lg sm:text-2xl md:text-3xl mb-24 max-w-5xl mx-auto font-medium leading-relaxed px-6">
            Eliminate error-prone spreadsheets. QS Vault digitizes construction takeoffs and project management, operating at peak performance even in disconnected site environments.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <Button variant="primary" onClick={onGetStarted} className="py-8 px-20 group text-sm" rightIcon={<ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />}>
              Start Free Trial 
            </Button>
            <Button variant="outline" className="py-8 px-20 text-sm">
              Technical Specs
            </Button>
          </div>
        </div>
      </header>

      {/* 3. WORKFLOW SECTION */}
      <section className="theme-surface-muted py-60 px-6 sm:px-12 border-y border-[color:var(--app-border)] relative overflow-hidden transition-colors duration-500">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="theme-title text-5xl sm:text-8xl font-black mb-48 tracking-tighter uppercase leading-none">
            Measure. <span className="text-amber-500 italic">Estimate.</span> Certify.
          </h2>

          <div className="grid lg:grid-cols-3 gap-16 sm:gap-20">
            <FeatureCard
              icon={Tablet}
              title="1. Site Takeoff"
              description="Capture quantities directly on drawings. Local device encryption ensures your data remains secure in basement sites without signal."
            />
            <FeatureCard
              icon={LayoutGrid}
              title="2. Automated BoQ"
              description="Generate compliant Bills of Quantities instantly. Built-in work section templates for regional concrete, walling, and civil works."
            />
            <FeatureCard
              icon={DollarSign}
              title="3. Payment Certs"
              description="Calculate monthly progress claims automatically. Generate professional interim certificates and share them via WhatsApp or Email."
            />
          </div>
        </div>
      </section>

      {/* 4. FEATURES GRID */}
      <section className="py-64 px-6 sm:px-12 bg-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-16 mb-48 text-left">
            <div className="max-w-4xl">
              <h2 className="theme-title text-4xl sm:text-7xl font-black tracking-tight mb-10 uppercase leading-[1.05]">
                Engineering-Grade Precision,<br className="hidden lg:block" /> Built for the Site Node.
              </h2>
              <p className="theme-muted text-xl sm:text-2xl font-medium">
                Modern construction demands high-speed accuracy. We’ve removed the friction of legacy software to focus on pure data performance.
              </p>
            </div>
            <div className="theme-surface-accent w-full lg:w-auto border p-12 rounded-[2.5rem] shadow-2xl transition-colors">
              <p className="text-[12px] font-black uppercase tracking-[0.4em] text-amber-500 mb-4 leading-none">Compliance Protocol</p>
              <p className="theme-title text-4xl font-black italic leading-none">SMM-KE / RICS 2026</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-14">
            <ValuePropCard icon={Zap} title="Offline-First Logic" description="Your data stays safe locally on your laptop and syncs to the cloud the second you have a signal." />
            <ValuePropCard icon={MapPin} title="Localized SMM Rules" description="Fully aligned with East African SMM for roads and civil works. No more manual compliance checking." />
            <ValuePropCard icon={TrendingUp} title="Project Analytics" description="Advanced algorithms track material consumption and workforce productivity in real-time." />
            <ValuePropCard icon={LayoutGrid} title="Digital Diary" description="Keep an immutable record of site events, weather, and deliveries linked directly to your cost nodes." />
            <ValuePropCard icon={CheckCircle} title="Professional Reports" description="Export valuation reports, BoQs, and Variation claims in standard PDF and Excel formats." />
            <ValuePropCard icon={ShieldCheck} title="Verified Security" description="AES-256 local encryption and secure cloud backups ensure your project data is never compromised." />
          </div>
        </div>
      </section>

      {/* 5. TRUSTED NODES */}
      <section className="theme-page py-64 px-6 sm:px-12 overflow-hidden relative transition-colors duration-500">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="theme-title text-4xl sm:text-8xl font-black uppercase tracking-tighter mb-48 italic leading-none">
            Authorized by <span className="text-amber-500">Industry</span><br className="hidden sm:block" /> Professionals.
          </h2>

          <div className="grid md:grid-cols-2 gap-24 text-left">
            <GlassCard className="p-16 border shadow-2xl flex flex-col justify-between h-full">
              <p className="theme-muted font-medium italic mb-12 leading-relaxed text-xl sm:text-2xl">
                "QS Vault is the only tool that actually understands site work. The offline logic is absolutely bulletproof for remote projects."
              </p>
              <div className="flex items-center gap-6 mt-auto">
                <div className="w-16 h-16 rounded-3xl bg-amber-500 flex items-center justify-center font-black text-black text-2xl shadow-xl shrink-0 italic">DD</div>
                <div>
                  <p className="theme-title font-black text-sm uppercase tracking-[0.2em]">Denzel Damba</p>
                  <p className="text-zinc-500 text-[11px] uppercase tracking-[0.2em] mt-1 font-bold">Principal QS / Centum RE</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-16 border shadow-2xl flex flex-col justify-between h-full">
              <p className="theme-muted font-medium italic mb-12 leading-relaxed text-xl sm:text-2xl">
                "Payment certificates used to take weeks of coordination. Now, we close our monthly valuation nodes in just a few days."
              </p>
              <div className="flex items-center gap-6 mt-auto">
                <div className="theme-avatar-neutral w-16 h-16 rounded-3xl border flex items-center justify-center font-black text-2xl shadow-xl shrink-0 italic">NM</div>
                <div>
                  <p className="theme-title font-black text-sm uppercase tracking-[0.25em]">Naff Mwaura</p>
                  <p className="text-zinc-500 text-[11px] uppercase tracking-[0.2em] mt-1 font-bold">Project Manager</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 6. SYSTEM FOOTER */}
      <footer className="theme-surface-muted py-40 text-center border-t border-[color:var(--app-border)] transition-colors duration-500">
        <div className="mb-14 flex items-center justify-center gap-4">
            <div className="bg-amber-500 p-3 rounded-xl shadow-xl shadow-amber-500/20">
              <HardHat size={28} className="text-black" />
            </div>
            <span className="theme-title text-4xl sm:text-5xl font-black uppercase tracking-tighter italic">
              QS VAULT<span className="text-amber-500">.</span>
            </span>
        </div>
        <div className="space-y-8 px-10">
          <p className="text-[12px] font-black uppercase tracking-[0.6em] text-zinc-500">
            © {new Date().getFullYear()} PRECISION OS / THE PROFESSIONAL STANDARD FOR INFRASTRUCTURE.
          </p>
          <div className="flex justify-center gap-16 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic">
             <span className="hover:text-amber-500 cursor-pointer transition-colors">Integrity</span>
             <span className="text-amber-500/20">•</span>
             <span className="hover:text-amber-500 cursor-pointer transition-colors">Accuracy</span>
             <span className="text-amber-500/20">•</span>
             <span className="hover:text-amber-500 cursor-pointer transition-colors">Innovation</span>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; transition: background 0.3s; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fade-in 0.8s ease-out forwards; }
      `}</style>
    </main>
  );
};

export default MarketingPage;
