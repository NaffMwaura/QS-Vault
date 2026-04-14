import React from "react";
import { Database, Globe, WifiOff,  TrendingUp } from "lucide-react";
import { useAuth } from "../../../features/auth/AuthContext";

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

const StatCard: React.FC<{ item: StatItem }> = ({
  item,
}) => (
  <div
    className={`p-8 sm:p-10 rounded-sm border flex justify-between items-center group transition-all duration-500 hover:scale-[1.02] theme-panel hover:border-[var(--app-accent-strong)]`}
  >
    <div className="text-left space-y-3">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--app-meta)] leading-none">
        {item.label}
      </p>
      <p className={`text-4xl font-black italic tracking-tighter leading-none text-[var(--app-heading)]`}
      >
        {item.value}
      </p>
      {item.desc && (
        <p className="text-[9px] font-bold text-[var(--app-meta)] uppercase tracking-widest leading-none">
          {item.desc}
        </p>
      )}
    </div>

    <div className={`p-5 rounded-sm transition-all duration-500 group-hover:scale-110 theme-card border`}
    >
      <item.icon
        className={`${item.color} opacity-40 group-hover:opacity-100 transition-opacity duration-500`}
        size={28}
      />
    </div>
  </div>
);

const StatGrid: React.FC<StatGridProps> = ({
  projectsCount = 0,
  measurementsCount = 0,
}) => {
  const { isOnline } = useAuth();

  const stats: StatItem[] = [
    {
      label: "Running Projects",
      value: projectsCount.toString().padStart(2, '0'),
      icon: Database,
      color: "text-amber-500",
      desc: "Active Office Vaults",
    },
    {
      label: "Cloud Connection",
      value: isOnline ? "Synced" : "Local",
      icon: isOnline ? Globe : WifiOff,
      color: isOnline ? "text-emerald-500" : "text-rose-500",
      desc: isOnline ? "Live Database Link" : "Offline Workspace",
    },
    {
      label: "Recorded Items",
      value: measurementsCount,
      icon: TrendingUp,
      color: "text-blue-500",
      desc: "Total Takeoff Nodes",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {stats.map((stat, index) => (
        <StatCard key={index} item={stat} />
      ))}
    </div>
  );
};

export default StatGrid;
