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
} from 'lucide-react';
import { useAuth } from "../../features/auth/AuthContext";

export type DashboardView =
  | 'projects'
  | 'rates'
  | 'settings'
  | 'profile'
  | 'diary'
  | 'resources'
  | 'collab';

interface SidebarCommandProps {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

const navLinks = [
  { id: 'projects' as DashboardView, label: 'Overview', icon: LayoutGrid },
  { id: 'diary' as DashboardView, label: 'Daily Record', icon: ClipboardList },
  { id: 'resources' as DashboardView, label: 'Schedule', icon: Calendar },
  { id: 'collab' as DashboardView, label: 'Team Chat', icon: MessageSquare },
  { id: 'rates' as DashboardView, label: 'Rates', icon: Database },
  { id: 'settings' as DashboardView, label: 'Reports', icon: Settings },
];

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
    className={`theme-admin-control flex w-full items-center gap-3.5 border text-left transition-all ${
      active
        ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20'
        : 'theme-muted border-transparent hover:bg-zinc-500/5 hover:text-[(--app-fg)]'
    }`}
  >
    <Icon size={18} />
    <span className="text-[0.72rem] font-black uppercase tracking-[0.14em] leading-none">
      {label}
    </span>
  </button>
);

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
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNavigate = (view: DashboardView) => {
    setActiveView(view);
    onClose?.();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[(--app-divider)] px-5 py-5 lg:px-6 lg:py-6">
        <button
          type="button"
          onClick={() => handleNavigate('projects')}
          className="flex items-center gap-3 text-left"
        >
          <div className="rounded-2xl bg-amber-500 p-2.5 shadow-xl shadow-amber-500/20">
            <HardHat size={22} className="text-black" />
          </div>
          <div>
            <p className="theme-title text-lg font-black uppercase tracking-tight italic">
              QS VAULT<span className="text-amber-500">.</span>
            </p>
            <p className="theme-subtle text-[10px] font-black uppercase tracking-[0.24em]">
              Admin Workspace
            </p>
          </div>
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="theme-surface-inset theme-muted theme-admin-icon-button-compact flex items-center justify-center border lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="px-5 py-5">
        <div className="theme-surface-inset flex items-center gap-3 rounded-2xl border p-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 font-black italic text-amber-500">
            {getInitials()}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="theme-title truncate text-sm font-black">
              {user?.user_metadata?.full_name || 'Surveyor'}
            </p>
            <p className="theme-subtle truncate text-xs">
              {user?.email || 'Verified operator'}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-button-muted theme-muted theme-admin-icon-button-compact flex items-center justify-center border"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-5 py-2">
        {navLinks.map((link) => (
          <SidebarLink
            key={link.id}
            icon={link.icon}
            label={link.label}
            active={activeView === link.id}
            onClick={() => handleNavigate(link.id)}
          />
        ))}

        <button
          type="button"
          onClick={signOut}
          className="theme-admin-control mt-3 flex w-full items-center gap-3.5 border border-rose-500/15 bg-rose-500/6 text-left text-rose-500 transition-all hover:bg-rose-500/10"
        >
          <LogOut size={18} />
          <span className="text-[0.72rem] font-black uppercase tracking-[0.14em] leading-none">
            Log Out
          </span>
        </button>
      </nav>
    </div>
  );
};

const SidebarCommand: React.FC<SidebarCommandProps> = ({
  activeView,
  setActiveView,
  mobileOpen = false,
  onClose,
}) => {
  return (
    <>
      <aside className="theme-surface-overlay sticky top-0 hidden h-screen w-72 shrink-0 border-r backdrop-blur-3xl lg:flex">
        <div className="h-full w-full overflow-y-auto custom-scrollbar">
          <SidebarContent activeView={activeView} setActiveView={setActiveView} />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Close navigation"
          />
          <aside className="theme-surface-overlay relative z-10 h-full w-[88vw] max-w-sm border-r backdrop-blur-3xl">
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
