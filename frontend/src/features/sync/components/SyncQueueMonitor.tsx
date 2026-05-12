/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Cloud, 
  CloudOff, 
  Database, 
  Zap, 
  Loader2, 
  ShieldCheck,
  Activity
} from 'lucide-react';

/* ======================================================
    MODULE RESOLUTION (Internal safety)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark', isOnline: true });
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
    // Standby mode active for preview environments
  }
};

resolveModules();

/** --- MAIN COMPONENT: SIMPLE SYNC MONITOR --- **/

const SyncQueueMonitor: React.FC = () => {
  const { theme, isOnline } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let liveQuerySubscription: any = null;
    let pollInterval: any = null;
    let lastCountRef = 0;

    // OPTIMIZATION: Try to use Dexie's liveQuery for reactive updates
    // Falls back to polling if not available
    const setupQueueMonitoring = async () => {
      if (!db?.sync_queue) return;

      try {
        // Try to use liveQuery for efficient reactive updates
        if (db.sync_queue.liveQuery) {
          const liveQuery = (await import('dexie')).liveQuery;
          liveQuerySubscription = liveQuery(
            async () => {
              const count = await db.sync_queue.count();
              return count;
            }
          ).subscribe((count) => {
            setPendingCount(count || 0);
            lastCountRef = count || 0;
          }, (err) => {
            console.warn("Live query error, falling back to polling:", err);
            // Fallback to polling
            startPolling();
          });
        } else {
          // Fallback to polling if liveQuery not available
          startPolling();
        }
      } catch (err) {
        // Fallback to polling
        startPolling();
      }
    };

    // OPTIMIZATION: Increased polling interval from 3s to 10s to reduce CPU/battery drain
    // Dexie queries are expensive, so we poll less frequently
    const startPolling = () => {
      const checkRecords = async () => {
        if (!db?.sync_queue) return;
        try {
          const count = await db.sync_queue.count();
          if (count !== lastCountRef) {
            setPendingCount(count);
            lastCountRef = count;
          }
        } catch (err) { /* vault scan error handling */ }
      };

      checkRecords();
      // OPTIMIZATION: Increased from 3000ms to 10000ms
      // Still responsive but reduces unnecessary database reads
      pollInterval = setInterval(checkRecords, 10000);
    };

    setupQueueMonitoring();

    return () => {
      if (liveQuerySubscription) {
        liveQuerySubscription.unsubscribe?.();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  useEffect(() => {
    const triggerSync = async () => {
      // OPTIMIZATION: Only trigger sync if we have pending items AND we're online AND not already syncing
      // This prevents excessive sync attempts
      if (isOnline && pendingCount > 0 && !isSyncing && syncEngine) {
        setIsSyncing(true);
        try {
          await syncEngine.processQueue();
          // After sync, re-check the count
          if (db?.sync_queue) {
            const count = await db.sync_queue.count();
            setPendingCount(count);
          }
        } catch (err) {
          console.warn("Sync error in monitor:", err);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    
    triggerSync();
  }, [isOnline, pendingCount, isSyncing]);

  return (
    <div className={`p-8 rounded-[3.5rem] border backdrop-blur-3xl transition-all duration-500 shadow-2xl
      ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-8 text-left">
        
        {/* 1. STATUS INDICATOR (WiFi & Cloud Logic) */}
        <div className="flex items-center gap-6 text-left w-full sm:w-auto">
          <div className={`p-5 rounded-[1.8rem] transition-all duration-500 shadow-inner relative
            ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-100'}
            ${isSyncing ? 'ring-4 ring-amber-500/20' : ''}`}>
            
            {/* Visual change based on Online Status and Activity */}
            {isSyncing ? (
              <RefreshCw className="text-amber-500 animate-spin" size={28} />
            ) : isOnline ? (
              <Cloud className={pendingCount > 0 ? 'text-amber-500 animate-pulse' : 'text-emerald-500'} size={28} />
            ) : (
              <CloudOff className="text-rose-500" size={28} />
            )}

            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 
               ${theme === 'dark' ? 'border-[#09090b]' : 'border-white'}
               ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          </div>
          
          <div className="space-y-1 text-left">
            <h4 className={`text-2xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Project Status
            </h4>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-colors
                ${isSyncing 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                  : isOnline 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse'}`}>
                {isSyncing ? 'Saving Data...' : isOnline ? 'System Synced' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. PENDING DATA COUNT */}
        <div className="flex items-center gap-10 text-right">
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500 leading-none">
              Unsaved Records
            </p>
            <div className="flex items-baseline gap-3 justify-end">
               <p className={`text-5xl font-black italic tracking-tighter leading-none transition-colors
                 ${pendingCount > 0 ? 'text-amber-500' : theme === 'dark' ? 'text-zinc-200' : 'text-zinc-200'}`}>
                 {pendingCount.toString().padStart(2, '0')}
               </p>
               {isSyncing && <Loader2 size={18} className="animate-spin text-amber-500/40" />}
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-center gap-2 opacity-30">
             <Activity size={22} className={isSyncing ? "text-amber-500" : "text-zinc-600"} />
             <p className="text-[8px] font-black uppercase tracking-widest text-yellow-500">Live Status</p>
          </div>
        </div>
      </div>

      {/* 3. SUBTLE FOOTER BAR */}
      <div className={`mt-8 pt-6 border-t flex items-center justify-between opacity-40
        ${theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-200'}`}>
        <div className="flex items-center gap-3 text-left">
          <ShieldCheck size={16} className="text-emerald-500" />
          <p className={`text-[9px] font-black uppercase tracking-widest leading-none ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>
            {isOnline ? 'Cloud backup active' : 'Local security enabled'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Database size={12} className="text-zinc-600" />
            <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-widest leading-none mt-0.5">VAULT_OK</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-amber-500" />
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none mt-0.5 italic">QS_v2.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncQueueMonitor;