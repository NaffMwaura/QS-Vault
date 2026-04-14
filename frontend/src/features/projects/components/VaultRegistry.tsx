import React, { useState } from 'react';
import { 
  Search, Plus, MapPin, ExternalLink, X,
  CheckCircle2, AlertCircle, Briefcase, Trash2
} from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine } from "../../../lib/database/database";

interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name: string | null;
  location: string | null;
  contract_sum: number;
  status: 'active' | 'completed' | 'archived';
  geofence_radius: number;
  created_at: string;
  updated_at: string;
}

interface VaultRegistryProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  navigate: (path: string) => void;
  onDeleteProject: (id: string) => void; 
}

const VaultRegistry: React.FC<VaultRegistryProps> = ({ projects, setProjects, navigate, onDeleteProject }) => {
  const { user } = useAuth();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newProject, setNewProject] = useState({ 
    name: "", 
    client_name: "", 
    location: "" 
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !user || !db) return;

    setIsSubmitting(true);
    const timestamp = new Date().toISOString();
    const projectId = editingId || crypto.randomUUID();
    
    const projectRecord: Project = {
      ...formData,
      id: projectId,
      user_id: user.id,
      created_at: editingId ? (projects.find(p => p.id === editingId)?.created_at || timestamp) : timestamp,
      updated_at: timestamp
    };

    try {
      await db.projects.add({ ...projectData, contract_sum: 0, updated_at: timestamp });
      if (syncEngine?.queueChange) {
        await syncEngine.queueChange('projects', projectId, editingId ? 'UPDATE' : 'INSERT', projectRecord);
      }
      setProjects(prev => [projectData, ...prev]);
      setIsCreating(false);
      setNewProject({ name: "", client_name: "", location: "" });
    } catch (err) {
      console.error("Registry Error: Transaction failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, projects]);

  return (
    <div className="theme-panel rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden transition-all duration-500 shadow-2xl backdrop-blur-3xl">
      
      <div className="p-6 sm:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b theme-border bg-white/1">
        <div className="space-y-1 text-left">
          <h3 className="theme-heading text-2xl sm:text-3xl font-black uppercase italic tracking-tighter leading-none">
            Project Portfolio<span className="theme-accent">.</span>
          </h3>
          <p className="theme-meta text-[10px] font-black uppercase tracking-[0.4em]">
            Professional Project Inventory
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 theme-meta group-focus-within:theme-accent transition-colors" size={16} />
            <input 
              placeholder="Search Project..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="theme-input pl-10 pr-4 py-3 rounded-xl outline-none font-bold text-xs w-full sm:w-56 transition-all focus:theme-border shadow-inner" 
            />
          </div>
          
          <button 
            onClick={() => openEditor()} 
            className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-4 italic shadow-amber-500/20"
          >
            <Plus size={20} strokeWidth={3} /> Register Project
          </button>
        </div>
      </div>

      {isCreating && (
        <form 
          onSubmit={handleCreateProject} 
          className="p-8 sm:p-12 theme-accent-surface theme-border border-b animate-in slide-in-from-top-4 space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-left">
               <label className="theme-meta text-[10px] font-black uppercase italic ml-1">Project Name</label>
               <input 
                 required 
                 placeholder="e.g. Nairobi Office Complex"
                 value={newProject.name} 
                 onChange={e => setNewProject({...newProject, name: e.target.value})} 
                 className="theme-input w-full p-5 rounded-2xl font-bold text-sm outline-none transition-all shadow-inner focus:theme-border" 
               />
            </div>
            <div className="space-y-2 text-left">
               <label className="theme-meta text-[10px] font-black uppercase italic ml-1">Client Name</label>
               <input 
                 required 
                 placeholder="Client / Stakeholder..."
                 value={newProject.client_name} 
                 onChange={e => setNewProject({...newProject, client_name: e.target.value})} 
                 className="theme-input w-full p-5 rounded-2xl font-bold text-sm outline-none transition-all shadow-inner focus:theme-border" 
               />
            </div>
          </div>
          
          <div className="flex gap-4">
             <Button 
               type="submit" 
               isLoading={isSubmitting} 
               className="flex-1 py-6 italic"
               leftIcon={<CheckCircle2 size={18} />}
             >
               Save Project
             </Button>
             <button 
               type="button" 
               onClick={() => setIsCreating(false)} 
               className="theme-button-secondary px-10 rounded-2xl transition-all"
             >
               <X size={20} />
             </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="theme-card text-[10px] font-black uppercase tracking-[0.4em] italic border-b shadow-inner">
            <tr>
              <th className="p-10 text-left">Infrastructure Node</th>
              <th className="p-10 hidden lg:table-cell text-left">Valuation</th>
              <th className="p-10 hidden sm:table-cell text-left">Main Client</th>
              <th className="p-10 text-right">Technical Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y theme-border/40">
            {filteredProjects.length > 0 ? filteredProjects.map(p => (
              <tr key={p.id} className="group hover:bg-[color-mix(in_srgb,var(--app-body)_5%,transparent)] transition-colors">
                <td className="p-8 sm:p-10 text-left">
                  <div className="flex flex-col text-left">
                    <span className="theme-heading font-black text-xl sm:text-2xl uppercase tracking-tighter transition-colors group-hover:theme-accent leading-none">
                      {p.name}
                    </span>
                    <div className="flex items-center gap-2 mt-2 sm:hidden">
                       <MapPin size={10} className="theme-accent opacity-60" />
                       <span className="theme-meta text-[10px] font-bold uppercase tracking-tight truncate max-w-30">
                         {p.client_name}
                       </span>
                       <span className="text-[9px] font-mono text-zinc-700 font-bold uppercase">ID: {p.id.slice(0,8)}</span>
                    </div>
                    <h4 className={`font-black text-2xl sm:text-3xl uppercase tracking-tighter transition-colors group-hover:text-amber-500 leading-none
                      ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-950'}`}>
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-4 opacity-40">
                       <MapPin size={12} className="text-amber-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest truncate">{p.location || 'Location Pending'}</span>
                    </div>
                    <span className="theme-meta text-[9px] font-mono mt-2 tracking-widest hidden sm:block leading-none uppercase">
                      REF: {p.id.slice(0,12)}
                    </span>
                  </div>
                </td>
                <td className="p-8 sm:p-10 hidden sm:table-cell text-left">
                  <div className="flex items-center gap-3 text-sm font-bold theme-meta uppercase tracking-tight">
                    <MapPin size={14} className="theme-accent opacity-60" /> 
                    {p.client_name || 'Project Node'}
                  </div>
                </td>
                <td className="p-10 text-right">
                  <div className="flex gap-4 justify-end">
                    <button 
                      onClick={() => onDeleteProject(p.id)} 
                      title="Purge Project Node"
                      className="theme-card p-4 hover:text-[var(--app-error)] hover:border-[var(--app-error)] transition-all active:scale-90 shadow-xl"
                    >
                      <Trash2 size={20}/>
                    </button>
                    <button 
                      onClick={() => navigate(`/projects/${p.id}`)} 
                      title="Open Workspace"
                      className="theme-button-secondary p-4 rounded-2xl hover:theme-accent transition-all active:scale-90 shadow-xl"
                    >
                      <ExternalLink size={20}/>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="p-32 text-center opacity-20">
                  <Briefcase size={64} className="mx-auto mb-6 theme-icon animate-pulse" />
                  <div className="space-y-2">
                    <p className="theme-heading font-black uppercase text-sm tracking-[0.5em] italic">Registry is Empty</p>
                    <p className="theme-meta text-[10px] font-bold uppercase tracking-widest leading-none">
                      Launch a new project to start site measurements.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="theme-panel p-6 border-t flex items-center justify-between opacity-40 shadow-inner">
        <div className="flex items-center gap-3">
          <AlertCircle size={12} className="theme-accent" />
          <p className="theme-meta text-[8px] font-black uppercase tracking-widest">
            Professional SMM Monitoring Active
          </p>
        </div>
        <p className="theme-meta text-[8px] font-mono uppercase">
          SECURE_VAULT_PROTOCOL_V4
        </p>
      </div>
    </div>
  );
};

export default VaultRegistry;