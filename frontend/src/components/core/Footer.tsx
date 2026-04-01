import { HardHat } from "lucide-react";

const Footer = () => {
  return (
    <footer className="theme-surface-muted border-t border-[color:var(--app-border)] py-16 sm:py-20 text-center transition-colors duration-500">
      <div className="mb-8 flex items-center justify-center gap-4">
        <div className="rounded-xl bg-amber-500 p-3 shadow-xl shadow-amber-500/20">
          <HardHat size={24} className="text-black" />
        </div>
        <span className="theme-title text-3xl sm:text-4xl font-black uppercase tracking-tighter italic">
          QS VAULT<span className="text-amber-500">.</span>
        </span>
      </div>

      <div className="space-y-5 px-6 sm:px-10">
        <p className="theme-public-meta text-[0.78rem] sm:text-[0.82rem] uppercase tracking-[0.16em] sm:tracking-[0.2em]">
          © {new Date().getFullYear()} Precision OS / The professional standard for
          infrastructure.
        </p>

        <div className="theme-public-meta flex flex-wrap justify-center gap-4 text-[0.76rem] uppercase tracking-[0.14em] italic sm:gap-6">
          <span className="cursor-pointer transition-colors hover:text-amber-500">
            Integrity
          </span>
          <span className="text-amber-500/30">•</span>
          <span className="cursor-pointer transition-colors hover:text-amber-500">
            Accuracy
          </span>
          <span className="text-amber-500/30">•</span>
          <span className="cursor-pointer transition-colors hover:text-amber-500">
            Innovation
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
