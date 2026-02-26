import React from 'react';
import { useAuth } from "../../features/auth/AuthContext";
import { 
  HardHat, 
  LayoutGrid, 
  Settings, 
  LogOut, 
  Database, 
  ChevronRight,
  User as UserIcon,
  CircleDot
} from "lucide-react";

/** --- TYPES & INTERFACES --- **/

interface AppShellProps {
  children: React.ReactNode;
}

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

/** --- MAIN APP SHELL --- **/

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, signOut, isLoading, theme } = useAuth();

  // Global Loading State - Matches the Branding in AuthContext
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-16 h-16 mb-8">
          <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 border-2 border-amber-500/30 rounded-full animate-pulse"></div>
        </div>
        <h2 className="text-amber-500 font-black uppercase tracking-[0.4em] text-lg mb-2 italic">
          QS POCKET KNIFE
        </h2>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
          Synchronizing Workspace...
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex overflow-hidden font-sans selection:bg-amber-500/30 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      
      {/* 1. Sidebar Navigation - Professional Drafting UI */}
      <aside className={`
        relative z-30 w-20 lg:w-72 flex flex-col transition-all duration-500 ease-in-out border-r
        ${theme === 'dark' ? 'bg-zinc-900/40 backdrop-blur-xl border-zinc-800/50 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'}
      `}>
        {/* Branding Area */}
        <div className="p-6 lg:p-8 flex items-center gap-4">
          <div className="bg-amber-500 p-2.5 rounded-2xl shadow-xl shadow-amber-500/20 shrink-0 group transition-transform hover:rotate-6">
            <HardHat size={24} className="text-black" />
          </div>
          <div className="hidden lg:block overflow-hidden">
            <span className="block font-black uppercase tracking-tighter italic text-xl leading-none">
              QS VAULT<span className="text-amber-500">.</span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1 block">
              Precision Tool
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-3">
          <SidebarLink icon={<LayoutGrid size={20} />} label="Dashboard" active />
          <SidebarLink icon={<Database size={20} />} label="Rates Library" />
          <SidebarLink icon={<Settings size={20} />} label="Vault Settings" />
        </nav>

        {/* Bottom User Profile Section */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-100'}`}>
          <div className="mb-4 hidden lg:flex items-center gap-3 p-3 rounded-2xl bg-zinc-500/5 border border-zinc-500/10">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black text-xs uppercase">
              {user?.email?.[0] || 'S'}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-tight truncate leading-none">
                {user?.email?.split('@')[0] || 'Surveyor_01'}
              </p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                Pro License Active
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={signOut}
            className={`
              w-full flex items-center gap-4 p-4 rounded-2xl transition-all group
              ${theme === 'dark' ? 'text-zinc-500 hover:text-red-500 hover:bg-red-500/10' : 'text-zinc-400 hover:text-red-600 hover:bg-red-50'}
            `}
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">
              Lock Vault
            </span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Header Bar - Floating Glass Effect */}
        <header className={`
          h-20 border-b flex items-center justify-between px-8 z-20 backdrop-blur-md transition-colors duration-300
          ${theme === 'dark' ? 'bg-[#09090b]/50 border-zinc-800/50' : 'bg-white/80 border-zinc-200'}
        `}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-500/5 border border-zinc-500/10">
               <CircleDot size={12} className="text-amber-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Root Vault</span>
            </div>
            <ChevronRight size={14} className="text-zinc-700" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500 italic">
              Active Project Environment
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="h-8 w-px bg-zinc-800/50 hidden sm:block" />
            <div className="flex items-center gap-4 group cursor-default">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-tight leading-none">
                  Status: Secure
                </p>
                <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-[0.3em] mt-1">
                  Cloud Synced
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center group-hover:border-amber-500/50 transition-colors shadow-inner">
                 <UserIcon size={18} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Background Mesh (Only visible in dark mode) */}
        {theme === 'dark' && (
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px] translate-x-1/4 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-zinc-500/10 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4" />
          </div>
        )}

        {/* Scrollable Content Container */}
        <section className={`flex-1 overflow-y-auto relative z-10 p-2 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
          <div className="min-h-full">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

// --- HELPER COMPONENT ---

const SidebarLink: React.FC<SidebarLinkProps> = ({ icon, label, active = false, onClick }) => (
  <button 
    type="button"
    onClick={onClick}
    className={`
      w-full flex items-center gap-5 p-4 rounded-3xl transition-all duration-300 group relative
      ${active 
        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-500/5 border border-transparent'}
    `}>
    {/* Active Indicator Glow */}
    {active && (
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-amber-500 rounded-full blur-sm" />
    )}
    
    <div className={`${active ? 'text-amber-500 scale-110' : 'text-zinc-600 group-hover:text-amber-500 group-hover:scale-110'} transition-all duration-300`}>
      {icon}
    </div>
    <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em]">
      {label}
    </span>
  </button>
);

export default AppShell;