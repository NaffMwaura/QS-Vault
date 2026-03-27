import { ChevronRight } from "lucide-react";
import { useTypewriter } from "../../hooks/useTypewriter";
import { heroEyebrow, heroPhrases } from "../marketing/marketingContent";
import Button from "../ui/Button";

const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const typewriterText = useTypewriter(heroPhrases);
  const EyebrowIcon = heroEyebrow.icon;

  return (
    <header className="relative min-h-screen flex items-center justify-center px-6 pt-28 sm:pt-32 overflow-hidden bg-transparent">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="theme-glow-amber absolute top-0 right-0 w-2/3 h-2/3 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/4" />
        <div className="theme-glow-neutral absolute bottom-0 left-0 w-1/2 h-1/2 rounded-full blur-[140px] translate-y-1/4 -translate-x-1/4" />
        <div
          className="theme-grid-overlay absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#f59e0b 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto text-center px-6">
        <div className="theme-surface-accent inline-flex items-center gap-4 px-5 sm:px-6 py-3 rounded-full border mb-10 sm:mb-16 shadow-inner animate-in">
          <EyebrowIcon size={14} className="text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-600 dark:text-amber-400 leading-none">
            {heroEyebrow.label}
          </span>
        </div>

        <h1 className="theme-title text-4xl sm:text-6xl md:text-7xl font-black mb-8 sm:mb-12 leading-[1.05] tracking-tighter">
          <span className="theme-hero-gradient block min-h-[1.1em] text-transparent bg-clip-text transition-all duration-1000">
            {typewriterText}
            <span className="animate-pulse text-amber-500">_</span>
          </span>
          <span className="block mt-4 italic text-amber-500 drop-shadow-2xl">
            Site Mastery.
          </span>
        </h1>

        <p className="theme-subtle text-lg sm:text-2xl md:text-3xl mb-12 sm:mb-20 max-w-5xl mx-auto font-medium leading-relaxed px-2 sm:px-6">
          Eliminate error-prone spreadsheets. QS Vault digitizes construction
          takeoffs and project management while staying resilient in disconnected
          site environments.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 justify-center items-center">
          <Button
            variant="primary"
            onClick={onGetStarted}
            className="py-6 sm:py-8 px-10 sm:px-16 group text-sm w-full sm:w-auto"
            rightIcon={
              <ChevronRight
                size={22}
                className="group-hover:translate-x-1 transition-transform"
              />
            }
          >
            Start Free Trial
          </Button>
          <Button variant="outline" className="py-6 sm:py-8 px-10 sm:px-16 text-sm w-full sm:w-auto">
            Technical Specs
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Hero;
