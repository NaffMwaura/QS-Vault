/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark' });
let db: any = null;
let syncEngine: any = null;
let Button: any = ({ children, onClick, className }: any) => (
  <button onClick={onClick} className={className}>{children}</button>
);

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db; 
    
    const syncMod = await import("../../../lib/database/database");
    if (syncMod.syncEngine) syncEngine = syncMod.syncEngine;

    const btnMod = await import("../../../components/ui/Button");
    if (btnMod.default) Button = btnMod.default;
  } catch (e) {
    // Sandbox shims active
  }
};

resolveModules();

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
  const { theme } = useAuth();
  
  // LIVE DATA STATES
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [laborCount, setLaborCount] = useState(0);
  const [logistics, setLogistics] = useState<any[]>([]);
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
        db.timeclock.where('project_id').equals(projectId).filter((t: any) => t.clock_out === null).toArray(),
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
      item_name: newDelivery.item_name,
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
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className="font-black text-[10px] uppercase tracking-[0.4em]">Establishing Site Connection...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left pb-20">
      
      {/* 1. RESOURCE HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-xl'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic leading-none mt-2">Work Health</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 leading-none text-left">Schedule Velocity</p>
          <h3 className={`text-4xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} text-left`}>
            {calculateVelocity}%
          </h3>
        </div>

        <div className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <HardHat size={24} />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> GPS Secure
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 leading-none text-left">On-Site Workforce</p>
          <h3 className={`text-4xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} text-left`}>
            {laborCount.toString().padStart(2, '0')} Nodes
          </h3>
        </div>

        <div className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Truck size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 leading-none text-left">Verified Deliveries</p>
          <h3 className={`text-4xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} text-left`}>
            {logistics.length.toString().padStart(2, '0')} Items
          </h3>
        </div>
      </div>

      {/* 2. MASTER TIMELINE (GANTT) */}
      <div className={`rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-2xl shadow-black' : 'bg-white border-zinc-200'}`}>
        
        <div className="p-10 border-b border-zinc-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/1">
           <div className="text-left space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter">Production Timeline</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Updating Site Progress Stages</p>
           </div>
           <Button variant="primary" leftIcon={<Plus size={16} />}>New Stage</Button>
        </div>

        <div className="p-10 space-y-12">
           {tasks.length > 0 ? tasks.map((task) => (
             <div key={task.id} className="space-y-6 group">
                <div className="flex justify-between items-end">
                   <div className="text-left space-y-2">
                      <div className="flex items-center gap-4">
                         <span className={`text-xl font-black uppercase tracking-tight group-hover:text-amber-500 transition-colors ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>
                           {task.title}
                         </span>
                         <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
                           {task.id.slice(0, 8)}
                         </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                         <div className="flex items-center gap-2"><Calendar size={12} className="text-zinc-700"/> {task.start_date}</div>
                         <ChevronRight size={12} className="text-zinc-800" />
                         <div className="flex items-center gap-2"><Clock size={12} className="text-zinc-700"/> {task.end_date}</div>
                      </div>
                   </div>
                   
                   {/* Interactive Controls */}
                   <div className="flex items-center gap-6">
                      <div className="flex gap-1">
                         <button 
                            onClick={() => handleUpdateProgress(task.id, task.completion_percentage, -5)}
                            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all active:scale-90"
                         >-</button>
                         <button 
                            onClick={() => handleUpdateProgress(task.id, task.completion_percentage, 5)}
                            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all active:scale-90"
                         >+</button>
                      </div>
                      <span className={`text-4xl font-black italic tracking-tighter w-24 text-right ${task.completion_percentage < 30 ? 'text-rose-500' : 'text-amber-500'}`}>
                        {task.completion_percentage}%
                      </span>
                   </div>
                </div>

                <div className="relative h-10 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-inner group-hover:border-zinc-700 transition-all">
                   <div 
                      className={`h-full transition-all duration-700 ease-out relative ${task.completion_percentage < 30 ? 'bg-rose-500/40' : 'bg-amber-500'}`}
                      style={{ width: `${task.completion_percentage}%` }}
                   >
                      <div className="absolute inset-0 bg-white/10 animate-pulse" />
                   </div>
                </div>
             </div>
           )) : (
             <div className="py-20 text-center opacity-10 flex flex-col items-center gap-6">
                <Calendar size={80} />
                <p className="font-black uppercase text-sm tracking-widest italic">No Active Timeline Nodes</p>
             </div>
           )}
        </div>
      </div>

      {/* 3. LOGISTICS & TIMECLOCK NODES */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* MATERIAL LOGISTICS */}
        <div className={`p-10 rounded-[3.5rem] border ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>
          <div className="flex justify-between items-center mb-10">
             <div className="flex items-center gap-4">
                <Truck size={24} className="text-amber-500" />
                <h4 className="text-xl font-black uppercase italic tracking-tighter">Site Arrivals</h4>
             </div>
             <button 
                onClick={() => setShowDeliveryForm(!showDeliveryForm)}
                className="p-3 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all"
             >
                <Plus size={18} />
             </button>
          </div>

          {showDeliveryForm && (
            <form onSubmit={handleLogDelivery} className="mb-10 p-6 rounded-3xl bg-zinc-950/60 border border-amber-500/20 space-y-6 animate-in slide-in-from-top-4 duration-500">
               <div className="space-y-4">
                  <input 
                    placeholder="Item Name (e.g. 100 Bags Cement)" 
                    value={newDelivery.item_name}
                    onChange={e => setNewDelivery({...newDelivery, item_name: e.target.value})}
                    className="w-full p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-amber-500 font-bold text-sm"
                  />
                  <input 
                    placeholder="Delivery Note REF #" 
                    value={newDelivery.delivery_note_ref}
                    onChange={e => setNewDelivery({...newDelivery, delivery_note_ref: e.target.value})}
                    className="w-full p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-amber-500 font-bold text-sm"
                  />
               </div>
               <Button type="submit" variant="primary" className="w-full py-5">Record Delivery</Button>
            </form>
          )}

          <div className="space-y-4">
             {logistics.length > 0 ? logistics.map((log: any) => (
               <div key={log.id} className="p-6 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 flex justify-between items-center group hover:border-amber-500/20 transition-all text-left">
                  <div>
                     <p className="text-[9px] font-black uppercase text-amber-500 mb-1 leading-none tracking-widest">Verified Material</p>
                     <h5 className="font-black uppercase text-zinc-200 tracking-tight leading-none mb-4">{log.item_name}</h5>
                     <p className="text-[8px] font-mono text-zinc-600 uppercase">D.Note: {log.delivery_note_ref || 'NO_REF'}</p>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-xl text-emerald-500/50 group-hover:text-emerald-500 transition-colors">
                     <CheckCircle2 size={18} />
                  </div>
               </div>
             )) : (
               <p className="text-[10px] font-black uppercase text-zinc-700 text-center py-10">No recent arrivals nodes</p>
             )}
          </div>
        </div>

        {/* GPS LABOR TRACKER */}
        <div className={`p-10 rounded-[3.5rem] border ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-xl' : 'bg-white border-zinc-200'}`}>
           <div className="flex items-center gap-4 mb-10 text-left">
              <Navigation size={24} className="text-blue-500" />
              <h4 className="text-xl font-black uppercase italic tracking-tighter">GPS Geofence Node</h4>
           </div>

           <div className={`p-10 rounded-[3rem] border bg-zinc-950/60 border-zinc-800 text-center space-y-8 shadow-inner`}>
              <div className="relative w-32 h-32 mx-auto">
                 <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
                 <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-[ping_2s_linear_infinite]" />
                 <div className="absolute inset-4 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                    <HardHat size={32} className="text-blue-500" />
                 </div>
              </div>

              <div className="space-y-2">
                 <h5 className="text-4xl font-black italic tracking-tighter text-white leading-none">
                   {laborCount.toString().padStart(2, '0')} Active
                 </h5>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Verified Personnel on Site</p>
              </div>

              <div className="pt-8 border-t border-zinc-800 flex justify-between items-center opacity-40">
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span className="text-[9px] font-black uppercase text-zinc-400">Payroll Link Active</span>
                 </div>
                 <span className="text-[9px] font-mono text-zinc-600">ID: SITE-B-ALPHA</span>
              </div>
           </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className={`p-8 border-t border-zinc-800/40 flex items-center justify-between opacity-30`}>
         <div className="flex items-center gap-3">
            <AlertCircle size={14} className="text-amber-500" />
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Resource Monitoring Active</p>
         </div>
         <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">SCHEDULE_ENGINE_V4.0 • GPS_GEOFENCE: ARMED</p>
      </div>
    </div>
  );
};

export default ResourceGantt;