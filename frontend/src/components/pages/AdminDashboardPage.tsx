/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Database, Activity, 
  Search, UserPlus, Settings, Wifi, WifiOff, 
  ExternalLink, ChevronRight, ShieldAlert,
  UserCog, Loader2, RefreshCw, LayoutGrid
} from 'lucide-react';
import { useNavigate } from "react-router-dom";

/** --- TYPES & INTERFACES --- **/
export type UserRole = 'user' | 'editor' | 'admin' | 'super-admin';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  updated_at: string;
  project_count?: number; 
}

interface AuthContextValue {
  theme: 'light' | 'dark';
  isOnline: boolean;
  role: UserRole | null;
  isLoading: boolean;
  toggleTheme: () => void;
}

/* ======================================================
    MODULE RESOLUTION HANDLERS
    Ensures the Canvas preview compiles while maintaining
    compatibility with your local project structure.
   ====================================================== */

// 1. Auth Shim
let useAuth: () => AuthContextValue = () => ({
  theme: 'dark',
  isOnline: true,
  role: 'admin',
  isLoading: false,
  toggleTheme: () => {},
});

// 2. Admin Service Shim
let adminService: any = {
  getGlobalStats: async () => ({ totalUsers: 0, totalProjects: 0, totalMeasurements: 0, systemHealth: 'Offline' }),
  getAllProfiles: async () => [],
  updateRole: async () => {}
};

const initializeServices = async () => {
  try {
    // @ts-ignore - Dynamic resolution for local project paths
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    // @ts-ignore - Dynamic resolution for local project paths
    const dbMod = await import("../../lib/database/database");
    if (dbMod.adminService) adminService = dbMod.adminService;
  } catch (e) {
    console.warn("Vault Admin: Local service resolution pending...");
  }
};

/** --- UI COMPONENTS --- **/
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
  theme: 'light' | 'dark';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, color, theme }) => (
  <div className={`p-8 rounded-[2.5rem] border backdrop-blur-2xl transition-all duration-500 hover:scale-[1.02] group
    ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60 shadow-black' : 'bg-white/70 border-zinc-200 shadow-zinc-200/50'}`}>
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 border border-current border-opacity-20 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">{label}</p>
    <h3 className="text-4xl font-black tracking-tighter italic leading-none">{value}</h3>
  </div>
);

/** --- MAIN ADMIN DASHBOARD --- **/
const AdminDashboardPage: React.FC = () => {
  const { theme, isOnline, role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, totalMeasurements: 0, systemHealth: 'Scanning...' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAdminData = async () => {
    // Attempt service handshake if not already established
    if (adminService.getGlobalStats === undefined || stats.systemHealth === 'Offline') {
      await initializeServices();
    }

    try {
      setLoading(true);
      setError(null);
      
      const [statsData, profilesData] = await Promise.all([
        adminService.getGlobalStats(),
        adminService.getAllProfiles()
      ]);
      
      setStats(statsData);
      setProfiles(profilesData);
    } catch (err: any) {
      console.error("Admin Access Error:", err);
      setError(err.message || "Failed to initialize secure link.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only attempt data load if the node has appropriate clearance and auth is finished
    if (!authLoading && isOnline && (role === 'admin' || role === 'super-admin')) {
      loadAdminData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, role, authLoading]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isOnline) return;
    setUpdatingId(userId);
    try {
      await adminService.updateRole(userId, newRole);
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
    } catch (err) {
      console.error("Failed to update node permissions:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    (p.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.includes(searchQuery)
  );

  // 1. Initial Auth Loading State
  if (authLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 animate-pulse">Syncing Authorization Node...</p>
      </div>
    );
  }

  // 2. Clearance Denial (Explicit Role Check)
  // We only show this if auth is NOT loading and the role is explicitly NOT admin
  if (role && role !== 'admin' && role !== 'super-admin') {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center p-20 text-center space-y-6">
        <ShieldAlert size={64} className="text-rose-500 animate-pulse" />
        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-zinc-900 dark:text-white">Access Denied</h2>
        <p className="text-zinc-500 text-sm max-w-md font-medium uppercase tracking-widest leading-relaxed">
          The requested clearance level was not detected on this node. Entry to the Command Center is restricted to system administrators.
        </p>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-amber-400 transition-all active:scale-95 shadow-xl shadow-amber-500/20"
        >
          Return to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-full transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      
      {/* 1. HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20 group hover:rotate-6 transition-transform">
              <ShieldCheck size={28} className="text-black" />
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                Command <span className="text-amber-500">Center.</span>
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-2">Momentum Global Infrastructure</p>
            </div>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black transition-all duration-500 uppercase tracking-[0.2em] 
            ${isOnline 
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' 
              : 'bg-red-500/5 border-red-500/20 text-red-500 animate-pulse'}`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{isOnline ? "Encrypted Uplink Active" : "Local Override Mode"}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {error && (
            <button onClick={loadAdminData} className="flex items-center gap-2 px-6 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-rose-500 bg-rose-500/10 border border-rose-500/20">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Retry Link
            </button>
          )}
          <button className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest border transition-all
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/40' : 'bg-white border-zinc-200 hover:border-amber-500/40'}`}>
            <Settings size={16} /> System Config
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest bg-amber-500 text-black shadow-xl shadow-amber-500/20 hover:bg-amber-400 active:scale-95">
            <UserPlus size={16} /> Provision User
          </button>
        </div>
      </header>

      {/* 2. ANALYTICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <StatCard label="Authorized Nodes" value={stats.totalUsers} icon={Users} color="text-blue-500" theme={theme} />
        <StatCard label="Active Workspaces" value={stats.totalProjects} icon={Database} color="text-amber-500" theme={theme} />
        <StatCard label="Total Takeoffs" value={stats.totalMeasurements} icon={Activity} color="text-emerald-500" theme={theme} />
        <StatCard label="Engine Health" value={stats.systemHealth} icon={ShieldAlert} color="text-rose-500" theme={theme} />
      </div>

      {/* 3. NODE MANAGEMENT CONSOLE */}
      <div className={`rounded-[3rem] border backdrop-blur-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200
        ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800/60 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        
        <div className="p-10 border-b border-zinc-800/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-left">
            <h3 className="text-2xl font-black uppercase tracking-tight italic">Registry Management</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1">Audit node activity and workspace authorization</p>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search Node Identifier..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-16 pr-8 py-5 rounded-2xl border outline-none font-bold text-xs transition-all focus:ring-4 ring-amber-500/10
                ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 text-white placeholder-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${theme === 'dark' ? 'bg-white/5 border-zinc-800/50' : 'bg-zinc-100 border-zinc-200'} border-b`}>
                {["Node Identification", "Active Workspaces", "Permission Logic", "Control"].map((h) => (
                  <th key={h} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center font-mono text-[10px] uppercase tracking-[0.5em] opacity-30 animate-pulse">Initializing Data Stream...</td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-zinc-500 font-bold text-xs uppercase tracking-widest">No matching nodes detected in the vault.</td>
                </tr>
              ) : filteredProfiles.map((p) => (
                <tr key={p.id} className="group hover:bg-amber-500/5 transition-colors">
                  <td className="px-10 py-8 text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-black text-amber-500">
                        {p.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-black text-lg uppercase tracking-tight group-hover:text-amber-500 transition-colors text-zinc-900 dark:text-white">{p.username || 'Unidentified Node'}</p>
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{p.id.slice(0,18)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black border 
                      ${(p.project_count || 0) > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-zinc-500/5 border-zinc-500/10 text-zinc-500 opacity-40'}`}>
                      <LayoutGrid size={12} />
                      {p.project_count || 0} Workspaces
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="relative w-44">
                       <select 
                        value={p.role}
                        disabled={updatingId === p.id}
                        onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                        className={`w-full appearance-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border outline-none transition-all cursor-pointer disabled:opacity-50
                          ${p.role === 'super-admin' ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 
                            p.role === 'admin' ? 'bg-blue-500/10 border-blue-500/40 text-blue-500' :
                            p.role === 'editor' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500' :
                            'bg-zinc-500/10 border-zinc-500/40 text-zinc-500'}`}
                       >
                         <option value="super-admin">Super Admin</option>
                         <option value="admin">System Admin</option>
                         <option value="editor">Editor (CRUD)</option>
                         <option value="user">Standard User</option>
                       </select>
                       <UserCog size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => navigate(`/admin/node/${p.id}`)}
                        className={`p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-amber-600'}`}>
                        {updatingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                      </button>
                      <button className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                        <ShieldAlert size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className={`p-8 border-t flex items-center justify-between opacity-50 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-200'}`}>
           <p className="text-[9px] font-black uppercase tracking-[0.4em] italic leading-none">Vault Authorization Protocol v2.6.4</p>
           <div className="flex gap-6">
              <ChevronRight className="rotate-180 cursor-pointer" size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Page 01 of 04</span>
              <ChevronRight className="cursor-pointer" size={14} />
           </div>
        </div>
      </div>

      <footer className="pt-20 pb-10 flex flex-col items-center gap-4 opacity-20">
        <div className="flex items-center gap-6">
           <div className="h-px w-20 bg-amber-500" />
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.6em] italic">Momentum Global Network Security</p>
           <div className="h-px w-20 bg-amber-500" />
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.8em] text-zinc-600">Precision • Compliance • Integrity</p>
      </footer>
    </div>
  );
};

export default AdminDashboardPage;