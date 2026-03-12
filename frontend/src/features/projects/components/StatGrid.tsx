/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { 
  Database, 
  Globe, 
  WifiOff,
  ClipboardList
} from 'lucide-react';

/* ======================================================
    OFFICE DATABASE INTEGRATION
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  theme: 'dark',
  isOnline: true,
});

const resolveModules = async () => {
  try {
    // Attempt to resolve real office security settings
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  } catch (e) {
    // Sandbox fallback active
  }
};

resolveModules();

/** --- TYPES --- **/

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  desc?: string;
}

interface StatGridProps {
  projectsCount?: number;
  measurementsCount?: number;
}

/** --- SUB-COMPONENT: STAT_CARD --- **/

const StatCard: React.FC<{ item: StatItem; theme: 'light' | 'dark' }> = ({ item, theme }) => (
  <div className={`p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border backdrop-blur-3xl flex justify-between items-center group transition-all duration-500 hover:scale-[1.02]
    ${theme === 'dark' 
      ? 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/30 shadow-2xl shadow-black/50' 
      : 'bg-white border-zinc-200 hover:border-amber-500/30 shadow-xl shadow-zinc-200/50'}`}>
    
    <div className="text-left space-y-3">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 leading-none">
        {item.label}
      </p>
      <p className={`text-4xl sm:text-5xl font-black italic tracking-tighter leading-none
        ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
        {item.value}
      </p>
      {item.desc && (
        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none">
          {item.desc}
        </p>
      )}
    
    </div>

    <div className={`p-5 rounded-3xl transition-all duration-500 group-hover:scale-110 shadow-inner
      ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-100'}`}>
      <item.icon 
        className={`${item.color} opacity-40 group-hover:opacity-100 transition-opacity duration-500`} 
        size={32} 
      />
    </div>
  </div>
);

/** --- MAIN COMPONENT: OFFICE METRICS GRID --- **/

const StatGrid: React.FC<StatGridProps> = ({ projectsCount = 0, measurementsCount = 0 }) => {
  const { theme, isOnline } = useAuth();

  const stats: StatItem[] = [
    { 
      label: 'Active Projects', 
      value: projectsCount, 
      icon: Database, 
      color: 'text-amber-500',
      desc: 'Office Workspaces'
    },
    { 
      label: 'Sync Status', 
      value: isOnline ? 'Verified' : 'Offline', 
      icon: isOnline ? Globe : WifiOff, 
      color: isOnline ? 'text-emerald-500' : 'text-rose-500',
      desc: isOnline ? 'Live Cloud Sync' : 'Saving to Device'
    },
    { 
      label: 'Measurements', 
      value: measurementsCount, 
      icon: ClipboardList, 
      color: 'text-blue-500',
      desc: 'Total Records'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {stats.map((stat, index) => (
        <StatCard key={index} item={stat} theme={theme} />
      ))}
    </div>
  );
};

export default StatGrid;