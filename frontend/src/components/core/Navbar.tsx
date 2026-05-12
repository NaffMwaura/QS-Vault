import { useEffect, useState } from "react";
import { Sun, Moon, Wifi, WifiOff, HardHat, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useScrolled } from "../../hooks/useScrolled";
import Button from "../ui/Button";

interface NavigationBarProps {
  onGetStarted: () => void;
  onLoginClick?: () => void;
}

export const NavigationBar = ({
  onGetStarted,
  onLoginClick,
}: NavigationBarProps) => {
  const { theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const scrolled = useScrolled(20);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on Escape key or handle body scroll lock
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  const handleLogin = () => {
    setMobileMenuOpen(false);
    if (onLoginClick) {
      onLoginClick();
      return;
    }
    navigate("/login");
  };

  const handleGetStarted = () => {
    setMobileMenuOpen(false);
    onGetStarted();
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  return (
    <>
      {/* 1. MAIN NAVIGATION BAR */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "theme-panel border-t-0 border-x-0 rounded-none py-3.5 shadow-lg"
            : "bg-transparent py-5 sm:py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex justify-between items-center gap-4">
          
          {/* Logo & Connection Status */}
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <div 
                className="p-2 rounded-xl shadow-xl transition-transform hover:scale-105"
                style={{ backgroundColor: 'var(--app-accent-strong)', color: 'var(--app-bg)' }}
              >
                <HardHat size={20} />
              </div>
              <span className="theme-heading text-2xl tracking-tighter italic">
                QS VAULT<span className="theme-accent">.</span>
              </span>
            </div>

            <div
              className={`hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                isOnline
                  ? "theme-status-online border-emerald-500/20"
                  : "theme-status-offline border-rose-500/20 animate-pulse"
              }`}
            >
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? "System Online" : "Offline Mode"}</span>
            </div>
          </div>

          {/* Desktop Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleThemeToggle}
              className="theme-card p-2.5 flex items-center justify-center transition-all active:scale-90 hover:theme-accent"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Button
              variant="ghost"
              onClick={handleLogin}
              className="hidden sm:flex px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Login
            </Button>

            <Button
              variant="primary"
              onClick={handleGetStarted}
              className="hidden sm:flex px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl"
            >
              Get Started
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="theme-card flex sm:hidden p-2.5 items-center justify-center transition-all active:scale-90"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 sm:hidden animate-in fade-in duration-300">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 theme-page opacity-95 backdrop-blur-2xl" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          
          {/* Menu Panel */}
          <div className="absolute inset-x-4 top-24 theme-panel p-8 flex flex-col gap-6 shadow-2xl rounded-4xl">
            <p className="theme-meta text-[10px] font-black uppercase tracking-[0.2em] mb-2">Navigate</p>
            
            <Button
              variant="primary"
              onClick={handleGetStarted}
              className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg"
            >
              Get Started
            </Button>
            
            <Button
              variant="outline"
              onClick={handleLogin}
              className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest"
            >
              Login
            </Button>

            <div className="mt-4 pt-6 border-t theme-divider flex items-center justify-between">
              <span className="theme-meta text-[10px] font-black uppercase tracking-widest">
                Appearance
              </span>
              <button
                type="button"
                onClick={handleThemeToggle}
                className="theme-card p-3 rounded-xl flex items-center gap-3 transition-all active:scale-95"
              >
                <span className="text-[10px] font-black uppercase">
                  {theme === "dark" ? "Light" : "Dark"}
                </span>
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};