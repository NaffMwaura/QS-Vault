/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, ExternalLink, 
  MapPin, Loader2, Search,
  LayoutDashboard, Database, 
  Activity, Shield, User as UserIcon,
  Camera, Globe, RefreshCw, Layers,
  Bell, ShieldCheck, ChevronRight,
  ArrowLeft, Ruler, Save, Edit3
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

/** --- MODULE RESOLUTION HANDLERS (SANDBOX COMPATIBILITY) --- 
 * This block ensures the code runs in the browser preview.
 * For local development, standard static imports are used.
 **/

let useAuth: any = () => ({
  user: { id: 'dev-user-001', email: 'surveyor@vault.systems', user_metadata: { full_name: 'Naftaly Mwaura', username: 'naftali795' } },
  signOut: async () => console.log("Protocol Terminated"),
  theme: 'dark',
  isOnline: true
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
    // Attempt local project resolutions
    const authMod = await import("../../features/auth/AuthContext") as any;
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../lib/database/database") as any;
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (err) {
    // Silent fallback to mocks for Canvas compilation
  }
};

resolveModules();

/** --- MAIN DASHBOARD PAGE --- **/

const DashboardPage: React.FC = () => {
  const { user, theme, isOnline } = useAuth();
  
  // --- View Management ---
  const [activeView, setActiveView] = useState<'projects' | 'rates' | 'settings' | 'profile'>('projects');
  
  // --- Project State ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newProject, setNewProject] = useState({ name: "", client_name: "", location: "" });

  // --- Profile / Identity State ---
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || 'Naftaly Mwaura');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

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

  // Load User Projects from Local Vault
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      try {
        const userProjects = await db.projects
          .where('user_id')
          .equals(user.id)
          .reverse() 
          .toArray();
        setProjects(userProjects);
      } catch (err) {
        console.error("Vault access offline:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadProjects();
  }, [user]);

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

  if (isInitialLoading) return (
    <div className={`flex flex-col items-center justify-center min-h-screen gap-6 ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-50'}`}>
      <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      <div className="font-black text-amber-500 uppercase tracking-[0.5em] text-xs italic leading-none">Syncing Protocol Node...</div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 selection:bg-amber-500/30
      ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
      
      {/* Background FX */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-7xl mx-auto p-6 sm:p-10 space-y-10">
        
        {/* HUD HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div 
                className="p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20 group hover:rotate-6 transition-transform cursor-pointer"
                onClick={() => setActiveView('projects')}
              >
                <LayoutDashboard size={24} className="text-black" />
              </div>
              <h1 className={`text-5xl font-black tracking-tighter uppercase italic leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                Workspace<span className="text-amber-500">.</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border backdrop-blur-md ${isOnline ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 animate-pulse'}`} />
                {isOnline ? "Cloud Active" : "Local Vault"}
              </div>
              <button 
                onClick={() => setActiveView('profile')}
                className="flex items-center gap-2 hover:text-amber-500 transition-all active:scale-95 group"
              >
                 <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shadow-lg group-hover:border-amber-500/40">
                    {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : <UserIcon size={14} className="text-zinc-500" />}
                 </div>
                 <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest hidden sm:block">
                  {fullName.split(' ')[0]}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <nav className="flex bg-zinc-500/5 p-1.5 rounded-2xl border border-zinc-500/10 backdrop-blur-3xl shadow-inner">
                {(['projects', 'rates', 'settings'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                      ${activeView === view ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/20' : 'text-zinc-500 hover:text-amber-500 hover:bg-white/5'}`}
                  >
                    {view}
                  </button>
                ))}
             </nav>
          </div>
        </header>

        {/* --- VIEW SWITCHER --- */}
        
        {/* VIEW: PROJECTS REGISTRY */}
        {activeView === 'projects' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: 'Active Vaults', value: projects.length, icon: Database, color: 'text-amber-500' },
                { label: 'Cloud Status', value: isOnline ? 'Verified' : 'Local', icon: Globe, color: 'text-emerald-500' },
                { label: 'Node Admin', value: 'Authorized', icon: Shield, color: 'text-blue-500' },
              ].map((stat, i) => (
                <div key={i} className={`p-10 rounded-[3rem] border backdrop-blur-3xl flex justify-between items-center group hover:border-amber-500/30 transition-all ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                  <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">{stat.label}</p><p className="text-4xl font-black italic tracking-tighter leading-none">{stat.value}</p></div>
                  <stat.icon className={`${stat.color} opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all`} size={40} />
                </div>
              ))}
            </div>

            <div className={`rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <div className="p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-zinc-800/40 bg-white/2">
                <div className="space-y-1 text-left">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">Vault Registry</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500">Coordinate and manage takeoff nodes</p>
                </div>
                <button onClick={() => setIsCreating(true)} className="flex items-center gap-3 px-10 py-5 bg-amber-500 text-black rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all">
                  <Plus size={18} className="stroke-[3px]" /> New Workspace
                </button>
              </div>

              {isCreating && (
                <form onSubmit={handleCreateProject} className="p-12 bg-amber-500/5 border-b border-amber-500/20 animate-in slide-in-from-top-4 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 italic">Vault Identity</label>
                      <input required placeholder="Project Name..." value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-bold outline-none focus:border-amber-500 transition-all" />
                    </div>
                    <div className="flex-1 space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 italic">Primary Stakeholder</label>
                      <input placeholder="Client Name..." value={newProject.client_name} onChange={e => setNewProject({...newProject, client_name: e.target.value})} className="w-full p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-bold outline-none focus:border-amber-500 transition-all" />
                    </div>
                    <div className="flex gap-4 items-end">
                       <button type="submit" className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-[10px] rounded-2xl hover:bg-amber-400 transition-all shadow-lg">Confirm</button>
                       <button type="button" onClick={() => setIsCreating(false)} className="px-8 py-5 bg-zinc-800 text-zinc-400 font-black uppercase text-[10px] rounded-2xl hover:bg-zinc-700 transition-all">Cancel</button>
                    </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic bg-zinc-900/50 border-b border-zinc-800">
                    <tr><th className="p-10">Node Identity</th><th className="p-10">Stakeholder</th><th className="p-10">Last Handshake</th><th className="p-10 text-right">Control</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {projects.length > 0 ? projects.map(p => (
                      <tr key={p.id} className="group hover:bg-white/2 transition-colors">
                        <td className="p-10 text-left">
                          <div className="flex flex-col">
                            <span className="font-black text-2xl uppercase tracking-tighter group-hover:text-amber-500 transition-colors leading-none">{p.name}</span>
                            <span className="text-[9px] font-mono text-zinc-600 mt-2 tracking-widest">HEX_REF: {p.id.slice(0,14).toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="p-10 text-left"><div className="flex items-center gap-3 text-sm font-bold text-zinc-400 uppercase tracking-tight"><MapPin size={14} className="text-amber-500/60" /> {p.client_name || 'Nairobi Hub'}</div></td>
                        <td className="p-10 text-[11px] font-black text-zinc-500 uppercase tracking-widest">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="p-10 text-right">
                          <div className="flex gap-3 justify-end">
                             <button 
                              onClick={() => window.location.href = `/projects/${p.id}`} 
                              className="p-4 bg-zinc-900/60 border border-zinc-800 text-zinc-500 rounded-2xl hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all active:scale-90 shadow-xl shadow-black/40"
                             >
                                <ExternalLink size={20}/>
                             </button>
                             <button className="p-4 bg-zinc-900/60 border border-zinc-800 text-zinc-700 rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-90"><Trash2 size={20}/></button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="p-32 text-center opacity-10"><Search size={80} className="mx-auto mb-6" /><p className="font-black uppercase text-sm tracking-[0.5em] italic leading-none">Registry Node Storage Empty</p></td></tr>
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
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16">
                 <div className="text-left">
                    <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Rates Library<span className="text-amber-500">.</span></h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mt-3 italic">Standardized Regional Material & Resource Database</p>
                 </div>
                 <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={20} />
                    <input 
                      type="text" placeholder="Search SMM Code or Item..." value={rateSearch} onChange={e => setRateSearch(e.target.value)}
                      className="w-full pl-16 pr-8 py-6 rounded-3xl bg-zinc-950/60 border border-zinc-800 outline-none font-bold text-sm focus:border-amber-500/40 transition-all shadow-inner" 
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
                   <div key={r.id} className="p-10 rounded-[3.5rem] bg-zinc-900/40 border border-zinc-800 shadow-2xl group hover:border-amber-500/30 transition-all flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-10 text-left">
                         <div className="space-y-1">
                            <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-mono font-black text-zinc-600 group-hover:text-amber-500 transition-colors">{r.code}</span>
                            <p className="text-[9px] font-black uppercase text-zinc-700 tracking-widest mt-2">{r.category}</p>
                         </div>
                         <div className={`p-4 rounded-3xl bg-zinc-800 text-zinc-600 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-all shadow-lg`}>
                            {r.category === 'labor' ? <UserIcon size={20}/> : r.category === 'plant' ? <Activity size={20}/> : <Layers size={20}/>}
                         </div>
                      </div>
                      <div className="text-left">
                         <h4 className="font-black text-xl uppercase tracking-tight mb-3 group-hover:text-white transition-colors leading-none">{r.name}</h4>
                         <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest mb-10">{r.unit}</p>
                      </div>
                      <div className="pt-8 border-t border-zinc-800/60 flex justify-between items-center">
                         <span className="text-4xl font-black italic tracking-tighter">KES {r.rate.toLocaleString()}</span>
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
          <div className="grid lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="p-12 rounded-[4rem] bg-zinc-900/30 border border-zinc-800/60 backdrop-blur-3xl space-y-14 text-left">
                <header>
                   <h3 className="text-4xl font-black uppercase italic tracking-tighter">System Engine</h3>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mt-3 italic">Advanced Protocol Configuration</p>
                </header>
                <div className="space-y-6">
                   {[
                     { id: 'sync', label: 'Cloud Synchronization', desc: 'Auto-handshake with global nodes.', icon: RefreshCw },
                     { id: 'precision', label: 'Precision Snap Mode', desc: 'Increase takeoff sensitivity (SMM Kenya).', icon: Ruler },
                     { id: 'encryption', label: 'AES-256 Vault Shield', desc: 'Secure local storage encryption blocks.', icon: ShieldCheck },
                     { id: 'notifications', label: 'Audit Alert System', desc: 'Notify on unauthorized registry mutations.', icon: Bell }
                   ].map((s) => (
                     <div key={s.id} className="flex justify-between items-center p-8 rounded-[3rem] bg-zinc-950/40 border border-zinc-800/40 group hover:border-amber-500/20 transition-all shadow-xl">
                        <div className="flex gap-8 items-center">
                           <div className={`p-5 bg-zinc-900 rounded-3xl border border-zinc-800 transition-all ${(sysSettings as any)[s.id] ? 'text-amber-500 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'text-zinc-600'}`}>
                              <s.icon size={26}/>
                           </div>
                           <div className="space-y-1">
                              <p className="text-base font-black uppercase tracking-tight text-zinc-200">{s.label}</p>
                              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic">{s.desc}</p>
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
                   <div className="p-10 bg-black/10 border border-black/10 rounded-[3.5rem] flex items-center gap-10 group cursor-pointer hover:bg-black/15 transition-all shadow-inner">
                      <div className="w-28 h-28 rounded-[2.5rem] bg-black/20 flex items-center justify-center overflow-hidden border-4 border-black/5 shadow-2xl transition-transform group-hover:scale-105">
                         {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : <UserIcon size={56} className="text-black/30" />}
                      </div>
                      <div>
                         <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40 mb-3 leading-none">Authenticated As</p>
                         <p className="text-4xl font-black italic tracking-tighter leading-none">{fullName}</p>
                         <div className="mt-5 flex items-center gap-3 px-4 py-1.5 bg-black/15 rounded-full w-fit">
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

        {/* VIEW: PROFILE EDITOR */}
        {activeView === 'profile' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className={`p-20 rounded-[5rem] backdrop-blur-3xl border text-center space-y-16 relative overflow-hidden ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-2xl'}`}>
                
                <button 
                  onClick={() => setActiveView('settings')} 
                  className="absolute top-12 left-12 p-5 bg-zinc-950/40 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-amber-500 transition-all active:scale-90 group shadow-xl"
                >
                  <ArrowLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                
                <div className="relative w-56 h-56 mx-auto group">
                   <div className="w-full h-full rounded-[4rem] bg-zinc-950 border-8 border-amber-500/10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] transition-all group-hover:scale-105 group-hover:border-amber-500/40">
                      {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : <UserIcon size={96} className="text-zinc-800 mx-auto mt-20" />}
                   </div>
                   <label className="absolute -bottom-3 -right-3 p-6 bg-amber-500 text-black rounded-4xl shadow-[0_15px_40px_rgba(245,158,11,0.4)] cursor-pointer hover:bg-amber-400 hover:scale-110 transition-all active:scale-90 border-4 border-[#09090b]">
                      <Camera size={28} className="stroke-[3px]" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                   </label>
                </div>

                <div className="space-y-4">
                   <h2 className="text-6xl font-black italic tracking-tighter uppercase text-white leading-none">{fullName}</h2>
                   <p className="text-sm font-black text-amber-500 uppercase tracking-[0.7em] italic">{user?.email}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                   <div className="p-10 rounded-[3rem] bg-zinc-950/60 border border-zinc-800/60 space-y-3 group hover:border-amber-500/20 transition-all shadow-inner">
                      <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-1 italic">Node Hardware GUID</p>
                      <p className="font-mono text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors truncate uppercase">{user?.id}</p>
                   </div>
                   <div className="p-10 rounded-[3rem] bg-zinc-950/60 border border-zinc-800/60 space-y-3 group hover:border-amber-500/20 transition-all shadow-inner">
                      <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-1 italic">Protocol Clearance</p>
                      <p className="text-base font-black text-amber-500 uppercase tracking-tighter italic">Enterprise Hub Architect</p>
                   </div>
                </div>

                <div className="space-y-8 pt-10 text-left">
                   <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase text-zinc-600 ml-3 tracking-[0.4em] italic">Identity Display Name</label>
                      <input 
                        value={fullName} 
                        onChange={e => setFullName(e.target.value)}
                        className="w-full p-8 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 outline-none font-bold text-2xl text-white focus:border-amber-500/40 transition-all shadow-inner" 
                      />
                   </div>
                   <button 
                    disabled={isUpdatingProfile}
                    onClick={() => { setIsUpdatingProfile(true); setTimeout(() => {setIsUpdatingProfile(false); setActiveView('settings');}, 1500); }}
                    className="w-full py-8 bg-amber-500 text-black font-black uppercase text-xs tracking-[0.5em] rounded-[2.5rem] shadow-2xl hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-5"
                   >
                     {isUpdatingProfile ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} className="stroke-[3px]" />}
                     Commit Local Mutation
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Footer Identifier */}
        <footer className="pt-32 pb-10 text-center opacity-30 group hover:opacity-100 transition-opacity">
           <div className="flex items-center justify-center gap-12 mb-8">
              <div className="h-px w-32 bg-zinc-800 group-hover:bg-amber-500/40 transition-colors" />
              <p className={`text-[12px] font-black uppercase tracking-[1em] italic ${theme === 'dark' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                QS POCKET KNIFE v2.0.4
              </p>
              <div className="h-px w-32 bg-zinc-800 group-hover:bg-amber-500/40 transition-colors" />
           </div>
           <div className="flex flex-col gap-3">
             <p className="text-[9px] font-black uppercase tracking-[0.6em] text-zinc-700 italic">Precision • Compliance • Integrity</p>
             <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-800">Momentum Global Infrastructure Development Systems</p>
           </div>
        </footer>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        ::selection { background: #f59e0b; color: black; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DashboardPage;