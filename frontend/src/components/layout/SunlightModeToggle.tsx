import React, { useState, useEffect } from 'react';
import { 
  SunMedium, 
  Zap, 
  Highlighter
} from 'lucide-react';

/* ======================================================
    MODULE RESOLUTION HANDLER (SANDBOX COMPATIBILITY)
    Ensures the component compiles while linking to your
    local office security settings.
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  theme: 'dark',
  toggleTheme: () => console.log("Appearance change requested"),
});

const resolveModules = async () => {
  try {
    // Attempt to resolve real project modules
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Fallback to mock for stability
  }
};

resolveModules();

/** --- MAIN COMPONENT: OUTDOOR VISIBILITY TOGGLE --- **/

const SunlightModeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAuth();
  const [isSunlightMode, setIsSunlightMode] = useState(false);

  // When Outdoor Mode is active, we apply a high-contrast style 
  // to make the screen visible in direct sunlight.
  useEffect(() => {
    if (isSunlightMode) {
      document.documentElement.classList.add('sunlight-optimized');
      
      // If the user is in Dark Mode, we force a switch to Light Mode
      // as it provides better contrast outdoors.
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
          relative flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border transition-all duration-500 group overflow-hidden
          ${isSunlightMode 
            ? 'bg-amber-500 border-amber-600 text-black shadow-[0_0_30px_rgba(245,158,11,0.4)]' 
            : theme === 'dark'
              ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-amber-500/50 hover:text-amber-500'
              : 'bg-white border-zinc-200 text-zinc-400 hover:border-amber-500/50 hover:text-amber-600 shadow-sm'}
        `}
        title="Optimize screen for direct sunlight"
      >
        {/* Visual Pulse for Active State */}
        {isSunlightMode && (
          <span className="absolute inset-0 bg-white/20 animate-pulse" />
        )}

        <div className="relative z-10 flex items-center gap-3">
          {isSunlightMode ? (
            <Zap size={16} className="fill-current animate-bounce" />
          ) : (
            <SunMedium size={16} className="group-hover:rotate-90 transition-transform duration-700" />
          )}
          
          <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">
            {isSunlightMode ? 'Outdoor Mode Active' : 'Outdoor Visibility'}
          </span>
        </div>
      </button>

      {/* Visibility Status (Desktop only) */}
      {isSunlightMode && (
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 animate-in fade-in slide-in-from-right-4">
          <Highlighter size={12} className="text-amber-500" />
          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 leading-none">
            Contrast Boost: ON
          </p>
        </div>
      )}

      {/* Styles for High-Glare Environments */}
      <style>{`
        .sunlight-optimized {
          --sunlight-bg: #ffffff;
          --sunlight-text: #000000;
        }

        .sunlight-optimized body {
          background-color: var(--sunlight-bg) !important;
          color: var(--sunlight-text) !important;
        }

        /* Remove transparency and blurs to ensure text is readable outside */
        .sunlight-optimized .backdrop-blur-3xl,
        .sunlight-optimized .backdrop-blur-md {
          backdrop-filter: none !important;
          background-color: var(--sunlight-bg) !important;
        }

        .sunlight-optimized .border-zinc-800,
        .sunlight-optimized .border-zinc-200 {
          border-color: #000000 !important;
          border-width: 2px !important;
        }

        .sunlight-optimized .text-zinc-400,
        .sunlight-optimized .text-zinc-500,
        .sunlight-optimized .text-zinc-600 {
          color: #000000 !important;
          font-weight: 900 !important;
        }

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