import { useEffect, useState } from "react";
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
  Menu,
  X,
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
    REUSABLE COMPONENTS (Refined professional spacing)
   ====================================================== */

interface CardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  theme: 'light' | 'dark';
}

const FeatureCard = ({ icon: Icon, title, description, theme }: CardProps) => (
  <div className={`p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border transition-all duration-500 hover:scale-[1.02] text-center group relative overflow-hidden
    ${theme === 'dark' 
      ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl hover:border-amber-500/30' 
      : 'bg-white border-zinc-200 shadow-xl hover:border-amber-500/30'}`}>
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/10 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-amber-500 transition-all duration-500">
      <Icon size={32} className="text-amber-500 group-hover:text-black transition-colors" />
    </div>
    <h3 className={`text-lg sm:text-xl font-black uppercase tracking-tight mb-4 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
    <p className={`text-sm leading-relaxed font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{description}</p>
  </div>
);

const ValuePropCard = ({ icon: Icon, title, description, theme }: CardProps) => (
  <div className={`p-6 sm:p-8 border rounded-2xl sm:rounded-3xl transition-all duration-500 hover:border-amber-500/30 space-y-4 flex flex-col items-start text-left group
    ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
    <div className="p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform">
      <Icon size={20} className="text-amber-500" />
    </div>
    <div>
      <h3 className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] mb-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
      <p className={`text-[11px] sm:text-xs leading-relaxed font-bold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{description}</p>
    </div>
  </div>
);

/* ======================================================
    NAVIGATION BAR (Mobile Friendly)
   ====================================================== */

const NavigationBar = ({ onAuthClick }: { onAuthClick: () => void }) => {
  const { theme, toggleTheme } = useAuth();
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <>
      <nav className={`
        fixed top-0 inset-x-0 z-50 transition-all duration-500
        ${scrolled 
          ? (theme === 'dark' ? "bg-[#09090b]/80 border-zinc-800/50" : "bg-white/80 border-zinc-200/50") + " border-b py-3 sm:py-4 shadow-lg backdrop-blur-md" 
          : "bg-transparent py-6 sm:py-8"}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-amber-500 p-2 rounded-lg sm:rounded-xl shadow-xl shadow-amber-500/20">
                <HardHat size={20} className="text-black" />
              </div>
              <span className={`text-2xl sm:text-3xl font-black uppercase tracking-tighter italic ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                QS VAULT<span className="text-amber-500">.</span>
              </span>
            </div>

            <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black transition-all duration-500 uppercase tracking-[0.2em] ${
              isOnline 
                ? (theme === 'dark' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600") 
                : "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"
            }`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOnline ? "Infrastructure Synced" : "Offline Mode"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2.5 sm:p-3 rounded-xl transition-all active:scale-90 border border-transparent hover:border-amber-500/20
                ${theme === 'dark' ? 'bg-zinc-800 text-zinc-500 hover:text-amber-500' : 'bg-zinc-200 text-zinc-600 hover:text-amber-600'}`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <button
              onClick={onAuthClick}
              className={`hidden sm:block text-[11px] font-black uppercase tracking-[0.2em] transition-colors
                ${theme === 'dark' ? 'text-zinc-200 hover:text-amber-500' : 'text-zinc-500 hover:text-amber-600'}`}
            >
               Login
            </button>
            
            <button
              onClick={onAuthClick}
              className="bg-amber-500 text-black px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest sm:tracking-[0.2em] shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all active:scale-95"
            >
              Get Started
            </button>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`sm:hidden p-2 rounded-xl border ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900 text-zinc-400' : 'border-zinc-200 bg-zinc-100 text-zinc-600'}`}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className={`fixed inset-0 z-40 sm:hidden transition-all duration-300 backdrop-blur-xl
          ${theme === 'dark' ? 'bg-[#09090b]/95' : 'bg-white/95'}`}>
          <div className="flex flex-col items-center justify-center h-full space-y-10 px-8">
            <button onClick={() => { setMobileMenuOpen(false); onAuthClick(); }} className={`text-2xl font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Login</button>
            <button onClick={() => { setMobileMenuOpen(false); onAuthClick(); }} className={`text-2xl font-black uppercase tracking-widest text-amber-500`}>Pricing</button>
            <button onClick={() => { setMobileMenuOpen(false); onAuthClick(); }} className={`text-2xl font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>About</button>
            <div className="pt-10 border-t border-zinc-800 w-full flex justify-center gap-8">
               <button onClick={toggleTheme} className="p-4 rounded-full bg-amber-500/10 text-amber-500">
                 {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ======================================================
    MARKETING PAGE (Refined spacing & Professional UI)
   ====================================================== */

const MarketingPage = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const { theme } = useAuth();
  const typewriterText = useTypewriter([
    "Precision Cost Control.",
    "Automated BoQ Generation.",
    "Localized SMM Compliance.",
    "Offline Site Takeoffs.",
  ]);

  return (
    <main className={`min-h-screen selection:bg-amber-500/30 selection:text-black transition-colors duration-500 overflow-x-hidden custom-scrollbar
      ${theme === 'dark' ? 'bg-[#09090b] text-white' : 'bg-zinc-100 text-zinc-900'}`}>
      
      <NavigationBar onAuthClick={onGetStarted} />

      {/* HERO SECTION */}
      <header className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center px-4 sm:px-6 pt-24 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className={`absolute top-0 right-0 w-2/3 h-2/3 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4 ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-500/5'}`} />
           <div className={`absolute bottom-0 left-0 w-1/2 h-1/2 rounded-full blur-[120px] translate-y-1/4 -translate-x-1/4 ${theme === 'dark' ? 'bg-zinc-500/10' : 'bg-zinc-500/5'}`} />
           <div className={`absolute inset-0 ${theme === 'dark' ? 'opacity-[0.07]' : 'opacity-[0.03]'}`} 
                style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center px-4">
          <div className={`inline-flex items-center gap-3 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full border mb-8 sm:mb-12 shadow-inner
            ${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-500/5 border-amber-500/10'}`}>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-amber-500 leading-none">
              The Professional standard for East African QS
            </span>
          </div>

          <h1 className={`text-4xl sm:text-6xl md:text-8xl font-black mb-8 sm:mb-10 leading-[0.9] sm:leading-[0.85] tracking-tighter transition-colors
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            <span className={`block min-h-[1.1em] text-transparent bg-clip-text transition-all duration-1000
              ${theme === 'dark' ? 'bg-linear-to-b from-white to-zinc-600' : 'bg-linear-to-b from-zinc-900 to-zinc-500'}`}>
              {typewriterText}<span className="animate-pulse text-amber-500">_</span>
            </span>
            <span className="block mt-4 sm:mt-6 italic text-amber-500 drop-shadow-2xl">On-Site Mastery.</span>
          </h1>

          <p className={`text-base sm:text-xl md:text-2xl mb-12 sm:mb-16 max-w-4xl mx-auto font-medium leading-relaxed px-4
            ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Eliminate errors in takeoffs and valuations. Fully compliant with local SMM standards, operating at peak performance even in the most remote site nodes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto group bg-amber-500 text-black font-black py-5 sm:py-6 px-12 sm:px-16 rounded-2xl sm:rounded-[2.5rem] text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-2xl shadow-amber-500/30 hover:bg-amber-400 transition-all flex items-center justify-center gap-4 hover:scale-105"
            >
              Start Free Trial 
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className={`w-full sm:w-auto px-12 sm:px-16 py-5 sm:py-6 rounded-2xl sm:rounded-[2.5rem] text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all
              ${theme === 'dark' 
                ? 'border border-zinc-800 text-white hover:bg-zinc-900' 
                : 'border border-zinc-300 text-zinc-900 hover:bg-white shadow-sm'}`}>
              View Technical Specs
            </button>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS (Breathing Room Spacing) */}
      <section className={`py-24 sm:py-40 px-4 sm:px-6 border-y relative overflow-hidden transition-colors duration-500
        ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className={`text-4xl sm:text-7xl font-black mb-16 sm:mb-32 tracking-tighter uppercase leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Measure. <span className="text-amber-500 italic">Estimate.</span> Certify.
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
              <h2 className={`text-4xl sm:text-6xl font-black tracking-tight mb-8 uppercase leading-[1.1]
                ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                Drafting-Grade Tools,<br className="hidden sm:block" /> Optimized for the site Node.
              </h2>
              <p className={`text-lg sm:text-xl font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Modern infrastructure demands high-speed precision. We’ve stripped away the complexity of legacy software to focus on pure quantity takeoff performance.
              </p>
            </div>
            <div className={`w-full lg:w-auto border p-6 sm:p-8 rounded-4xl shadow-xl transition-colors
              ${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-500/5 border-amber-500/10'}`}>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-3">Compliance Engine</p>
              <p className={`text-2xl sm:text-3xl font-black italic ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>SMM-KE / RICS 2026</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
            <ValuePropCard theme={theme} icon={Zap} title="Offline-First PWA" description="Basement sites or remote projects? Your measurements stay encrypted locally and sync the second you're online." />
            <ValuePropCard theme={theme} icon={MapPin} title="Localized Rules" description="Fully aligned with East African SMM for roads, buildings, and civil works. No more manual compliance checks." />
            <ValuePropCard theme={theme} icon={DollarSign} title="Waste Minimization" description="Precision takeoff logic minimizes material waste by providing exact component volumes from on-site measurements." />
            <ValuePropCard theme={theme} icon={LayoutGrid} title="Resource Intelligence" description="Automatically generate material schedules and labor estimates based on your quantified BoQ data streams." />
            <ValuePropCard theme={theme} icon={Tablet} title="Real-Time Sync" description="Collaborative project management. Share takeoff results with the office team in real-time when signal permits." />
            <ValuePropCard theme={theme} icon={CheckCircle} title="Site-Ready UX" description="A high-contrast interface designed for low-light site environments and high-glare outdoor site use." />
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className={`py-24 sm:py-48 px-4 sm:px-6 overflow-hidden relative transition-colors duration-500
        ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-100'}`}>
        {theme === 'dark' && (
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-amber-500/5 blur-[150px] rounded-full"></div>
        )}
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className={`text-4xl sm:text-7xl font-black uppercase tracking-tighter mb-16 sm:mb-32 italic leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Trusted by the <span className="text-amber-500">Elite</span><br className="hidden sm:block" /> Construction Nodes.
          </h2>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-16 text-left">
            <div className={`p-8 sm:p-12 rounded-[3rem] border transition-all duration-500 group
              ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>
              <p className={`font-medium italic mb-10 leading-relaxed text-base sm:text-xl
                ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                "QS Vault is the only tool that actually understands the reality of site work in Kenya. The offline logic is absolutely bulletproof."
              </p>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-black text-xl shadow-lg shrink-0">DD</div>
                <div>
                  <p className={`font-black text-xs uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Denzel Damba</p>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">Lead QS / Centum RE</p>
                </div>
              </div>
            </div>
            <div className={`p-8 sm:p-12 rounded-[3rem] border transition-all duration-500 group
              ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>
              <p className={`font-medium italic mb-10 leading-relaxed text-base sm:text-xl
                ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                "Interim certificate preparation used to take weeks. With this module, we’re closing valuation nodes in just a few days."
              </p>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-amber-500 text-xl shadow-lg shrink-0">NM</div>
                <div>
                  <p className={`font-black text-xs uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Naff Mwaura</p>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">Chartered Project Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`py-16 sm:py-32 text-center border-t transition-colors duration-500
        ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
        <div className="mb-10 flex items-center justify-center gap-3">
            <div className="bg-amber-500 p-2 rounded-xl shadow-xl shadow-amber-500/20">
              <HardHat size={24} className="text-black" />
            </div>
            <span className={`text-3xl sm:text-4xl font-black uppercase tracking-tighter italic ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              QS VAULT<span className="text-amber-500">.</span>
            </span>
        </div>
        <div className="space-y-6 px-8">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-zinc-500">
            © {new Date().getFullYear()} PRECISION TAKEOFF SYSTEM / DEVELOPED FOR SUB-SAHARAN INFRASTRUCTURE.
          </p>
          <div className="flex justify-center gap-6 sm:gap-12 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-zinc-600 italic">
             <span className="hover:text-amber-500 cursor-pointer transition-colors">Integrity</span>
             <span className="text-amber-500/20 hidden sm:inline">•</span>
             <span className="hover:text-amber-500 cursor-pointer transition-colors">Accuracy</span>
             <span className="text-amber-500/20 hidden sm:inline">•</span>
             <span className="hover:text-amber-500 cursor-pointer transition-colors">Innovation</span>
          </div>
        </div>
      </footer>

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