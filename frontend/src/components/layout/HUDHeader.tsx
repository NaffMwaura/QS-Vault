/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, 
  WifiOff, 
  ChevronRight, 
  ChevronDown,
  Settings, 
  Edit3, 
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
 
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (OFFLINE-FIRST)
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  user: { id: 'dev-user-001', email: 'surveyor@vault.systems', user_metadata: { full_name: 'Naftaly Mwaura' } },
  signOut: async () => console.log("Logging out..."),
  theme: 'dark',
  toggleTheme: () => console.log("Changing appearance..."),
  isOnline: true,
  activeView: 'projects',
  setActiveView: (view: string) => console.log(`Switching to ${view}`)
});

const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  } catch (e) {
    // Shims active for sandbox stability
  }
};

resolveModules();

/** --- TYPES --- **/
// Expanded to include the new Sidebar-accessible engines
export type DashboardView = 'projects' | 'rates' | 'settings' | 'profile' | 'diary' | 'resources' | 'collab';

interface HUDHeaderProps {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
}

/** --- MAIN COMPONENT: OFFICE CONTROL BAR --- **/
const HUDHeader: React.FC<HUDHeaderProps> = ({ activeView, setActiveView }) => {
  const { user, theme, toggleTheme, isOnline, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || 'User';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  /** * NAVIGATION LABELS
   * We use simpler language here so everyone on site can follow.
   */
  const getViewLabel = (view: DashboardView) => {
    const labels: Record<DashboardView, string> = {
      projects: 'All Projects',
      diary: 'Daily Site Record',
      resources: 'Work Schedule',
      collab: 'Team Chat',
      rates: 'Material Prices',
      settings: 'Office Settings',
      profile: 'My Profile'
    };
    return labels[view] || 'Workspace';
  };

  const fullName = user?.user_metadata?.full_name || 'Surveyor';

  return (
    <header className={`h-16 sm:h-20 border-b flex items-center justify-between px-4 sm:px-10 z-60] backdrop-blur-2xl transition-all duration-500 sticky top-0
      ${theme === 'dark' 
        ? 'bg-[#09090b]/80 border-zinc-800/60 shadow-[0_4px_30px_rgba(0,0,0,0.3)]' 
        : 'bg-white/90 border-zinc-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)]'}`}>
      
      {/* 1. LEFT SIDE: SYNC STATUS & BREADCRUMB */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all duration-700
          ${!isOnline 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse' 
            : theme === 'dark' 
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
           {isOnline ? <Wifi size={14} className="stroke-[2.5px]" /> : <WifiOff size={14} className="stroke-[2.5px]" />}
           <span className="text-[10px] font-black uppercase tracking-[0.15em] hidden xs:block leading-none">
             {isOnline ? 'Synced' : 'Working Offline'}
           </span>
        </div>

        <div className="flex items-center gap-3">
          <ChevronRight size={14} className="text-zinc-700 hidden md:block" />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500 italic leading-none">
              {getViewLabel(activeView)}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mt-1 hidden sm:block">
              Project ID: {user?.id?.slice(0, 8).toUpperCase() || 'LOCAL'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT SIDE: THEME & PROFILE */}
      <div className="flex items-center gap-4 sm:gap-8">
        {/* Toggle Light/Dark Mode */}
        <button 
          onClick={toggleTheme}
          className={`p-3 rounded-2xl transition-all active:scale-90
            ${theme === 'dark' ? 'bg-zinc-900 text-zinc-400 hover:text-amber-500' : 'bg-zinc-100 text-zinc-500 hover:text-amber-600 shadow-sm'}`}
          title="Change Appearance"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className={`h-10 w-px ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'} hidden sm:block`} />
        
        {/* Account Menu */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center gap-3 sm:gap-4 p-1 rounded-2xl border transition-all active:scale-95
              ${showDropdown 
                ? 'border-amber-500/40 bg-amber-500/5 shadow-2xl' 
                : 'border-transparent hover:bg-zinc-500/5'}`}
          >
            <div className="text-right hidden md:block space-y-1">
              <p className={`text-[11px] font-black uppercase tracking-tight leading-none 
                ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                {fullName.split(' ')[0]}
              </p>
              <div className="flex items-center gap-2 justify-end">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Verified
                </span>
                <ChevronDown size={10} className={`text-zinc-600 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
              </div>
            </div>

            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border transition-all duration-300 overflow-hidden flex items-center justify-center shadow-inner
              ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}
              ${showDropdown ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]' : ''}`}>
               <span className={`text-xs sm:text-sm font-black italic transition-colors
                 ${showDropdown ? 'text-amber-500' : 'text-zinc-500'}`}>
                 {getInitials()}
               </span>
            </div>
          </button>

          {/* DROP-DOWN MENU */}
          {showDropdown && (
            <div className={`absolute top-full right-0 mt-4 w-64 sm:w-72 rounded-[2.5rem] border shadow-2xl backdrop-blur-3xl p-3 z-100] animate-in fade-in zoom-in-95 duration-200
              ${theme === 'dark' ? 'bg-zinc-950/95 border-zinc-800 shadow-black' : 'bg-white/95 border-zinc-200 shadow-zinc-200'}`}>
              
              <div className="px-6 py-5 mb-3 border-b border-zinc-800/40 text-left">
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 leading-none text-left">My Account</p>
                <p className="text-[12px] font-bold truncate text-amber-500 italic leading-none">{user?.email}</p>
              </div>
              
              <div className="space-y-1">
                <button 
                  onClick={() => { setActiveView('settings'); setShowDropdown(false); }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all
                    ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'}`}
                >
                  <Settings size={16} className="text-amber-500" /> Office Settings
                </button>
                <button 
                  onClick={() => { setActiveView('profile'); setShowDropdown(false); }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all
                    ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'}`}
                >
                  <Edit3 size={16} className="text-amber-500" /> Profile Settings
                </button>
                
                <div className="h-px bg-zinc-800/40 my-2 mx-4" />
                
                <button 
                  onClick={() => { setShowDropdown(false); signOut(); }}
                  className="w-full flex items-center gap-4 px-5 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-500/10 transition-all italic"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HUDHeader;