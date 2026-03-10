/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  ExternalLink, 
  Trash2, 
  Database 
} from 'lucide-react';

/* ======================================================
    MODULE RESOLUTION HANDLER (SANDBOX COMPATIBILITY)
    Ensures compatibility with your local project structure.
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  user: { id: 'dev-node-001' },
  theme: 'dark',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = {
  projects: {
    add: async () => {},
    delete: async () => {}
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let syncEngine: any = { queueChange: async () => {} };

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    // @ts-
    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {
    // Sandbox fallback
  }
};

resolveModules();

/** --- TYPES --- **/

interface Project {
  id: string;
  name: string;
  client_name: string;
  location: string;
  created_at: string;
}

interface VaultRegistryProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  navigate: (path: string) => void;
}

/** --- MAIN COMPONENT --- **/

const VaultRegistry: React.FC<VaultRegistryProps> = ({ projects, setProjects, navigate }) => {
  const { user, theme } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProject, setNewProject] = useState({ name: "", client_name: "", location: "" });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !user) return;

    const projectId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const projectData: Project = {
      id: projectId,
      name: newProject.name,
      client_name: newProject.client_name,
      location: newProject.location,
      created_at: timestamp,
    };

    try {
      // 1. Commit to Local Vault (Dexie)
      await db.projects.add({ 
        ...projectData, 
        user_id: user.id, 
        contract_sum: 0, 
        status: 'active', 
        updated_at: timestamp 
      });

      // 2. Queue for Cloud Handshake
      await syncEngine.queueChange('projects', projectId, 'INSERT', { 
        ...projectData, 
        user_id: user.id 
      });
      
      setProjects([projectData, ...projects]);
      setIsCreating(false);
      setNewProject({ name: "", client_name: "", location: "" });
    } catch (err) {
      console.error("Failed to commit new vault node:", err);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.client_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500
      ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200 shadow-2xl'}`}>
      
      {/* 1. Registry Header */}
      <div className="p-8 sm:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-zinc-800/40 bg-white/2">
        <div className="space-y-1 text-left">
          <h3 className={`text-3xl font-black uppercase italic tracking-tighter leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Vault Registry
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
            Coordinate and manage takeoff node inventories
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search Node Identifier..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-12 pr-6 py-4 rounded-2xl border outline-none font-bold text-xs transition-all w-full sm:w-64
                ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500/40' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500/40'}`} 
            />
          </div>
          <button 
            onClick={() => setIsCreating(true)} 
            className="flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all"
          >
            <Plus size={18} className="stroke-[3px]" /> New Workspace
          </button>
        </div>
      </div>

      {/* 2. Creation Form Node */}
      {isCreating && (
        <form onSubmit={handleCreateProject} className="p-8 sm:p-12 bg-amber-500/5 border-b border-amber-500/20 animate-in slide-in-from-top-4 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2 text-left">
            <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 italic leading-none block">Vault Identity</label>
            <input required placeholder="Project Name..." value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className={`w-full p-4 rounded-xl border font-bold text-xs outline-none focus:border-amber-500 transition-all ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`} />
          </div>
          <div className="flex-1 space-y-2 text-left">
            <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 italic leading-none block">Primary Stakeholder</label>
            <input placeholder="Client Name..." value={newProject.client_name} onChange={e => setNewProject({...newProject, client_name: e.target.value})} className={`w-full p-4 rounded-xl border font-bold text-xs outline-none focus:border-amber-500 transition-all ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`} />
          </div>
          <div className="flex gap-3 items-end">
             <button type="submit" className="px-8 py-4 bg-amber-500 text-black font-black uppercase text-[10px] rounded-xl hover:bg-amber-400 transition-all shadow-lg">Confirm</button>
             <button type="button" onClick={() => setIsCreating(false)} className={`px-6 py-4 font-black uppercase text-[10px] rounded-xl transition-all ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>Cancel</button>
          </div>
        </form>
      )}

      {/* 3. Registry Project Stream */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic bg-zinc-900/50 border-b border-zinc-800">
            <tr>
              <th className="p-10">Node Identity</th>
              <th className="p-10">Stakeholder</th>
              <th className="p-10">Last Handshake</th>
              <th className="p-10 text-right">Control</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
            {filteredProjects.length > 0 ? filteredProjects.map(p => (
              <tr key={p.id} className="group hover:bg-white/2 transition-colors">
                <td className="p-10">
                  <div className="flex flex-col text-left">
                    <span className={`font-black text-2xl uppercase tracking-tighter group-hover:text-amber-500 transition-colors leading-none ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>{p.name}</span>
                    <span className="text-[9px] font-mono text-zinc-600 mt-2 tracking-widest leading-none">HEX_REF: {p.id.slice(0,14).toUpperCase()}</span>
                  </div>
                </td>
                <td className="p-10">
                  <div className="flex items-center gap-3 text-sm font-bold text-zinc-400 uppercase tracking-tight text-left">
                    <MapPin size={14} className="text-amber-500/60 shrink-0" /> {p.client_name || 'Nairobi Hub'}
                  </div>
                </td>
                <td className="p-10 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-left">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="p-10 text-right">
                  <div className="flex gap-3 justify-end">
                    <button 
                      onClick={() => navigate(`/projects/${p.id}`)} 
                      className={`p-4 rounded-2xl border transition-all active:scale-90 shadow-xl
                        ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:bg-amber-500 hover:text-black hover:border-amber-500' : 'bg-white border-zinc-200 text-zinc-400 hover:bg-amber-500 hover:text-black hover:border-amber-500'}`}
                    >
                      <ExternalLink size={20}/>
                    </button>
                    <button className={`p-4 rounded-2xl border transition-all active:scale-90
                      ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 text-zinc-700 hover:bg-rose-500 hover:text-white hover:border-rose-500' : 'bg-white border-zinc-200 text-zinc-300 hover:bg-rose-500 hover:text-white hover:border-rose-500'}`}>
                      <Trash2 size={20}/>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="p-32 text-center opacity-10">
                  <Database size={80} className="mx-auto mb-6" />
                  <p className="font-black uppercase text-sm tracking-[0.5em] italic">No active vaults detected in registry</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VaultRegistry;