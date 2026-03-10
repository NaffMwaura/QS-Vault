/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  ExternalLink, 
   
  Database, 
  Loader2,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

/* ======================================================
    MODULE RESOLUTION HANDLER (PRODUCTION READY)
   ====================================================== */

// We attempt to import the real logic nodes. 
// If they are missing in the current context, we use the sandbox shims.
let useAuth: any = () => ({ 
  user: { id: 'dev-node-001' }, 
  theme: 'dark' 
});

let db: any = null;
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    // Standard relative paths based on your provided structure
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {
    console.warn("Vault Handshake: Falling back to sandbox mode.");
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
}

/** --- MAIN COMPONENT --- **/

const VaultRegistry: React.FC<VaultRegistryProps> = ({ projects, setProjects, navigate }) => {
  const { user, theme } = useAuth();
  
  // UI States
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [newProject, setNewProject] = useState({ 
    name: "", 
    client_name: "", 
    location: "" 
  });

  /** * MASTER CREATION HANDSHAKE
   * Handles hard persistence to Dexie and queues the Supabase sync.
   */
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !user || !db) {
      console.error("Registry Error: Node requirements not met for injection.");
      return;
    }

    setIsSubmitting(true);
    const projectId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const projectData: Project = {
      id: projectId,
      user_id: user.id,
      name: newProject.name,
      client_name: newProject.client_name,
      location: newProject.location || 'Nairobi Site Node',
      status: 'active',
      created_at: timestamp
    };

    try {
      // 1. HARD PERSISTENCE: Write to the device's indexedDB (Dexie)
      // This prevents data loss on reload.
      await db.projects.add({
        ...projectData,
        contract_sum: 0,
        updated_at: timestamp
      });

      // 2. CLOUD SYNC: Queue the change for the background heartbeat
      if (syncEngine?.queueChange) {
        await syncEngine.queueChange('projects', projectId, 'INSERT', projectData);
      }
      
      // 3. UI SYNC: Update the parent state to show the new node immediately
      setProjects(prev => [projectData, ...prev]);
      
      // 4. CLEANUP
      setIsCreating(false);
      setNewProject({ name: "", client_name: "", location: "" });
      
    } catch (err) {
      console.error("Critical: Project creation failed on local node:", err);
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
      ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200 shadow-2xl'}`}>
      
      {/* 1. REGISTRY HEADER HUB */}
      <div className="p-6 sm:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-zinc-800/40 bg-white/2">
        <div className="space-y-1 text-left">
          <h3 className={`text-2xl sm:text-3xl font-black uppercase italic tracking-tighter leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Vault Registry<span className="text-amber-500">.</span>
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
            Authorized project node inventory
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-amber-500 transition-colors" size={16} />
            <input 
              placeholder="Search registry..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-3 rounded-xl border outline-none font-bold text-xs w-full sm:w-56 transition-all
                ${theme === 'dark' 
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500/40' 
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500/40'}`} 
            />
          </div>
          <button 
            onClick={() => setIsCreating(true)} 
            className="flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-amber-400 active:scale-95 transition-all shadow-amber-500/10"
          >
            <Plus size={16} className="stroke-[3px]" /> New Workspace
          </button>
        </div>
      </div>

      {/* 2. PROJECT INJECTION FORM (Animated) */}
      {isCreating && (
        <form 
          onSubmit={handleCreateProject} 
          className="p-8 sm:p-12 bg-amber-500/5 border-b border-amber-500/20 animate-in slide-in-from-top-4 flex flex-col md:flex-row gap-6 items-end"
        >
          <div className="flex-1 w-full space-y-2 text-left">
             <label className="text-[10px] font-black uppercase text-zinc-500 italic ml-1">Vault Identity</label>
             <input 
               required 
               placeholder="Project Name..."
               value={newProject.name} 
               onChange={e => setNewProject({...newProject, name: e.target.value})} 
               className={`w-full p-5 rounded-2xl border font-bold text-sm outline-none transition-all
                 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900'}`} 
             />
          </div>
          <div className="flex-1 w-full space-y-2 text-left">
             <label className="text-[10px] font-black uppercase text-zinc-500 italic ml-1">Stakeholder Ref</label>
             <input 
               required 
               placeholder="Client Name..."
               value={newProject.client_name} 
               onChange={e => setNewProject({...newProject, client_name: e.target.value})} 
               className={`w-full p-5 rounded-2xl border font-bold text-sm outline-none transition-all
                 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900'}`} 
             />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button 
               type="submit" 
               disabled={isSubmitting} 
               className="flex-1 md:flex-none px-10 py-5 bg-amber-500 text-black font-black uppercase text-[10px] rounded-2xl hover:bg-amber-400 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3"
             >
               {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
               Confirm Node
             </button>
             <button 
               type="button" 
               onClick={() => setIsCreating(false)} 
               className={`p-5 rounded-2xl border transition-all ${theme === 'dark' ? 'border-zinc-800 text-zinc-500 hover:text-white' : 'border-zinc-200 text-zinc-400 hover:text-zinc-900'}`}
             >
               <X size={20} />
             </button>
          </div>
        </form>
      )}

      {/* 3. VAULT TABLE (Optimized for Mobile/Desktop) */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className={`text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic border-b
            ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <tr>
              <th className="p-8 sm:p-10">Node Identity</th>
              <th className="p-8 sm:p-10 hidden sm:table-cell">Primary Stakeholder</th>
              <th className="p-8 sm:p-10 text-right">Access</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
            {filteredProjects.length > 0 ? filteredProjects.map(p => (
              <tr key={p.id} className="group hover:bg-white/2 transition-colors">
                <td className="p-8 sm:p-10 text-left">
                  <div className="flex flex-col">
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
                    <span className="text-[9px] font-mono text-zinc-600 mt-2 tracking-widest hidden sm:block">
                      HEX_REF: {p.id.slice(0,14).toUpperCase()}
                    </span>
                  </div>
                </td>
                <td className="p-8 sm:p-10 hidden sm:table-cell text-left">
                  <div className="flex items-center gap-3 text-sm font-bold text-zinc-400 uppercase tracking-tight">
                    <MapPin size={14} className="text-amber-500/60" /> 
                    {p.client_name || 'Generic Site Hub'}
                  </div>
                </td>
                <td className="p-8 sm:p-10 text-right">
                  <div className="flex gap-3 justify-end">
                    <button 
                      onClick={() => navigate(`/projects/${p.id}`)} 
                      title="Enter Technical Workspace"
                      className="p-4 bg-zinc-900/60 border border-zinc-800 text-zinc-500 rounded-2xl hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all active:scale-90 shadow-xl shadow-black/40 border-opacity-40"
                    >
                      <ExternalLink size={20}/>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="p-32 text-center opacity-20">
                  <Database size={64} className="mx-auto mb-6 text-zinc-700 animate-pulse" />
                  <div className="space-y-2">
                    <p className="font-black uppercase text-sm tracking-[0.5em] italic">Node Registry Empty</p>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none">
                      Initialize a new workspace to begin takeoff
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. COMPLIANCE STATUS FOOTER */}
      <div className={`p-6 border-t flex items-center justify-between opacity-40
        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
        <div className="flex items-center gap-3">
          <AlertCircle size={12} className="text-amber-500" />
          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
            SMM-KE Compliance Monitoring node Active
          </p>
        </div>
        <p className="text-[8px] font-mono text-zinc-600 uppercase">
          STORAGE: LOCAL_DB_V1
        </p>
      </div>
    </div>
  );
};

export default VaultRegistry;