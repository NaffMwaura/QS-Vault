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
            ? "theme-nav-solid border-b py-3.5 backdrop-blur-md"
            : "bg-transparent py-5 sm:py-6"
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
              className={`theme-public-chip hidden lg:flex items-center gap-3 border transition-all duration-500 ${
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
              className="theme-button-muted theme-muted theme-public-icon-button flex items-center justify-center transition-all active:scale-90 border border-transparent hover:border-amber-500/20 hover:text-amber-500"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Button
              variant="ghost"
              onClick={handleLogin}
              className="theme-public-button hidden sm:flex px-5"
            >
              Login
            </Button>

            <Button variant="primary" onClick={handleGetStarted} className="theme-public-button px-6">
              Get Started
            </Button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="theme-surface-inset theme-muted theme-public-icon-button lg:hidden flex items-center justify-center border"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="theme-overlay fixed inset-0 z-40 lg:hidden transition-all duration-300 backdrop-blur-2xl">
          <div className="flex flex-col items-center justify-center h-full space-y-6 px-8 text-center">
            <p className="theme-public-label">
              Navigate
            </p>
            <Button
              variant="primary"
              onClick={handleGetStarted}
              className="theme-public-button-lg min-w-56"
            >
              Get Started
            </Button>
            <Button variant="outline" onClick={handleLogin} className="theme-public-button-lg min-w-56">
              Login
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
