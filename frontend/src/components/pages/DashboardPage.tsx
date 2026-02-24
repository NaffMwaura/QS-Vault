import React, { useState} from 'react';
import { 
  Plus, Trash2, ExternalLink, 
  MapPin, Loader2, Check, Calendar, Search 
} from 'lucide-react';

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
  variant?: "primary" | "ghost" | "outline";
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-amber-500 hover:bg-amber-400 text-black",
    ghost: "text-zinc-500 hover:text-amber-500 bg-transparent",
    outline: "border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
  };
  return (
    <button 
      {...props} 
      className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

/** --- DASHBOARD PAGE --- **/

const DashboardPage: React.FC = () => {
  // Fix: Use a lazy initializer function to ensure Date.now() is only called once on mount.
  // This satisfies the requirement for components to remain pure during render cycles.
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
      updated_at: Date.now(), // Impure calls are allowed inside event handlers
      status: 'active'
    };

    setProjects([project, ...projects]);
    setNewProject({ name: "", client_name: "", location: "" });
    setIsCreating(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Permanently delete "${name}"?`)) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const handleOpenProject = (id: string) => {
    setOpeningId(id);
    setTimeout(() => {
      console.log(`Navigating to /projects/${id}`);
      setOpeningId(null);
    }, 1000);
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] gap-4">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      <div className="font-black text-amber-500 uppercase tracking-widest text-xs">Synchronizing...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 sm:p-10 font-sans animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-zinc-800/50">
        <div className="space-y-2">
          <h2 className="text-6xl font-black tracking-tighter text-amber-500 uppercase italic leading-none">Dashboard</h2>
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] w-fit flex items-center gap-2 border ${isOnline ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            {isOnline ? "Cloud Sync Active" : "Local Vault Mode"}
          </div>
        </div>

        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="py-6 px-10 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Plus size={18} className="mr-2 stroke-[3px]" /> New Project
          </Button>
        )}
      </div>

      <div className="max-w-7xl mx-auto mt-10 space-y-8">
        
        {/* Creation Form */}
        {isCreating && (
          <form onSubmit={handleCreateProject} className="bg-zinc-900/40 p-8 rounded-[2.5rem] border-2 border-dashed border-amber-500/20 backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(['name', 'client_name', 'location'] as const).map((key) => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                    {key.replace('_', ' ')}
                  </label>
                  <input
                    required
                    className="w-full bg-zinc-950 p-4 rounded-2xl border border-zinc-800 outline-none focus:ring-2 ring-amber-500/30 text-sm font-bold text-white placeholder-zinc-800 transition-all"
                    placeholder={`e.g., ${key === 'name' ? 'Two Rivers Mall' : key === 'client_name' ? 'Centum' : 'Nairobi'}`}
                    value={newProject[key]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProject({ ...newProject, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-8">
              <Button type="submit" className="px-10">
                <Check className="w-4 h-4 mr-2 stroke-[3px]" /> Initialize Project
              </Button>
              <Button variant="ghost" type="button" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Projects Table */}
        <div className="bg-zinc-900/20 rounded-[3rem] border border-zinc-800/50 overflow-hidden backdrop-blur-sm shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-zinc-800/50">
                  {["Project Identity", "Stakeholder / Region", "Last Modified", "System Control"].map((h) => (
                    <th key={h} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {projects.length > 0 ? projects.map((p) => (
                  <tr key={p.id} className="group hover:bg-amber-500/2 transition-colors">
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="font-black text-xl uppercase tracking-tighter text-zinc-200 group-hover:text-amber-500 transition-colors">
                          {p.name}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-700 mt-1 uppercase">UID: {p.id.slice(0,8)}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="text-xs font-black uppercase text-zinc-400">{p.client_name}</div>
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
                          className="flex items-center gap-2 bg-zinc-950 text-amber-500 font-black uppercase text-[10px] tracking-[0.2em] px-5 py-3 rounded-xl border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all min-w-30 justify-center"
                        >
                          {openingId === p.id ? <Loader2 size={12} className="animate-spin" /> : <><ExternalLink size={12} /> Open</>}
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
                    <td colSpan={4} className="px-10 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-20">
                        <Search size={40} />
                        <span className="text-xs font-black uppercase tracking-widest">No projects found in vault</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;