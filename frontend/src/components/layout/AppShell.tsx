import React, { useState, useEffect, useRef } from 'react';
import { useLocation,  } from "react-router-dom";
import { 
  Wifi,
  WifiOff,
  ChevronRight,
  User as 
  ShieldCheck,
  LogOut,
  Settings,
  Edit3,
  Sun,
  Moon,
  ChevronDown,
 
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

/** --- TYPES & INTERFACES --- **/

interface AppShellProps {
  children?: React.ReactNode;
}

/** --- LOADING COMPONENT (VAULT INITIALIZATION) --- **/

const VaultLoader = ({ isOnline }: { isOnline: boolean }) => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center z-100 fixed inset-0">
    <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-12">
      {/* Precision Measurement Rings */}
      <div className="absolute inset-0 border-4 border-zinc-900 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-[spin_4s_linear_infinite]"></div>
      
      <div className="absolute inset-3 sm:inset-4 border-2 border-zinc-800 rounded-full"></div>
      <div className={`absolute inset-3 sm:inset-4 border-2 rounded-full border-b-transparent animate-[spin_2s_linear_infinite_reverse] ${isOnline ? 'border-amber-400' : 'border-red-500'}`}></div>
      
      <div className="absolute inset-8 sm:inset-10 border border-amber-500/10 rounded-full"></div>
      <div className="absolute inset-8 sm:inset-10 border border-amber-300 rounded-full border-l-transparent animate-spin"></div>
      
      <div className={`absolute inset-12 sm:inset-15 rounded-full animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.4)] ${isOnline ? 'bg-amber-500' : 'bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.4)]'}`}></div>
    </div>
    
    <div className="space-y-4">
      <h2 className="text-amber-500 font-black uppercase tracking-[0.5em] sm:tracking-[0.8em] text-xs sm:text-sm italic">
        QS VAULT INITIALIZATION
      </h2>
      <div className="flex flex-col items-center gap-2 px-4">
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] animate-pulse leading-tight">
          {isOnline ? "Synchronizing Cloud Infrastructure..." : "Switching to Local Storage Mode..."}
        </p>
      </div>
    </div>
  </div>
);

/** --- REFINED APP SHELL --- **/

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, isLoading: authLoading, theme, toggleTheme, isOnline, signOut, setActiveView } = useAuth();
  const location = useLocation();
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(location.pathname);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Route Transition
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

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || 'Naftaly Mwaura';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAction = (view: 'settings' | 'profile') => {
    if (setActiveView) {
      setActiveView(view);
    }
    setShowDropdown(false);
    // If you use actual routing, uncomment: navigate(`/${view}`);
  };

  if (authLoading || isTransitioning) {
    return <VaultLoader isOnline={isOnline} />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 overflow-x-hidden
      ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
      
      {/* 1. Global HUD Header (Optimized for Mobile) */}
      <header className={`
        h-16 sm:h-20 border-b flex items-center justify-between px-4 sm:px-8 z-50 backdrop-blur-md transition-all duration-300 sticky top-0
        ${theme === 'dark' ? 'bg-[#09090b]/80 border-zinc-800/40 shadow-lg' : 'bg-white border-zinc-200 shadow-sm'}
      `}>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border transition-all duration-500
            ${!isOnline 
              ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' 
              : theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
             {isOnline ? <Wifi size={10} className="sm:w-3 sm:h-3" /> : <WifiOff size={10} className="sm:w-3 sm:h-3" />}
             <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest sm:tracking-[0.2em]`}>
               {isOnline ? (window.innerWidth < 640 ? 'SYNC' : 'Vault Synced') : (window.innerWidth < 640 ? 'LOCAL' : 'Local Protocol')}
             </span>
          </div>
          <ChevronRight size={12} className="text-zinc-600 hidden xs:block" />
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-amber-500 italic truncate max-w-20 xs:max-w-none">
            {window.innerWidth < 640 ? 'SECURE' : 'Secure Session'}
          </span>
        </div>
        
        {/* Right Section: Profile & Dropdown */}
        <div className="flex items-center gap-2 sm:gap-6">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-colors hidden sm:block ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-zinc-100 text-zinc-400'}`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className={`h-8 w-px hidden sm:block ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center gap-2 sm:gap-4 group transition-all p-1 rounded-2xl border
                ${showDropdown ? 'border-amber-500/40 bg-amber-500/5' : 'border-transparent'}`}
            >
              <div className="text-right hidden md:block">
                <p className={`text-[10px] font-black uppercase tracking-tight leading-none 
                  ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  {user?.user_metadata?.full_name?.split(' ')[0] || 'Naftaly'}
                </p>
                <p className="text-[8px] font-bold uppercase tracking-[0.4em] mt-1 text-zinc-500 flex items-center gap-1 justify-end">
                  NODE-L4 <ChevronDown size={8} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden flex items-center justify-center shadow-inner
                ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}
                ${showDropdown ? 'border-amber-500' : 'group-hover:border-amber-500/50'}`}>
                 {user?.user_metadata?.avatar_url ? (
                   <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-xs sm:text-sm font-black text-zinc-500 italic">{getInitials()}</span>
                 )}
              </div>
            </button>

            {/* Premium Mobile-Friendly Dropdown */}
            {showDropdown && (
              <div className={`absolute top-full right-0 mt-3 w-56 sm:w-64 rounded-2xl border shadow-2xl backdrop-blur-3xl p-2 z-100 animate-in fade-in zoom-in-95 duration-200
                ${theme === 'dark' ? 'bg-zinc-950/95 border-zinc-800 shadow-black/50' : 'bg-white/95 border-zinc-200 shadow-zinc-200'}`}>
                <div className="px-4 py-3 mb-2 border-b border-zinc-800/50">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-1">Authenticated Node</p>
                  <p className="text-[11px] font-bold truncate text-amber-500 italic">{user?.email || 'surveyor@vault.systems'}</p>
                </div>
                
                <div className="space-y-1">
                  <button 
                    onClick={() => handleAction('settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                      ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'}`}
                  >
                    <Settings size={14} className="text-amber-500" /> Vault Configuration
                  </button>
                  <button 
                    onClick={() => handleAction('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                      ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'}`}
                  >
                    <Edit3 size={14} className="text-amber-500" /> Edit Node Identity
                  </button>
                  
                  <div className="sm:hidden">
                    <button 
                      onClick={toggleTheme}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                        ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'}`}
                    >
                      {theme === 'dark' ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-amber-500" />} 
                      Switch Appearance
                    </button>
                  </div>

                  <div className="h-px bg-zinc-800/50 my-1 mx-2" />
                  
                  <button 
                    onClick={() => { setShowDropdown(false); signOut(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-all"
                  >
                    <LogOut size={14} /> Terminate Handshake
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Aesthetic Background Overlays */}
        {theme === 'dark' && (
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-500/10 rounded-full blur-[120px] translate-x-1/4 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-zinc-500/10 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4" />
          </div>
        )}

        {/* This container allows children to render their own Sidebars or layouts internally */}
        <section className={`flex-1 relative z-10 overflow-x-hidden overflow-y-auto custom-scrollbar flex flex-col transition-colors duration-500
          ${theme === 'dark' ? 'bg-transparent' : 'bg-zinc-100'}`}>
          <div className="flex-1 w-full max-w-full">
            {children || (
              <div className="min-h-[70vh] flex flex-col items-center justify-center p-10 sm:p-20 opacity-20">
                <ShieldCheck size={48} className="mb-4 text-amber-500" />
                <p className="font-black text-xs uppercase tracking-[0.5em] italic">Initializing Node...</p>
              </div>
            )}
          </div>

          {/* Minimal Mobile Footer (Visible only on very small screens if needed) */}
          <footer className="py-6 px-8 text-center opacity-20 sm:hidden">
             <p className="text-[8px] font-black uppercase tracking-widest">QS Vault v2.0</p>
          </footer>
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        
        @media (max-width: 640px) {
          header { height: 64px; }
        }
        
        @keyframes zoom-in-95 {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-in { animation: zoom-in-95 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AppShell;