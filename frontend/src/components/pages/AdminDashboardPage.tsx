/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { 
  ShieldCheck, Users, Database, Activity, 
  Search, Settings, Wifi, WifiOff, 
  ExternalLink, ChevronRight, ShieldAlert,
   Loader2, RefreshCw, LayoutGrid,
  HardHat, LogOut, Sun, Moon, 
  BarChart3, User as UserIcon, Camera, ArrowLeft, Save, Edit3,
  Layers, Trash2, 
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

export interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name: string;
  location: string;
  status: string;
  created_at: string;
  username?: string; 
}

/* ======================================================
    MODULE RESOLUTION HANDLERS
    Ensures the Canvas preview compiles while maintaining
    compatibility with your local project structure.
   ====================================================== */

let useAuth: any = () => ({
  user: { id: 'admin-node-001', email: 'admin@vault.systems', user_metadata: { full_name: 'Naftaly Mwaura' } },
  signOut: async () => { console.log("Secure Sign Out Executed"); window.location.href = "/"; },
  theme: 'dark',
  toggleTheme: () => {},
  isOnline: true,
  role: 'admin',
  isLoading: false
});

let adminService: any = {
  getGlobalStats: async () => ({ totalUsers: 124, totalProjects: 45, totalMeasurements: 1842, systemHealth: 'Optimal' }),
  getAllProfiles: async () => [
    { id: '1', username: 'surveyor_alpha', full_name: 'Surveyor Alpha', role: 'editor', updated_at: new Date().toISOString(), project_count: 5 },
    { id: '2', username: 'naftali795', full_name: 'Naftaly Mwaura', role: 'admin', updated_at: new Date().toISOString(), project_count: 12 },
  ],
  updateRole: async () => {},
  deleteProject: async () => {},
  getAllProjects: async () => []
};

const resolveModules = async () => {
  try {
    // @ts-ignore
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    // @ts-ignore
    const dbMod = await import("../../lib/database/database");
    if (dbMod.adminService) adminService = dbMod.adminService;
  } catch (err) {
    console.warn("Vault Admin: Handshake with shims active.");
  }
};

resolveModules();

/** --- UI HELPER COMPONENTS --- **/
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
    <div className="flex justify-between items-start mb-6 text-left">
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 border border-current border-opacity-20 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      {trend && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">{trend}</span>}
    </div>
    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 leading-none text-left">{label}</p>
    <h3 className="text-4xl font-black tracking-tighter italic leading-none text-left">{value}</h3>
  </div>
);

/** --- MAIN ADMIN DASHBOARD --- **/
const AdminDashboardPage: React.FC = () => {
  const { theme, toggleTheme, isOnline, role, isLoading: authLoading, user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // --- View Management ---
  const [activeView, setActiveView] = useState<'registry' | 'projects' | 'rates' | 'settings' | 'profile'>('registry');

  // --- Admin States ---
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, totalMeasurements: 0, systemHealth: 'Scanning...' });
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // --- Profile Identity State ---
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || 'Naftaly Mwaura');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // --- Rates State ---
  const [rateSearch, setRateSearch] = useState("");
  const [activeRateCategory, setActiveRateCategory] = useState<string>('all');
  const [rates] = useState<any[]>([
    { id: '1', code: 'MAT-001', name: 'Portland Cement (50kg)', category: 'material', unit: 'Bag', rate: 850 },
    { id: '2', code: 'LAB-020', name: 'Skilled Mason (Daily)', category: 'labor', unit: 'Day', rate: 2500 },
    { id: '3', code: 'PLT-005', name: 'Concrete Mixer (Diesel)', category: 'plant', unit: 'Day', rate: 4500 },
    { id: '4', code: 'MAT-012', name: 'River Sand', category: 'material', unit: 'Ton', rate: 3200 },
  ]);

  const [sysSettings] = useState({ sync: true, precision: true, encryption: true });

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, profilesData] = await Promise.all([
        adminService.getGlobalStats(),
        adminService.getAllProfiles()
      ]);
      
      let globalProjects = [];
      if (adminService.getAllProjects) {
        globalProjects = await adminService.getAllProjects();
      }
      
      setStats(statsData);
      setProfiles(profilesData || []);
      setAllProjects(globalProjects || []);
    } catch (err: any) {
      console.error("Admin Handshake Error:", err);
      setError("Database Node Connectivity Interrupted.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (role === 'admin' || role === 'super-admin')) {
      loadAdminData();
    }
  }, [role, authLoading]);

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Permanently delete this project from the global registry?")) return;
    try {
      if (adminService.deleteProject) {
        await adminService.deleteProject(projectId);
      }
      setAllProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      console.error("Deletion failed:", err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isOnline) return;
    setUpdatingId(userId);
    try {
      await adminService.updateRole(userId, newRole);
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
    } catch (err) {
      console.error("Role mutation failed:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredNodes = profiles.filter(p => (p.username || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProjects = allProjects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const filteredRates = useMemo(() => {
    return rates.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(rateSearch.toLowerCase()) || r.code.toLowerCase().includes(rateSearch.toLowerCase());
      const matchesCategory = activeRateCategory === 'all' || r.category === activeRateCategory;
      return matchesSearch && matchesCategory;
    });
  }, [rates, rateSearch, activeRateCategory]);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#09090b]">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em] mt-6">Establishing Admin Link...</p>
      </div>
    );
  }

  // Defensive clearance denial check
  if (role && role !== 'admin' && role !== 'super-admin') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-20 text-center space-y-6 bg-[#09090b]">
        <ShieldAlert size={64} className="text-rose-500 animate-pulse" />
        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white leading-none">Access Denied</h2>
        <p className="text-zinc-500 text-sm max-w-md font-medium uppercase tracking-widest leading-relaxed">
          Required clearance level not detected on this node.
        </p>
        <button onClick={() => navigate('/dashboard')} className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-amber-400 transition-all">Return to Workspace</button>
      </div>
    );
  }

  function handleImageUpload(_event: ChangeEvent<HTMLInputElement, HTMLInputElement>): void {
    throw new Error('Function not implemented.');
  }

  function toggleSetting(_arg0: any): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 selection:bg-amber-500/30 flex overflow-hidden
      ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
      
      {/* --- 1. INTEGRATED MASTER SIDEBAR --- */}
      <aside className={`relative z-50 w-20 lg:w-72 flex flex-col transition-all duration-500 ease-in-out border-r shrink-0
        ${theme === 'dark' ? 'bg-zinc-950/70 backdrop-blur-3xl border-zinc-800/40 shadow-2xl shadow-black' : 'bg-white border-zinc-200 shadow-xl'}`}>
        <div className="p-6 lg:p-8 flex items-center gap-4 cursor-pointer group" onClick={() => setActiveView('registry')}>
          <div className="bg-amber-500 p-2.5 rounded-2xl shadow-xl shrink-0 group-hover:rotate-6 transition-transform"><HardHat size={24} className="text-black" /></div>
          <div className="hidden lg:block text-left">
            <span className={`block font-black uppercase tracking-tighter italic text-xl leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>QS VAULT<span className="text-amber-500">.</span></span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1 block">Admin Console 2.0</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-3">
          <SidebarLink icon={Users} label="Registry" active={activeView === 'registry'} onClick={() => setActiveView('registry')} theme={theme} />
          <SidebarLink icon={Database} label="All Projects" active={activeView === 'projects'} onClick={() => setActiveView('projects')} theme={theme} />
          <SidebarLink icon={BarChart3} label="Rates Library" active={activeView === 'rates'} onClick={() => setActiveView('rates')} theme={theme} />
          <SidebarLink icon={Settings} label="Vault Config" active={activeView === 'settings'} onClick={() => setActiveView('settings')} theme={theme} />
        </nav>

        <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800/30' : 'border-zinc-200'}`}>
          <div onClick={() => setActiveView('profile')} className={`mb-4 hidden lg:flex items-center gap-3 p-3 rounded-2xl border cursor-pointer hover:border-amber-500/30 transition-all ${theme === 'dark' ? 'bg-zinc-500/5 border-zinc-500/10' : 'bg-zinc-50 border-zinc-100'}`}>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
               <UserIcon size={14} className="text-amber-500" />
            </div>
            <div className="overflow-hidden text-left flex-1 text-left"><p className={`text-[10px] font-black uppercase tracking-tight truncate leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{fullName}</p><p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Super Admin</p></div>
            <button onClick={(e) => { e.stopPropagation(); toggleTheme(); }} className="p-2 rounded-lg hover:bg-zinc-500/10 text-zinc-500 transition-colors">{theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}</button>
          </div>
          <button type="button" onClick={() => signOut()} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${theme === 'dark' ? 'text-zinc-500 hover:text-red-500 hover:bg-red-500/10' : 'text-zinc-400 hover:text-red-600 hover:bg-red-50'}`}>
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /><span className="hidden lg:block text-[10px] font-black uppercase tracking-widest text-left leading-none">Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* --- 2. MAIN HUB AREA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className={`h-20 border-b flex items-center justify-between px-8 z-20 backdrop-blur-md shrink-0 transition-all duration-300 ${theme === 'dark' ? 'bg-[#09090b]/80 border-zinc-800/40 shadow-lg' : 'bg-white border-zinc-200 shadow-sm'}`}>
          <div className="flex items-center gap-4 text-left">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isOnline ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-red-500/5 border-red-500/20 text-red-500 animate-pulse'}`}>
               {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
               <span className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none`}>{isOnline ? 'Admin Online' : 'Local Protocol'}</span>
            </div>
            <ChevronRight size={14} className="text-zinc-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500 italic leading-none">{activeView.toUpperCase()} MODE</span>
          </div>
          
          <button onClick={() => setActiveView('profile')} className="flex items-center gap-4 group active:scale-95 transition-all">
             <div className="text-right hidden sm:block text-left text-left"><p className={`text-[10px] font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{fullName}</p><p className="text-[8px] font-bold uppercase mt-1 text-zinc-500 leading-none">REF: {user?.id?.slice(0, 12).toUpperCase()}</p></div>
             <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:border-amber-500 shadow-inner ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <UserIcon size={20} className="text-zinc-500 group-hover:text-amber-500" />
             </div>
          </button>
        </header>

        <section className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar scroll-smooth relative">
          {/* Background FX */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30 z-0">
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-500/10 rounded-full blur-[120px] translate-x-1/4 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-zinc-500/10 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4" />
          </div>

          <div className="max-w-7xl mx-auto space-y-10 relative z-10 text-left">
            
            {activeView === 'registry' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="Authorized Nodes" value={stats.totalUsers} icon={Users} color="text-blue-500" trend="+12%" theme={theme} />
                  <StatCard label="Platform Vaults" value={stats.totalProjects} icon={Database} color="text-amber-500" trend="+4%" theme={theme} />
                  <StatCard label="Global Takeoffs" value={stats.totalMeasurements} icon={Activity} color="text-emerald-500" trend="+28%" theme={theme} />
                  <StatCard label="Engine Health" value={isOnline ? 'Optimal' : 'Offline'} icon={ShieldCheck} color="text-rose-500" theme={theme} />
                </div>

                <div className={`rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-sm'}`}>
                  <div className="p-10 border-b border-zinc-800/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/[0.02]">
                    <div className="text-left text-left"><h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Node Registry</h3><p className="text-[10px] font-black uppercase text-zinc-500 mt-2 leading-none">Manage platform identities and access clearance</p></div>
                    <div className="relative w-full md:w-96 group text-left">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                      <input type="text" placeholder="Search Node Identifier..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-16 pr-8 py-5 rounded-2xl border outline-none font-bold text-xs ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-800' : 'bg-zinc-50 border-zinc-200'}`} />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead><tr className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} border-b`}><th className="p-10 text-[10px] font-black uppercase text-zinc-500 italic text-left">Node Identification</th><th className="p-10 text-[10px] font-black uppercase text-zinc-500 italic text-left">Workspaces</th><th className="p-10 text-[10px] font-black uppercase text-zinc-500 italic text-left">Clearance Level</th><th className="p-10 text-[10px] font-black uppercase text-zinc-500 italic text-right">Control</th></tr></thead>
                      <tbody className="divide-y divide-zinc-800/40">
                        {loading ? (<tr><td colSpan={4} className="p-20 text-center font-mono text-[10px] uppercase opacity-30 animate-pulse">Initializing Data Stream...</td></tr>) : filteredNodes.map((p) => (
                          <tr key={p.id} className="group hover:bg-amber-500/5 transition-colors">
                            <td className="p-10 text-left"><div className="flex items-center gap-4 text-left"><div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-black text-amber-500">{(p.username?.[0] || '?').toUpperCase()}</div><div className="text-left text-left"><p className="font-black text-lg uppercase text-zinc-900 dark:text-white group-hover:text-amber-500 leading-none">{p.username || 'Unidentified Node'}</p><p className="text-[9px] font-mono text-zinc-500 uppercase mt-2">GUID: {p.id.slice(0,18)}...</p></div></div></td>
                            <td className="p-10 text-left"><div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black border ${(p.project_count || 0) > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-zinc-500/5 text-zinc-500 opacity-40'}`}><LayoutGrid size={12}/> {p.project_count || 0} Nodes</div></td>
                            <td className="p-10 text-left"><select value={p.role} disabled={updatingId === p.id} onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)} className={`appearance-none px-4 py-2 rounded-xl text-[10px] font-black uppercase border outline-none bg-zinc-900 border-zinc-800 text-zinc-300 shadow-inner`}>
                              <option value="super-admin">Super Admin</option><option value="admin">System Admin</option><option value="editor">Editor</option><option value="user">Standard User</option></select></td>
                            <td className="p-10 text-right"><div className="flex gap-3 justify-end"><button className="p-4 bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-2xl hover:bg-amber-500 hover:text-black transition-all shadow-xl"><ExternalLink size={18}/></button><button className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl"><ShieldAlert size={18}/></button></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'projects' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className={`rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800 shadow-black' : 'bg-white border-zinc-200'}`}>
                   <div className="p-10 border-b border-zinc-800/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/[0.02]">
                      <div className="text-left text-left text-left text-left"><h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Global Vault Projects</h3><p className="text-[10px] font-black uppercase text-zinc-500 mt-2 leading-none text-left">Visibility and control of construction takeoff nodes across all nodes</p></div>
                      <div className="relative w-full md:w-96 group text-left"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500" size={18} /><input type="text" placeholder="Search project name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-16 pr-8 py-5 rounded-2xl border outline-none font-bold text-xs ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-800' : 'bg-zinc-50 border-zinc-200'}`} /></div>
                   </div>
                   <div className="overflow-x-auto text-left">
                     <table className="w-full text-left">
                       <thead><tr className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} border-b`}><th className="p-10 text-[10px] font-black uppercase text-zinc-500 italic">Project Identity</th><th className="p-10 text-[10px] font-black uppercase text-zinc-500 italic">Auth Node</th><th className="p-10 text-[10px] font-black uppercase text-zinc-500 italic text-right">Control</th></tr></thead>
                       <tbody className="divide-y divide-zinc-800/40">
                         {filteredProjects.map(proj => (
                           <tr key={proj.id} className="group hover:bg-amber-500/5 transition-colors">
                             <td className="p-10"><div className="flex flex-col text-left text-left"><span className={`font-black text-xl uppercase tracking-tighter transition-colors group-hover:text-amber-500 ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>{proj.name}</span><span className="text-[9px] font-mono text-zinc-600 mt-1 uppercase">LOC: {proj.location || 'SITE_NODE'}</span></div></td>
                             <td className="p-10"><div className="flex items-center gap-2 text-left"><div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center font-black text-[10px] text-amber-500">{(proj.username?.[0] || 'U').toUpperCase()}</div><span className="font-bold text-xs uppercase tracking-tight text-zinc-400">{proj.username || 'System'}</span></div></td>
                             <td className="p-10 text-right"><div className="flex gap-3 justify-end"><button onClick={() => navigate(`/projects/${proj.id}`)} className="p-4 bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-2xl hover:bg-amber-500 hover:text-black transition-all shadow-xl"><ExternalLink size={16}/></button><button onClick={() => handleDeleteProject(proj.id)} className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl"><Trash2 size={16}/></button></div></td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              </div>
            )}

            {activeView === 'rates' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className={`p-12 rounded-[4rem] border backdrop-blur-3xl ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                  <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 text-left">
                     <div className="text-left space-y-1 text-left"><h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-zinc-900 dark:text-white">Rates Library<span className="text-amber-500">.</span></h3><p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mt-3 italic leading-none text-left">Global Standardized Resource Database</p></div>
                     <div className="relative w-full md:w-96 group text-left"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500" size={20} /><input type="text" placeholder="Search resources..." value={rateSearch} onChange={e => setRateSearch(e.target.value)} className="w-full pl-16 pr-8 py-6 rounded-3xl bg-zinc-950/60 border border-zinc-800 outline-none font-bold text-sm focus:border-amber-500/40 text-white" /></div>
                  </header>
                  <div className="flex gap-3 mb-12 overflow-x-auto pb-4 custom-scrollbar text-left">
                     {['all', 'material', 'labor', 'plant'].map(cat => (<button key={cat} onClick={() => setActiveRateCategory(cat)} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeRateCategory === cat ? 'bg-amber-500 text-black border-amber-500 shadow-2xl' : 'bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:text-zinc-200'}`}>{cat}</button>))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                     {filteredRates.map(r => (
                       <div key={r.id} className="p-10 rounded-[3.5rem] bg-zinc-900/40 border border-zinc-800 shadow-2xl group hover:border-amber-500/30 transition-all flex flex-col justify-between h-80 text-left">
                          <div className="flex justify-between items-start text-left text-left text-left"><div className="space-y-1 text-left text-left"><span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-mono font-black text-zinc-600 group-hover:text-amber-500 leading-none">{r.code}</span><p className="text-[9px] font-black uppercase text-zinc-700 mt-2">{r.category}</p></div><div className={`p-4 rounded-2xl bg-zinc-800 text-zinc-600 group-hover:text-amber-500 group-hover:bg-amber-500/10 shadow-lg`}><Layers size={20}/></div></div>
                          <div className="text-left text-left text-left text-left"><h4 className="font-black text-xl uppercase tracking-tight mb-2 group-hover:text-white transition-colors leading-none">{r.name}</h4><p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest mb-10 leading-none">{r.unit}</p></div>
                          <div className="pt-8 border-t border-zinc-800/60 flex justify-between items-center"><span className="text-3xl sm:text-4xl font-black italic tracking-tighter text-zinc-900 dark:text-white">KES {r.rate.toLocaleString()}</span><button className="p-4 rounded-2xl bg-zinc-800 text-zinc-600 hover:text-amber-500 transition-all shadow-xl"><Edit3 size={18}/></button></div>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'settings' && (
              <div className="grid lg:grid-cols-2 gap-10 animate-in zoom-in-95 duration-500 text-left text-left">
                 <div className="p-12 rounded-[4rem] bg-zinc-900/30 border border-zinc-800/60 backdrop-blur-3xl space-y-12">
                    <header><h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Command Protocol</h3><p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mt-2 italic leading-none text-left text-left">Enterprise Configuration Nodes</p></header>
                    <div className="space-y-6">
                       {[{ id: 'sync', label: 'Cloud Handshake', desc: 'Sync registry nodes with cloud database.', icon: RefreshCw }, { id: 'precision', label: 'Root Admin Overrides', desc: 'Allow admins to force-edit measurements.', icon: ShieldAlert }, { id: 'encryption', label: 'Vault Protection', desc: 'AES-256 secure local storage encryption.', icon: ShieldCheck }].map((s) => (
                         <div key={s.id} className="flex justify-between items-center p-8 rounded-[3rem] bg-zinc-950/40 border border-zinc-800/40 group hover:border-amber-500/20 transition-all shadow-xl gap-4">
                            <div className="flex gap-8 items-center text-left text-left text-left"><div className={`p-5 bg-zinc-900 rounded-2xl border border-zinc-800 ${(sysSettings as any)[s.id] ? 'text-amber-500' : 'text-zinc-600'}`}><s.icon size={22}/></div><div><p className="text-sm font-black uppercase text-zinc-200">{s.label}</p><p className="text-[10px] font-bold text-zinc-600 uppercase mt-1 leading-none text-left">{s.desc}</p></div></div>
                            <button onClick={() => toggleSetting(s.id as any)} className={`w-14 h-8 rounded-full flex items-center px-1 ${(sysSettings as any)[s.id] ? 'bg-amber-500 shadow-xl shadow-amber-500/10' : 'bg-zinc-800'}`}><div className={`w-6 h-6 rounded-full shadow-md transition-all ${(sysSettings as any)[s.id] ? 'translate-x-6 bg-black' : 'bg-zinc-600'}`} /></button>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="p-12 rounded-[4rem] bg-amber-500 text-black flex flex-col justify-between shadow-2xl relative overflow-hidden">
                    <ShieldCheck size={300} className="absolute top-[-20%] right-[-10%] opacity-5 rotate-12" />
                    <div className="relative z-10 space-y-10"><h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-left">Admin<br/>Handshake Node</h3><div className="p-10 bg-black/10 border border-black/10 rounded-[3.5rem] flex items-center gap-8 group cursor-pointer hover:bg-black/15 transition-all shadow-inner"><div className="w-24 h-24 rounded-4xl bg-black/20 flex items-center justify-center overflow-hidden border-2 border-black/5 shadow-inner"><UserIcon size={48} className="text-black/30" /></div><div className="text-left text-left text-left"><p className="text-[10px] font-black uppercase opacity-40 mb-2 leading-none">Authorized Node Admin</p><p className="text-3xl font-black italic tracking-tighter leading-none break-words leading-none">{fullName}</p><div className="mt-4 flex items-center gap-2 px-3 py-1 bg-black/10 rounded-full w-fit"><ShieldCheck size={12} className="opacity-50" /><span className="text-[9px] font-black uppercase tracking-widest opacity-60">Level 4 Node Authorization</span></div></div></div></div>
                    <button onClick={() => setActiveView('profile')} className="relative z-10 w-full py-8 rounded-[2.5rem] bg-black text-white font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 italic leading-none">Verify Node Identity <ChevronRight size={16}/></button>
                 </div>
              </div>
            )}

            {activeView === 'profile' && (
              <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 text-left">
                 <div className={`p-8 sm:p-20 rounded-[4rem] sm:rounded-[5rem] backdrop-blur-3xl border border-zinc-800/60 bg-zinc-900/40 text-center space-y-16 relative overflow-hidden ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200'}`}>
                    <button onClick={() => setActiveView('registry')} className="absolute top-8 sm:top-12 left-8 sm:left-12 p-4 sm:p-5 bg-zinc-950/40 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-white active:scale-90 shadow-xl transition-all"><ArrowLeft size={28}/></button>
                    <div className="relative w-48 sm:w-56 h-56 mx-auto group"><div className="w-full h-full rounded-[4rem] bg-zinc-950 border-8 border-amber-500/20 overflow-hidden shadow-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-inner"><div className="text-zinc-800 font-black text-6xl italic">{(fullName?.[0] || 'A').toUpperCase()}</div></div><label className="absolute -bottom-3 -right-3 p-6 bg-amber-500 text-black rounded-3xl shadow-2xl cursor-pointer hover:bg-amber-400 hover:scale-110 transition-all active:scale-90 border-4 border-[#09090b]"><Camera size={28}/><input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label></div>
                    <div className="space-y-4 text-center text-center"><h2 className="text-5xl sm:text-6xl font-black italic tracking-tighter uppercase text-white leading-none break-words leading-none">{fullName}</h2><p className="text-sm font-black text-amber-500 uppercase tracking-[0.7em] italic leading-none">{user?.email}</p></div>
                    <div className="space-y-8 pt-10 text-left text-left"><div className="space-y-4 text-left text-left text-left text-left text-left text-left"><label className="text-[11px] font-black uppercase text-zinc-600 ml-3 tracking-[0.4em] italic font-bold leading-none">Identity Display Name</label><input value={fullName} onChange={e => setFullName(e.target.value)} className={`w-full p-6 sm:p-8 rounded-[2rem] bg-zinc-950 border border-zinc-800 outline-none font-bold text-xl sm:text-2xl text-white focus:border-amber-500/40 transition-all shadow-inner`} /></div><button disabled={isUpdatingProfile} onClick={() => { setIsUpdatingProfile(true); setTimeout(() => {setIsUpdatingProfile(false); setActiveView('settings');}, 1500); }} className="w-full py-6 sm:py-8 bg-amber-500 text-black font-black uppercase text-xs tracking-[0.5em] rounded-[2.5rem] shadow-2xl hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-5 italic leading-none text-left">{isUpdatingProfile ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />} Commit Admin Handshake</button></div>
                 </div>
              </div>
            )}

            <footer className="pt-24 pb-10 text-center opacity-30 group hover:opacity-100 transition-opacity shrink-0 relative z-10 text-center text-center text-center text-center text-center">
               <p className="text-[12px] font-black uppercase tracking-[1em] italic text-zinc-700 leading-none">QS POCKET KNIFE v2.0.4</p>
               <div className="flex items-center justify-center gap-6 mt-6 leading-none"><div className="h-px w-20 bg-zinc-800 group-hover:bg-amber-500/40 transition-colors" /><p className="text-[9px] font-black uppercase tracking-[0.6em] text-zinc-700 italic leading-none">Integrity • Precision • Compliance</p><div className="h-px w-20 bg-zinc-800 group-hover:bg-amber-500/40 transition-colors" /></div>
            </footer>
          </div>
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </div>
  );
};

/** --- HELPER SIDEBAR LINK COMPONENT --- **/

const SidebarLink: React.FC<{ icon: any; label: string; active?: boolean; onClick?: () => void; theme: 'light' | 'dark' }> = ({ icon: Icon, label, active = false, onClick, theme }) => (
  <button type="button" onClick={onClick} className={`w-full flex items-center gap-5 p-5 rounded-3xl transition-all duration-300 group relative ${active ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.08)]' : theme === 'dark' ? 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 border border-transparent'}`}>
    {active && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-amber-500 rounded-full blur-[2px]" />}
    <div className={`${active ? 'text-amber-500 scale-110' : 'text-zinc-500 group-hover:text-amber-500 group-hover:scale-110'} transition-all duration-300 shrink-0`}><Icon size={20} /></div>
    <span className="hidden lg:block text-[11px] font-black uppercase tracking-[0.25em] text-left leading-none text-left">{label}</span>
  </button>
);

export default AdminDashboardPage;