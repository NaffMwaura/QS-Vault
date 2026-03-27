import { HardHat } from "lucide-react";

const Footer = () => {
  return (
    <footer className="theme-surface-muted py-20 sm:py-28 text-center border-t border-[color:var(--app-border)] transition-colors duration-500">
      <div className="mb-10 flex items-center justify-center gap-4">
        <div className="bg-amber-500 p-3 rounded-xl shadow-xl shadow-amber-500/20">
          <HardHat size={28} className="text-black" />
        </div>
        <span className="theme-title text-4xl sm:text-5xl font-black uppercase tracking-tighter italic">
          QS VAULT<span className="text-amber-500">.</span>
        </span>
      </div>

      <div className="space-y-6 px-10">
        <p className="theme-subtle text-[11px] sm:text-[12px] font-black uppercase tracking-[0.35em] sm:tracking-[0.5em]">
          © {new Date().getFullYear()} Precision OS / The professional standard
          for infrastructure.
        </p>

        <div className="flex justify-center gap-6 sm:gap-10 text-[10px] font-black uppercase tracking-[0.3em] theme-subtle italic">
          <span className="hover:text-amber-500 cursor-pointer transition-colors">
            Integrity
          </span>
          <span className="text-amber-500/30">•</span>
          <span className="hover:text-amber-500 cursor-pointer transition-colors">
            Accuracy
          </span>
          <span className="text-amber-500/30">•</span>
          <span className="hover:text-amber-500 cursor-pointer transition-colors">
            Innovation
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
