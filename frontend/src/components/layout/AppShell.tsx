/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from "react-router-dom";
import { HardHat, ShieldCheck, WifiOff } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

let HUDHeader: any = () => null;
let SidebarCommand: any = () => null;

/** 
 * Modular Loader: Handles the injection of layout components.
 * Optimized to prevent multiple re-renders.
 */
const resolveModules = async () => {
  try {
    const [headerMod, sidebarMod] = await Promise.all([
      import("./HUDHeader"),
      import("./SidebarCommand")
    ]);
    HUDHeader = headerMod.default;
    SidebarCommand = sidebarMod.default;
    return true;
  } catch (e) {
    return false;
  }
};

const OfficeLoader = ({ isOnline }: { isOnline: boolean }) => (
  <div className="theme-page fixed inset-0 z-100] flex flex-col items-center justify-center p-6 text-center">
    <div className="relative mb-12 h-24 w-24 sm:h-32 sm:w-32">
      <div className="theme-border absolute inset-0 rounded-full border-4 opacity-10" />
      <div className="theme-accent absolute inset-0 animate-[spin_2s_linear_infinite] rounded-full border-4 border-current border-t-transparent" />
      <div className="theme-accent-surface absolute inset-8 animate-pulse rounded-full border border-current opacity-20" />
    </div>
    <div className="space-y-4">
      <h2 className="theme-heading text-xs font-black uppercase tracking-[0.8em] italic opacity-80">
        QS APP
      </h2>
      <p className="theme-meta text-[9px] font-black uppercase tracking-[0.4em] animate-pulse italic">
        {isOnline ? "Syncing Workspaces..." : "Vault Offline Mode"}
      </p>
    </div>
  </div>
);

const AppShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isLoading: authLoading, isOnline, activeView, setActiveView, user } = useAuth();
  const location = useLocation();
  
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [modulesReady, setModulesReady] = useState(false);

  // Optimized Handshake: Resolve modules only once on mount
  useEffect(() => {
    let mounted = true;
    resolveModules().then((success) => {
      if (mounted && success) setModulesReady(true);
    });
    return () => { mounted = false; };
  }, []);

  // Performance Guard: Memoize static background to prevent GPU re-draws
  const BackgroundNodes = useMemo(() => (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-10 select-none">
      <div className="theme-accent-surface absolute right-0 top-0 h-2/3 w-2/3 -translate-y-1/4 translate-x-1/4 rounded-full blur-[160px]" />
      <div className="theme-accent-surface absolute bottom-0 left-0 h-[40%] w-[40%] -translate-x-1/4 translate-y-1/4 rounded-full blur-[120px]" />
    </div>
  ), []);

  if (authLoading && !user) {
    return <OfficeLoader isOnline={isOnline} />;
  }

  return (
    <div className="theme-page h-screen w-full overflow-hidden font-sans transition-colors duration-500 selection:bg-amber-500/30 flex flex-col">
      
      {      !isOnline && (
        <div className="fixed top-0 left-0 right-0 z-200] bg-rose-600 py-1 px-4 text-center animate-in slide-in-from-top duration-500 shadow-lg">
          <div className="flex items-center justify-center gap-3">
            <WifiOff size={12} className="text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">
              Working in Local Offline Mode
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {        modulesReady && (
          <SidebarCommand
            activeView={activeView || 'projects'}
            setActiveView={setActiveView}
            mobileOpen={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden relative">
          {modulesReady && (
            <HUDHeader
              activeView={activeView || 'projects'}
              setActiveView={setActiveView}
              onMenuClick={() => setMobileNavOpen(true)}
              isOnline={isOnline}
            />
          )}

          <main className="relative flex-1 overflow-y-auto custom-scrollbar pt-safe pb-safe px-safe flex flex-col">
            {BackgroundNodes}

            <section className="relative z-10 mx-auto flex flex-1 w-full max-w-7xl flex-col px-4 py-8 sm:px-10">
              <div 
                key={location.pathname} 
                className="flex-1 animate-workspace will-change-transform"
              >
                {children || (
                  <div className="flex min-h-[50vh] flex-col items-center justify-center opacity-20">
                    <ShieldCheck size={48} className="mb-6 theme-accent" />
                    <p className="theme-heading font-black text-[10px] uppercase tracking-[0.6em] italic">
                      Vault Secure
                    </p>
                  </div>
                )}
              </div>

              {}
              <footer className="mt-auto hidden pb-12 pt-24 text-center opacity-30 md:block select-none pointer-events-none">
                <div className="mb-6 flex items-center justify-center gap-10">
                  <div className="h-px w-24 bg-(--app-border)] opacity-50" />
                  <HardHat size={16} className="theme-icon" />
                  <div className="h-px w-24 bg-(--app-border)] opacity-50" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-[1.2em] italic">
                  QS App • PRECISION OS
                </p>
              </footer>
            </section>
          </main>
        </div>
      </div>

      <style>{`
        :root {
          --sat: env(safe-area-inset-top);
          --sar: env(safe-area-inset-right);
          --sab: env(safe-area-inset-bottom);
          --sal: env(safe-area-inset-left);
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--app-border); border-radius: 20px; opacity: 0.5; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--app-accent-strong); }

        @keyframes workspace-entry {
          0% { opacity: 0; transform: translateY(8px) scale(0.99); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        .animate-workspace {
          animation: workspace-entry 0.5s cubic-bezier(0.2, 1, 0.3, 1) forwards;
        }

        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
};

export default AppShell;