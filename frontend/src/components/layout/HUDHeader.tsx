import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Edit3,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  Wifi,
  WifiOff,
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

interface HUDHeaderProps {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  onMenuClick?: () => void;
}

const HUDHeader: React.FC<HUDHeaderProps> = ({
  activeView,
  setActiveView,
  onMenuClick,
}) => {
  const { user, theme, toggleTheme, isOnline, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getViewLabel = (view: DashboardView) => {
    const labels: Record<DashboardView, string> = {
      projects: 'Overview',
      diary: 'Daily Record',
      resources: 'Work Schedule',
      collab: 'Team Chat',
      rates: 'Material Prices',
      settings: 'Reports',
      profile: 'Profile',
    };

    return labels[view] || 'Workspace';
  };

  const fullName = user?.user_metadata?.full_name || 'Surveyor';

  return (
    <header className="theme-nav-solid sticky top-0 z-40 border-b backdrop-blur-2xl transition-all duration-500">
      <div className="flex min-h-18 items-center justify-between gap-3 px-4 py-3 sm:min-h-20 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="theme-surface-inset theme-muted flex h-11 w-11 items-center justify-center rounded-2xl border lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <div
            className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="hidden sm:inline">
              {isOnline ? 'Synced' : 'Offline'}
            </span>
          </div>

          <div className="min-w-0 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-600 dark:text-amber-400">
              {getViewLabel(activeView)}
            </p>
            <p className="theme-subtle truncate text-xs font-semibold">
              {user?.email || 'Local workspace'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-button-muted theme-muted flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent transition-all active:scale-90 hover:border-amber-500/20 hover:text-amber-500"
            title="Change appearance"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown((current) => !current)}
              className={`flex items-center gap-3 rounded-2xl border px-2 py-2 transition-all ${
                showDropdown
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-transparent hover:bg-zinc-500/5'
              }`}
            >
              <div className="hidden text-right md:block">
                <p className="theme-title text-[11px] font-black uppercase tracking-tight leading-none">
                  {fullName.split(' ')[0]}
                </p>
                <p className="theme-subtle mt-1 text-[9px] font-bold uppercase tracking-[0.2em] leading-none">
                  Verified
                </p>
              </div>

              <div className="theme-surface-inset flex h-10 w-10 items-center justify-center rounded-xl border shadow-inner sm:h-11 sm:w-11">
                <span className="text-xs font-black italic text-amber-500">
                  {getInitials()}
                </span>
              </div>

              <ChevronDown
                size={14}
                className={`hidden text-zinc-500 transition-transform md:block ${
                  showDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showDropdown && (
              <div className="theme-surface-overlay absolute right-0 top-full z-50 mt-3 w-64 rounded-[2rem] border p-3 shadow-2xl backdrop-blur-3xl">
                <div className="theme-divider mb-3 border-b px-4 py-4 text-left">
                  <p className="theme-title text-sm font-black">{fullName}</p>
                  <p className="theme-subtle mt-1 truncate text-xs">{user?.email}</p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={10} />
                    Verified
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('settings');
                      setShowDropdown(false);
                    }}
                    className="theme-muted flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] transition-all hover:bg-zinc-500/5 hover:text-[var(--app-fg)]"
                  >
                    <Settings size={16} className="text-amber-500" />
                    Reports
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('profile');
                      setShowDropdown(false);
                    }}
                    className="theme-muted flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] transition-all hover:bg-zinc-500/5 hover:text-[var(--app-fg)]"
                  >
                    <Edit3 size={16} className="text-amber-500" />
                    Profile
                  </button>

                  <div className="theme-divider my-2 h-px" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-rose-500 transition-all hover:bg-rose-500/10"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HUDHeader;
