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

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

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
              onClick={handleThemeToggle}
              className="theme-button-muted theme-muted theme-public-icon-button hidden sm:flex items-center justify-center transition-all active:scale-90 border border-transparent hover:border-amber-500/20 hover:text-amber-500"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
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

            <Button
              variant="primary"
              onClick={handleGetStarted}
              className="theme-public-button hidden sm:flex px-6"
            >
              Get Started
            </Button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="theme-surface-inset theme-muted theme-public-icon-button flex sm:hidden items-center justify-center border"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          aria-hidden={!mobileMenuOpen}
        >
          <button
            type="button"
            className="theme-overlay absolute inset-0 backdrop-blur-2xl"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          />
          <div
            id="mobile-navigation-menu"
            className="theme-nav-solid absolute inset-x-4 top-24 rounded-[2rem] border shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex flex-col gap-4 p-5">
              <p className="theme-public-label text-left">Navigate</p>
              <Button
                variant="primary"
                onClick={handleGetStarted}
                className="theme-public-button w-full"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                onClick={handleLogin}
                className="theme-public-button w-full"
              >
                Login
              </Button>
              <div className="mt-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  className="theme-button-muted theme-muted flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all hover:border-amber-500/20 hover:text-amber-500"
                >
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
