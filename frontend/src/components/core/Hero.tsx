import { useAuth } from "../../features/auth/AuthContext";
import { ChevronRight } from "lucide-react";
import { useTypewriter } from "../../hooks/useTypewriter";

const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => {
  useAuth();
  const typewriterText = useTypewriter([
    "Precision Cost Control.",
    "Automated BoQ Generation.",
    "Localized SMM Compliance.",
    "Offline Site Takeoffs.",
  ]);

  return (
    <header className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center px-4 sm:px-6 pt-24 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="theme-glow-amber absolute top-0 right-0 w-2/3 h-2/3 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4" />
        <div className="theme-glow-neutral absolute bottom-0 left-0 w-1/2 h-1/2 rounded-full blur-[120px] translate-y-1/4 -translate-x-1/4" />
        <div
          className="theme-grid-overlay absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#f59e0b 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center px-4">
        <div className="theme-surface-accent inline-flex items-center gap-3 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full border mb-8 sm:mb-12 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-amber-500 leading-none">
            The Professional standard for East African QS
          </span>
        </div>

        <h1 className="theme-title text-lg md:text-2xl lg:text-5xl font-black mb-8 sm:mb-10 leading-[0.9] sm:leading-[0.85] tracking-tighter transition-colors">
          <span
            className="theme-hero-gradient block min-h-[1.1em] text-transparent bg-clip-text transition-all duration-1000"
          >
            {typewriterText}
            <span className="animate-pulse text-amber-500">_</span>
          </span>
          <span className="block mt-4 sm:mt-6 italic text-amber-500 drop-shadow-2xl">
            On-Site Mastery.
          </span>
        </h1>

        <p className="theme-muted text-base sm:text-xl md:text-2xl mb-12 sm:mb-16 max-w-4xl mx-auto font-medium leading-relaxed px-4">
          Eliminate errors in takeoffs and valuations. Fully compliant with
          local SMM standards, operating at peak performance even in the most
          remote site nodes.
        </p>

        <div className="flex flex-col sm:flex-row gap-4  justify-center items-center mb-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto group bg-amber-500 text-black font-black py-5  px-5 lg:px-12 rounded-2xl sm:rounded-[2.5rem] text-xs uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/30 hover:bg-amber-400 transition-all flex items-center justify-center gap-4 hover:scale-105"
          >
            Start Free Trial
            <ChevronRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
          <button className="theme-title theme-surface-inset w-full sm:w-auto px-5 lg:px-12 py-5 rounded-2xl sm:rounded-[2.5rem] text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all border hover:border-amber-500/30">
            View Technical Specs
          </button>
        </div>
      </div>
    </header>
  );
};

export default Hero;
