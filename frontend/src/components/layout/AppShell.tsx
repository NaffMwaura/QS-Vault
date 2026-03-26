import React, {  } from 'react';
import { useLocation } from "react-router-dom";
import { ShieldCheck, HardHat,  } from "lucide-react";

/* ======================================================
    OFFICE MODULE RESOLUTION (OFFLINE-FIRST)
    This section ensures the frame can boot even if 
    individual nodes are loading or offline.
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  user: { id: 'dev-node-001', user_metadata: { full_name: 'Naftaly Mwaura' } },
  isLoading: false,
  theme: 'dark',
  isOnline: true,
  activeView: 'projects',
  setActiveView: (view: string) => console.log("Navigation:", view)
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let HUDHeader: any = () => null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SidebarCommand: any = () => null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const headerMod = await import("./HUDHeader");
    HUDHeader = headerMod.default;

    const sidebarMod = await import("./SidebarCommand");
    SidebarCommand = sidebarMod.default;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Shims active for sandbox stability
  }
};

resolveModules();

/** --- TYPES --- **/
interface AppShellProps {
  children?: React.ReactNode;
}

/** --- UI: PRECISION OFFICE LOADER --- **/
const OfficeLoader = ({ isOnline }: { isOnline: boolean }) => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center z-100] fixed inset-0">
    <div className="relative w-28 h-28 mb-12">
      {/* Outer Rotating Ring */}
      <div className="absolute inset-0 border-4 border-zinc-900 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-[spin_2s_linear_infinite]"></div>
      
      {/* Inner Precision Ring */}
      <div className="absolute inset-4 border-2 border-zinc-800 rounded-full"></div>
      <div className="absolute inset-4 border-2 border-amber-400 rounded-full border-b-transparent animate-[spin_1.5s_linear_infinite_reverse]"></div>
      
      {/* Center Pulse */}
      <div className="absolute inset-10 border border-amber-500/10 rounded-full animate-pulse shadow-[0_0_40px_rgba(245,158,11,0.15)]"></div>
    </div>
    <div className="space-y-3">
      <h2 className="text-amber-500 font-black uppercase tracking-[0.6em] text-sm italic">
        QS VAULT
      </h2>
      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse italic">
        {isOnline ? "Syncing with Cloud..." : "Opening Local Database..."}
      </p>
    </div>
  </div>
);

/** --- MAIN APP SHELL: CONSTRUCTION OS FRAME --- **/
const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isLoading: authLoading, isOnline, activeView, setActiveView, user } = useAuth();
  const location = useLocation();

  /** * PRO DEV OPTIMIZATION:
   * We removed the manual 'isTransitioning' state that caused the cascading render error.
   * Instead, we use 'location.key' as a unique identifier for the main workspace.
   * When the key changes, the browser automatically re-triggers the CSS animations 
   * defined in the <style> block, creating the same smooth transition effect 
   * with zero performance penalty.
   */

  // Defensive Loading Guard: Only shows the full loader if we truly lack user data.
  if (authLoading && !user) {
    return <OfficeLoader isOnline={isOnline} />;
  }

  return (
    <div className="theme-page min-h-screen flex font-sans transition-colors duration-500 overflow-hidden selection:bg-amber-500/30">
      
      {/* 1. SIDEBAR COMMAND CENTER */}
      <SidebarCommand 
        activeView={activeView || 'projects'} 
        setActiveView={setActiveView} 
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* 2. HUD HEADER: NETWORK & PROFILE MONITOR */}
        <HUDHeader 
          activeView={activeView || 'projects'} 
          setActiveView={setActiveView} 
        />

        {/* 3. MAIN WORKSPACE: SCROLLABLE CORE */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar scroll-smooth">
          
          {/* Aesthetic High-End Background Fills */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
            <div className="theme-glow-amber absolute top-0 right-0 w-1/2 h-1/2 rounded-full blur-[140px] translate-x-1/4 -translate-y-1/4" />
            <div className="theme-glow-neutral absolute bottom-0 left-0 w-[30%] h-[30%] rounded-full blur-[120px] -translate-x-1/4 translate-y-1/4" />
          </div>

          <section className="relative z-10 p-6 sm:p-10 max-w-7xl mx-auto min-h-full flex flex-col">
            
            {/* WORKSPACE CONTENT: 
                Using 'key={location.pathname}' ensures that every time the route changes,
                React treats this as a fresh mount, triggering the 'animate-workspace' 
                CSS animation perfectly without manual state management.
            */}
            <div 
              key={location.pathname}
              className="flex-1 animate-workspace"
            >
              {children || (
                <div className="min-h-[60vh] flex flex-col items-center justify-center opacity-20">
                  <ShieldCheck size={48} className="mb-4 text-amber-500" />
                  <p className="font-black text-xs uppercase tracking-[0.5em] italic">Workspace Ready</p>
                </div>
              )}
            </div>
            
            {/* Professional Legal & Compliance Branding */}
            <footer className="pt-24 pb-12 text-center opacity-10 hidden md:block mt-auto select-none">
               <div className="flex items-center justify-center gap-8 mb-4">
                  <div className="h-px w-24 bg-zinc-800" />
                  <HardHat size={14} className="text-zinc-500" />
                  <div className="h-px w-24 bg-zinc-800" />
               </div>
               <p className="text-[9px] font-black uppercase tracking-[0.8em] text-zinc-600 italic">
                 QS VAULT • SMM-KE COMPLIANT PRECISION OS
               </p>
            </footer>
          </section>
        </main>
      </div>

      <style>{`
        /* Professional Slim UI Scrollbars */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; transition: background 0.3s; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        
        /* High-speed animations for Microsoft-level polish */
        @keyframes workspace-entry {
          0% { opacity: 0; transform: translateY(10px) scale(0.99); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        
        .animate-workspace { 
          animation: workspace-entry 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; 
        }
      `}</style>
    </div>
  );
};

export default AppShell;
