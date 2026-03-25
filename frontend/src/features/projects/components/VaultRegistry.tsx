/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Trash2
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (OFFLINE-FIRST)
   ====================================================== */

let useAuth: any = () => ({ 
  user: { id: 'dev-surveyor-001' }, 
  theme: 'dark' 
});

let db: any = null;
let syncEngine: any = null;
let Button: any = ({ children, onClick, className, }: any) => (
  <button onClick={onClick} className={className}>{children}</button>
);

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;

    const btnMod = await import("../../../components/ui/Button");
    if (btnMod.default) Button = btnMod.default;
  } catch (e) {
    // Sandbox fallback
  }
};

resolveModules();

/** --- TYPES --- **/

interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name: string;
  location: string;
  created_at: string;
  status: 'active' | 'completed' | 'archived';
}

interface VaultRegistryProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  navigate: (path: string) => void;
  onDeleteProject: (id: string) => void; 
}

/** --- MAIN COMPONENT: PROJECT PORTFOLIO --- **/

const VaultRegistry: React.FC<VaultRegistryProps> = ({ projects, setProjects, navigate, onDeleteProject }) => {
  const { user, theme } = useAuth();
  
  // UI States
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Project Data
  const [newProject, setNewProject] = useState({ 
    name: "", 
    client_name: "", 
    location: "" 
  });

  /** * CREATE PROJECT (LOCAL-FIRST)
   * 1. Generates a unique node ID.
   * 2. Commits to the local device vault (Dexie).
   * 3. Queues the change for cloud synchronization.
   */
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !user || !db) return;

    setIsSubmitting(true);
    const projectId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const projectData: Project = {
      id: projectId,
      user_id: user.id,
      name: newProject.name,
      client_name: newProject.client_name,
      location: newProject.location || 'Site Location TBD',
      status: 'active',
      created_at: timestamp
    };

    try {
      // SAVE TO LOCAL DEVICE (Immediate Feedback)
      await db.projects.add({ ...projectData, contract_sum: 0, updated_at: timestamp });
      
      // QUEUE FOR CLOUD (Background Sync)
      if (syncEngine?.queueChange) {
        await syncEngine.queueChange('projects', projectId, 'INSERT', projectData);
      }

      setProjects(prev => [projectData, ...prev]);
      setIsCreating(false);
      setNewProject({ name: "", client_name: "", location: "" });
    } catch (err) {
      console.error("Office Registry: Local save failed.", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`rounded-[2.5rem] sm:rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500
      ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200 shadow-2xl shadow-zinc-200/40'}`}>
      
      {/* 1. PORTFOLIO HEADER */}
      <div className="p-6 sm:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-zinc-800/40 bg-white/1">
        <div className="space-y-1 text-left">
          <h3 className={`text-2xl sm:text-3xl font-black uppercase italic tracking-tighter leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Project Portfolio<span className="text-amber-500">.</span>
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
            Professional Project Inventory
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-amber-500 transition-colors" size={16} />
            <input 
              placeholder="Search portfolio..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-3 rounded-xl border outline-none font-bold text-xs w-full sm:w-56 transition-all
                ${theme === 'dark' 
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500/40' 
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500/40'}`} 
            />
          </div>
          
          <Button 
            variant="primary"
            onClick={() => setIsCreating(true)} 
            leftIcon={<Plus size={16} className="stroke-[3px]" />}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* 2. NEW PROJECT FORM */}
      {isCreating && (
        <form 
          onSubmit={handleCreateProject} 
          className="p-8 sm:p-12 bg-amber-500/5 border-b border-amber-500/20 animate-in slide-in-from-top-4 space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-left">
               <label className="text-[10px] font-black uppercase text-zinc-500 italic ml-1">Project Name</label>
               <input 
                 required 
                 placeholder="e.g. Nairobi Office Complex"
                 value={newProject.name} 
                 onChange={e => setNewProject({...newProject, name: e.target.value})} 
                 className={`w-full p-5 rounded-2xl border font-bold text-sm outline-none transition-all
                   ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900'}`} 
               />
            </div>
            <div className="space-y-2 text-left">
               <label className="text-[10px] font-black uppercase text-zinc-500 italic ml-1">Client Name</label>
               <input 
                 required 
                 placeholder="Client / Stakeholder..."
                 value={newProject.client_name} 
                 onChange={e => setNewProject({...newProject, client_name: e.target.value})} 
                 className={`w-full p-5 rounded-2xl border font-bold text-sm outline-none transition-all
                   ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900'}`} 
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
               className={`px-10 rounded-2xl border transition-all ${theme === 'dark' ? 'border-zinc-800 text-zinc-500 hover:text-white' : 'border-zinc-200 text-zinc-400 hover:text-zinc-900'}`}
             >
               <X size={20} />
             </button>
          </div>
        </form>
      )}

      {/* 3. PROJECT LIST TABLE */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className={`text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic border-b
            ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <tr>
              <th className="p-8 sm:p-10 text-left">Project Identity</th>
              <th className="p-8 sm:p-10 hidden sm:table-cell text-left">Main Client</th>
              <th className="p-8 sm:p-10 text-right">Technical Controls</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
            {filteredProjects.length > 0 ? filteredProjects.map(p => (
              <tr key={p.id} className="group hover:bg-white/2 transition-colors">
                <td className="p-8 sm:p-10 text-left">
                  <div className="flex flex-col text-left">
                    <span className={`font-black text-xl sm:text-2xl uppercase tracking-tighter transition-colors group-hover:text-amber-500 leading-none
                      ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>
                      {p.name}
                    </span>
                    <div className="flex items-center gap-2 mt-2 sm:hidden">
                       <MapPin size={10} className="text-amber-500/60" />
                       <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight truncate max-w-30">
                         {p.client_name}
                       </span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-600 mt-2 tracking-widest hidden sm:block leading-none uppercase">
                      REF: {p.id.slice(0,12)}
                    </span>
                  </div>
                </td>
                <td className="p-8 sm:p-10 hidden sm:table-cell text-left">
                  <div className="flex items-center gap-3 text-sm font-bold text-zinc-400 uppercase tracking-tight">
                    <MapPin size={14} className="text-amber-500/60" /> 
                    {p.client_name || 'Project Node'}
                  </div>
                </td>
                <td className="p-8 sm:p-10 text-right">
                  <div className="flex gap-4 justify-end">
                    <button 
                      onClick={() => onDeleteProject(p.id)} 
                      title="Purge Project Node"
                      className="p-4 bg-zinc-900/60 border border-zinc-800 text-zinc-700 hover:text-rose-500 hover:border-rose-500 transition-all active:scale-90 shadow-xl"
                    >
                      <Trash2 size={20}/>
                    </button>
                    <button 
                      onClick={() => navigate(`/projects/${p.id}`)} 
                      title="Open Workspace"
                      className="p-4 bg-zinc-900/60 border border-zinc-800 text-zinc-500 rounded-2xl hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all active:scale-90 shadow-xl"
                    >
                      <ExternalLink size={20}/>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="p-32 text-center opacity-20">
                  <Briefcase size={64} className="mx-auto mb-6 text-zinc-700 animate-pulse" />
                  <div className="space-y-2">
                    <p className="font-black uppercase text-sm tracking-[0.5em] italic">Registry is Empty</p>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none">
                      Launch a new project to start site measurements.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`p-6 border-t flex items-center justify-between opacity-40
        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
        <div className="flex items-center gap-3">
          <AlertCircle size={12} className="text-amber-500" />
          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
            Professional SMM Monitoring Active
          </p>
        </div>
        <p className="text-[8px] font-mono text-zinc-600 uppercase">
          SECURE_VAULT_PROTOCOL_V4
        </p>
      </div>
    </div>
  );
};

export default VaultRegistry;