/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { 
  LayoutGrid, 
  Database, 
  Settings, 
  HardHat, 
  LogOut, 
  Sun, 
  Moon,
  ClipboardList,
  Calendar,
  MessageSquare,
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (OFFLINE-FIRST)
   ====================================================== */

// 1. Hook declaration with stable fallback for the environment
let useAuth: any = () => ({
  user: { id: 'dev-user-001', user_metadata: { full_name: 'Naftaly Mwaura' } },
  signOut: async () => console.log("Terminating session..."),
  theme: 'dark',
  toggleTheme: () => console.log("Switching appearance..."),
  activeView: 'projects',
  setActiveView: (view: string) => console.log(`Navigating to ${view}`)
});

const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  } catch (e) {
    // Sandbox fallback
  }
};

resolveModules();

/** --- TYPES --- **/
// Matches the DashboardView type from HUDHeader.tsx
export type DashboardView = 'projects' | 'rates' | 'settings' | 'profile' | 'diary' | 'resources' | 'collab';

interface SidebarCommandProps {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
}

/** --- SUB-COMPONENT: SIDEBAR_LINK --- **/
const SidebarLink: React.FC<{ 
  icon: React.ElementType; 
  label: string; 
  active: boolean; 
  onClick: () => void; 
  theme: 'light' | 'dark' 
}> = ({ icon: Icon, label, active, onClick, theme }) => (
  <button 
    type="button"
    onClick={onClick} 
    className={`w-full flex items-center gap-5 p-4 lg:p-5 rounded-3xl transition-all duration-300 group relative 
      ${active 
        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xl shadow-amber-500/5' 
        : theme === 'dark' 
          ? 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30 border border-transparent' 
          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent'}`}
  >
    {active && (
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-amber-500 rounded-full blur-[1px]" />
    )}
    <Icon 
      size={20} 
      className={`${active ? 'scale-110 text-amber-500' : 'group-hover:scale-110 group-hover:text-amber-500'} transition-all duration-300 shrink-0`} 
    />
    <span className="hidden lg:block text-[11px] font-black uppercase tracking-[0.2em] text-left leading-none">
      {label}
    </span>
  </button>
);

/** --- MAIN SIDEBAR COMPONENT: THE COMMAND HUB --- **/
const SidebarCommand: React.FC<SidebarCommandProps> = ({ activeView, setActiveView }) => {
  const { user, theme, toggleTheme, signOut } = useAuth();

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || 'User';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  /** * NAVIGATION NODES
   * Organized for high-frequency site management tasks.
   */
  const navLinks = [
    { id: 'projects' as DashboardView, label: 'All Projects', icon: LayoutGrid },
    { id: 'diary' as DashboardView, label: 'Daily Record', icon: ClipboardList },
    { id: 'resources' as DashboardView, label: 'Work Schedule', icon: Calendar },
    { id: 'collab' as DashboardView, label: 'Team Chat', icon: MessageSquare },
    { id: 'rates' as DashboardView, label: 'Material Prices', icon: Database },
    { id: 'settings' as DashboardView, label: 'Office Reports', icon: Settings },
  ];

  return (
    <aside className={`relative z-50 w-20 lg:w-72 flex flex-col transition-all duration-500 ease-in-out border-r shrink-0
      ${theme === 'dark' 
        ? 'bg-zinc-950/70 backdrop-blur-3xl border-zinc-800/40 shadow-2xl shadow-black' 
        : 'bg-white border-zinc-200 shadow-xl'}`}>
      
      {/* 1. BRANDING: THE VAULT NODE */}
      <div className="p-6 lg:p-8 flex items-center gap-4 cursor-pointer group" onClick={() => setActiveView('projects')}>
        <div className="bg-amber-500 p-2.5 rounded-2xl shadow-xl shadow-amber-500/20 shrink-0 group-hover:rotate-6 transition-transform">
          <HardHat size={24} className="text-black" />
        </div>
        <div className="hidden lg:block text-left overflow-hidden">
          <span className={`block font-black uppercase tracking-tighter italic text-xl leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            QS VAULT<span className="text-amber-500">.</span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1 block leading-none">
            Construction OS
          </span>
        </div>
      </div>

      {/* 2. PRIMARY NAVIGATION NODES */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        {navLinks.map((link) => (
          <SidebarLink 
            key={link.id}
            icon={link.icon}
            label={link.label}
            active={activeView === link.id}
            onClick={() => setActiveView(link.id)}
            theme={theme}
          />
        ))}
      </nav>

      {/* 3. SESSION & IDENTITY CONTROLS */}
      <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800/30' : 'border-zinc-200'}`}>
        <div 
          onClick={() => setActiveView('profile')}
          className={`mb-4 hidden lg:flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all hover:border-amber-500/30
          ${theme === 'dark' ? 'bg-zinc-500/5 border-zinc-500/10' : 'bg-zinc-50 border-zinc-100'}`}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center font-black text-[10px] text-amber-500 shrink-0 uppercase italic shadow-inner">
            {getInitials()}
          </div>
          <div className="overflow-hidden flex-1 text-left">
            <p className={`text-[10px] font-black uppercase tracking-tight truncate leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              {user?.user_metadata?.full_name?.split(' ')[0] || 'Surveyor'}
            </p>
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1 leading-none">Verified ID</p>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); toggleTheme(); }} className="p-2 text-zinc-500 hover:text-amber-500 transition-colors">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
        
        <button 
          type="button"
          onClick={signOut}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group
            ${theme === 'dark' ? 'text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10' : 'text-zinc-500 hover:text-rose-600 hover:bg-rose-50'}`}
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest text-left leading-none">
            Log Out
          </span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarCommand;