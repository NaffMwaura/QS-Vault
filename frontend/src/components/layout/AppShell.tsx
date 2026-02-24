import React from 'react';
// Fix: Remove the .tsx extension from the import path (standard for React projects)
import { useAuth } from "../../features/auth/AuthContext";
import { 
  HardHat, 
  LayoutGrid, 
  Settings, 
  LogOut, 
  Database, 
  ChevronRight
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

/** --- TYPES & INTERFACES --- **/

interface AppShellProps {
  children: React.ReactNode;
  session: Session | null; 
}

// Interface for helper component props
interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

/** --- MAIN APP SHELL --- **/

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  // session is passed from App.tsx but we can also access user/isLoading from useAuth
  const { user, signOut, isLoading } = useAuth();

  // Global Loading State (Used during auth initialization or navigation)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-16 h-16 mb-8">
          <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
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
    <div className="min-h-screen bg-white dark:bg-[#09090b] flex overflow-hidden">
      {/* 1. Sidebar Navigation - Professional Drafting Style */}
      <aside className="w-20 lg:w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-500/20 shrink-0">
            <HardHat size={24} className="text-black" />
          </div>
          <span className="hidden lg:block font-black uppercase tracking-tighter italic text-xl dark:text-white">
            QS VAULT
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarLink icon={<LayoutGrid size={20} />} label="Dashboard" active />
          <SidebarLink icon={<Database size={20} />} label="Library" />
          <SidebarLink icon={<Settings size={20} />} label="Settings" />
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button 
            type="button"
            onClick={signOut}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={20} />
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 bg-white/50 dark:bg-[#09090b]/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Workspace</span>
            <ChevronRight size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Active Project</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-tight dark:text-white leading-none">
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                Professional License
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
               <span className="text-[10px] font-black text-amber-500">
                 {user?.email?.[0].toUpperCase() || 'U'}
               </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <section className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-transparent">
          {children}
        </section>
      </main>
    </div>
  );
};

// --- HELPER COMPONENT ---

const SidebarLink: React.FC<SidebarLinkProps> = ({ icon, label, active = false }) => (
  <button 
    type="button"
    className={`
    w-full flex items-center gap-4 p-3 rounded-xl transition-all group
    ${active 
      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'}
  `}>
    <div className={`${active ? 'text-amber-500' : 'text-zinc-400 group-hover:text-amber-500'} transition-colors`}>
      {icon}
    </div>
    <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">
      {label}
    </span>
  </button>
);

export default AppShell;