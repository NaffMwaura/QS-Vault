import { useState } from "react";
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

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "theme-nav-solid border-b py-4 backdrop-blur-md"
            : "bg-transparent py-6 sm:py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-xl shadow-xl shadow-amber-500/20">
                <HardHat size={20} className="text-black" />
              </div>
              <span className="theme-title text-2xl font-black uppercase tracking-tighter italic">
                QS VAULT<span className="text-amber-500">.</span>
              </span>
            </div>

            <div
              className={`hidden lg:flex items-center gap-3 px-5 py-2.5 rounded-full border text-[9px] font-black transition-all duration-500 uppercase tracking-[0.3em] ${
                isOnline
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse"
              }`}
            >
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? "System Online" : "Offline Mode"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-button-muted theme-muted p-3 rounded-xl transition-all active:scale-90 border border-transparent hover:border-amber-500/20 hover:text-amber-500"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Button
              variant="ghost"
              onClick={handleLogin}
              className="hidden sm:flex px-6"
            >
              Login
            </Button>

            <Button variant="primary" onClick={handleGetStarted} className="px-8 py-3">
              Get Started
            </Button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="theme-surface-inset theme-muted lg:hidden p-2.5 rounded-xl border"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="theme-overlay fixed inset-0 z-40 lg:hidden transition-all duration-300 backdrop-blur-2xl">
          <div className="flex flex-col items-center justify-center h-full space-y-6 px-8 text-center">
            <p className="theme-subtle text-xs font-black uppercase tracking-[0.35em]">
              Navigate
            </p>
            <Button
              variant="primary"
              onClick={handleGetStarted}
              className="min-w-56"
            >
              Get Started
            </Button>
            <Button variant="outline" onClick={handleLogin} className="min-w-56">
              Login
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
