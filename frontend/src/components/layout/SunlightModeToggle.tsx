import React, { useState, useEffect } from 'react';
import { SunMedium, Zap, Eye } from 'lucide-react';
import { useAuth } from "../../features/auth/AuthContext";

const SunlightModeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAuth();
  const [isSunlightMode, setIsSunlightMode] = useState(false);

  useEffect(() => {
    if (isSunlightMode) {
      document.documentElement.classList.add('sunlight-optimized');
      if (theme === 'dark') {
        toggleTheme();
      }
    } else {
      document.documentElement.classList.remove('sunlight-optimized');
    }
  }, [isSunlightMode, theme, toggleTheme]);

  const toggleVisibilityMode = () => setIsSunlightMode(!isSunlightMode);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleVisibilityMode}
        className={`relative flex items-center gap-3 px-5 py-2.5 sm:px-8 sm:py-4 rounded-2xl transition-all duration-500 group overflow-hidden active:scale-95 ${
          isSunlightMode ? 'theme-button-primary shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'theme-button-secondary'
        }`}
        title="Optimize screen for direct sunlight"
      >
        {isSunlightMode && <span className="absolute inset-0 bg-white/20 animate-pulse" />}
        <div className="relative z-10 flex items-center gap-3">
          {isSunlightMode ? (
            <Zap size={18} className="fill-current animate-bounce" />
          ) : (
            <SunMedium size={18} className="group-hover:rotate-90 transition-transform duration-700" />
          )}
          <span className="text-[10px] font-black uppercase tracking-[0.25em] leading-none">
            {isSunlightMode ? 'Sunlight Mode Active' : 'Sunlight Boost'}
          </span>
        </div>
      </button>

      {isSunlightMode && (
        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl theme-panel animate-in fade-in slide-in-from-right-4 duration-500 shadow-2xl">
          <Eye size={14} className="theme-accent" />
          <p className="text-[9px] font-black uppercase tracking-widest theme-meta leading-none">
            High Contrast: <span className="theme-total-value">Engaged</span>
          </p>
        </div>
      )}

      <style>{`
        :root.sunlight-optimized {
          --app-bg: #ffffff !important;
          --app-surface: #ffffff !important;
          --app-surface-elevated: #ffffff !important;
          --app-border: #000000 !important;
          --app-body: #000000 !important;
          --app-heading: #000000 !important;
          --app-meta: #000000 !important;
          --app-icon: #000000 !important;
          --app-secondary-bg: #ffffff !important;
          --app-secondary-fg: #000000 !important;
          --app-secondary-border: #000000 !important;
          --app-shadow-card: none !important;
        }

        :root.sunlight-optimized .backdrop-blur-3xl,
        :root.sunlight-optimized .backdrop-blur-2xl,
        :root.sunlight-optimized .backdrop-blur-md {
          backdrop-filter: none !important;
        }
      `}</style>
    </div>
  );
};

export default SunlightModeToggle;
