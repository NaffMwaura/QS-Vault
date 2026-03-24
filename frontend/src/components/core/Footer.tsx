import { HardHat } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

const Footer = () => {
  const { theme } = useAuth();
  return (
    <footer
      className={`py-16 sm:py-32 text-center border-t transition-colors duration-500
        ${theme === "dark" ? "bg-[#09090b] border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
    >
      <div className="mb-10 flex items-center justify-center gap-3">
        <div className="bg-amber-500 p-2 rounded-xl shadow-xl shadow-amber-500/20">
          <HardHat size={24} className="text-black" />
        </div>
        <span
          className={`text-3xl sm:text-4xl font-black uppercase tracking-tighter italic ${theme === "dark" ? "text-white" : "text-zinc-900"}`}
        >
          QS VAULT<span className="text-amber-500">.</span>
        </span>
      </div>
      <div className="space-y-6 px-8">
        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-zinc-500">
          © {new Date().getFullYear()} PRECISION TAKEOFF SYSTEM / DEVELOPED FOR
          SUB-SAHARAN INFRASTRUCTURE.
        </p>
        <div className="flex justify-center gap-6 sm:gap-12 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-zinc-600 italic">
          <span className="hover:text-amber-500 cursor-pointer transition-colors">
            Integrity
          </span>
          <span className="text-amber-500/20 hidden sm:inline">•</span>
          <span className="hover:text-amber-500 cursor-pointer transition-colors">
            Accuracy
          </span>
          <span className="text-amber-500/20 hidden sm:inline">•</span>
          <span className="hover:text-amber-500 cursor-pointer transition-colors">
            Innovation
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
