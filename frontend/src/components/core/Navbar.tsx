import { useEffect, useState } from "react";
import { Sun, Moon, Wifi, WifiOff, HardHat, Menu, X } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

export const NavigationBar = ({ onAuthClick }: { onAuthClick: () => void }) => {
  const { theme, toggleTheme } = useAuth();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
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
      <nav
        className={`
        fixed top-0 inset-x-0 z-50 transition-all duration-500
        ${
          scrolled
            ? (theme === "dark"
                ? "bg-[#09090b]/80 border-zinc-800/50"
                : "bg-white/80 border-zinc-200/50") +
              " border-b py-3 sm:py-4 shadow-lg backdrop-blur-md"
            : "bg-transparent py-6 sm:py-8"
        }
      `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-amber-500 p-2 rounded-lg sm:rounded-xl shadow-xl shadow-amber-500/20">
                <HardHat size={20} className="text-black" />
              </div>
              <span
                className={`text-2xl  font-black uppercase tracking-tighter italic ${theme === "dark" ? "text-white" : "text-zinc-900"}`}
              >
                QS VAULT<span className="text-amber-500">.</span>
              </span>
            </div>

            <div
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black transition-all duration-500 uppercase tracking-[0.2em] ${
                isOnline
                  ? theme === "dark"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                  : "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"
              }`}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOnline ? "Infrastructure Synced" : "Offline Mode"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2.5 sm:p-3 rounded-xl transition-all active:scale-90 border border-transparent hover:border-amber-500/20
                ${theme === "dark" ? "bg-zinc-800 text-zinc-500 hover:text-amber-500" : "bg-zinc-200 text-zinc-600 hover:text-amber-600"}`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={onAuthClick}
              className={`hidden sm:block text-[11px] font-black uppercase tracking-[0.2em] transition-colors
                ${theme === "dark" ? "text-zinc-200 hover:text-amber-500" : "text-zinc-500 hover:text-amber-600"}`}
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
              className={`sm:hidden p-2 rounded-xl border ${theme === "dark" ? "border-zinc-800 bg-zinc-900 text-zinc-400" : "border-zinc-200 bg-zinc-100 text-zinc-600"}`}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div
          className={`fixed inset-0 z-40 sm:hidden transition-all duration-300 backdrop-blur-xl
          ${theme === "dark" ? "bg-[#09090b]/95" : "bg-white/95"}`}
        >
          <div className="flex flex-col items-center justify-center h-full space-y-10 px-8">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onAuthClick();
              }}
              className={`text-2xl font-black uppercase tracking-widest ${theme === "dark" ? "text-white" : "text-zinc-900"}`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onAuthClick();
              }}
              className={`text-2xl font-black uppercase tracking-widest text-amber-500`}
            >
              Pricing
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onAuthClick();
              }}
              className={`text-2xl font-black uppercase tracking-widest ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}
            >
              About
            </button>
            <div className="pt-10 border-t border-zinc-800 w-full flex justify-center gap-8">
              <button
                onClick={toggleTheme}
                className="p-4 rounded-full bg-amber-500/10 text-amber-500"
              >
                {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
