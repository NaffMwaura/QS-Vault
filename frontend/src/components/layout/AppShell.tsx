import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import { ShieldCheck, } from "lucide-react";

/* ======================================================
    MODULE RESOLUTION HANDLER (SANDBOX COMPATIBILITY)
   ====================================================== */

// Default mock implementations for the preview environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  user: { id: 'dev-node-001', user_metadata: { full_name: 'Naftaly Mwaura' } },
  isLoading: false,
  theme: 'dark',
  isOnline: true,
  activeView: 'projects',
  setActiveView: (view: string) => console.log("Navigating to:", view)
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let HUDHeader: any = () => <div className="h-20 border-b border-zinc-800 flex items-center px-8 text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em]">HUD_MODULE_MOCK</div>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SidebarCommand: any = () => <div className="w-20 lg:w-72 border-r border-zinc-800 p-8 text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em]">SIDEBAR_MODULE_MOCK</div>;

const resolveModules = async () => {
  try {
    // Attempt to resolve real project modules
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const headerMod = await import("./HUDHeader");
    HUDHeader = headerMod.default;

    const sidebarMod = await import("./SidebarCommand");
    SidebarCommand = sidebarMod.default;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Fallback to mocks if paths aren't established in the environment
  }
};

resolveModules();

/** --- TYPES & INTERFACES --- **/
interface AppShellProps {
  children?: React.ReactNode;
}

/** --- SUB-COMPONENT: VAULT_LOADER --- **/
const VaultLoader = ({ isOnline }: { isOnline: boolean }) => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center z-100 fixed inset-0">
    <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-12">
      <div className="absolute inset-0 border-4 border-zinc-900 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
      <div className="absolute inset-10 border border-amber-500/20 rounded-full animate-pulse shadow-[0_0_50px_rgba(245,158,11,0.2)]"></div>
    </div>
    <div className="space-y-4">
      <h2 className="text-amber-500 font-black uppercase tracking-[0.5em] text-xs italic">
        VAULT_HANDSHAKE_INIT
      </h2>
      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
        {isOnline ? "Syncing Cloud Registry..." : "Initializing Offline Buffer..."}
      </p>
    </div>
  </div>
);

/** --- REFINED MODULAR APP SHELL --- **/
const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isLoading: authLoading, theme, isOnline, activeView, setActiveView } = useAuth();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Precision Transition Logic
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 600);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (authLoading || isTransitioning) {
    return <VaultLoader isOnline={isOnline} />;
  }

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-500 overflow-hidden selection:bg-amber-500/30
      ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
      
      {/* 1. MODULAR COMMAND SIDEBAR */}
      <SidebarCommand 
        activeView={activeView || 'projects'} 
        setActiveView={setActiveView} 
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* 2. MODULAR HUD HEADER */}
        <HUDHeader 
          activeView={activeView || 'projects'} 
          setActiveView={setActiveView} 
        />

        {/* 3. MAIN WORKSPACE SCROLL AREA */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar scroll-smooth">
          {/* Visual Aesthetic Overlays */}
          {theme === 'dark' && (
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-500/5 rounded-full blur-[120px] translate-x-1/4 -translate-y-1/4" />
              <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-zinc-500/5 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4" />
            </div>
          )}

          <section className="relative z-10 p-6 sm:p-10 max-w-7xl mx-auto min-h-full flex flex-col">
            <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {children || (
                <div className="min-h-[60vh] flex flex-col items-center justify-center opacity-20">
                  <ShieldCheck size={48} className="mb-4 text-amber-500" />
                  <p className="font-black text-xs uppercase tracking-[0.5em] italic">Workspace Node Isolated</p>
                </div>
              )}
            </div>
            
            {/* Global Compliance Footer */}
            <footer className="pt-20 pb-10 text-center opacity-20 hidden md:block mt-auto">
               <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="h-px w-12 bg-zinc-800" />
                  <p className="text-[10px] font-black uppercase tracking-[0.6em] italic">
                    QS VAULT PRECISION OS v2.0.4
                  </p>
                  <div className="h-px w-12 bg-zinc-800" />
               </div>
               <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">
                 AUTHORIZED NODE • SMM-KE COMPLIANT • ENCRYPTED HANDSHAKE
               </p>
            </footer>
          </section>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AppShell;