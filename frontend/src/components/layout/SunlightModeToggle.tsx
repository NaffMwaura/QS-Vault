import React, { useState, useEffect } from 'react';
import {
  SunMedium,
  Zap,
  Eye
} from 'lucide-react';
import { useAuth } from "../../features/auth/AuthContext";

/** --- MAIN COMPONENT: SITE VISIBILITY ENGINE --- **/

const SunlightModeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAuth();
  const [isSunlightMode, setIsSunlightMode] = useState(false);

  /** * SITE VISIBILITY LOGIC
   * When 'Sunlight Mode' is active, we force a high-contrast white background.
   * This is critical for reading BoQ numbers and drawings in direct sunlight.
   */
  useEffect(() => {
    if (isSunlightMode) {
      document.documentElement.classList.add('sunlight-optimized');

      // Force switch to Light Mode if currently in Dark Mode
      // Dark mode is impossible to read in high-glare environments.
      if (theme === 'dark') {
        toggleTheme();
      }
    } else {
      document.documentElement.classList.remove('sunlight-optimized');
    }
  }, [isSunlightMode, theme, toggleTheme]);

  const toggleVisibilityMode = () => {
    setIsSunlightMode(!isSunlightMode);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleVisibilityMode}
        className={`
          relative flex items-center gap-3 px-5 py-2.5 sm:px-8 sm:py-4 rounded-2xl border transition-all duration-500 group overflow-hidden active:scale-95
          ${isSunlightMode
            ? 'bg-amber-500 border-amber-600 text-black shadow-[0_0_30px_rgba(245,158,11,0.3)]'
            : theme === 'dark'
              ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-amber-500/50 hover:text-amber-500'
              : 'bg-white border-zinc-200 text-zinc-400 hover:border-amber-500/50 hover:text-amber-600 shadow-sm'}
        `}
        title="Optimize screen for direct sunlight"
      >
        {/* Visual Pulse: Signals that a visibility modifier is active */}
        {isSunlightMode && (
          <span className="absolute inset-0 bg-white/20 animate-pulse" />
        )}

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

      {/* Visibility Badge: Confirms the hardware-level contrast change */}
      {isSunlightMode && (
        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 animate-in fade-in slide-in-from-right-4 duration-500 shadow-2xl">
          <Eye size={14} className="text-amber-500" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none">
            High Contrast: <span className="text-emerald-500">Engaged</span>
          </p>
        </div>
      )}

      {/* GLOBAL CSS OVERRIDES: THE "PAPER-WHITE" PROTOCOL */}
      <style>{`
        .sunlight-optimized {
          --sunlight-bg: #ffffff;
          --sunlight-text: #000000;
          --sunlight-border: #000000;
        }

        .sunlight-optimized body {
          background-color: var(--sunlight-bg) !important;
          color: var(--sunlight-text) !important;
        }

        /* Kill all transparency and blur - these are hard to see outdoors */
        .sunlight-optimized .backdrop-blur-3xl,
        .sunlight-optimized .backdrop-blur-2xl,
        .sunlight-optimized .backdrop-blur-md {
          backdrop-filter: none !important;
          background-color: var(--sunlight-bg) !important;
        }

        /* Heavy black borders for structural clarity */
        .sunlight-optimized .border-zinc-800,
        .sunlight-optimized .border-zinc-700,
        .sunlight-optimized .border-zinc-200 {
          border-color: var(--sunlight-border) !important;
          border-width: 2px !important;
        }

        /* Force pure black text for readability */
        .sunlight-optimized .text-zinc-400,
        .sunlight-optimized .text-zinc-500,
        .sunlight-optimized .text-zinc-600 {
          color: var(--sunlight-text) !important;
          font-weight: 900 !important;
          opacity: 1 !important;
        }

        /* Adjust buttons that aren't the primary amber ones */
        .sunlight-optimized button:not(.bg-amber-500) {
          background-color: #ffffff !important;
          border: 2px solid #000000 !important;
          color: #000000 !important;
        }
      `}</style>
    </div>
  );
};

export default SunlightModeToggle;
