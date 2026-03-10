import React, { useState, useEffect } from 'react';
import {
    SunMedium,
    Zap,
     Highlighter
} from 'lucide-react';

/* ======================================================
    MODULE RESOLUTION HANDLER (SANDBOX COMPATIBILITY)
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
    theme: 'dark',
    toggleTheme: () => console.log("Theme Toggle Handshake Initiated"),
});

const resolveModules = async () => {
    try {
        // @ts-
        const authMod = await import("../../features/auth/AuthContext");
        if (authMod.useAuth) useAuth = authMod.useAuth;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        // Sandbox fallback active
    }
};

resolveModules();

/** --- MAIN COMPONENT --- **/

const SunlightModeToggle: React.FC = () => {
    const { theme, toggleTheme } = useAuth();
    const [isSunlightMode, setIsSunlightMode] = useState(false);

    // When Sunlight Mode is active, we force a high-contrast CSS injection
    useEffect(() => {
        if (isSunlightMode) {
            document.documentElement.classList.add('sunlight-optimized');
            // Force light theme as the base for sunlight optimization if currently dark
            if (theme === 'dark') {
                toggleTheme();
            }
        } else {
            document.documentElement.classList.remove('sunlight-optimized');
        }
    }, [isSunlightMode, theme, toggleTheme]);

    const toggleSunlightProtocol = () => {
        setIsSunlightMode(!isSunlightMode);
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={toggleSunlightProtocol}
                className={`
          relative flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border transition-all duration-500 group overflow-hidden
          ${isSunlightMode
                        ? 'bg-amber-500 border-amber-600 text-black shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                        : theme === 'dark'
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-amber-500/50 hover:text-amber-500'
                            : 'bg-white border-zinc-200 text-zinc-400 hover:border-amber-500/50 hover:text-amber-600 shadow-sm'}
        `}
                title="Toggle High-Contrast Sunlight Mode"
            >
                {/* Animated Background Pulse for Active State */}
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
                        {isSunlightMode ? 'Sunlight Active' : 'Sunlight Mode'}
                    </span>
                </div>
            </button>

            {/* Mode Indicator Node (Visible only when optimized) */}
            {isSunlightMode && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 animate-in fade-in slide-in-from-right-4">
                    <Highlighter size={12} className="text-amber-500" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 leading-none">
                        Contrast Boost: 100%
                    </p>
                </div>
            )}

            {/* Global CSS for Sunlight Mode Optimization */}
            <style>{`
        .sunlight-optimized {
          --sunlight-bg: #ffffff;
          --sunlight-text: #000000;
          --sunlight-accent: #f59e0b;
        }

        .sunlight-optimized body {
          background-color: var(--sunlight-bg) !important;
          color: var(--sunlight-text) !important;
        }

        /* Eliminate soft shadows and grays for high-glare environments */
        .sunlight-optimized .backdrop-blur-3xl,
        .sunlight-optimized .backdrop-blur-md {
          backdrop-filter: none !important;
          background-color: var(--sunlight-bg) !important;
        }

        .sunlight-optimized .border-zinc-800,
        .sunlight-optimized .border-zinc-200,
        .sunlight-optimized .border-zinc-800/40 {
          border-color: #000000 !important;
          border-width: 2px !important;
        }

        .sunlight-optimized .text-zinc-400,
        .sunlight-optimized .text-zinc-500,
        .sunlight-optimized .text-zinc-600 {
          color: #000000 !important;
          font-weight: 900 !important;
        }

        .sunlight-optimized .bg-zinc-900/20,
        .sunlight-optimized .bg-zinc-900/40,
        .sunlight-optimized .bg-zinc-950/60 {
          background-color: #ffffff !important;
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