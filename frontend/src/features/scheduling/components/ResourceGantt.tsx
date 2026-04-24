/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Loader2,
  Truck,
  Navigation,
  ShieldCheck,
  X,
  TrendingUp,
  HardHat,
  ChevronRight,
  AlertCircle,
  Briefcase,
  ChevronDown,
  RefreshCw,
  Target,
  Trash2,
  Save,
  Eye,
  Layout
} from "lucide-react";
import Button from "../../../components/ui/Button";

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ theme: "light", user: null });
let db: any = null;
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {
    console.warn("Scheduling Engine: Waiting for database connection...");
  }
};

resolveModules();

/** --- TYPES --- **/
interface GanttTask {
  id: string;
  project_id: string;
  title: string;
  start_date: string;
  end_date: string;
  completion_percentage: number;
}

interface ResourceGanttProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: WORK PROGRESS & ARRIVALS --- **/

const ResourceGantt: React.FC<ResourceGanttProps> = ({ projectId: initialId }) => {
  const { theme, user } = useAuth();

  // WORKSPACE CONTEXT
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  
  // LIVE DATA STATES
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [logistics, setLogistics] = useState<any[]>([]);
  const [projectMeta, setProjectMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [laborCount, setLaborCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // GPS STATES
  const [isOnSite, setIsOnSite] = useState<boolean | "pending" | "no-geo">("pending");

  // UI FORM STATES
  const [showStageForm, setShowStageForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  
  const [newStage, setNewStage] = useState({
    title: "",
    start_date: "",
    end_date: "",
  });
  
  const [newDelivery, setNewDelivery] = useState({
    item_name: "",
    delivery_note_ref: "",
  });

  /** * 1. GPS LOGIC: DISTANCE CHECK */
  const checkProximity = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number, radius: number) => {
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c <= (radius || 100);
    },
    [],
  );

  const verifyLocation = useCallback(() => {
    if (!projectMeta?.lat || !projectMeta?.lng) {
      setIsOnSite("no-geo");
      return;
    }
    setIsOnSite("pending");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const near = checkProximity(
            pos.coords.latitude,
            pos.coords.longitude,
            projectMeta.lat,
            projectMeta.lng,
            projectMeta.geofence_radius,
          );
          setIsOnSite(near);
        },
        () => setIsOnSite("no-geo"),
      );
    }
  }, [projectMeta, checkProximity]);

  /** * 2. DATA RECOVERY: SYNC WITH LOCAL VAULT */
  const syncWorkspaceData = useCallback(async () => {
    if (!db || !user) {
      setTimeout(() => setIsLoading(false), 800);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load all available projects for the dropdown
      const projects = await db.projects.where('user_id').equals(user.id).toArray();
      setAvailableProjects(projects);

      if (selectedId) {
        const [storedTasks, recentDeliveries, project, labor] = await Promise.all([
          db.gantt_tasks.where("project_id").equals(selectedId).toArray(),
          db.material_logistics.where("project_id").equals(selectedId).reverse().toArray(),
          db.projects.get(selectedId),
          db.time_clocks ? db.time_clocks.where("project_id").equals(selectedId).and((x: any) => !x.out_time).count() : 0,
        ]);

        setTasks(storedTasks);
        setLogistics(recentDeliveries);
        setProjectMeta(project);
        setLaborCount(labor || 0);
      } else if (projects.length > 0) {
        setSelectedId(projects[0].id);
      }
    } catch (err) {
      console.error("Vault access failed.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedId, user]);

  useEffect(() => {
    syncWorkspaceData();
  }, [syncWorkspaceData]);

  useEffect(() => {
    if (projectMeta) verifyLocation();
  }, [projectMeta, verifyLocation]);

  /** * 3. SAVE LOGIC: MILESTONES & DELIVERIES */
  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedId || !newStage.title) return;
    
    setIsSaving(true);
    const stageId = crypto.randomUUID();
    const stageData: GanttTask = {
      id: stageId,
      project_id: selectedId,
      title: newStage.title,
      start_date: newStage.start_date || new Date().toISOString().split("T")[0],
      end_date: newStage.end_date || new Date().toISOString().split("T")[0],
      completion_percentage: 0,
    };

    try {
      await db.gantt_tasks.add(stageData);
      if (syncEngine) await syncEngine.queueChange("gantt_tasks", stageId, "INSERT", stageData);
      setNewStage({ title: "", start_date: "", end_date: "" });
      setShowStageForm(false);
      syncWorkspaceData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProgress = async (taskId: string, current: number, delta: number) => {
    if (!db) return;
    const nextValue = Math.min(100, Math.max(0, current + delta));
    try {
      await db.gantt_tasks.update(taskId, { completion_percentage: nextValue });
      if (syncEngine) await syncEngine.queueChange("gantt_tasks", taskId, "UPDATE", { completion_percentage: nextValue });
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completion_percentage: nextValue } : t));
    } catch (e) {
      console.error("Progress update failed.");
    }
  };

  const handleLogDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedId || !newDelivery.item_name) return;

    setIsSaving(true);
    const deliveryId = crypto.randomUUID();
    const deliveryData = {
      id: deliveryId,
      project_id: selectedId,
      item_name: newDelivery.item_name,
      delivery_note_ref: newDelivery.delivery_note_ref,
      timestamp: new Date().toISOString(),
    };

    try {
      await db.material_logistics.add(deliveryData);
      if (syncEngine) await syncEngine.queueChange("material_logistics", deliveryId, "INSERT", deliveryData);
      setNewDelivery({ item_name: "", delivery_note_ref: "" });
      setShowDeliveryForm(false);
      syncWorkspaceData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm("Permanently delete this work stage?")) return;
    await db.gantt_tasks.delete(id);
    if (syncEngine) await syncEngine.queueChange("gantt_tasks", id, "DELETE", null);
    syncWorkspaceData();
  };

  const calculateTotalProgress = useMemo(() => {
    if (tasks.length === 0) return "0";
    const sum = tasks.reduce((acc, curr) => acc + curr.completion_percentage, 0);
    return (sum / tasks.length).toFixed(0);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-30">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Synchronizing Schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left pb-24">
      
      {/* 1. PROJECT SELECTION DROPDOWN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-4">
        <div className="space-y-3 text-left">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Work Schedule</h3>
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                <select 
                  value={selectedId || ''} 
                  onChange={(e) => setSelectedId(e.target.value)}
                  className={`pl-12 pr-10 py-3 rounded-xl border appearance-none font-black uppercase text-[10px] tracking-widest cursor-pointer outline-none transition-all
                    ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white hover:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900 hover:border-amber-500 shadow-sm'}`}
                >
                  {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Project Active</p>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500 flex justify-between items-center
          ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800 shadow-black" : "bg-white border-zinc-200 shadow-zinc-200/50"}`}>
          <div className="text-left">
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>Work Completion</p>
            <h3 className={`text-6xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>{calculateTotalProgress}%</h3>
          </div>
          <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-lg"><TrendingUp size={28} /></div>
        </div>

        <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500 flex justify-between items-center
          ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800 shadow-black" : "bg-white border-zinc-200 shadow-zinc-200/50"}`}>
          <div className="text-left space-y-2">
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>Personnel on Site</p>
            <h3 className={`text-6xl font-black italic tracking-tighter ${isOnSite === true ? 'text-emerald-500' : 'text-zinc-500'}`}>{laborCount.toString().padStart(2, "0")}</h3>
            <div className="flex items-center gap-2">
              <Navigation size={12} className={isOnSite === 'pending' ? 'animate-spin' : ''} />
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                {isOnSite === true ? 'Geofence Verified' : isOnSite === false ? 'Off-Site Node' : 'Locating...'}
              </p>
            </div>
          </div>
          <div className={`p-5 rounded-3xl border transition-all ${isOnSite === true ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}><HardHat size={28} /></div>
        </div>

        <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500 flex justify-between items-center
          ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800 shadow-black" : "bg-white border-zinc-200 shadow-zinc-200/50"}`}>
          <div className="text-left">
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>Arrivals Today</p>
            <h3 className={`text-6xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>{logistics.length.toString().padStart(2, "0")}</h3>
          </div>
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-lg"><Truck size={28} /></div>
        </div>
      </div>

      {/* 3. WORK TIMELINE WORKSPACE */}
      <div className={`rounded-[4rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500 shadow-2xl
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        
        <div className="p-12 border-b border-zinc-800/40 flex flex-col md:flex-row justify-between items-center gap-8 bg-white/[0.01]">
           <div className="text-left space-y-2">
              <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Milestone Tracker</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500">Updating Stage Completion Nodes</p>
           </div>
           <button onClick={() => setShowStageForm(!showStageForm)} className="px-10 py-6 bg-amber-500 text-black font-black uppercase text-[10px] rounded-2xl italic tracking-widest shadow-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-4">
              {showStageForm ? <X size={20} /> : <Plus size={20} strokeWidth={3} />}
              {showStageForm ? 'Cancel' : 'Add Milestone'}
           </button>
        </div>

        {showStageForm && (
           <form onSubmit={handleAddStage} className="p-12 bg-zinc-950/40 border-b border-amber-500/20 animate-in slide-in-from-top-4 duration-500 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 <div className="space-y-4 text-left">
                    <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic text-left">Stage Description</label>
                    <input required placeholder="e.g. Roof Trusses Installation" value={newStage.title} onChange={e => setNewStage({...newStage, title: e.target.value})} 
                      className={`w-full h-20 px-8 rounded-3xl border font-bold text-xl outline-none transition-all shadow-inner
                        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200'}`} />
                 </div>
                 <div className="space-y-4 text-left">
                    <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Target Start</label>
                    <input type="date" value={newStage.start_date} onChange={e => setNewStage({...newStage, start_date: e.target.value})} 
                      className={`w-full h-20 px-8 rounded-3xl border font-bold text-sm outline-none transition-all shadow-inner
                        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200'}`} />
                 </div>
                 <div className="space-y-4 text-left">
                    <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Target Finish</label>
                    <input type="date" value={newStage.end_date} onChange={e => setNewStage({...newStage, end_date: e.target.value})} 
                      className={`w-full h-20 px-8 rounded-3xl border font-bold text-sm outline-none transition-all shadow-inner
                        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200'}`} />
                 </div>
              </div>
              <button type="submit" className="w-full h-24 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.5em] rounded-4xl shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-6 italic active:scale-95 shadow-amber-500/20">
                 <Save size={24} strokeWidth={3} /> Secure Stage Entry
              </button>
           </form>
        )}

        <div className="p-12 space-y-16">
           {tasks.length > 0 ? tasks.map((task) => {
             const isExpanded = expandedId === task.id;
             return (
               <div key={task.id} className="space-y-8 group border-b border-zinc-800/40 pb-12 last:border-0">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                     <div className="text-left space-y-4 flex-1">
                        <div className="flex items-center gap-6">
                           <h4 className={`text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none transition-colors ${theme === 'dark' ? 'text-zinc-100 group-hover:text-amber-500' : 'text-zinc-950'}`}>
                             {task.title}
                           </h4>
                           <div className="flex gap-2">
                              <button onClick={() => setExpandedId(isExpanded ? null : task.id)} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all"><Eye size={18}/></button>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-3 rounded-xl bg-rose-500/5 text-rose-500 opacity-0 group-hover:opacity-100 transition-all active:scale-90"><Trash2 size={18}/></button>
                           </div>
                        </div>
                        <div className="flex items-center gap-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] italic leading-none">
                           <div className="flex items-center gap-3"><Calendar size={14} className="text-zinc-700"/> {task.start_date}</div>
                           <ChevronRight size={12} className="text-zinc-800" />
                           <div className="flex items-center gap-3"><Clock size={14} className="text-zinc-700"/> {task.end_date}</div>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-10 w-full md:w-auto">
                        <div className={`flex gap-2 p-2 rounded-2xl ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800 shadow-inner' : 'bg-zinc-100'}`}>
                           <button onClick={() => handleUpdateProgress(task.id, task.completion_percentage, -5)} className="w-12 h-12 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white transition-all active:scale-90 font-black">-</button>
                           <button onClick={() => handleUpdateProgress(task.id, task.completion_percentage, 5)} className="w-12 h-12 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white transition-all active:scale-90 font-black">+</button>
                        </div>
                        <span className={`text-6xl font-black italic tracking-tighter w-36 text-right ${task.completion_percentage < 30 ? 'text-rose-500' : 'text-amber-500'} drop-shadow-2xl`}>
                          {task.completion_percentage}%
                        </span>
                     </div>
                  </div>

                  <div className={`relative h-16 rounded-[2.5rem] overflow-hidden shadow-inner p-2 flex items-center border transition-all duration-500
                     ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 group-hover:border-zinc-700' : 'bg-zinc-100 border-zinc-200'}`}>
                     <div 
                        className={`h-full rounded-[2rem] transition-all duration-1000 ease-out relative shadow-2xl ${task.completion_percentage < 30 ? 'bg-rose-500/60' : 'bg-amber-500'}`}
                        style={{ width: `${task.completion_percentage}%` }}
                     >
                        <div className="absolute inset-0 bg-white/10 animate-pulse" />
                     </div>
                  </div>

                    {isExpanded && (
                      <div className="p-8 rounded-[2.5rem] bg-zinc-950/20 border border-zinc-800/40 animate-in slide-in-from-top-4 duration-500 grid md:grid-cols-2 gap-8 text-left">
                         <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Stage Identity</p>
                            <p className="text-sm font-medium text-zinc-400 italic">This milestone tracks the quantitative progress for {task.title}. Data is archived in the secure project vault.</p>
                         </div>
                         <div className="flex justify-end items-center gap-6 opacity-40 italic">
                            <p className="text-[9px] font-black uppercase tracking-widest">Vault ID: {task.id}</p>
                            <ShieldCheck size={16} className="text-emerald-500" />
                         </div>
                      </div>
                    )}
                 </div>
              );
            }) : (
               <div className="py-40 text-center opacity-10 flex flex-col items-center gap-12">
                  <RefreshCw size={100} strokeWidth={1} className="animate-spin-slow" />
                  <p className="font-black uppercase text-xl tracking-[1em] italic leading-none">Schedule Record Empty</p>
               </div>
             )}
        </div>
      </div>

      {/* 4. ARRIVALS LEDGER */}
      <div className={`p-12 sm:p-16 rounded-[4.5rem] border shadow-2xl transition-all duration-700 overflow-hidden
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/40'}`}>
        
        <header className="flex justify-between items-center mb-16 text-left">
            <div className="flex items-center gap-8">
               <div className="p-6 rounded-4xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xl">
                  <Truck size={40} strokeWidth={2.5} />
               </div>
               <div className="text-left space-y-2">
                  <h4 className={`text-5xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Arrivals Ledger</h4>
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">Logging Site Material Handshakes</p>
               </div>
            </div>
            <button onClick={() => setShowDeliveryForm(!showDeliveryForm)} className="p-8 rounded-3xl bg-amber-500 text-black shadow-2xl hover:bg-amber-400 active:scale-90 transition-all border-4 border-black/5">
              {showDeliveryForm ? <X size={32} strokeWidth={3} /> : <Plus size={32} strokeWidth={3} />}
            </button>
        </header>

        {showDeliveryForm && (
          <form onSubmit={handleLogDelivery} className="mb-16 p-12 rounded-[4rem] bg-zinc-950/60 border border-amber-500/20 space-y-12 animate-in slide-in-from-top-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4 text-left">
                  <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Item Received</label>
                  <input required placeholder="e.g. 100 Bags Portland Cement" value={newDelivery.item_name} onChange={e => setNewDelivery({...newDelivery, item_name: e.target.value})} 
                    className={`w-full h-24 px-10 rounded-4xl border font-black text-2xl italic tracking-tighter outline-none transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200'}`} />
                </div>
                <div className="space-y-4 text-left">
                  <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Delivery Note REF</label>
                  <input placeholder="D-NOTE #..." value={newDelivery.delivery_note_ref} onChange={e => setNewDelivery({...newDelivery, delivery_note_ref: e.target.value})} 
                    className={`w-full h-24 px-10 rounded-4xl border font-black text-2xl italic tracking-tighter outline-none transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200'}`} />
                </div>
             </div>
             <button type="submit" disabled={isSaving} className="w-full h-28 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.8em] rounded-[3rem] shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-8 italic active:scale-95 shadow-amber-500/20">
                {isSaving ? <Loader2 size={36} className="animate-spin" /> : <Save size={36} strokeWidth={3} />}
                Secure Delivery Node
             </button>
          </form>
        )}

        <div className="space-y-6">
           {logistics.length > 0 ? logistics.map((log: any) => (
             <div key={log.id} className={`p-10 rounded-[3.5rem] border flex flex-col md:flex-row justify-between items-center group transition-all text-left gap-10 shadow-xl
                ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 hover:border-amber-500/20' : 'bg-zinc-50 border-zinc-100 hover:border-amber-500'}`}>
                <div className="flex items-center gap-12 text-left flex-1">
                   <div className="p-8 rounded-4xl bg-zinc-900 border border-zinc-800 text-emerald-500 shadow-2xl transition-transform group-hover:scale-105 group-hover:rotate-3 shadow-emerald-500/5">
                      <CheckCircle2 size={36} strokeWidth={3} />
                   </div>
                   <div className="text-left space-y-4">
                      <div className="flex items-center gap-4">
                         <span className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-black text-amber-500 uppercase tracking-widest italic leading-none">RECEIVED_ITEM</span>
                         <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <h5 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-950'}`}>{log.item_name}</h5>
                      <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-[0.4em] font-black leading-none italic">Note: {log.delivery_note_ref || 'NO_REF'}</p>
                   </div>
                </div>
             </div>
           )) : (
             <div className="py-40 text-center opacity-10 flex flex-col items-center gap-10 border-2 border-dashed border-zinc-800 rounded-[4rem]">
                <Layout size={100} strokeWidth={1} />
                <p className="font-black uppercase text-xl tracking-[1em] italic leading-none">Arrivals Record Empty</p>
             </div>
           )}
        </div>
      </div>

      <footer className="pt-32 pb-12 text-center opacity-20 select-none flex flex-col items-center gap-10">
         <p className="text-[9px] font-black uppercase tracking-[2.5em] text-zinc-600 italic leading-none text-center">
           RESOURCE SCHEDULING ENGINE • QS VAULT
         </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </div>
  );
};

export default ResourceGantt;