import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from "react-router-dom";
import { 
  Wifi,
  WifiOff,
  ChevronRight,
  User as UserIcon,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

/** --- TYPES & INTERFACES --- **/

interface AppShellProps {
  children?: React.ReactNode;
}

/** --- LOADING COMPONENT (VAULT INITIALIZATION) --- **/

const VaultLoader = ({ isOnline }: { isOnline: boolean }) => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center z-100 fixed inset-0">
    <div className="relative w-32 h-32 mb-12">
      {/* Precision Measurement Rings */}
      <div className="absolute inset-0 border-4 border-zinc-900 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-[spin_4s_linear_infinite]"></div>
      
      <div className="absolute inset-4 border-2 border-zinc-800 rounded-full"></div>
      <div className={`absolute inset-4 border-2 rounded-full border-b-transparent animate-[spin_2s_linear_infinite_reverse] ${isOnline ? 'border-amber-400' : 'border-red-500'}`}></div>
      
      <div className="absolute inset-10 border border-amber-500/10 rounded-full"></div>
      <div className="absolute inset-10 border border-amber-300 rounded-full border-l-transparent animate-spin"></div>
      
      <div className={`absolute inset-15 rounded-full animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.4)] ${isOnline ? 'bg-amber-500' : 'bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.4)]'}`}></div>
    </div>
    
    <div className="space-y-4">
      <h2 className="text-amber-500 font-black uppercase tracking-[0.8em] text-sm italic">
        QS VAULT INITIALIZATION
      </h2>
      <div className="flex flex-col items-center gap-2">
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse leading-none">
          {isOnline ? "Synchronizing Cloud Infrastructure..." : "Switching to Local Storage Mode..."}
        </p>
      </div>
    </div>
  </div>
);

/** --- REFINED APP SHELL (NO SIDEBAR) --- 
 * This shell handles global loaders, headers, and backgrounds.
 * Navigation is now handled internally by the Dashboard master node.
 **/

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, isLoading: authLoading, theme, isOnline } = useAuth();
  const location = useLocation();
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTransitioning(true);
      const transitionTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, 800); 

      return () => clearTimeout(transitionTimer);
    }
  }, [location.pathname]);

  if (authLoading || isTransitioning) {
    return <VaultLoader isOnline={isOnline} />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 
      ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
      
      {/* 1. Global HUD Header (Shared across all pages) */}
      <header className={`
        h-20 border-b flex items-center justify-between px-8 z-50 backdrop-blur-md transition-all duration-300 sticky top-0
        ${theme === 'dark' ? 'bg-[#09090b]/80 border-zinc-800/40 shadow-lg' : 'bg-white border-zinc-200 shadow-sm'}
      `}>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500
            ${!isOnline 
              ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' 
              : theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
             {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
             <span className={`text-[9px] font-black uppercase tracking-[0.2em]`}>
               {isOnline ? 'Vault Synced' : 'Local Protocol'}
             </span>
          </div>
          <ChevronRight size={14} className="text-zinc-500" />
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500 italic">
            Secure Session
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className={`h-8 w-px hidden sm:block ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
          <div className="flex items-center gap-4 group cursor-default text-left">
            <div className="text-right hidden sm:block">
              <p className={`text-[10px] font-black uppercase tracking-tight leading-none 
                ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                {user?.user_metadata?.full_name || 'Naftaly Mwaura'}
              </p>
              <p className={`text-[8px] font-bold uppercase tracking-[0.4em] mt-1 text-zinc-500`}>
                ID: {user?.id?.slice(0, 12).toUpperCase()}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl border transition-all duration-300 overflow-hidden flex items-center justify-center
              ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
               <UserIcon size={20} className="text-zinc-500" />
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Aesthetic Background Overlays */}
        {theme === 'dark' && (
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-500/10 rounded-full blur-[120px] translate-x-1/4 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-zinc-500/10 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4" />
          </div>
        )}

        {/* This container allows children (like Dashboard) to render their own Sidebars internally */}
        <section className={`flex-1 relative z-10 overflow-hidden flex transition-colors duration-500
          ${theme === 'dark' ? 'bg-transparent' : 'bg-zinc-100'}`}>
          {children || (
            <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-20">
              <ShieldCheck size={48} className="mb-4 text-amber-500" />
              <p className="font-black text-xs uppercase tracking-[0.5em] italic">Initializing Node...</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AppShell;