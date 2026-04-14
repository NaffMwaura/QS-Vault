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
            className="theme-surface-inset theme-muted theme-admin-icon-button flex items-center justify-center border lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <div
            className={`theme-admin-chip flex items-center gap-2 border transition-all ${
              isOnline
                ? 'theme-status-online'
                : 'theme-status-offline'
            }`}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="hidden sm:inline">
              {isOnline ? 'Synced' : 'Offline'}
            </span>
          </div>

          <div className="min-w-0 text-left">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] theme-accent">
              {getViewLabel(activeView)}
            </p>
            <p className="theme-admin-meta truncate">
              {user?.email || 'Local workspace'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-button-muted theme-muted theme-admin-icon-button flex items-center justify-center border border-transparent transition-all active:scale-90 hover:border-[var(--app-accent-strong)] hover:text-[var(--app-accent-strong)]"
            title="Change appearance"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown((current) => !current)}
              className={`flex min-h-[2.9rem] items-center gap-3 rounded-2xl border px-2.5 py-2 transition-all ${
                showDropdown
                  ? 'border-[var(--app-accent-strong)] theme-accent-surface'
                  : 'border-transparent hover:bg-[color-mix(in_srgb,var(--app-body)_5%,transparent)]'
              }`}
            >
              <div className="hidden text-right md:block">
                <p className="theme-title text-[0.76rem] font-black uppercase tracking-tight leading-none">
                  {fullName.split(' ')[0]}
                </p>
                <p className="theme-admin-meta mt-1 text-[0.66rem] uppercase tracking-[0.14em] leading-none">
                  Verified
                </p>
              </div>

              <div className="theme-surface-inset flex h-10 w-10 items-center justify-center rounded-xl border shadow-inner sm:h-11 sm:w-11">
                <span className="text-xs font-black italic theme-accent">
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
              <div className="theme-surface-overlay absolute right-0 top-full z-50 mt-3 w-64 rounded-4xl border p-3 shadow-2xl backdrop-blur-3xl">
              <div className="theme-divider mb-3 border-b px-4 py-4 text-left">
                  <p className="theme-admin-subheading">{fullName}</p>
                  <p className="theme-admin-meta mt-1 truncate">{user?.email}</p>
                  <div className="theme-admin-chip mt-3 inline-flex items-center gap-2 border theme-status-success">
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
                    className="theme-muted theme-admin-control flex w-full items-center gap-3 text-left transition-all hover:bg-zinc-500/5 hover:text-(--app-fg)"
                  >
                    <Settings size={16} className="theme-accent" />
                    Reports
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('profile');
                      setShowDropdown(false);
                    }}
                    className="theme-muted theme-admin-control flex w-full items-center gap-3 text-left transition-all hover:bg-zinc-500/5 hover:text-[--app-fg)]"
                  >
                    <Edit3 size={16} className="theme-accent" />
                    Profile
                  </button>

                  <div className="theme-divider my-2 h-px" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      signOut();
                    }}
                    className="theme-admin-control flex w-full items-center gap-3 text-left text-[var(--app-error)] transition-all hover:bg-[var(--app-error-bg)]"
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
