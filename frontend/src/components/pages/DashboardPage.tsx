/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, ExternalLink, 
  MapPin, Loader2, Search,
   Database, 
  Activity, Shield, User as UserIcon,
  Camera, Globe, RefreshCw, Layers,
   ShieldCheck, ChevronRight,
  ArrowLeft, Ruler, Save, Edit3,
   HardHat, 
  LogOut, Sun, Moon,
  LayoutGrid,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react';

/** --- TYPES & INTERFACES --- **/

export interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name: string;
  location: string;
  contract_sum: number;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface RateItem {
  id: string;
  name: string;
  category: 'material' | 'labor' | 'plant';
  unit: string;
  rate: number;
  code: string;
}

/** --- MODULE RESOLUTION HANDLERS (SANDBOX COMPATIBILITY) --- **/

let useAuth: any = () => ({
  user: null,
  signOut: async () => { console.log("Secure Sign Out Executed"); window.location.href = "/"; },
  theme: 'dark',
  toggleTheme: () => console.log("Theme Shift Triggered"),
  isOnline: true,
  isLoading: true
});

let db: any = {
  projects: {
    where: () => ({ equals: () => ({ reverse: () => ({ toArray: async () => [] }) }) }),
    add: async () => {},
    delete: async () => {}
  }
};

let syncEngine: any = { queueChange: async () => {} };

const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext") as any;
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../lib/database/database") as any;
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (err) {
    console.warn("Dashboard Handshake: Falling back to node mocks for stability.");
  }
};

resolveModules();

/** --- MAIN DASHBOARD PAGE (INTEGRATED MASTER NODE) --- **/

const DashboardPage: React.FC = () => {
  const { user, theme, toggleTheme, isOnline, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // --- View Management ---
  const [activeView, setActiveView] = useState<'projects' | 'rates' | 'settings' | 'profile'>('projects');
  
  // --- Project State ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [, setIsInitialLoading] = useState(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newProject, setNewProject] = useState({ name: "", client_name: "", location: "" });

  // --- Profile / Identity State ---
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState('Naftaly Mwaura');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Sync fullName with user data when it arrives
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  // --- Rates Library State ---
  const [rateSearch, setRateSearch] = useState("");
  const [activeRateCategory, setActiveRateCategory] = useState<string>('all');
  const [rates] = useState<RateItem[]>([
    { id: '1', code: 'MAT-001', name: 'Portland Cement (50kg)', category: 'material', unit: 'Bag', rate: 850 },
    { id: '2', code: 'LAB-020', name: 'Skilled Mason (Daily)', category: 'labor', unit: 'Day', rate: 2500 },
    { id: '3', code: 'PLT-005', name: 'Concrete Mixer (Diesel)', category: 'plant', unit: 'Day', rate: 4500 },
    { id: '4', code: 'MAT-012', name: 'River Sand', category: 'material', unit: 'Ton', rate: 3200 },
    { id: '5', code: 'LAB-021', name: 'General Laborer', category: 'labor', unit: 'Day', rate: 1200 },
    { id: '6', code: 'MAT-088', name: 'T12 Reinforcement Bar', category: 'material', unit: 'Kg', rate: 145 },
  ]);

  // --- Settings State ---
  const [sysSettings, setSysSettings] = useState({
    sync: true,
    precision: true,
    encryption: true,
    notifications: false
  });

  // Load User Projects
  useEffect(() => {
    const loadProjects = async () => {
      // Defensive check for database initialization
      if (!user || !db?.projects?.where) return;
      try {
        const userProjects = await db.projects
          .where('user_id')
          .equals(user.id)
          .reverse() 
          .toArray();
        setProjects(userProjects || []);
      } catch (err) {
        console.error("Vault access offline or error:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    if (!authLoading) {
      loadProjects();
    }
  }, [user, authLoading]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !user) return;
    const projectId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const projectData: Project = {
      id: projectId, user_id: user.id, name: newProject.name,
      client_name: newProject.client_name, location: newProject.location,
      contract_sum: 0, status: 'active', created_at: timestamp, updated_at: timestamp
    };

    try {
      await db.projects.add(projectData);
      await syncEngine.queueChange('projects', projectId, 'INSERT', projectData);
      setProjects([projectData, ...projects]);
      setIsCreating(false);
      setNewProject({ name: "", client_name: "", location: "" });
    } catch (err) { console.error(err); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleSetting = (key: keyof typeof sysSettings) => {
    setSysSettings(prev => ({ ...prev, [key]: !(prev as any)[key] }));
  };

  const filteredRates = useMemo(() => {
    return rates.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(rateSearch.toLowerCase()) || 
                           r.code.toLowerCase().includes(rateSearch.toLowerCase());
      const matchesCat = activeRateCategory === 'all' || r.category === activeRateCategory;
      return matchesSearch && matchesCat;
    });
  }, [rateSearch, activeRateCategory, rates]);

  const handleSecureSignOut = async () => {
    try {
      if (signOut) await signOut();
    } catch (err) {
      console.error("Secure logout failure:", err);
    }
  };

  // Prevent crash during auth load or project load
  if (authLoading) return (
    <div className={`flex flex-col items-center justify-center min-h-screen gap-6 ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-50'}`}>
      <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      <div className="font-black text-amber-500 uppercase tracking-[0.5em] text-xs italic leading-none text-center">
        Syncing Protocol Node...<br/>
        <span className="text-zinc-600 mt-2 block tracking-widest uppercase">Establishing Secure Handshake</span>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 selection:bg-amber-500/30 flex
      ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
      
      {/* --- 1. SIDEBAR COMMAND CENTER --- */}
      <aside className={`
        relative z-50 w-20 lg:w-72 flex flex-col transition-all duration-500 ease-in-out border-r shrink-0
        ${theme === 'dark' 
          ? 'bg-zinc-950/70 backdrop-blur-3xl border-zinc-800/40 shadow-2xl' 
          : 'bg-white border-zinc-200 shadow-xl'}
      `}>
        <div className="p-6 lg:p-8 flex items-center gap-4 cursor-pointer group" onClick={() => setActiveView('projects')}>
          <div className="bg-amber-500 p-2.5 rounded-2xl shadow-xl shadow-amber-500/20 shrink-0 transition-transform group-hover:rotate-6 active:scale-90">
            <HardHat size={24} className="text-black" />
          </div>
          <div className="hidden lg:block overflow-hidden">
            <span className={`block font-black uppercase tracking-tighter italic text-xl leading-none 
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              QS VAULT<span className="text-amber-500">.</span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1 block leading-none text-left">
              Precision OS 2.0
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-3">
          <SidebarLink icon={<LayoutGrid size={20} />} label="Dashboard" active={activeView === 'projects'} onClick={() => setActiveView('projects')} theme={theme} />
          <SidebarLink icon={<Database size={20} />} label="Rates Library" active={activeView === 'rates'} onClick={() => setActiveView('rates')} theme={theme} />
          <SidebarLink icon={<Settings size={20} />} label="Vault Settings" active={activeView === 'settings'} onClick={() => setActiveView('settings')} theme={theme} />
        </nav>

        {/* Sidebar Bottom Profile Section */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800/30' : 'border-zinc-200'}`}>
          <div 
            onClick={() => setActiveView('profile')}
            className={`mb-4 hidden lg:flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all hover:border-amber-500/30
            ${theme === 'dark' ? 'bg-zinc-500/5 border-zinc-500/10' : 'bg-zinc-50 border-zinc-100'}`}
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center overflow-hidden shrink-0">
              {profileImage ? (
                <img src={profileImage} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="text-amber-500 font-black text-xs uppercase italic">
                  {(fullName?.[0] || user?.email?.[0] || 'S').toUpperCase()}
                </div>
              )}
            </div>
            <div className="overflow-hidden flex-1 text-left">
              <p className={`text-[10px] font-black uppercase tracking-tight truncate leading-none 
                ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                {fullName || user?.email?.split('@')[0]}
              </p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                L4 License
              </p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
              className="p-2 rounded-lg hover:bg-zinc-500/10 text-zinc-500 transition-colors"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          
          <button 
            type="button"
            onClick={handleSecureSignOut}
            className={`
              w-full flex items-center gap-4 p-4 rounded-2xl transition-all group
              ${theme === 'dark' ? 'text-zinc-500 hover:text-red-500 hover:bg-red-500/10' : 'text-zinc-400 hover:text-red-600 hover:bg-red-50'}
            `}
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest text-left">
              Secure Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* --- 2. MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative text-left">
        {/* Background FX */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-500/10 rounded-full blur-[120px] translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-zinc-500/10 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4" />
        </div>

        {/* HUD HEADER */}
        <header className={`
          h-20 border-b flex items-center justify-between px-8 z-20 backdrop-blur-md transition-all duration-300 shrink-0
          ${theme === 'dark' ? 'bg-[#09090b]/80 border-zinc-800/40 shadow-lg' : 'bg-white border-zinc-200 shadow-sm'}
        `}>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500
              ${!isOnline 
                ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' 
                : theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
               {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
               <span className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none`}>
                 {isOnline ? 'Vault Synced' : 'Local Protocol'}
               </span>
            </div>
            <ChevronRight size={14} className="text-zinc-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500 italic">
              {activeView.toUpperCase()} MODE
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`h-8 w-px hidden sm:block ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            <button 
              onClick={() => setActiveView('settings')}
              className="flex items-center gap-4 group text-left transition-all active:scale-95"
            >
              <div className="hidden sm:block text-left">
                <p className={`text-[10px] font-black uppercase tracking-tight leading-none 
                  ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  {fullName?.split(' ')[0] || 'Surveyor'}
                </p>
                <p className={`text-[8px] font-bold uppercase tracking-[0.4em] mt-1 ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {isOnline ? 'Cloud Active' : 'Buffer Local'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-2xl border transition-all duration-300 overflow-hidden flex items-center justify-center group-hover:border-amber-500 shadow-inner
                ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                 {profileImage ? (
                   <img src={profileImage} className="w-full h-full object-cover" alt="Profile" />
                 ) : (
                   <div className="text-zinc-500 font-black text-sm group-hover:text-amber-500 transition-colors">
                     {(fullName?.[0] || 'S').toUpperCase()}
                   </div>
                 )}
              </div>
            </button>
          </div>
        </header>

        {/* --- MAIN SCROLL CONTENT AREA --- */}
        <section className="flex-1 overflow-y-auto relative z-10 p-6 sm:p-10 scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-10">
            
            {/* VIEW: PROJECTS REGISTRY */}
            {activeView === 'projects' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: 'Active Vaults', value: projects.length, icon: Database, color: 'text-amber-500' },
                    { label: 'Cloud Status', value: isOnline ? 'Verified' : 'Buffered', icon: Globe, color: 'text-emerald-500' },
                    { label: 'Node Admin', value: 'Authorized', icon: Shield, color: 'text-blue-500' },
                  ].map((stat, i) => (
                    <div key={i} className={`p-10 rounded-[3rem] border backdrop-blur-3xl flex justify-between items-center group hover:border-amber-500/30 transition-all ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                      <div className="text-left"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3 leading-none">{stat.label}</p><p className="text-4xl font-black italic tracking-tighter leading-none">{stat.value}</p></div>
                      <stat.icon className={`${stat.color} opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all`} size={40} />
                    </div>
                  ))}
                </div>

                <div className={`rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>
                  <div className="p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-zinc-800/40 bg-white/2">
                    <div className="space-y-1 text-left">
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter">Vault Registry</h3>
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 leading-none">Coordinate and manage takeoff nodes</p>
                    </div>
                    <button onClick={() => setIsCreating(true)} className="flex items-center gap-3 px-10 py-5 bg-amber-500 text-black rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all">
                      <Plus size={18} className="stroke-[3px]" /> New Workspace
                    </button>
                  </div>

                  {isCreating && (
                    <form onSubmit={handleCreateProject} className="p-12 bg-amber-500/5 border-b border-amber-500/20 animate-in slide-in-from-top-4 flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-2  text-left">
                          <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 italic">Vault Identity</label>
                          <input required placeholder="Project Name..." value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-bold outline-none focus:border-amber-500 transition-all text-white" />
                        </div>
                        <div className="flex-1 space-y-2  text-left">
                          <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 italic">Primary Stakeholder</label>
                          <input placeholder="Client Name..." value={newProject.client_name} onChange={e => setNewProject({...newProject, client_name: e.target.value})} className="w-full p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-bold outline-none focus:border-amber-500 transition-all text-white" />
                        </div>
                        <div className="flex gap-4 items-end">
                           <button type="submit" className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-[10px] rounded-2xl hover:bg-amber-400 transition-all shadow-lg">Confirm</button>
                           <button type="button" onClick={() => setIsCreating(false)} className="px-8 py-5 bg-zinc-800 text-zinc-400 font-black uppercase text-[10px] rounded-2xl hover:bg-zinc-700 transition-all">Cancel</button>
                        </div>
                    </form>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic bg-zinc-900/50 border-b border-zinc-800">
                        <tr><th className="p-10">Node Identity</th><th className="p-10 text-left">Stakeholder</th><th className="p-10">Last Handshake</th><th className="p-10 text-right">Control</th></tr>
                      </thead>
                      <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
                        {projects.length > 0 ? projects.map(p => (
                          <tr key={p.id} className="group hover:bg-white/2 transition-colors">
                            <td className="p-10 text-left">
                              <div className="flex flex-col">
                                <span className={`font-black text-2xl uppercase tracking-tighter group-hover:text-amber-500 transition-colors leading-none ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>{p.name}</span>
                                <span className="text-[9px] font-mono text-zinc-600 mt-2 tracking-widest">HEX_REF: {p.id.slice(0,14).toUpperCase()}</span>
                              </div>
                            </td>
                            <td className="p-10 text-left"><div className="flex items-center gap-3 text-sm font-bold text-zinc-400 uppercase tracking-tight text-left"><MapPin size={14} className="text-amber-500/60" /> {p.client_name || 'Nairobi Hub'}</div></td>
                            <td className="p-10 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-left">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="p-10 text-right">
                              <div className="flex gap-3 justify-end">
                                 <button 
                                  onClick={() => navigate(`/projects/${p.id}`)} 
                                  className="p-4 bg-zinc-900/60 border border-zinc-800 text-zinc-500 rounded-2xl hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all active:scale-90 shadow-xl shadow-black/40 border-opacity-40"
                                 >
                                    <ExternalLink size={20}/>
                                 </button>
                                 <button className="p-4 bg-zinc-900/60 border border-zinc-800 text-zinc-700 rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-90"><Trash2 size={20}/></button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} className="p-24 text-center opacity-10"><Search size={64} className="mx-auto mb-4" /><p className="font-black uppercase text-xs tracking-[0.4em]">Node Storage Empty</p></td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: RATES LIBRARY */}
            {activeView === 'rates' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className={`p-12 rounded-[4rem] border backdrop-blur-3xl ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                  <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 text-left">
                     <div className="text-left space-y-1">
                        <h3 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Rates Library<span className="text-amber-500">.</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mt-3 italic leading-none">Standard Regional Material & Resource Database</p>
                     </div>
                     <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={20} />
                        <input 
                          type="text" placeholder="Search SMM Code or Item..." value={rateSearch} onChange={e => setRateSearch(e.target.value)}
                          className={`w-full pl-16 pr-8 py-6 rounded-3xl outline-none font-bold text-sm focus:border-amber-500/40 transition-all shadow-inner border ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'}`} 
                        />
                     </div>
                  </header>

                  <div className="flex gap-3 mb-12 overflow-x-auto pb-4 custom-scrollbar">
                     {['all', 'material', 'labor', 'plant'].map(cat => (
                       <button 
                        key={cat} 
                        onClick={() => setActiveRateCategory(cat)}
                        className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border
                          ${activeRateCategory === cat ? 'bg-amber-500 text-black border-amber-500 shadow-2xl shadow-amber-500/10' : 'bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-200'}`}
                       >
                         {cat}
                       </button>
                     ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {filteredRates.length > 0 ? filteredRates.map(r => (
                       <div key={r.id} className="p-10 rounded-[3.5rem] bg-zinc-900/40 border border-zinc-800 shadow-2xl group hover:border-amber-500/30 transition-all flex flex-col justify-between h-80 text-left">
                          <div className="flex justify-between items-start mb-10 text-left">
                             <div className="space-y-1  text-left">
                                <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-mono font-black text-zinc-600 group-hover:text-amber-500 transition-colors leading-none">{r.code}</span>
                                <p className="text-[9px] font-black uppercase text-zinc-700 tracking-widest mt-2">{r.category}</p>
                             </div>
                             <div className={`p-4 rounded-3xl bg-zinc-800 text-zinc-600 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-all shadow-lg`}>
                                {r.category === 'labor' ? <UserIcon size={20}/> : r.category === 'plant' ? <Activity size={20}/> : <Layers size={20}/>}
                             </div>
                          </div>
                          <div className="text-left">
                             <h4 className="font-black text-xl uppercase tracking-tight mb-3 group-hover:text-white transition-colors leading-none">{r.name}</h4>
                             <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest mb-10 leading-none">{r.unit}</p>
                          </div>
                          <div className="pt-8 border-t border-zinc-800/60 flex justify-between items-center">
                             <span className={`text-3xl sm:text-4xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>KES {r.rate.toLocaleString()}</span>
                             <button className="p-4 rounded-2xl bg-zinc-800 text-zinc-600 hover:text-amber-500 hover:bg-amber-500/10 transition-all"><Edit3 size={18}/></button>
                          </div>
                       </div>
                     )) : (
                       <div className="col-span-full py-32 text-center border-2 border-dashed border-zinc-800 rounded-[4rem] opacity-20">
                          <Search size={64} className="mx-auto mb-6" />
                          <p className="font-black uppercase text-sm tracking-[0.5em]">No matching resources in cloud node</p>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: VAULT SETTINGS */}
            {activeView === 'settings' && (
              <div className="grid lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
                 <div className="p-12 rounded-[4rem] bg-zinc-900/30 border border-zinc-800/60 backdrop-blur-3xl space-y-14">
                    <header>
                       <h3 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>System Engine</h3>
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mt-3 italic leading-none text-left">Advanced Protocol Configuration</p>
                    </header>
                    <div className="space-y-6">
                       {[
                         { id: 'sync', label: 'Cloud Synchronization', desc: 'Auto-handshake with global nodes.', icon: RefreshCw },
                         { id: 'precision', label: 'Precision Snap Mode', desc: 'Increase takeoff capture sensitivity.', icon: Ruler },
                         { id: 'encryption', label: 'AES-256 Vault Shield', desc: 'Secure local storage encryption blocks.', icon: ShieldCheck }
                       ].map((s) => (
                         <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-8 rounded-[2.5rem] bg-zinc-950/40 border border-zinc-800/40 group hover:border-amber-500/20 transition-all shadow-xl gap-4">
                            <div className="flex gap-8 items-center text-left">
                               <div className={`p-5 bg-zinc-900 rounded-3xl border border-zinc-800 transition-all ${(sysSettings as any)[s.id] ? 'text-amber-500 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'text-zinc-600'}`}>
                                  <s.icon size={26}/>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-base font-black uppercase tracking-tight text-zinc-200">{s.label}</p>
                                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic leading-none text-left">{s.desc}</p>
                               </div>
                            </div>
                            <button 
                              onClick={() => toggleSetting(s.id as any)}
                              className={`w-16 h-9 rounded-full transition-all flex items-center px-1.5 ${(sysSettings as any)[s.id] ? 'bg-amber-500 shadow-2xl shadow-amber-500/20' : 'bg-zinc-800 border border-zinc-700'}`}
                            >
                               <div className={`w-6 h-6 rounded-full transition-all shadow-2xl ${(sysSettings as any)[s.id] ? 'translate-x-7 bg-black' : 'bg-zinc-600'}`} />
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-12 rounded-[4rem] bg-amber-500 text-black space-y-14 relative overflow-hidden shadow-2xl flex flex-col justify-between text-left">
                    <div className="absolute top-[-10%] right-[-10%] p-10 opacity-5"><Layers size={400} className="rotate-12" /></div>
                    <div className="relative z-10 space-y-12">
                       <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-[0.9]">Security<br/>Identity Check<span className="opacity-20">.</span></h3>
                       <div className="p-10 bg-black/10 border border-black/10 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-10 group cursor-pointer hover:bg-black/15 transition-all shadow-inner">
                          <div className="w-28 h-28 rounded-[2.5rem] bg-black/20 flex items-center justify-center overflow-hidden border-4 border-black/5 shadow-2xl transition-transform group-hover:scale-105 shrink-0">
                             {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : <div className="text-black/40 font-black text-3xl">{(fullName?.[0] || 'S').toUpperCase()}</div>}
                          </div>
                          <div className="text-center md:text-left">
                             <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40 mb-3 leading-none">Authenticated As</p>
                             <p className="text-4xl font-black italic tracking-tighter leading-none wrap-break-word">{fullName}</p>
                             <div className="mt-5 flex items-center gap-3 px-4 py-1.5 bg-black/15 rounded-full w-fit mx-auto md:mx-0">
                                <Shield size={14} className="opacity-50" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Level 4 Node Access</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    <button 
                      onClick={() => setActiveView('profile')}
                      className="relative z-10 w-full py-8 rounded-[2.5rem] bg-black text-white font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-5 italic"
                    >
                       Verify Identity Handshake <ChevronRight size={18}/>
                    </button>
                 </div>
              </div>
            )}

            {activeView === 'profile' && (
              <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                 <div className={`p-8 sm:p-20 rounded-[5rem] backdrop-blur-3xl border text-center space-y-16 relative overflow-hidden ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-2xl'}`}>
                    <button onClick={() => setActiveView('settings')} className="absolute top-12 left-12 p-5 bg-zinc-950/40 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-amber-500 transition-all active:scale-90 shadow-xl"><ArrowLeft size={28}/></button>
                    <div className="relative w-56 h-56 mx-auto group">
                       <div className="w-full h-full rounded-[4rem] bg-zinc-950 border-8 border-amber-500/10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] transition-all group-hover:scale-105 group-hover:border-amber-500/40 flex items-center justify-center">
                          {profileImage ? <img src={profileImage} className="w-full h-full object-cover" alt="Profile" /> : <UserIcon size={96} className="text-zinc-800 mx-auto mt-20" />}
                       </div>
                       <label className="absolute -bottom-3 -right-3 p-6 bg-amber-500 text-black rounded-4xl shadow-2xl cursor-pointer hover:bg-amber-400 hover:scale-110 transition-all active:scale-90 border-4 border-[#09090b]">
                          <Camera size={28} className="stroke-[3px]" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                       </label>
                    </div>
                    <div className="space-y-4">
                       <h2 className={`text-6xl font-black italic tracking-tighter uppercase leading-none wrap-break-word ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{fullName}</h2>
                       <p className="text-sm font-black text-amber-500 uppercase tracking-[0.7em] italic leading-none">{user?.email}</p>
                    </div>
                    <div className="space-y-8 pt-10 text-left">
                       <div className="space-y-4 text-left">
                          <label className="text-[11px] font-black uppercase text-zinc-600 ml-3 tracking-[0.4em] italic leading-none">Identity Display Name</label>
                          <input value={fullName} onChange={e => setFullName(e.target.value)} className={`w-full p-8 rounded-[2.5rem] border outline-none font-bold text-2xl focus:border-amber-500/40 transition-all shadow-inner ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`} />
                       </div>
                       <button disabled={isUpdatingProfile} onClick={() => { setIsUpdatingProfile(true); setTimeout(() => {setIsUpdatingProfile(false); setActiveView('settings');}, 1500); }} className="w-full py-8 bg-amber-500 text-black font-black uppercase text-xs tracking-[0.5em] rounded-[2.5rem] shadow-2xl hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-5 leading-none">
                         {isUpdatingProfile ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} className="stroke-[3px]" />}
                         Commit Local Mutation
                       </button>
                    </div>
                 </div>
              </div>
            )}

            <footer className="pt-32 pb-10 text-center opacity-30 group hover:opacity-100 transition-opacity shrink-0">
               <div className="flex items-center justify-center gap-4 sm:gap-12 mb-8 px-4">
                  <div className="h-px flex-1 sm:w-32 bg-zinc-800 group-hover:bg-amber-500/40 transition-colors" />
                  <p className={`text-[12px] font-black uppercase tracking-[1em] italic ${theme === 'dark' ? 'text-zinc-700' : 'text-zinc-400'}`}>QS POCKET KNIFE v2.0.4</p>
                  <div className="h-px flex-1 sm:w-32 bg-zinc-800 group-hover:bg-amber-500/40 transition-colors" />
               </div>
               <p className="text-[9px] font-black uppercase tracking-[0.6em] text-zinc-700 italic leading-none">Precision • Compliance • Integrity</p>
            </footer>
          </div>
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 12px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        ::selection { background: #f59e0b; color: black; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// --- HELPER SIDEBAR COMPONENT ---

const SidebarLink: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; theme: 'light' | 'dark' }> = ({ icon, label, active = false, onClick, theme }) => (
  <button type="button" onClick={onClick} className={`w-full flex items-center gap-5 p-4 lg:p-5 rounded-3xl transition-all duration-300 group relative ${active ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.08)]' : theme === 'dark' ? 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 border border-transparent'}`}>
    {active && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-amber-500 rounded-full blur-[2px]" />}
    <div className={`${active ? 'text-amber-500 scale-110' : 'text-zinc-500 group-hover:text-amber-500 group-hover:scale-110'} transition-all duration-300 shrink-0`}>{icon}</div>
    <span className="hidden lg:block text-[11px] font-black uppercase tracking-[0.25em] text-left leading-none">{label}</span>
  </button>
);

export default DashboardPage;