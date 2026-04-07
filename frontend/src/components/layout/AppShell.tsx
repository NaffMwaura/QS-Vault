/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState,  } from 'react';
import { useLocation } from "react-router-dom";
import { HardHat, ShieldCheck,  } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

/* ======================================================
    MODULE RESOLUTION (PRODUCTION SYNC)
   ====================================================== */

let HUDHeader: any = () => null;
let SidebarCommand: any = () => null;

const resolveModules = async () => {
  try {
    const headerMod = await import("./HUDHeader");
    HUDHeader = headerMod.default;

    const sidebarMod = await import("./SidebarCommand");
    SidebarCommand = sidebarMod.default;
  } catch (e) {
    // Shims active for sandbox initialization
  }
};

resolveModules();

/** --- TYPES --- **/
interface AppShellProps {
  children?: React.ReactNode;
}

/** --- UI: NATIVE APP LOADER --- **/
const OfficeLoader = ({ isOnline }: { isOnline: boolean }) => (
  <div className="fixed inset-0 z-100] flex flex-col items-center justify-center bg-[#09090b] p-6 text-center">
    <div className="relative mb-12 h-32 w-32">
      <div className="absolute inset-0 rounded-full border-4 border-zinc-900" />
      <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-4 border-amber-500 border-t-transparent" />
      <div className="absolute inset-4 rounded-full border-2 border-zinc-800" />
      <div className="absolute inset-4 animate-[spin_2s_linear_infinite_reverse] rounded-full border-2 border-amber-400 border-b-transparent" />
      <div className="absolute inset-10 animate-pulse rounded-full border border-amber-500/10 shadow-[0_0_40px_rgba(245,158,11,0.2)]" />
    </div>
    <div className="space-y-4">
      <h2 className="text-sm font-black uppercase tracking-[0.8em] text-amber-500 italic">
        QS VAULT
      </h2>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 animate-pulse italic">
        {isOnline ? "Syncing Workspace Nodes..." : "Accessing Local Vault..."}
      </p>
    </div>
  </div>
);

/** --- MAIN COMPONENT: THE PWA FRAME --- **/
const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    isLoading: authLoading,
    isOnline,
    activeView,
    setActiveView,
    user,
    theme
  } = useAuth();
  
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // 1. Loading Guard: Prevents UI jumps during Vault initialization
  if (authLoading && !user) {
    return <OfficeLoader isOnline={isOnline} />;
  }

  return (
    <div className={`h-screen w-full overflow-hidden font-sans transition-colors duration-500 selection:bg-amber-500/30 
      ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      
      <div className="flex h-full">
        {/* SIDEBAR: Left Control Node */}
        <SidebarCommand
          activeView={activeView || 'projects'}
          setActiveView={setActiveView}
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* HUD: Top Status & Profile Hub */}
          <HUDHeader
            activeView={activeView || 'projects'}
            setActiveView={setActiveView}
            onMenuClick={() => setMobileNavOpen(true)}
          />

          <main className="relative flex-1 overflow-y-auto custom-scrollbar pt-safe pb-safe px-safe">
            
            {/* Background Aesthetic Nodes (Hardware Accelerated) */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-30">
              <div className={`absolute right-0 top-0 h-2/3 w-2/3 -translate-y-1/4 translate-x-1/4 rounded-full blur-[160px] 
                ${theme === 'dark' ? 'bg-amber-500/5' : 'bg-amber-500/10'}`} />
              <div className={`absolute bottom-0 left-0 h-[40%] w-[40%] -translate-x-1/4 translate-y-1/4 rounded-full blur-[120px]
                ${theme === 'dark' ? 'bg-zinc-500/5' : 'bg-zinc-500/10'}`} />
            </div>

            <section className="relative z-10 mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-8 sm:px-10">
              
              {/* WORKSPACE TRANSITION: 
                  The 'key={location.pathname}' is critical. It forces React to 
                  rerender the node and trigger the CSS workspace-entry animation 
                  on every navigation, providing a fluid "App-like" feel.
              */}
              <div 
                key={location.pathname} 
                className="flex-1 animate-workspace will-change-transform"
              >
                {children || (
                  <div className="flex min-h-[60vh] flex-col items-center justify-center opacity-20">
                    <ShieldCheck size={64} className="mb-6 text-amber-500" />
                    <p className="font-black text-sm uppercase tracking-[0.6em] italic">
                      Node Optimized
                    </p>
                  </div>
                )}
              </div>

              {/* Legal & Compliance Footer */}
              <footer className="mt-auto hidden pb-12 pt-24 text-center opacity-10 md:block select-none">
                <div className="mb-6 flex items-center justify-center gap-10">
                  <div className="h-px w-32 bg-zinc-800" />
                  <HardHat size={20} className="text-zinc-600" />
                  <div className="h-px w-32 bg-zinc-800" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[1em] text-zinc-600 italic">
                  QS VAULT • PRECISION OS
                </p>
              </footer>
            </section>
          </main>
        </div>
      </div>

      <style>{`
        /* PWA Viewport Optimization */
        :root {
          --sat: env(safe-area-inset-top);
          --sar: env(safe-area-inset-right);
          --sab: env(safe-area-inset-bottom);
          --sal: env(safe-area-inset-left);
        }

        .pt-safe { padding-top: var(--sat); }
        .pb-safe { padding-bottom: var(--sab); }
        .px-safe { padding-left: var(--sal); padding-right: var(--sar); }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; transition: background 0.3s; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }

        @keyframes workspace-entry {
          0% { 
            opacity: 0; 
            transform: translateY(12px) scale(0.98); 
            filter: blur(8px); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
            filter: blur(0); 
          }
        }

        .animate-workspace {
          animation: workspace-entry 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Prevent system tap highlights on touch devices */
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
};

export default AppShell;