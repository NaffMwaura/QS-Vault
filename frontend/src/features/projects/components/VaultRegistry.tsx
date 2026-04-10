/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  X,
  Briefcase,
  Trash2,
  Edit3,
  DollarSign,
  LocateFixed,
  ShieldCheck,
  Save,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine } from "../../../lib/database/database";

/** --- TYPES --- **/
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

/** --- MAIN COMPONENT: PROJECT REGISTRY & COMMAND --- **/

const VaultRegistry: React.FC<VaultRegistryProps> = ({ projects, setProjects, navigate, onDeleteProject }) => {
  const { user, theme } = useAuth();
  
  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Unified Form State
  const [formData, setFormData] = useState<{
    name: string;
    client_name: string;
    location: string;
    contract_sum: number;
    geofence_radius: number;
    status: 'active' | 'completed' | 'archived';
  }>({
    name: "",
    client_name: "",
    location: "",
    contract_sum: 0,
    geofence_radius: 100,
    status: 'active'
  });

  /** * 1. OPEN EDITOR (Hydrate if editing) */
  const openEditor = (project?: Project) => {
    if (project) {
      setEditingId(project.id);
      setFormData({
        name: project.name,
        client_name: project.client_name || "",
        location: project.location || "",
        contract_sum: project.contract_sum || 0,
        geofence_radius: project.geofence_radius || 100,
        status: project.status
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", client_name: "", location: "", contract_sum: 0, geofence_radius: 100, status: 'active' });
    }
    setIsFormOpen(true);
  };

  /** * 2. COMMIT TO VAULT (ADD/UPDATE) */
  const handleCommitProject = async (e: React.FormEvent) => {
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
      // VAULT HANDSHAKE (Dexie)
      if (editingId) {
        await db.projects.update(editingId, projectRecord);
        setProjects(prev => prev.map(p => p.id === editingId ? projectRecord : p));
      } else {
        await db.projects.add(projectRecord);
        setProjects(prev => [projectRecord, ...prev]);
      }
      
      // CLOUD BRIDGE (Sync Engine)
      if (syncEngine?.queueChange) {
        await syncEngine.queueChange('projects', projectId, editingId ? 'UPDATE' : 'INSERT', projectRecord);
      }

      // DISAPPEAR LOGIC: Clear and Close
      setIsFormOpen(false);
      setEditingId(null);
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
    <div className={`rounded-[3rem] sm:rounded-[4rem] border backdrop-blur-3xl overflow-hidden transition-all duration-700 shadow-2xl
      ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200 shadow-zinc-200/40'}`}>
      
      {/* 1. REGISTRY HEADER */}
      <div className="p-8 sm:p-14 flex flex-col md:flex-row justify-between items-start md:items-center gap-10 border-b border-zinc-800/40 bg-white/1">
        <div className="space-y-3 text-left">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            Vault Registry<span className="text-amber-500">.</span>
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">
            Secure Infrastructure Node Portfolio
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input 
              placeholder="Search Project..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`pl-16 pr-8 py-5 rounded-2xl border outline-none font-bold text-sm w-full sm:w-72 transition-all shadow-inner
                ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500/50' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`} 
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

      {/* 2. DYNAMIC REGISTRATION FORM (CREATE / EDIT) */}
      {isFormOpen && (
        <form onSubmit={handleCommitProject} className="p-10 sm:p-16 bg-zinc-950/40 border-b border-amber-500/20 animate-in slide-in-from-top-4 duration-500 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4 text-left">
               <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic leading-none">Project Identity</label>
               <input required placeholder="Project Name..." value={formData.name} 
                 onChange={e => setFormData({...formData, name: e.target.value})} 
                 className={`w-full p-6 rounded-3xl border font-bold text-lg outline-none transition-all shadow-inner
                   ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900'}`} />
            </div>
            <div className="space-y-4 text-left">
               <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic leading-none">Client / Stakeholder</label>
               <input required placeholder="Client Node..." value={formData.client_name} 
                 onChange={e => setFormData({...formData, client_name: e.target.value})} 
                 className={`w-full p-6 rounded-3xl border font-bold text-lg outline-none transition-all shadow-inner
                   ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900'}`} />
            </div>
            <div className="space-y-4 text-left">
               <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic leading-none">Site Location</label>
               <input placeholder="Physical Address..." value={formData.location} 
                 onChange={e => setFormData({...formData, location: e.target.value})} 
                 className={`w-full p-6 rounded-3xl border font-bold text-lg outline-none transition-all shadow-inner
                   ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900'}`} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4 text-left">
               <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic leading-none">Contract Sum (KES)</label>
               <div className="relative">
                  <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                  <input type="number" placeholder="0.00" value={formData.contract_sum || ''} 
                    onChange={e => setFormData({...formData, contract_sum: parseFloat(e.target.value) || 0})} 
                    className={`w-full p-6 pl-16 rounded-3xl border font-black text-2xl italic tracking-tighter outline-none transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900'}`} />
               </div>
            </div>
            <div className="space-y-4 text-left">
               <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic leading-none">Geofence Radius (Meters)</label>
               <div className="relative">
                  <LocateFixed className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />
                  <input type="number" value={formData.geofence_radius} 
                    onChange={e => setFormData({...formData, geofence_radius: parseInt(e.target.value) || 0})} 
                    className={`w-full p-6 pl-16 rounded-3xl border font-black text-2xl italic tracking-tighter outline-none transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900'}`} />
               </div>
            </div>
            <div className="space-y-4 text-left">
               <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic leading-none">Handover Status</label>
               <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}
                 className={`w-full p-6 h-76px] rounded-3xl border font-bold text-sm outline-none transition-all shadow-inner appearance-none
                   ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900'}`}>
                  <option value="active">Active Execution</option>
                  <option value="completed">Completed / Handed Over</option>
                  <option value="archived">Archived Node</option>
               </select>
            </div>
          </div>
          
          <div className="flex gap-6">
             <button type="submit" disabled={isSubmitting} className="flex-1 py-8 bg-amber-500 text-black rounded-[2.5rem] font-black uppercase text-sm tracking-[0.5em] shadow-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-5 italic shadow-amber-500/20">
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} strokeWidth={3} />}
                {editingId ? "Update Project Node" : "Secure New Project"}
             </button>
             <button type="button" onClick={() => setIsFormOpen(false)} className={`px-12 rounded-4xl border transition-all ${theme === 'dark' ? 'border-zinc-800 text-zinc-600 hover:text-white bg-zinc-900/40' : 'border-zinc-200 text-zinc-400 hover:text-zinc-900'}`}>
                <X size={24} />
             </button>
          </div>
        </form>
      )}

      {/* 3. PROJECT INVENTORY TABLE */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className={`text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic border-b
            ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-sm'}`}>
            <tr>
              <th className="p-10 text-left">Infrastructure Node</th>
              <th className="p-10 hidden lg:table-cell text-left">Valuation</th>
              <th className="p-10 hidden sm:table-cell text-left">Main Client</th>
              <th className="p-10 text-right">Technical Controls</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
            {filteredProjects.length > 0 ? filteredProjects.map(p => (
              <tr key={p.id} className="group hover:bg-white/2 transition-colors">
                <td className="p-10 text-left">
                  <div className="flex flex-col text-left max-w-sm">
                    <div className="flex items-center gap-4 mb-3">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-xl
                         ${p.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                         {p.status}
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
                  </div>
                </td>
                <td className="p-10 hidden lg:table-cell text-left">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest leading-none">Contract Sum</p>
                      <p className={`text-2xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-900'}`}>
                        <span className="text-xs font-bold mr-1 text-amber-500 not-italic">KES</span>
                        {p.contract_sum.toLocaleString()}
                      </p>
                   </div>
                </td>
                <td className="p-10 hidden sm:table-cell text-left">
                  <div className="flex items-center gap-4 text-[12px] font-black text-zinc-500 uppercase tracking-tighter leading-none">
                    <Briefcase size={16} className="text-zinc-800" /> 
                    {p.client_name || 'Public Work'}
                  </div>
                </td>
                <td className="p-10 text-right">
                  <div className="flex gap-4 justify-end">
                    <button onClick={() => openEditor(p)} className={`p-5 rounded-2xl transition-all shadow-xl active:scale-90 ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800 text-zinc-600 hover:text-amber-500 hover:border-amber-500' : 'bg-zinc-100 text-zinc-400 hover:text-amber-500 shadow-sm'}`}>
                      <Edit3 size={24}/>
                    </button>
                    <button onClick={() => onDeleteProject(p.id)} className="p-5 bg-zinc-900/60 border border-zinc-800 text-zinc-700 hover:text-rose-500 hover:border-rose-500 transition-all active:scale-90 shadow-xl">
                      <Trash2 size={24}/>
                    </button>
                    <button onClick={() => navigate(`/projects/${p.id}`)} className="p-5 bg-zinc-900/60 border border-zinc-800 text-zinc-500 rounded-3xl hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all active:scale-90 shadow-2xl">
                      <ChevronRight size={24} strokeWidth={3}/>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="p-40 text-center opacity-10">
                  <Briefcase size={120} className="mx-auto mb-10 text-zinc-700" />
                  <p className="font-black uppercase text-xl tracking-[0.8em] italic leading-none">Vault Ledger Empty</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`p-10 border-t flex items-center justify-between opacity-30 shadow-inner
        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
        <div className="flex items-center gap-5">
          <ShieldCheck size={24} className="text-emerald-500" />
          <p className={`text-[11px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>
            Immutable Project Archival Handshake Active
          </p>
        </div>
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">REGISTRY_v4.2 • QS_SECURE</p>
      </div>
    </div>
  );
};

export default VaultRegistry;