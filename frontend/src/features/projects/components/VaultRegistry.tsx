/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  MapPin,
  ExternalLink,
  X,
  Briefcase,
  Trash2,
  Save,
  Loader2,
  RefreshCw,
  ShieldCheck,
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

/** --- MAIN COMPONENT: PROJECT REGISTRY --- **/
const VaultRegistry: React.FC<VaultRegistryProps> = ({
  projects,
  setProjects,
  navigate,
}) => {
  const { user, theme, isOnline } = useAuth();
  
  // UI States
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newProject, setNewProject] = useState({
    name: "",
    client_name: "",
    location: "",
  });

  /** * 1. SYNC ENGINE: FETCH CLOUD DATA
   * This ensures your local list matches the database exactly.
   */
  const syncWithCloud = useCallback(async () => {
    if (!user || !supabase || !isOnline) return;
    
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (data && !error) {
        // Atomic Update: We overwrite local cache with cloud truth
        // This handles cases where items were deleted elsewhere
        await db.projects.where('user_id').equals(user.id).delete();
        await db.projects.bulkPut(data);
        
        setProjects(data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      }
    } catch (err) {
      console.warn("Vault Sync: Using local offline records.");
    } finally {
      setIsRefreshing(false);
    }
  }, [user, isOnline, setProjects]);

  useEffect(() => {
    syncWithCloud();
  }, [syncWithCloud]);

  /** * 2. ACTION: REGISTER NEW PROJECT */
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
      // Save locally first for instant feedback
      await db.projects.add(projectRecord);
      
      // Queue for cloud delivery
      if (syncEngine) {
        await syncEngine.queueChange("projects", projectId, "INSERT", projectRecord);
      }
      
      setProjects((prev) => [projectRecord, ...prev]);
      setIsCreating(false);
      setNewProject({ name: "", client_name: "", location: "" });
    } catch (err) {
      console.error("Failed to secure project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /** * 3. ACTION: PERMANENT DELETE
   * Removes from device and queues removal from cloud database.
   */
  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `DELETE PROJECT: Are you sure you want to remove "${name}"? This will erase it from the cloud and this device.`
    );
    
    if (!confirmed || !db) return;

    try {
      // Remove locally
      await db.projects.delete(id);
      
      // Tell cloud to remove it
      if (syncEngine) {
        await syncEngine.queueChange("projects", id, "DELETE", null);
      }

      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Deletion failed.");
    }
  };

  const filteredProjects = useMemo(() =>
      projects.filter((p) => {
        const query = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(query) || p.client_name?.toLowerCase().includes(query);
      }),
    [projects, searchQuery]
  );

  return (
    <div className={`rounded-[3rem] border-2 shadow-2xl transition-all duration-500 overflow-hidden
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
      
      {/* 1. CONTROL HEADER */}
      <div className={`p-8 sm:p-10 border-b-2 flex flex-col md:flex-row justify-between items-center gap-8
        ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'}`}>
        
        <div className="text-left">
          <h3 className={`text-3xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Project Portfolio<span className="text-amber-500">.</span>
          </h3>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2 italic">
            Secure Local & Cloud Workspace Registry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={syncWithCloud}
            disabled={isRefreshing || !isOnline}
            className={`p-4 rounded-xl border-2 transition-all active:scale-90 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400 shadow-inner'}`}
          >
             <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-amber-500' : ''} />
          </button>

          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input
              placeholder="Search Projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full sm:w-60 pl-14 pr-6 py-4 rounded-xl border-2 outline-none font-bold text-xs
                ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-100'}`}
            />
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-6 py-4 bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl shadow-xl hover:bg-amber-400 transition-all flex items-center gap-3 italic"
          >
            {isCreating ? <X size={16} /> : <Plus size={16} strokeWidth={3} />}
            {isCreating ? 'Cancel' : 'New Project'}
          </button>
        </div>
      </div>

      {/* 2. ADD PROJECT FORM */}
      {isCreating && (
        <form onSubmit={handleCreateProject} className="p-8 sm:p-12 bg-zinc-950/20 border-b-2 border-amber-500/10 animate-in slide-in-from-top-4 duration-500 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="space-y-3 text-left">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 tracking-widest italic">Project Name</label>
                <input required placeholder="e.g. Westside Mall" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} 
                  className={`w-full p-5 rounded-2xl border-2 font-bold outline-none ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white text-zinc-900'}`} />
             </div>
             <div className="space-y-3 text-left">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 tracking-widest italic">Client Name</label>
                <input required placeholder="Client Node..." value={newProject.client_name} onChange={e => setNewProject({...newProject, client_name: e.target.value})} 
                  className={`w-full p-5 rounded-2xl border-2 font-bold outline-none ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white text-zinc-900'}`} />
             </div>
             <div className="space-y-3 text-left">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 tracking-widest italic">Location</label>
                <input placeholder="Site Address..." value={newProject.location} onChange={e => setNewProject({...newProject, location: e.target.value})} 
                  className={`w-full p-5 rounded-2xl border-2 font-bold outline-none ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white text-zinc-900'}`} />
             </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-amber-500 text-black font-black uppercase text-xs tracking-[0.4em] shadow-2xl rounded-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-4 italic">
             {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
             Secure Project to Vault
          </button>
        </form>
      )}

      {/* 3. PROJECT LIST */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-800px]">
          <thead className={`text-[9px] font-black uppercase tracking-widest italic border-b-2
            ${theme === 'dark' ? 'bg-zinc-950/60 text-zinc-600' : 'bg-zinc-50 text-zinc-400'}`}>
            <tr>
              <th className="p-8">Project Name</th>
              <th className="p-8">Stakeholder</th>
              <th className="p-8">Location</th>
              <th className="p-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y-2 ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-100'}`}>
            {filteredProjects.length > 0 ? filteredProjects.map((p) => (
              <tr key={p.id} className="group hover:bg-amber-500/1 transition-colors">
                <td className="p-8 text-left">
                  <div className="space-y-3">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border
                       ${p.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                       {p.status}
                    </span>
                    <h4 className={`text-xl font-black uppercase italic tracking-tighter leading-none group-hover:text-amber-500 transition-colors
                      ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      {p.name}
                    </h4>
                  </div>
                </td>
                <td className="p-8 text-left">
                   <p className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      <Briefcase size={14} className="opacity-40" />
                      {p.client_name || "Private"}
                   </p>
                </td>
                <td className="p-8 text-left">
                   <div className="flex items-center gap-2 opacity-50">
                      <MapPin size={12} className="text-amber-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-150px]">{p.location || "Pending"}</span>
                   </div>
                   <p className="text-[8px] font-bold text-zinc-600 mt-2 uppercase tracking-tighter italic leading-none">ID: {p.id.slice(0, 8)}</p>
                </td>
                <td className="p-8 text-right">
                   <div className="flex gap-3 justify-end">
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-4 rounded-xl bg-rose-500/5 text-rose-500 border border-transparent hover:border-rose-500 transition-all active:scale-90">
                        <Trash2 size={18} />
                      </button>
                      <button onClick={() => navigate(`/projects/${p.id}`)} className="px-5 py-4 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all active:scale-95 shadow-xl flex items-center gap-3">
                         <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">Open Project</span>
                         <ExternalLink size={18} />
                      </button>
                   </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="p-32 text-center opacity-10 flex flex-col items-center">
                   <Briefcase size={80} className="mb-6" />
                   <p className="font-black uppercase text-sm tracking-[0.6em] italic">No Projects in Vault</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. FOOTER STATUS */}
      <div className={`p-6 border-t-2 flex items-center justify-between opacity-30
        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
        <div className="flex items-center gap-4">
          <ShieldCheck size={18} className="text-emerald-500" />
          <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-900'}`}>
            Audit Handshake Active • All nodes secured
          </p>
        </div>
        <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">VAULT_v2.6 • SYNC_L4</p>
      </div>
    </div>
  );
};

export default VaultRegistry;