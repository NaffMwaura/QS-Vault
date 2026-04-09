/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2,
  Plus, 
  ChevronRight,
  Loader2,
  Truck,
  Navigation,
  ShieldCheck,
  X,
  Trash2,
  Save,
  Layers,
  TrendingUp,
  Briefcase,
  ChevronDown
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION
   ====================================================== */

let useAuth: any = () => ({ theme: 'light', user: null });
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
    console.warn("Scheduling Engine: Vault connection deferred.");
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

/** --- MAIN COMPONENT: SITE COMMAND & SCHEDULING --- **/

const ResourceGantt: React.FC<ResourceGanttProps> = ({ projectId: initialId }) => {
  const { theme, user } = useAuth();
  
  // WORKSPACE CONTEXT
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  
  // LIVE DATA STATES
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [logistics, setLogistics] = useState<any[]>([]);
  const [, setProjectMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // GPS STATES
  const [isOnSite, setIsOnSite] = useState<boolean | 'pending'>( 'pending');

  // UI FORM STATES
  const [showStageForm, setShowStageForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  
  const [newStage, setNewStage] = useState({ title: '', start_date: '', end_date: '' });
  const [newDelivery, setNewDelivery] = useState({ item_name: '', delivery_note_ref: '' });

  /** * 1. GPS GEOFENCE ENGINE */
  const checkProximity = useCallback((lat1: number, lon1: number, lat2: number, lon2: number, radius: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c) <= (radius || 100);
  }, []);

  /** * 2. DATA HANDSHAKE: RECOVER WORKSPACE RECORDS */
  const syncWorkspaceData = useCallback(async () => {
    if (!db || !user) {
      setTimeout(() => setIsLoading(false), 1000);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch user's available project nodes for the dropdown
      const projects = await db.projects.where('user_id').equals(user.id).toArray();
      setAvailableProjects(projects);

      if (selectedId) {
        const [storedTasks, recentDeliveries, project] = await Promise.all([
          db.gantt_tasks.where('project_id').equals(selectedId).toArray(),
          db.material_logistics.where('project_id').equals(selectedId).reverse().toArray(),
          db.projects.get(selectedId)
        ]);

        setTasks(storedTasks);
        setLogistics(recentDeliveries);
        setProjectMeta(project);

        // Project-Specific GPS Verification
        if (navigator.geolocation && project?.lat && project?.lng) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const near = checkProximity(pos.coords.latitude, pos.coords.longitude, project.lat, project.lng, project.geofence_radius);
            setIsOnSite(near);
          }, () => setIsOnSite('pending'));
        } else {
          setIsOnSite('pending');
        }
      } else if (projects.length > 0) {
        // Auto-select first project if none provided
        setSelectedId(projects[0].id);
      }

    } catch (err) {
      console.error("Vault Handshake failed.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedId, user, checkProximity]);

  useEffect(() => {
    syncWorkspaceData();
  }, [syncWorkspaceData]);

  /** * 3. RECORD PRODUCTION NODES */
  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedId || !newStage.title) return;

    const stageId = crypto.randomUUID();
    const stageData: GanttTask = {
      id: stageId,
      project_id: selectedId,
      title: newStage.title,
      start_date: newStage.start_date || new Date().toISOString().split('T')[0],
      end_date: newStage.end_date || new Date().toISOString().split('T')[0],
      completion_percentage: 0
    };

    try {
      setIsSaving(true);
      await db.gantt_tasks.add(stageData);
      if (syncEngine) await syncEngine.queueChange('gantt_tasks', stageId, 'INSERT', stageData);
      
      setNewStage({ title: '', start_date: '', end_date: '' });
      setShowStageForm(false);
      setShowSavedToast(true);
      syncWorkspaceData();
      setTimeout(() => {
        setIsSaving(false);
        setTimeout(() => setShowSavedToast(false), 3000);
      }, 500);
    } catch (e) { setIsSaving(false); }
  };

  const handleUpdateProgress = async (taskId: string, current: number, delta: number) => {
    if (!db) return;
    const nextValue = Math.min(100, Math.max(0, current + delta));
    try {
      await db.gantt_tasks.update(taskId, { completion_percentage: nextValue });
      if (syncEngine) await syncEngine.queueChange('gantt_tasks', taskId, 'UPDATE', { completion_percentage: nextValue });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completion_percentage: nextValue } : t));
    } catch (e) { console.error("Update failed."); }
  };

  /** * 4. LOGISTICS: RECORD & DELETE ARRIVALS */
  const handleLogDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedId || !newDelivery.item_name) return;

    const deliveryId = crypto.randomUUID();
    const deliveryData = {
      id: deliveryId,
      project_id: selectedId,
      item_name: newDelivery.item_name,
      delivery_note_ref: newDelivery.delivery_note_ref,
      timestamp: new Date().toISOString()
    };

    try {
      setIsSaving(true);
      await db.material_logistics.add(deliveryData);
      if (syncEngine) await syncEngine.queueChange('material_logistics', deliveryId, 'INSERT', deliveryData);
      setNewDelivery({ item_name: '', delivery_note_ref: '' });
      setShowDeliveryForm(false);
      syncWorkspaceData();
      setTimeout(() => setIsSaving(false), 500);
    } catch (e) { setIsSaving(false); }
  };

  const handleDeleteDelivery = async (id: string) => {
    if (!db || !window.confirm("Permanently erase this material arrival node?")) return;
    try {
      await db.material_logistics.delete(id);
      if (syncEngine) await syncEngine.queueChange('material_logistics', id, 'DELETE', null);
      setLogistics(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error("Logistics Deletion Error.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm("Remove this stage from timeline?")) return;
    await db.gantt_tasks.delete(id);
    if (syncEngine) await syncEngine.queueChange('gantt_tasks', id, 'DELETE', null);
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
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Synchronizing Schedule Node...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left pb-20">
      
      {/* 1. MASTER WORKSPACE CONTROL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-4">
        <div className="space-y-3">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Production Hub</h3>
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                <select 
                  value={selectedId || ''} 
                  onChange={(e) => setSelectedId(e.target.value)}
                  className={`pl-12 pr-10 py-3 rounded-xl border appearance-none font-black uppercase text-[10px] tracking-widest cursor-pointer outline-none transition-all
                    ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white hover:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900 hover:border-amber-500'}`}
                >
                  {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  {availableProjects.length === 0 && <option>No Projects Found</option>}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic leading-none mt-1">Project Site Active</p>
          </div>
        </div>

        {showSavedToast && (
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-in zoom-in duration-300">
                <CheckCircle2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Vault Synced</span>
            </div>
        )}
      </div>

      {/* 2. SITE STATUS INDICATORS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
          <div className="flex justify-between items-start mb-8">
            <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-lg">
              <TrendingUp size={28} />
            </div>
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic mt-2">Work Status</span>
          </div>
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-3 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-900'}`}>Project Completion</p>
          <h3 className={`text-6xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            {calculateTotalProgress}%
          </h3>
        </div>

        <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
          <div className="flex justify-between items-start mb-8 text-left">
            <div className={`p-5 rounded-3xl shadow-lg border transition-colors
                ${isOnSite === true ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : isOnSite === false ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
              <Navigation size={28} className={isOnSite === true ? 'animate-bounce' : ''} />
            </div>
            <div className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-3
                ${isOnSite === true ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : isOnSite === false ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-zinc-800 text-zinc-500'}`}>
                <div className={`w-2 h-2 rounded-full ${isOnSite === true ? 'bg-emerald-500' : isOnSite === false ? 'bg-rose-500 animate-ping' : 'bg-zinc-700'}`} /> 
                {isOnSite === true ? 'Verified On-Site' : isOnSite === false ? 'Off-Site Detection' : 'Location Pending'}
            </div>
          </div>
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-3 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-900'}`}>GPS Location Status</p>
          <h3 className={`text-2xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'} uppercase`}>
            {isOnSite === true ? 'Location Verified' : isOnSite === false ? 'Remote Node Access' : 'Verifying Geofence...'}
          </h3>
        </div>

        <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
          <div className="flex justify-between items-start mb-8">
            <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-lg">
              <Truck size={28} />
            </div>
          </div>
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-3 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-900'}`}>Deliveries Today</p>
          <h3 className={`text-6xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            {logistics.length.toString().padStart(2, '0')}
          </h3>
        </div>
      </div>

      {/* 3. PRODUCTION TIMELINE */}
      <div className={`rounded-[4rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500 shadow-2xl
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        
        <div className="p-12 border-b border-zinc-800/40 flex flex-col md:flex-row justify-between items-center gap-8 bg-white/1">
           <div className="text-left space-y-2">
              <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Project Schedule</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500">Live Stage Monitoring</p>
           </div>
           <button 
            onClick={() => setShowStageForm(!showStageForm)}
            className="px-10 py-6 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl italic tracking-[0.2em] shadow-2xl hover:bg-amber-400 transition-all flex items-center gap-4 active:scale-95"
           >
              {showStageForm ? <X size={20} /> : <Plus size={20} strokeWidth={3} />}
              {showStageForm ? 'Close Editor' : 'New Stage'}
           </button>
        </div>

        {showStageForm && (
           <form onSubmit={handleAddStage} className="p-12 bg-zinc-950/40 border-b border-amber-500/20 animate-in slide-in-from-top-4 duration-500 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-4 text-left">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest italic">Stage Description</label>
                    <input required placeholder="e.g. Roof Structure Framing" value={newStage.title} onChange={e => setNewStage({...newStage, title: e.target.value})} className="w-full h-18 px-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-amber-500 font-bold text-lg shadow-inner" />
                 </div>
                 <div className="space-y-4 text-left">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest italic">Start Date</label>
                    <input type="date" value={newStage.start_date} onChange={e => setNewStage({...newStage, start_date: e.target.value})} className="w-full h-18 px-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-amber-500 font-bold text-sm shadow-inner" />
                 </div>
                 <div className="space-y-4 text-left">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest italic">Target Completion</label>
                    <input type="date" value={newStage.end_date} onChange={e => setNewStage({...newStage, end_date: e.target.value})} className="w-full h-18 px-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-amber-500 font-bold text-sm shadow-inner" />
                 </div>
              </div>
              <button type="submit" className="w-full h-20 bg-amber-500 text-black font-black uppercase text-xs tracking-[0.5em] rounded-2xl shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-5 italic active:scale-[0.98]">
                 <CheckCircle2 size={24} /> Commit Stage to Schedule
              </button>
           </form>
        )}

        <div className="p-12 space-y-16">
           {tasks.length > 0 ? tasks.map((task) => (
             <div key={task.id} className="space-y-8 group">
                <div className="flex justify-between items-end gap-10">
                   <div className="text-left space-y-3 flex-1">
                      <div className="flex items-center gap-5 text-left">
                         <h4 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight transition-colors ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-950'} group-hover:text-amber-500`}>
                           {task.title}
                         </h4>
                         <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-700 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                      </div>
                      <div className="flex items-center gap-6 text-[11px] font-bold text-zinc-500 uppercase tracking-widest italic leading-none">
                         <div className="flex items-center gap-2"><Calendar size={14} className="text-zinc-700"/> {task.start_date}</div>
                         <ChevronRight size={16} className="text-zinc-800" />
                         <div className="flex items-center gap-2"><Clock size={14} className="text-zinc-700"/> {task.end_date}</div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-10 shrink-0">
                      <div className="flex gap-2">
                         <button onClick={() => handleUpdateProgress(task.id, task.completion_percentage, -5)} className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-white transition-all active:scale-90 font-black text-xl shadow-lg">-</button>
                         <button onClick={() => handleUpdateProgress(task.id, task.completion_percentage, 5)} className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-white transition-all active:scale-90 font-black text-xl shadow-lg">+</button>
                      </div>
                      <span className={`text-5xl font-black italic tracking-tighter w-40 text-right ${task.completion_percentage < 30 ? 'text-rose-500' : 'text-amber-500'}`}>
                        {task.completion_percentage}%
                      </span>
                   </div>
                </div>

                <div className="relative h-16 bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-inner group-hover:border-zinc-700 transition-all p-2 flex items-center">
                   <div 
                      className={`h-full rounded-3xl transition-all duration-1000 ease-out relative shadow-2xl ${task.completion_percentage < 30 ? 'bg-rose-500/60' : 'bg-amber-500 shadow-amber-500/20'}`}
                      style={{ width: `${task.completion_percentage}%` }}
                   >
                      <div className="absolute inset-0 bg-white/10 animate-pulse" />
                   </div>
                </div>
             </div>
           )) : (
             <div className="py-24 text-center opacity-10 flex flex-col items-center gap-10">
                <Layers size={100} />
                <p className="font-black uppercase text-lg tracking-[0.5em] italic">No active production stages detected</p>
             </div>
           )}
        </div>
      </div>

      {/* 4. ARRIVAL REGISTRY */}
      <div className={`p-12 rounded-[4.5rem] border shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/40'}`}>
        
        <header className="flex justify-between items-center mb-14 text-left">
            <div className="flex items-center gap-6">
               <div className="p-5 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xl">
                  <ShieldCheck size={32} />
               </div>
               <div>
                  <h4 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Arrivals</h4>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-2 text-left">Verified Site Material Logs</p>
               </div>
            </div>
            <button 
              onClick={() => setShowDeliveryForm(!showDeliveryForm)}
              className="p-6 rounded-2xl bg-amber-500 text-black shadow-2xl hover:bg-amber-400 transition-all active:scale-90"
            >
              {showDeliveryForm ? <X size={28} /> : <Plus size={28} strokeWidth={3} />}
            </button>
        </header>

        {showDeliveryForm && (
          <form onSubmit={handleLogDelivery} className="mb-14 p-12 rounded-[3.5rem] bg-zinc-950/60 border border-amber-500/20 space-y-10 animate-in slide-in-from-top-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4 text-left">
                  <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Item Node</label>
                  <input required placeholder="e.g. 100 Structural Hollow Sections" value={newDelivery.item_name} onChange={e => setNewDelivery({...newDelivery, item_name: e.target.value})} className="w-full h-20 px-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-amber-500 font-bold text-xl shadow-inner" />
                </div>
                <div className="space-y-4 text-left">
                  <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Delivery REF</label>
                  <input placeholder="D-NOTE #99001" value={newDelivery.delivery_note_ref} onChange={e => setNewDelivery({...newDelivery, delivery_note_ref: e.target.value})} className="w-full h-20 px-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-amber-500 font-bold text-xl shadow-inner" />
                </div>
             </div>
             <button type="submit" disabled={isSaving} className="w-full h-24 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.6em] rounded-3xl shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-6 italic active:scale-95">
                {isSaving ? <Loader2 size={28} className="animate-spin" /> : <Save size={28} strokeWidth={3} />}
                Commit Log to Vault
             </button>
          </form>
        )}

        <div className="space-y-6">
           {logistics.length > 0 ? logistics.map((log: any) => (
             <div key={log.id} className={`p-10 rounded-[3rem] border flex justify-between items-center group transition-all text-left
                ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 hover:border-amber-500/20' : 'bg-zinc-50 border-zinc-100 hover:bg-zinc-100 shadow-sm'}`}>
                <div className="flex items-center gap-10">
                   <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 text-emerald-500 shadow-xl group-hover:scale-105 transition-transform">
                      <CheckCircle2 size={32} />
                   </div>
                   <div className="text-left ">
                      <p className="text-[11px] font-black uppercase text-amber-500 mb-2 leading-none tracking-[0.3em] italic">Verified Site Entry</p>
                      <h5 className={`text-3xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-950'}`}>{log.item_name}</h5>
                      <p className="text-[10px] font-mono text-zinc-600 uppercase mt-4 tracking-widest font-black leading-none">LOG_REF: {log.delivery_note_ref || 'NO_REF'}</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleDeleteDelivery(log.id)}
                  className="p-6 text-zinc-800 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                  title="Remove Log"
                >
                  <Trash2 size={24} />
                </button>
             </div>
           )) : (
             <div className="py-24 text-center opacity-20 flex flex-col items-center gap-8">
                <Truck size={80} />
                <p className="font-black uppercase text-sm tracking-[0.5em] italic">No Material Records Handshaked</p>
             </div>
           )}
        </div>
      </div>

      <footer className="pt-24 pb-12 text-center opacity-20 select-none flex flex-col items-center gap-8">
         <div className="h-px w-80 bg-zinc-800" />
         <p className="text-[11px] font-black uppercase tracking-[2em] text-zinc-600 italic leading-none text-center ">
           PRODUCTION ENGINE • QS VAULT
         </p>
      </footer>
    </div>
  );
};

export default ResourceGantt;