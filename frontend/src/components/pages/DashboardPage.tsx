import React, { useState } from 'react';
import { 
  Plus, Trash2, ExternalLink, 
  MapPin, Loader2, Check, Calendar, Search,
  LogOut, LayoutDashboard, Database, 
  Activity, Shield
} from 'lucide-react';
import { useAuth } from "../../features/auth/AuthContext";

/** --- TYPES & INTERFACES --- **/

interface Project {
  id: string;
  name: string;
  client_name: string;
  location: string;
  updated_at: number;
  status: 'active' | 'completed' | 'archived';
}

type NewProjectKeys = 'name' | 'client_name' | 'location';

/** --- UI COMPONENTS --- **/

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline" | "danger";
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    ghost: "text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10",
    outline: "border border-zinc-800 text-zinc-300 hover:bg-zinc-800/50 backdrop-blur-md",
    danger: "text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
  };
  
  return (
    <button 
      {...props} 
      className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2.5rem] shadow-2xl ${className}`}>
    {children}
  </div>
);

/** --- DASHBOARD PAGE --- **/

const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth();
  
  // --- State Management ---
  const [projects, setProjects] = useState<Project[]>(() => [
    { 
      id: '1', 
      name: 'Two Rivers Mall', 
      client_name: 'Centum Real Estate', 
      location: 'Limuru Road, Nairobi', 
      updated_at: Date.now(), 
      status: 'active' 
    },
    { 
      id: '2', 
      name: 'Westlands Tower', 
      client_name: 'Skyline Ltd', 
      location: 'Westlands, Nairobi', 
      updated_at: Date.now() - 86400000, 
      status: 'active' 
    }
  ]);
  
  const [isLoading] = useState<boolean>(false);
  const [isOnline] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  
  const [newProject, setNewProject] = useState<Pick<Project, NewProjectKeys>>({ 
    name: "", 
    client_name: "", 
    location: "" 
  });

  // --- Actions ---
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.client_name) return;

    const project: Project = {
      ...newProject,
      id: crypto.randomUUID(),
      updated_at: Date.now(),
      status: 'active'
    };

    setProjects([project, ...projects]);
    setNewProject({ name: "", client_name: "", location: "" });
    setIsCreating(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Permanently purge "${name}" from the vault?`)) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const handleOpenProject = (id: string) => {
    setOpeningId(id);
    setTimeout(() => {
      console.log(`Navigating to /projects/${id}`);
      setOpeningId(null);
      // In a real app, window.location.href or router.push would go here
    }, 1000);
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] gap-6">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <div className="absolute inset-0 blur-xl bg-amber-500/20 animate-pulse" />
      </div>
      <div className="font-black text-amber-500 uppercase tracking-[0.5em] text-xs italic">Synchronizing Vault</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto p-6 sm:p-10 space-y-10">
        
        {/* Navigation / Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
                <LayoutDashboard size={20} className="text-black" />
              </div>
              <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
                Workspace<span className="text-amber-500">.</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border backdrop-blur-md ${isOnline ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                {isOnline ? "Cloud Sync Active" : "Local Vault Mode"}
              </div>
              <span className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest hidden sm:block">
                User: {user?.email?.split('@')[0] || 'Guest_Surveyor'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {!isCreating && (
              <Button onClick={() => setIsCreating(true)} className="flex-1 md:flex-none py-6 px-10 shadow-amber-500/10">
                <Plus size={18} className="stroke-[3px]" /> New Project
              </Button>
            )}
            <Button variant="outline" onClick={signOut} className="py-6 px-6">
              <LogOut size={18} className="text-zinc-500 group-hover:text-red-500" />
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          {[
            { label: 'Total Projects', value: projects.length, icon: Database, color: 'text-amber-500' },
            { label: 'Sync Status', value: '100%', icon: Activity, color: 'text-emerald-500' },
            { label: 'Vault Security', value: 'Level 4', icon: Shield, color: 'text-blue-500' },
          ].map((stat, i) => (
            <GlassCard key={i} className="p-6 flex items-center justify-between group hover:border-amber-500/20 transition-all">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
              <div className={`p-3 bg-zinc-950 rounded-2xl border border-zinc-800 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Creation Form - Glass UI */}
        {isCreating && (
          <GlassCard className="p-8 border-2 border-dashed border-amber-500/20 animate-in zoom-in-95 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(['name', 'client_name', 'location'] as const).map((key) => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                    {key.replace('_', ' ')}
                  </label>
                  <input
                    required
                    className="w-full bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800 outline-none focus:ring-2 ring-amber-500/30 text-sm font-bold text-white placeholder-zinc-800 transition-all"
                    placeholder={`e.g., ${key === 'name' ? 'Project X' : key === 'client_name' ? 'Stakeholder' : 'Nairobi'}`}
                    value={newProject[key]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProject({ ...newProject, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-8">
              <Button type="submit" onClick={handleCreateProject} className="px-10">
                <Check className="w-4 h-4 stroke-[3px]" /> Initialize Project
              </Button>
              <Button variant="ghost" type="button" onClick={() => setIsCreating(false)}>
                Discard
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Projects Table - Glass UI */}
        <GlassCard className="overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-zinc-800/50">
                  {["Project Identity", "Stakeholder", "Last Modified", "Actions"].map((h) => (
                    <th key={h} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {projects.length > 0 ? projects.map((p) => (
                  <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="font-black text-xl uppercase tracking-tighter text-zinc-200 group-hover:text-amber-500 transition-colors">
                          {p.name}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-700 mt-1 uppercase tracking-tighter">REF: {p.id.slice(0,8)}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="text-xs font-black uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors">{p.client_name}</div>
                      <div className="text-[10px] text-zinc-600 flex items-center gap-1 uppercase font-bold mt-1">
                        <MapPin size={10} className="text-amber-500/50" /> {p.location}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        {new Date(p.updated_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleOpenProject(p.id)}
                          disabled={openingId === p.id}
                          className="flex items-center gap-2 bg-zinc-950 text-amber-500 font-black uppercase text-[10px] tracking-[0.2em] px-6 py-3 rounded-xl border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all min-w-[140px] justify-center shadow-lg group-hover:shadow-amber-500/5"
                        >
                          {openingId === p.id ? <Loader2 size={12} className="animate-spin" /> : <><ExternalLink size={12} /> Launch</>}
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-3 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-10 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <div className="p-6 bg-zinc-950 rounded-full border border-zinc-800">
                          <Search size={48} className="text-zinc-500" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.4em]">Vault Empty</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Footer Info */}
        <footer className="pt-10 text-center">
           <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em] italic">
             QS POCKET KNIFE v2.0 <span className="mx-2">/</span> BUILT FOR PRECISION
           </p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;