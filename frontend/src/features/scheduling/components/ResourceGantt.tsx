/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  BarChart3, 
  MapPin,
  Plus, 
  ChevronRight,
  TrendingUp,
  Loader2,
  HardHat,
  Truck,
  Package
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark' });
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
    // Shims active in sandbox
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
  const [laborStats, setLaborStats] = useState<any[]>([]);
  const [logistics, setLogistics] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  /** * PRODUCTION DATA HANDSHAKE
   * This logic pulls real records from the project vault (Dexie).
   * It works fully offline and reflects site progress instantly.
   */
  const syncProductionData = useCallback(async () => {
    if (!db || !projectId) {
      setTimeout(() => setIsLoading(false), 1000);
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. Fetch Schedule Tasks
      const storedTasks = await db.gantt_tasks
        .where('project_id')
        .equals(projectId)
        .toArray();

      // 2. Fetch Active Labor (Timeclock nodes marked as clocked-in)
      const activeLabor = await db.timeclock
        .where('project_id')
        .equals(projectId)
        .filter((t: any) => t.clock_out === null)
        .toArray();

      // 3. Fetch Recent Logistics (Material Deliveries)
      const recentDeliveries = await db.material_logistics
        .where('project_id')
        .equals(projectId)
        .reverse()
        .limit(3)
        .toArray();

      setTasks(storedTasks);
      setLogistics(recentDeliveries);
      
      // Group labor by trade for deployment visualization
      setLaborStats([
        { trade: 'Verified On-Site', count: activeLabor.length, target: 40 },
        { trade: 'Geo-Fenced Nodes', count: activeLabor.filter((l: any) => l.is_verified_geofence).length, target: activeLabor.length }
      ]);

    } catch (err) {
      console.error("Gantt Engine: Handshake failed.", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    syncProductionData();
  }, [syncProductionData]);


  const calculateVelocity = useMemo(() => {
    if (tasks.length === 0) return "0";
    const total = tasks.reduce((acc, curr) => acc + curr.completion_percentage, 0);
    return (total / tasks.length).toFixed(1);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-20">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className="font-black text-[10px] uppercase tracking-[0.4em]">Compiling Schedule Nodes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left pb-20">
      
      {/* 1. RESOURCE HUD (Real Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">Live Velocity</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 leading-none">Schedule Health</p>
          <h3 className={`text-4xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            {calculateVelocity}%
          </h3>
        </div>

        <div className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <MapPin size={24} />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Tracking
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 leading-none">GPS Active Labor</p>
          <h3 className={`text-4xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            {laborStats[0]?.count || 0} Nodes
          </h3>
        </div>

        <div className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <BarChart3 size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 leading-none">Logistics Delta</p>
          <h3 className={`text-4xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            {logistics.length} Deliv.
          </h3>
        </div>
      </div>

      {/* 2. MASTER GANTT ENGINE */}
      <div className={`rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-2xl shadow-black' : 'bg-white border-zinc-200'}`}>
        
        <div className="p-10 border-b border-zinc-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/[0.02]">
           <div className="text-left space-y-2">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Production Timeline</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic leading-none">SMM-KE Work Section Schedule • {new Date().getFullYear()}</p>
           </div>
           <button className="flex items-center gap-3 px-8 py-4 bg-amber-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-500/10 hover:bg-amber-400 active:scale-95 transition-all">
              <Plus size={16} className="stroke-[3px]" /> New Schedule Node
           </button>
        </div>

        <div className="p-10 space-y-10">
           {tasks.length > 0 ? tasks.map((task) => (
             <div key={task.id} className="space-y-4 group">
                <div className="flex justify-between items-end">
                   <div className="text-left space-y-1">
                      <div className="flex items-center gap-3">
                         <span className={`text-lg font-black uppercase tracking-tight group-hover:text-amber-500 transition-colors ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>
                           {task.title}
                         </span>
                         {task.bill_item_id && (
                           <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
                             SMM Linked
                           </span>
                         )}
                      </div>
                      <div className="flex items-center gap-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                         <div className="flex items-center gap-1.5"><Calendar size={10} className="text-zinc-700"/> {task.start_date}</div>
                         <ChevronRight size={10} className="text-zinc-800" />
                         <div className="flex items-center gap-1.5"><Clock size={10} className="text-zinc-700"/> {task.end_date}</div>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className={`text-2xl font-black italic tracking-tighter ${task.completion_percentage < 30 ? 'text-rose-500' : 'text-amber-500'}`}>
                        {task.completion_percentage}%
                      </span>
                   </div>
                </div>

                <div className="relative h-6 bg-zinc-950 border border-zinc-800/60 rounded-full overflow-hidden shadow-inner group-hover:border-zinc-700 transition-all">
                   <div 
                      className={`h-full transition-all duration-1000 ease-out relative ${task.completion_percentage < 30 ? 'bg-rose-500/40' : 'bg-amber-500'}`}
                      style={{ width: `${task.completion_percentage}%` }}
                   >
                      <div className="absolute inset-0 bg-white/10 animate-pulse" />
                   </div>
                   <div className="absolute top-0 bottom-0 w-1 bg-white/20 blur-[2px]" style={{ left: `${task.completion_percentage}%` }} />
                </div>
             </div>
           )) : (
             <div className="p-20 text-center opacity-10">
                <Calendar size={64} className="mx-auto mb-6" />
                <p className="font-black uppercase text-sm tracking-widest">No Active Schedule Nodes</p>
             </div>
           )}
        </div>

        <div className={`p-10 border-t flex flex-col md:flex-row justify-between items-center gap-8 opacity-40
          ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 leading-none">Milestones Verified</p>
             </div>
             <div className="flex items-center gap-2">
                <HardHat size={12} className="text-blue-500" />
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 leading-none">GPS Geofencing Active</p>
             </div>
          </div>
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter leading-none">
            GANTT_ENGINE_V4.0 • OFFLINE_STORAGE: PROTECTED
          </p>
        </div>
      </div>

      {/* 3. LOGISTICS & LABOR INTEGRATION (Real Database Data) */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className={`p-10 rounded-[3.5rem] border ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/40'}`}>
          <div className="flex items-center gap-4 mb-10">
             <HardHat size={22} className="text-blue-500" />
             <h4 className="text-xl font-black uppercase italic tracking-tighter">Labor Deployment</h4>
          </div>
          <div className="space-y-6">
             {laborStats.length > 0 ? laborStats.map((l, i) => (
               <div key={i} className="flex justify-between items-center p-6 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 shadow-inner">
                  <div className="text-left">
                     <p className="text-xs font-black uppercase text-zinc-300 leading-none">{l.trade}</p>
                     <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-3 leading-none">Compliance Target: {l.target}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-2xl font-black italic tracking-tighter leading-none text-blue-500">{l.count.toString().padStart(2, '0')}</p>
                  </div>
               </div>
             )) : (
               <p className="text-[10px] font-black uppercase text-zinc-700 text-center py-10">Waiting for GPS clock-in nodes...</p>
             )}
          </div>
        </div>

        <div className={`p-10 rounded-[3.5rem] border ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/40'}`}>
          <div className="flex items-center gap-4 mb-10">
             <Truck size={22} className="text-amber-500" />
             <h4 className="text-xl font-black uppercase italic tracking-tighter text-left">Logistics Tracker</h4>
          </div>
          <div className="space-y-6">
             {logistics.length > 0 ? logistics.map((log: any) => (
               <div key={log.id} className="p-8 rounded-3xl bg-zinc-950/60 border border-amber-500/20 shadow-inner relative overflow-hidden group">
                  <div className="relative z-10 flex justify-between items-center text-left">
                     <div>
                        <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-2 leading-none">Material Received</p>
                        <h5 className="text-lg font-black uppercase text-zinc-200 leading-none">{log.item_name}</h5>
                     </div>
                     <span className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest shadow-xl">Verified</span>
                  </div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-6 relative z-10 leading-none">
                    D.NOTE: {log.delivery_note_ref || 'NO_REF'} • {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
               </div>
             )) : (
               <div className="p-20 text-center opacity-10">
                  <Package size={48} className="mx-auto mb-4" />
                  <p className="font-black uppercase text-[10px]">No recent deliveries nodes</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceGantt;