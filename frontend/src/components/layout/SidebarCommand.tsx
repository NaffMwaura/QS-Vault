import React from 'react';
import {
  Calendar,
  ClipboardList,
  Database,
  HardHat,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  Sun,
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth, type DashboardView } from "../../features/auth/AuthContext";

interface SidebarCommandProps {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

/** --- SUB-COMPONENT: SIDEBAR_LINK --- **/
const SidebarLink = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center justify-between px-6 py-4 rounded-2xl border-2 transition-all duration-300 group
      ${active
        ? 'bg-amber-500 text-black border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]'
        : 'bg-transparent border-transparent text-(--app-meta)] hover:bg-[color-mix(in_srgb,var(--app-heading)_5%,transparent)] hover:text-(--app-heading)'
      }`}
  >
    <div className="flex items-center gap-4">
      <Icon size={18} className={`${active ? 'text-black' : 'group-hover:text-amber-500'} transition-colors`} />
      <span className="text-[11px] font-black uppercase tracking-widest leading-none">
        {label}
      </span>
    </div>
    {active && <ChevronRight size={14} className="animate-in slide-in-from-left-2" />}
  </button>
);

/** --- SHARED SIDEBAR CONTENT --- **/
const SidebarContent = ({
  activeView,
  setActiveView,
  onClose,
}: {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  onClose?: () => void;
}) => {
  const { user, theme, toggleTheme, signOut } = useAuth();

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || 'User';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const navLinks = [
    { id: 'projects' as DashboardView, label: 'All Projects', icon: LayoutGrid },
    { id: 'diary' as DashboardView, label: 'Daily Record', icon: ClipboardList },
    { id: 'resources' as DashboardView, label: 'Work Schedule', icon: Calendar },
    { id: 'collab' as DashboardView, label: 'Team Chat', icon: MessageSquare },
    { id: 'rates' as DashboardView, label: 'Material Prices', icon: Database },
    { id: 'settings' as DashboardView, label: 'Office Reports', icon: Settings },
  ];

  const handleNavigate = (view: DashboardView) => {
    setActiveView(view);
    onClose?.();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 1. BRANDING AREA */}
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-(--app-border)] px-6">
        <button
          type="button"
          onClick={() => handleNavigate('projects')}
          className="flex items-center gap-3 transition-transform active:scale-95"
        >
          <div className="rounded-xl bg-amber-500 p-2 shadow-lg">
            <HardHat size={20} className="text-black" />
          </div>
          <div className="text-left">
            <p className="theme-heading text-lg tracking-tighter italic">QS APP<span className="text-amber-500">.</span></p>
          </div>
        </button>

        {onClose && (
          <button onClick={onClose} className="p-2 lg:hidden theme-icon">
            <X size={20} />
          </button>
        )}
      </div>

      {/* 2. USER MINI-PROFILE */}
      <div className="p-6">
        <div className="theme-card flex items-center justify-between p-4 rounded-3xl border-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-black font-black italic text-xs">
              {getInitials()}
            </div>
            <div className="min-w-0 text-left">
              <p className="theme-heading truncate text-[11px] uppercase tracking-tight">
                {user?.user_metadata?.full_name?.split(' ')[0] || 'Surveyor'}
              </p>
              <div className="flex items-center gap-1.5 opacity-60">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span className="text-[8px] font-black uppercase tracking-widest">Verified</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl theme-button-secondary border-none hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* 3. NAVIGATION NODES */}
      <nav className="flex-1 space-y-2 px-4 py-2 overflow-y-auto custom-scrollbar">
        {navLinks.map((link) => (
          <SidebarLink
            key={link.id}
            icon={link.icon}
            label={link.label}
            active={activeView === link.id}
            onClick={() => handleNavigate(link.id)}
          />
        ))}
      </nav>

      {/* 4. SYSTEM EXIT */}
      <div className="p-6 border-t border-(--app-border)]">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center justify-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:bg-rose-600 active:scale-95 italic"
        >
          <LogOut size={16} /> Log Out System
        </button>
      </div>
    </div>
  );
};

/** --- MAIN WRAPPER: ADAPTIVE FRAME --- **/
const SidebarCommand: React.FC<SidebarCommandProps> = ({
  activeView,
  setActiveView,
  mobileOpen = false,
  onClose,
}) => {
  return (
    <>
      {/* Desktop Persistent Drawer */}
      <aside className="theme-panel sticky top-0 hidden h-screen w-72 shrink-0 border-r-2 flex-col lg:flex z-50">
        <SidebarContent activeView={activeView} setActiveView={setActiveView} />
      </aside>

      {/* Mobile Modal Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-100] lg:hidden flex">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={onClose} 
          />
          <aside className="theme-panel relative z-10 flex h-full w-[85vw] max-w-[320px] flex-col border-r-2 animate-in slide-in-from-left duration-500 shadow-2xl">
            <SidebarContent
              activeView={activeView}
              setActiveView={setActiveView}
              onClose={onClose}
            />
          </aside>
        </div>
      )}
    </>
  );
};

export default SidebarCommand;