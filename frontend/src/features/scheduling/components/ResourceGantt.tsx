/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Trash2,
  Save,
  Layers,
  TrendingUp,
  Briefcase,
  ChevronDown,
  Target,
  RefreshCw
} from 'lucide-react';
import Button from "../../../components/ui/Button";
import {
  db,
  syncEngine,
  type MaterialLogistics,
  type TimeClock,
} from "../../../lib/database/database";

/* ======================================================
    OFFICE MODULE RESOLUTION (PRO-DEV)
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
    console.warn("Scheduling Engine: Infrastructure nodes in standby.");
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

const ResourceGantt: React.FC<ResourceGanttProps> = ({ projectId }) => {
  
  // LIVE DATA STATES
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [logistics, setLogistics] = useState<any[]>([]);
  const [projectMeta, setProjectMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // GPS STATES
  const [isOnSite, setIsOnSite] = useState<boolean | 'pending' | 'no-geo'>( 'pending');
  const [, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);

  // UI FORM STATES
  const [showStageForm, setShowStageForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  
  const [newStage, setNewStage] = useState({ title: '', start_date: '', end_date: '' });
  const [newDelivery, setNewDelivery] = useState({ item_name: '', delivery_note_ref: '' });

  /** * 1. GPS GEOFENCE ENGINE (Haversine Implementation) */
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

  /** * 2. GEOLOCATION HANDSHAKE */
  const verifyLocation = useCallback(() => {
    if (!projectMeta?.lat || !projectMeta?.lng) {
        setIsOnSite('no-geo');
        return;
    }

    setIsOnSite('pending');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });
        const near = checkProximity(latitude, longitude, projectMeta.lat, projectMeta.lng, projectMeta.geofence_radius);
        setIsOnSite(near);
      }, () => setIsOnSite('pending'));
    }
  }, [projectMeta, checkProximity]);

  /** * 3. DATA HANDSHAKE: RECOVER RECORDS */
  const syncWorkspaceData = useCallback(async () => {
    if (!db || !user) {
      setTimeout(() => setIsLoading(false), 1000);
      return;
    }

    try {
      setIsLoading(true);
      
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
      } else if (projects.length > 0) {
        setSelectedId(projects[0].id);
      }

    } catch (err) {
      console.error("Vault Handshake failed.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedId, user]);

  useEffect(() => {
    syncWorkspaceData();
  }, [syncWorkspaceData]);

  // Secondary Effect: Verify location whenever metadata changes
  useEffect(() => {
    if (projectMeta) verifyLocation();
  }, [projectMeta, verifyLocation]);

  /** * 4. PRODUCTION ACTIONS */
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
      
      // DISAPPEARING LOGIC
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
      
      // DISAPPEARING LOGIC
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
    } catch (err) { console.error("Logistics Deletion Error."); }
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
      <div className="flex flex-col items-center justify-center p-40 opacity-20">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-[var(--app-accent-strong)]" />
        <p className="font-black text-[10px] uppercase tracking-[0.4em] text-[var(--app-heading)]">Establishing Site Connection...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-left pb-24">
      
      {/* 1. RESOURCE HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-8 rounded-sm theme-card transition-all duration-500`}>
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 rounded-sm border border-blue-500 text-blue-500 bg-blue-500/10">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-black uppercase text-[var(--app-meta)] tracking-widest italic leading-none mt-2">Work Health</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--app-meta)] mb-2 leading-none text-left">Schedule Velocity</p>
          <h3 className={`text-4xl font-black italic tracking-tighter leading-none text-[var(--app-heading)] text-left`}>
            {calculateVelocity}%
          </h3>
        </div>

        <div className={`p-8 rounded-sm theme-card transition-all duration-500`}>
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 rounded-sm theme-status-online">
              <HardHat size={24} />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full theme-status-online text-[9px] font-black uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--app-success)] animate-pulse" /> GPS Secure
            </div>
        )}
      </div>

      {/* 2. OPERATIONAL STATUS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COMPLETION NODE */}
        <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500 flex justify-between items-center
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
          <div className="text-left">
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 leading-none ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-900'}`}>Project Phase</p>
            <h3 className={`text-6xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              {calculateTotalProgress}%
            </h3>
          </div>
          <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-lg">
            <TrendingUp size={28} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--app-meta)] mb-2 leading-none text-left">On-Site Workforce</p>
          <h3 className={`text-4xl font-black italic tracking-tighter leading-none text-[var(--app-heading)] text-left`}>
            {laborCount.toString().padStart(2, '0')} Nodes
          </h3>
        </div>

        <div className={`p-8 rounded-sm theme-card transition-all duration-500`}>
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 rounded-sm theme-status-warning">
              <Truck size={24} />
            </div>
            <button onClick={verifyLocation} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-600 hover:text-amber-500 active:scale-90 transition-all shadow-inner">
               <RefreshCw size={14} className={isOnSite === 'pending' ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* DELIVERY NODE */}
        <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500 flex justify-between items-center
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
          <div className="text-left">
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 leading-none ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-900'}`}>Daily Inflow</p>
            <h3 className={`text-6xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              {logistics.length.toString().padStart(2, '0')}
            </h3>
          </div>
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-lg">
            <Truck size={28} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--app-meta)] mb-2 leading-none text-left">Verified Deliveries</p>
          <h3 className={`text-4xl font-black italic tracking-tighter leading-none text-[var(--app-heading)] text-left`}>
            {logistics.length.toString().padStart(2, '0')} Items
          </h3>
        </div>
      </div>

      {/* 2. MASTER TIMELINE (GANTT) */}
      <div className={`rounded-sm theme-panel overflow-hidden transition-all duration-500`}>
        
        <div className="p-10 border-b border-[var(--app-border)] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-[var(--app-bg)]">
           <div className="text-left space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-[var(--app-heading)]">Production Timeline</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--app-meta)] italic">Updating Site Progress Stages</p>
           </div>
           <button onClick={() => setShowStageForm(!showStageForm)} className="px-10 py-6 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl italic tracking-widest shadow-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-4">
              {showStageForm ? <X size={20} /> : <Plus size={20} strokeWidth={3} />}
              {showStageForm ? 'Close Editor' : 'Register Stage'}
           </button>
        </div>

        {showStageForm && (
           <form onSubmit={handleAddStage} className="p-12 bg-zinc-950/40 border-b border-amber-500/20 animate-in slide-in-from-top-4 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 <div className="space-y-4 text-left">
                    <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Work Stage Identifier</label>
                    <input required placeholder="e.g. Ground Floor Slab Casting" value={newStage.title} onChange={e => setNewStage({...newStage, title: e.target.value})} 
                      className={`w-full h-20 px-8 rounded-3xl border font-bold text-xl outline-none transition-all shadow-inner
                        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900 focus:border-amber-500'}`} />
                 </div>
                 <div className="space-y-4 text-left">
                    <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Start Date</label>
                    <input type="date" value={newStage.start_date} onChange={e => setNewStage({...newStage, start_date: e.target.value})} 
                      className={`w-full h-20 px-8 rounded-3xl border font-bold text-sm outline-none transition-all shadow-inner
                        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900 focus:border-amber-500'}`} />
                 </div>
                 <div className="space-y-4 text-left">
                    <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Target Delivery</label>
                    <input type="date" value={newStage.end_date} onChange={e => setNewStage({...newStage, end_date: e.target.value})} 
                      className={`w-full h-20 px-8 rounded-3xl border font-bold text-sm outline-none transition-all shadow-inner
                        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900 focus:border-amber-500'}`} />
                 </div>
              </div>
              <button type="submit" className="w-full h-24 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.5em] rounded-4xl shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-6 italic active:scale-95 shadow-amber-500/20">
                 <CheckCircle2 size={32} strokeWidth={2.5} /> Secure Stage Entry
              </button>
           </form>
        )}

        <div className="p-12 space-y-20 pb-20">
           {tasks.length > 0 ? tasks.map((task) => (
             <div key={task.id} className="space-y-6 group">
                <div className="flex justify-between items-end">
                   <div className="text-left space-y-2">
                      <div className="flex items-center gap-4">
                         <span className={`text-xl font-black uppercase tracking-tight group-hover:text-[var(--app-accent-strong)] transition-colors text-[var(--app-heading)]`}>
                           {task.title}
                         </span>
                         <span className="px-2 py-0.5 rounded theme-card text-[var(--app-meta)] border border-[var(--app-border)] text-[8px] font-mono uppercase tracking-widest">
                           {task.id.slice(0, 8)}
                         </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--app-meta)] uppercase tracking-widest leading-none">
                         <div className="flex items-center gap-2"><Calendar size={12} className="text-[var(--app-icon)]"/> {task.start_date}</div>
                         <ChevronRight size={12} className="text-[var(--app-icon)]" />
                         <div className="flex items-center gap-2"><Clock size={12} className="text-[var(--app-icon)]"/> {task.end_date}</div>
                      </div>
                   </div>
                   
                   {/* Interactive Controls */}
                   <div className="flex items-center gap-6">
                      <div className="flex gap-1">
                         <button 
                            onClick={() => handleUpdateProgress(task.id, task.completion_percentage, -5)}
                            className="w-10 h-10 rounded-sm theme-card text-[var(--app-meta)] hover:text-[var(--app-heading)] transition-all active:scale-90"
                         >-</button>
                         <button 
                            onClick={() => handleUpdateProgress(task.id, task.completion_percentage, 5)}
                            className="w-10 h-10 rounded-sm theme-card text-[var(--app-meta)] hover:text-[var(--app-heading)] transition-all active:scale-90"
                         >+</button>
                      </div>
                      <span className={`text-4xl font-black italic tracking-tighter w-24 text-right ${task.completion_percentage < 30 ? 'text-[var(--app-error)]' : 'text-[var(--app-accent-strong)]'}`}>
                        {task.completion_percentage}%
                      </span>
                   </div>
                </div>

                <div className="relative h-10 theme-card rounded-md overflow-hidden shadow-inner group-hover:border-[var(--app-accent-strong)] transition-all">
                   <div 
                      className={`h-full transition-all duration-700 ease-out relative ${task.completion_percentage < 30 ? 'bg-[color-mix(in_srgb,var(--app-error)_80%,transparent)]' : 'bg-[var(--app-accent-strong)]'}`}
                      style={{ width: `${task.completion_percentage}%` }}
                   >
                      <div className="absolute inset-0 bg-white/10 animate-pulse" />
                   </div>
                   {/* Measurement Marker Node */}
                   <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3 opacity-20">
                      <ShieldCheck size={16} className="text-white" />
                      <span className="text-[10px] font-mono text-white font-bold uppercase tracking-widest">SECURE_PHASE</span>
                   </div>
                </div>
             </div>
           )) : (
             <div className="py-20 text-center opacity-40 flex flex-col items-center gap-6 text-[var(--app-heading)]">
                <Calendar size={80} />
                <p className="font-black uppercase text-sm tracking-widest italic text-[var(--app-meta)]">No Active Timeline Nodes</p>
             </div>
           )}
        </div>
      </div>

      {/* 4. MATERIAL ARRIVALS */}
      <div className={`p-12 sm:p-16 rounded-[4.5rem] border shadow-2xl transition-all duration-700
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/40'}`}>
        
        {/* MATERIAL LOGISTICS */}
        <div className={`p-10 rounded-sm theme-card shadow-xl`}>
          <div className="flex justify-between items-center mb-10">
             <div className="flex items-center gap-4">
                <Truck size={24} className="text-[var(--app-accent-strong)]" />
                <h4 className="text-xl font-black uppercase italic tracking-tighter text-[var(--app-heading)]">Site Arrivals</h4>
             </div>
             <button 
                onClick={() => setShowDeliveryForm(!showDeliveryForm)}
                className="p-3 rounded-sm theme-status-warning hover:bg-[var(--app-warning)] hover:text-white transition-all"
             >
                <Plus size={18} />
             </button>
          </div>

          {showDeliveryForm && (
            <form onSubmit={handleLogDelivery} className="mb-10 p-6 rounded-sm theme-card border border-[var(--app-accent-strong)] space-y-6 animate-in slide-in-from-top-4 duration-500">
               <div className="space-y-4">
                  <input 
                    placeholder="Item Name (e.g. 100 Bags Cement)" 
                    value={newDelivery.item_name}
                    onChange={e => setNewDelivery({...newDelivery, item_name: e.target.value})}
                    className="w-full p-5 rounded-sm theme-input outline-none focus:border-[var(--app-accent-strong)] font-bold text-sm"
                  />
                  <input 
                    placeholder="Delivery Note REF #" 
                    value={newDelivery.delivery_note_ref}
                    onChange={e => setNewDelivery({...newDelivery, delivery_note_ref: e.target.value})}
                    className="w-full p-5 rounded-sm theme-input outline-none focus:border-[var(--app-accent-strong)] font-bold text-sm"
                  />
               </div>
               <Button type="submit" variant="primary" className="w-full py-5">Record Delivery</Button>
            </form>
          )}

          <div className="space-y-4">
             {logistics.length > 0 ? logistics.map((log: MaterialLogistics) => (
               <div key={log.id} className="p-6 rounded-sm theme-panel shadow-none border border-[var(--app-border)] flex justify-between items-center group hover:border-[var(--app-accent-strong)] transition-all text-left">
                  <div>
                     <p className="text-[9px] font-black uppercase text-[var(--app-accent-strong)] mb-1 leading-none tracking-widest">Verified Material</p>
                     <h5 className="font-black uppercase text-[var(--app-heading)] tracking-tight leading-none mb-4">{log.item_name}</h5>
                     <p className="text-[8px] font-mono text-[var(--app-meta)] uppercase">D.Note: {log.delivery_note_ref || 'NO_REF'}</p>
                  </div>
                  <div className="p-3 theme-card text-[var(--app-success)] group-hover:bg-[var(--app-success)] group-hover:text-white transition-colors">
                     <CheckCircle2 size={18} />
                  </div>
               </div>
             )) : (
               <p className="text-[10px] font-black uppercase text-[var(--app-meta)] text-center py-10">No recent arrivals nodes</p>
             )}
          </div>
        </div>

        {/* GPS LABOR TRACKER */}
        <div className={`p-10 rounded-sm theme-card shadow-xl`}>
           <div className="flex items-center gap-4 mb-10 text-left">
              <Navigation size={24} className="text-blue-500" />
              <h4 className="text-xl font-black uppercase italic tracking-tighter text-[var(--app-heading)]">GPS Geofence Node</h4>
           </div>

           <div className={`p-10 rounded-sm theme-panel shadow-inner text-center space-y-8`}>
              <div className="relative w-32 h-32 mx-auto">
                 <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
                 <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-[ping_2s_linear_infinite]" />
                 <div className="absolute inset-4 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                    <HardHat size={32} className="text-blue-500" />
                 </div>
              </div>

              <div className="space-y-2">
                 <h5 className="text-4xl font-black italic tracking-tighter text-[var(--app-heading)] leading-none">
                   {laborCount.toString().padStart(2, '0')} Active
                 </h5>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--app-meta)]">Verified Personnel on Site</p>
              </div>

              <div className="pt-8 border-t border-[var(--app-border)] flex justify-between items-center opacity-40">
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-[var(--app-success)]" />
                    <span className="text-[9px] font-black uppercase text-[var(--app-meta)]">Payroll Link Active</span>
                 </div>
                 <span className="text-[9px] font-mono text-[var(--app-meta)]">ID: SITE-B-ALPHA</span>
              </div>
           </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className={`p-8 border-t border-[var(--app-border)] flex items-center justify-between opacity-30`}>
         <div className="flex items-center gap-3">
            <AlertCircle size={14} className="text-[var(--app-accent-strong)]" />
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--app-meta)]">Resource Monitoring Active</p>
         </div>
         <p className="text-[9px] font-mono text-[var(--app-meta)] uppercase tracking-tighter">SCHEDULE_ENGINE_V4.0 • GPS_GEOFENCE: ARMED</p>
      </div>
    </div>
  );
};

export default ResourceGantt;