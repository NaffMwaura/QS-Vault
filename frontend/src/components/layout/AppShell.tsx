import React, { useState, useEffect, useRef } from 'react';
import { useLocation, BrowserRouter } from "react-router-dom";
import { 
  HardHat, 
  LayoutGrid, 
  Settings, 
  LogOut, 
  Database, 
  ChevronRight,
  User as UserIcon,
  Wifi,
  WifiOff,
  Sun,
  Moon
} from "lucide-react";

/** --- TYPES & INTERFACES --- **/

// Aligned with Supabase User type to resolve ts(2322)
interface AuthUser {
  email?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  signOut: () => Promise<void> | void;
  isLoading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

interface AppShellProps {
  children?: React.ReactNode;
}

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  theme: 'light' | 'dark';
}

/** --- MODULE RESOLUTION HANDLER --- **/
// Fixed type assignment to resolve AuthContextValue mismatch
let useAuth: () => AuthContextValue = () => ({
  user: { email: 'surveyor@qsvault.com' },
  signOut: () => console.log('Signing out...'),
  isLoading: false,
  theme: 'dark',
  toggleTheme: () => console.log('Toggle theme')
});

try {
  // Removed unused @ts-expect-error to resolve ts(2578)
  import("../../features/auth/AuthContext").then(mod => {
    useAuth = mod.useAuth;
  }).catch(() => {});
} catch {
  // Fallback for non-Vite environments
}

/** --- LOADING COMPONENT (4 SPINNING CIRCLES + OFFLINE CHECK) --- **/

const VaultLoader = ({ isOnline }: { isOnline: boolean }) => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center z-100 fixed inset-0">
    <div className="relative w-32 h-32 mb-12">
      {/* Circle 1: Outer Technical Ring (Slow) */}
      <div className="absolute inset-0 border-4 border-zinc-900 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-[spin_4s_linear_infinite]"></div>
      
      {/* Circle 2: High-Precision Measurement Ring (Reverse) */}
      <div className="absolute inset-4 border-2 border-zinc-800 rounded-full"></div>
      <div className={`absolute inset-4 border-2 rounded-full border-b-transparent animate-[spin_2s_linear_infinite_reverse] ${isOnline ? 'border-amber-400' : 'border-red-500'}`}></div>
      
      {/* Circle 3: Data Processing Ring (Fast) */}
      <div className="absolute inset-10 border border-amber-500/10 rounded-full"></div>
      <div className="absolute inset-10 border border-amber-300 rounded-full border-l-transparent animate-spin"></div>
      
      {/* Circle 4: Core Heartbeat Pulse */}
      <div className={`absolute inset-15 rounded-full animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.4)] ${isOnline ? 'bg-amber-500' : 'bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.4)]'}`}></div>
    </div>
    
    <div className="space-y-4">
      <h2 className="text-amber-500 font-black uppercase tracking-[0.8em] text-sm italic">
        QS VAULT INITIALIZATION
      </h2>
      <div className="flex flex-col items-center gap-2">
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
          {isOnline ? "Synchronizing Cloud Infrastructure..." : "Switching to Local Storage Mode..."}
        </p>
        {!isOnline && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <WifiOff size={10} className="text-red-500" />
            <span className="text-red-500/80 text-[8px] font-black uppercase tracking-[0.2em]">Offline Vault Protocol Active</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

/** --- MAIN APP SHELL IMPLEMENTATION --- **/

const AppShellInternal: React.FC<AppShellProps> = ({ children }) => {
  const { user, signOut, isLoading: authLoading, theme, toggleTheme } = useAuth();
  const location = useLocation();
  
  // Initialize with navigator value directly to avoid synchronous setState in useEffect
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isTransitioning, setIsTransitioning] = useState(true);
  const prevPathRef = useRef(location.pathname);

  // 1. Network Status Heartbeat - Fix: Removed synchronous setState from effect body
  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // 2. Handle Route Transition - Fix: Async state update to resolve cascading render
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      // Defer state update to next tick to avoid render conflict
      setTimeout(() => setIsTransitioning(true), 0);
    }

    const transitionTimer = setTimeout(() => {
      setIsTransitioning(false);
    }, 3500); 

    return () => clearTimeout(transitionTimer);
  }, [location.pathname]);

  if (authLoading || isTransitioning) {
    return <VaultLoader isOnline={isOnline} />;
  }

  return (
    <div className={`min-h-screen flex overflow-hidden font-sans selection:bg-amber-500/30 transition-colors duration-500 
      ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
      
      {/* 1. Sidebar Navigation */}
      <aside className={`
        relative z-30 w-20 lg:w-72 flex flex-col transition-all duration-500 ease-in-out border-r
        ${theme === 'dark' 
          ? 'bg-zinc-950/70 backdrop-blur-3xl border-zinc-800/40 shadow-2xl' 
          : 'bg-white border-zinc-200 shadow-xl'}
      `}>
        <div className="p-6 lg:p-8 flex items-center gap-4">
          <div className="bg-amber-500 p-2.5 rounded-2xl shadow-xl shadow-amber-500/20 shrink-0 group transition-transform hover:rotate-6 active:scale-90 cursor-pointer">
            <HardHat size={24} className="text-black" />
          </div>
          <div className="hidden lg:block overflow-hidden">
            <span className={`block font-black uppercase tracking-tighter italic text-xl leading-none 
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              QS VAULT<span className="text-amber-500">.</span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1 block">
              Precision OS 2.0
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-3">
          <SidebarLink icon={<LayoutGrid size={20} />} label="Dashboard" active theme={theme} />
          <SidebarLink icon={<Database size={20} />} label="Rates Library" theme={theme} />
          <SidebarLink icon={<Settings size={20} />} label="Vault Settings" theme={theme} />
        </nav>

        {/* Bottom Profile & Theme Toggle */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800/30' : 'border-zinc-200'}`}>
          <div className={`mb-4 hidden lg:flex items-center gap-3 p-3 rounded-2xl border 
            ${theme === 'dark' ? 'bg-zinc-500/5 border-zinc-500/10' : 'bg-zinc-50 border-zinc-100'}`}>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black text-xs uppercase">
              {(user?.email?.[0] || 'S').toUpperCase()}
            </div>
            <div className="overflow-hidden text-left flex-1">
              <p className={`text-[10px] font-black uppercase tracking-tight truncate leading-none 
                ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                {user?.email?.split('@')[0] || 'Surveyor_Alpha'}
              </p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                Enterprise License
              </p>
            </div>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-zinc-500/10 text-zinc-500 transition-colors"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          
          <button 
            type="button"
            onClick={() => signOut()}
            className={`
              w-full flex items-center gap-4 p-4 rounded-2xl transition-all group
              ${theme === 'dark' ? 'text-zinc-500 hover:text-red-500 hover:bg-red-500/10' : 'text-zinc-400 hover:text-red-600 hover:bg-red-50'}
            `}
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">
              Secure Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className={`
          h-20 border-b flex items-center justify-between px-8 z-20 backdrop-blur-md transition-all duration-300
          ${theme === 'dark' ? 'bg-[#09090b]/80 border-zinc-800/40 shadow-lg' : 'bg-white border-zinc-200 shadow-sm'}
        `}>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500
              ${!isOnline 
                ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' 
                : theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
               {isOnline ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} />}
               <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                 {isOnline ? 'Vault Synced' : 'Local Storage'}
               </span>
            </div>
            <ChevronRight size={14} className="text-zinc-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500 italic">
              Active Session
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`h-8 w-px hidden sm:block ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            <div className="flex items-center gap-4 group cursor-default text-left">
              <div className="text-right hidden sm:block">
                <p className={`text-[10px] font-black uppercase tracking-tight leading-none 
                  ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  Vault Secure
                </p>
                <p className={`text-[8px] font-bold uppercase tracking-[0.4em] mt-1 ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {isOnline ? 'Cloud Active' : 'Buffer Local'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-2xl border transition-all duration-300 overflow-hidden flex items-center justify-center group-hover:border-amber-500 shadow-inner
                ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                 <UserIcon size={20} className="text-zinc-500 group-hover:text-amber-500 transition-colors" />
              </div>
            </div>
          </div>
        </header>

        {theme === 'dark' && (
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-500/10 rounded-full blur-[120px] translate-x-1/4 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-zinc-500/10 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4" />
          </div>
        )}

        <section className={`flex-1 overflow-y-auto relative z-10 p-8 transition-colors duration-500
          ${theme === 'dark' ? 'bg-transparent' : 'bg-zinc-100'}`}>
          <div className="min-h-full max-w-7xl mx-auto">
            {children || (
              <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-zinc-800/20 rounded-3xl opacity-30">
                <LayoutGrid size={48} className="mb-4" />
                <p className="font-mono text-xs uppercase tracking-[0.5em]">System Ready for Input...</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

// --- HELPER COMPONENT ---

const SidebarLink: React.FC<SidebarLinkProps> = ({ icon, label, active = false, onClick, theme }) => (
  <button 
    type="button"
    onClick={onClick}
    className={`
      w-full flex items-center gap-5 p-5 rounded-3xl transition-all duration-300 group relative
      ${active 
        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.08)]' 
        : theme === 'dark' 
          ? 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 border border-transparent'}
    `}>
    {active && (
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-amber-500 rounded-full blur-[2px]" />
    )}
    
    <div className={`${active ? 'text-amber-500 scale-110' : 'text-zinc-500 group-hover:text-amber-500 group-hover:scale-110'} transition-all duration-300`}>
      {icon}
    </div>
    <span className="hidden lg:block text-[11px] font-black uppercase tracking-[0.25em]">
      {label}
    </span>
  </button>
);

/** --- PREVIEW WRAPPER --- **/
const AppShell = (props: AppShellProps) => {
  return (
    <BrowserRouter>
      <AppShellInternal {...props} />
    </BrowserRouter>
  );
};

export default AppShell;