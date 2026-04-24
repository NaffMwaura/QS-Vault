/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  MapPin,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Trash2,
  Save,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine, supabase } from "../../../lib/database/database";

interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name: string | null;
  location: string | null;
  contract_sum: number;
  status: "active" | "completed" | "archived";
  geofence_radius: number;
  created_at: string;
  updated_at: string;
}

interface VaultRegistryProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  navigate: (path: string) => void;
}

const VaultRegistry: React.FC<VaultRegistryProps> = ({
  projects,
  setProjects,
  navigate,
}) => {
  const { user, theme, isOnline } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProject, setNewProject] = useState({
    name: "",
    client_name: "",
    location: "",
  });

  /** * 1. CLOUD SYNC: FETCH REMOTE PROJECTS
   * This ensures projects created on the deployed link show up on localhost.
   */
  const fetchCloudProjects = useCallback(async () => {
    if (!user || !supabase || !isOnline) return;
    
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (data && !error) {
        // Atomic Update: Put everything from cloud into local Dexie
        await db.projects.bulkPut(data);
        setProjects(data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      }
    } catch (err) {
      console.warn("Registry Sync Deferred: Using local vault cache.");
    } finally {
      setIsRefreshing(false);
    }
  }, [user, isOnline, setProjects]);

  useEffect(() => {
    fetchCloudProjects();
  }, [fetchCloudProjects]);

  /** * 2. REGISTRATION ENGINE: CREATE PROJECT */
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim() || !user || !db) return;

    setIsSubmitting(true);
    const timestamp = new Date().toISOString();
    const projectId = crypto.randomUUID();

    const projectRecord: Project = {
      id: projectId,
      user_id: user.id,
      name: newProject.name.trim(),
      client_name: newProject.client_name.trim() || null,
      location: newProject.location.trim() || null,
      contract_sum: 0,
      status: "active",
      geofence_radius: 100,
      created_at: timestamp,
      updated_at: timestamp,
    };

    try {
      // Step A: Immediate Local Persistence
      await db.projects.add(projectRecord);
      
      // Step B: Queue Cloud Handshake
      if (syncEngine) {
        await syncEngine.queueChange("projects", projectId, "INSERT", projectRecord);
      }
      
      setProjects((prev) => [projectRecord, ...prev]);
      setIsCreating(false);
      setNewProject({ name: "", client_name: "", location: "" });
    } catch (err) {
      console.error("Vault Creation Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** * 3. REVOCATION ENGINE: DELETE PROJECT 
   * Includes strict confirmation and cloud sync logic.
   */
  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `PERMANENT REVOCATION: Are you sure you want to erase project "${name}" from the vault? This cannot be undone.`
    );
    
    if (!confirmed || !db) return;

    try {
      // Step A: Local Purge
      await db.projects.delete(id);
      
      // Step B: Cloud Revocation Queue
      if (syncEngine) {
        await syncEngine.queueChange("projects", id, "DELETE", null);
      }

      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Purge Failed:", err);
    }
  };

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const query = searchQuery.toLowerCase();
        return (
          project.name.toLowerCase().includes(query) ||
          project.client_name?.toLowerCase().includes(query)
        );
      }),
    [projects, searchQuery],
  );

  return (
    <div className={`rounded-[3rem] border-2 shadow-2xl transition-all duration-700 overflow-hidden
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
      
      {/* HEADER SECTION */}
      <div className={`p-8 sm:p-12 border-b-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-10 bg-white/[0.01]
        ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'}`}>
        
        <div className="text-left space-y-3">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            Vault Registry<span className="text-amber-500">.</span>
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">
            Professional Infrastructure Inventory
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <button 
            onClick={fetchCloudProjects}
            disabled={isRefreshing || !isOnline}
            className={`p-4 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-amber-500' : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:text-amber-600 shadow-inner'}`}
          >
             <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-amber-500' : ''} />
          </button>

          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input
              placeholder="Search Vaults..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full sm:w-64 pl-16 pr-8 py-4 rounded-2xl border-2 outline-none font-bold text-xs transition-all shadow-inner
                ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-amber-500'}`}
            />
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-8 py-4 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-4 italic border-2 border-amber-300"
          >
            {isCreating ? <X size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
            {isCreating ? 'Cancel' : 'Register Project'}
          </button>
        </div>
      </div>

      {/* CREATION FORM */}
      {isCreating && (
        <form onSubmit={handleCreateProject} className="p-10 sm:p-14 bg-zinc-950/20 border-b-2 border-amber-500/20 animate-in slide-in-from-top-4 duration-500 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
             <div className="space-y-4 text-left">
                <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Project Node Name</label>
                <input required placeholder="e.g. Westside Complex" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} 
                  className={`w-full p-6 rounded-3xl border-2 font-bold outline-none transition-all ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950'}`} />
             </div>
             <div className="space-y-4 text-left">
                <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Main Client Node</label>
                <input required placeholder="Client Identity..." value={newProject.client_name} onChange={e => setNewProject({...newProject, client_name: e.target.value})} 
                  className={`w-full p-6 rounded-3xl border-2 font-bold outline-none transition-all ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950'}`} />
             </div>
             <div className="space-y-4 text-left">
                <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Site Coordinates / Addr</label>
                <input placeholder="Location Detail..." value={newProject.location} onChange={e => setNewProject({...newProject, location: e.target.value})} 
                  className={`w-full p-6 rounded-3xl border-2 font-bold outline-none transition-all ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950'}`} />
             </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-8 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.5em] shadow-2xl rounded-[2.5rem] hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-6 italic">
             {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} strokeWidth={3} />}
             Secure Project Node to Vault
          </button>
        </form>
      )}

      {/* PROJECTS TABLE */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className={`text-[10px] font-black uppercase tracking-[0.4em] italic border-b-2
            ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-100 text-zinc-500'}`}>
            <tr>
              <th className="p-10 text-left">Infrastructure Node</th>
              <th className="p-10 text-left">Client / Stakeholder</th>
              <th className="p-10 text-left">Registry Metadata</th>
              <th className="p-10 text-right">Site Controls</th>
            </tr>
          </thead>
          <tbody className={`divide-y-2 ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
            {filteredProjects.length > 0 ? filteredProjects.map((p) => (
              <tr key={p.id} className="group hover:bg-amber-500/[0.02] transition-colors">
                <td className="p-10 text-left">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border-2
                         ${p.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                         {p.status}
                       </span>
                       <span className="text-[9px] font-mono text-zinc-700 font-bold">NODE_REF: {p.id.slice(0, 12).toUpperCase()}</span>
                    </div>
                    <h4 className={`text-2xl font-black uppercase italic tracking-tighter leading-none transition-colors group-hover:text-amber-500
                      ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-950'}`}>
                      {p.name}
                    </h4>
                  </div>
                </td>
                <td className="p-10 text-left">
                   <p className={`text-sm font-bold uppercase tracking-widest flex items-center gap-3 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700'}`}>
                      <Briefcase size={16} className="text-zinc-700" />
                      {p.client_name || "Private Node"}
                   </p>
                </td>
                <td className="p-10 text-left">
                   <div className="flex items-center gap-3 opacity-60">
                      <MapPin size={14} className="text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[200px]">{p.location || "Coordinates Pending"}</span>
                   </div>
                   <p className="text-[8px] font-bold text-zinc-600 mt-2 uppercase tracking-widest">Added: {new Date(p.created_at).toLocaleDateString()}</p>
                </td>
                <td className="p-10 text-right">
                   <div className="flex gap-4 justify-end">
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-5 rounded-2xl bg-rose-500/5 text-rose-500 border-2 border-transparent hover:border-rose-500 transition-all shadow-xl active:scale-90 group-hover:opacity-100">
                        <Trash2 size={22} />
                      </button>
                      <button onClick={() => navigate(`/projects/${p.id}`)} className="p-5 bg-zinc-950 border-2 border-zinc-800 text-zinc-500 rounded-2xl hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all active:scale-90 shadow-2xl flex items-center gap-4 group">
                         <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Launch Node</span>
                         <ExternalLink size={22} />
                      </button>
                   </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="p-40 text-center opacity-10">
                   <Briefcase size={120} className="mx-auto mb-10 text-zinc-700" />
                   <p className="font-black uppercase text-xl tracking-[0.8em] italic leading-none">Registry Exhausted</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER BAR */}
      <div className={`p-8 border-t-2 flex items-center justify-between opacity-30 shadow-inner
        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
        <div className="flex items-center gap-4">
          <ShieldCheck size={20} className="text-emerald-500" />
          <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>
            Immutable Project Archival Handshake Active
          </p>
        </div>
        <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">VAULT_V2.6.0 • ISO_19650</p>
      </div>
    </div>
  );
};

export default VaultRegistry;