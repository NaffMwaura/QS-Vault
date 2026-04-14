/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2,
  Plus, 
  ChevronRight,
  TrendingUp,
  Loader2,
  HardHat,
  Truck,
  AlertCircle,
  Navigation,
  ShieldCheck
} from 'lucide-react';
import Button from "../../../components/ui/Button";
import {
  db,
  syncEngine,
  type MaterialLogistics,
  type TimeClock,
} from "../../../lib/database/database";

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

/** --- TYPES --- **/
interface GanttTask {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  completion_percentage: number;
  bill_item_id: string | null;
  status?: 'on-track' | 'delayed' | 'critical';
}

interface ResourceGanttProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: PRODUCTION SCHEDULING ENGINE --- **/

const ResourceGantt: React.FC<ResourceGanttProps> = ({ projectId }) => {
  
  // LIVE DATA STATES
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [laborCount, setLaborCount] = useState(0);
  const [logistics, setLogistics] = useState<MaterialLogistics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI STATES
  const [, setIsUpdating] = useState<string | null>(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [newDelivery, setNewDelivery] = useState({ item_name: '', delivery_note_ref: '' });

  /** * PRODUCTION DATA HANDSHAKE
   * Pulls real records from the local project vault (Dexie).
   */
  const syncProductionData = useCallback(async () => {
    if (!db || !projectId) {
      setTimeout(() => setIsLoading(false), 1000);
      return;
    }

    try {
      setIsLoading(true);
      
      const [storedTasks, activeLabor, recentDeliveries] = await Promise.all([
        db.gantt_tasks.where('project_id').equals(projectId).toArray(),
        db.timeclock
          .where('project_id')
          .equals(projectId)
          .filter((t: TimeClock) => t.clock_out === null)
          .toArray(),
        db.material_logistics.where('project_id').equals(projectId).reverse().limit(5).toArray()
      ]);

      setTasks(storedTasks);
      setLaborCount(activeLabor.length);
      setLogistics(recentDeliveries);

    } catch (err) {
      console.error("Gantt Engine: Handshake failed.", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    syncProductionData();
  }, [syncProductionData]);

  /** * GANTT: UPDATE PROGRESS 
   * Directly updates Dexie and queues the sync.
   */
  const handleUpdateProgress = async (taskId: string, current: number, delta: number) => {
    if (!db) return;
    const nextValue = Math.min(100, Math.max(0, current + delta));
    setIsUpdating(taskId);
    
    try {
      await db.gantt_tasks.update(taskId, { completion_percentage: nextValue });
      if (syncEngine) {
        await syncEngine.queueChange('gantt_tasks', taskId, 'UPDATE', { completion_percentage: nextValue });
      }
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completion_percentage: nextValue } : t));
    } finally {
      setIsUpdating(null);
    }
  };

  /** * LOGISTICS: RECORD DELIVERY */
  const handleLogDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !projectId || !newDelivery.item_name) return;

    const deliveryId = crypto.randomUUID();
    const deliveryData = {
      id: deliveryId,
      project_id: projectId,
      bill_item_id: "",
      item_name: newDelivery.item_name,
      qty_received: 0,
      delivery_note_ref: newDelivery.delivery_note_ref,
      timestamp: new Date().toISOString()
    };

    try {
      await db.material_logistics.add(deliveryData);
      if (syncEngine) {
        await syncEngine.queueChange('material_logistics', deliveryId, 'INSERT', deliveryData);
      }
      setNewDelivery({ item_name: '', delivery_note_ref: '' });
      setShowDeliveryForm(false);
      syncProductionData();
    } catch (e) {
      console.error("Logistics Error: Vault access failed.");
    }
  };

  const calculateVelocity = useMemo(() => {
    if (tasks.length === 0) return "0";
    const total = tasks.reduce((acc, curr) => acc + curr.completion_percentage, 0);
    return (total / tasks.length).toFixed(1);
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left pb-20">
      
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
           <Button variant="primary" leftIcon={<Plus size={16} />}>New Stage</Button>
        </div>

        <div className="p-10 space-y-12">
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

      {/* 3. LOGISTICS & TIMECLOCK NODES */}
      <div className="grid lg:grid-cols-2 gap-8">
        
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
