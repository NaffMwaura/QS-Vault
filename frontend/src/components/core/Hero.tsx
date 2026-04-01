import { ChevronRight } from "lucide-react";
import { useTypewriter } from "../../hooks/useTypewriter";
import { heroEyebrow, heroPhrases } from "../marketing/marketingContent";
import Button from "../ui/Button";

const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const typewriterText = useTypewriter(heroPhrases);
  const EyebrowIcon = heroEyebrow.icon;

  return (
    <header className="theme-public-section relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent px-6 pt-28 sm:pt-32">
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

      <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
        <div className="theme-surface-accent theme-public-chip inline-flex items-center gap-3 border mb-8 sm:mb-12 shadow-inner animate-in">
          <EyebrowIcon size={14} className="text-amber-500" />
          <span className="text-amber-600 dark:text-amber-400 leading-none">
            {heroEyebrow.label}
          </span>
        </div>

        <h1 className="mb-7 sm:mb-10">
          <span className="theme-hero-gradient block min-h-[1.25em] text-[2.1rem] font-black leading-[0.98] tracking-[-0.05em] text-transparent bg-clip-text transition-all duration-1000 sm:text-[3rem] lg:text-[3.8rem]">
            {typewriterText}
            <span className="animate-pulse text-amber-500">_</span>
          </span>
          <span className="block mt-3 text-[2rem] font-black italic leading-none tracking-[-0.05em] text-amber-500 drop-shadow-2xl sm:text-[2.8rem] lg:text-[3.4rem]">
            Site Mastery.
          </span>
        </h1>

        <p className="theme-public-body mb-10 sm:mb-14 max-w-4xl mx-auto px-2 sm:px-6">
          Eliminate error-prone spreadsheets. QS Vault digitizes construction
          takeoffs and project management while staying resilient in disconnected
          site environments.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
          <Button
            variant="primary"
            onClick={onGetStarted}
            className="theme-public-button-lg group w-full sm:w-auto px-8 sm:px-10"
            rightIcon={
              <ChevronRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            }
          >
            Start Free Trial
          </Button>
          <Button variant="outline" className="theme-public-button-lg w-full sm:w-auto px-8 sm:px-10">
            Technical Specs
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Hero;
