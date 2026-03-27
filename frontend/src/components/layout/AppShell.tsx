import React, { useState } from 'react';
import { useLocation } from "react-router-dom";
import { HardHat, ShieldCheck } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import HUDHeader from "./HUDHeader";
import SidebarCommand from "./SidebarCommand";

interface AppShellProps {
  children?: React.ReactNode;
}

const OfficeLoader = ({ isOnline }: { isOnline: boolean }) => (
  <div className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-[#09090b] p-6 text-center">
    <div className="relative mb-12 h-28 w-28">
      <div className="absolute inset-0 rounded-full border-4 border-zinc-900" />
      <div className="absolute inset-0 animate-[spin_2s_linear_infinite] rounded-full border-4 border-amber-500 border-t-transparent" />
      <div className="absolute inset-4 rounded-full border-2 border-zinc-800" />
      <div className="absolute inset-4 animate-[spin_1.5s_linear_infinite_reverse] rounded-full border-2 border-amber-400 border-b-transparent" />
      <div className="absolute inset-10 animate-pulse rounded-full border border-amber-500/10 shadow-[0_0_40px_rgba(245,158,11,0.15)]" />
    </div>
    <div className="space-y-3">
      <h2 className="text-sm font-black uppercase tracking-[0.6em] text-amber-500 italic">
        QS VAULT
      </h2>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic">
        {isOnline ? "Syncing with Cloud..." : "Opening Local Database..."}
      </p>
    </div>
  </div>
);

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    isLoading: authLoading,
    isOnline,
    activeView,
    setActiveView,
    user,
  } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (authLoading && !user) {
    return <OfficeLoader isOnline={isOnline} />;
  }

  return (
    <div className="theme-page h-screen overflow-hidden font-sans transition-colors duration-500 selection:bg-amber-500/30">
      <div className="flex h-full">
        <SidebarCommand
          activeView={activeView || 'projects'}
          setActiveView={setActiveView}
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <HUDHeader
            activeView={activeView || 'projects'}
            setActiveView={setActiveView}
            onMenuClick={() => setMobileNavOpen(true)}
          />

          <main className="relative flex-1 overflow-y-auto custom-scrollbar">
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-30">
              <div className="theme-glow-amber absolute right-0 top-0 h-1/2 w-1/2 -translate-y-1/4 translate-x-1/4 rounded-full blur-[140px]" />
              <div className="theme-glow-neutral absolute bottom-0 left-0 h-[30%] w-[30%] -translate-x-1/4 translate-y-1/4 rounded-full blur-[120px]" />
            </div>

            <section className="relative z-10 mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              <div key={location.pathname} className="flex-1 animate-workspace">
                {children || (
                  <div className="flex min-h-[60vh] flex-col items-center justify-center opacity-20">
                    <ShieldCheck size={48} className="mb-4 text-amber-500" />
                    <p className="text-xs font-black uppercase tracking-[0.5em] italic">
                      Workspace Ready
                    </p>
                  </div>
                )}
              </div>

              <footer className="mt-auto hidden pb-8 pt-16 text-center opacity-10 md:block">
                <div className="mb-4 flex items-center justify-center gap-8">
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
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; transition: background 0.3s; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }

        @keyframes workspace-entry {
          0% { opacity: 0; transform: translateY(10px) scale(0.99); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        .animate-workspace {
          animation: workspace-entry 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default AppShell;
