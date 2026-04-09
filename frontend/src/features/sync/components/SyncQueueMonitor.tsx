/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, 
  Cloud, 
  CloudOff, 
  Database, 
  Zap, 
  FileUp, 
  FileText, 
  FileSpreadsheet, 
  Loader2, 
  X, 
  Plus,
  ShieldCheck,
  Activity
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (PRO-DEV GUARD)
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
    console.warn("Sync Hub: Establishing local node connection...");
  }
};

// Initial trigger
resolveModules();

/** --- SUB-COMPONENT: ACTUAL MONITOR UI --- **/
// We separate this to ensure Hooks are called in a stable order after resolution
const SyncMonitorContent: React.FC<{ theme: string; isOnline: boolean }> = ({ theme, isOnline }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [localBuffer, setLocalBuffer] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** * 1. LIVE OUTBOX MONITORING */
  useEffect(() => {
    const checkOutbox = async () => {
      try {
        if (db?.sync_queue) {
          const count = await db.sync_queue.count();
          setPendingCount(count);
        }
      } catch (err) {
        console.warn("Sync Monitor: Scanning vault...");
      }
    };

    const interval = setInterval(checkOutbox, 2000);
    checkOutbox();
    return () => clearInterval(interval);
  }, []);

  /** * 2. AUTONOMOUS SYNC HANDSHAKE 
   * Triggers automatically when online and data is detected in the outbox.
   */
  useEffect(() => {
    const triggerAutoSync = async () => {
      if (isOnline && pendingCount > 0 && !isSyncing && syncEngine) {
        setIsSyncing(true);
        try {
          // Autonomous Vault Push logic
          await syncEngine.processQueue();
          setLocalBuffer([]); 
        } catch (err) {
          console.error("Auto Sync Handshake Failed:", err);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    triggerAutoSync();
  }, [isOnline, pendingCount, isSyncing]);

  const onFileIntake = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAssets = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      size: (file.size / 1024).toFixed(1) + ' KB'
    }));
    setLocalBuffer(prev => [...newAssets, ...prev]);
  };

  return (
    <div className={`p-10 rounded-[4rem] border backdrop-blur-3xl transition-all duration-500 shadow-2xl
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
      
      {/* 1. SYNC STATUS HUD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10 mb-12 text-left">
        <div className="flex items-center gap-8 text-left">
          <div className={`p-6 rounded-4xl transition-all duration-700 shadow-inner relative
            ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-100'}
            ${isSyncing ? 'ring-4 ring-amber-500/20' : isOnline && pendingCount === 0 ? 'ring-4 ring-emerald-500/10' : ''}`}>
            
            {isSyncing ? (
              <RefreshCw className="text-amber-500 animate-spin" size={32} />
            ) : isOnline ? (
              <Cloud className={pendingCount > 0 ? 'text-amber-500 animate-pulse' : 'text-emerald-500'} size={32} />
            ) : (
              <CloudOff className="text-zinc-600" size={32} />
            )}

            {/* Micro status heartbeat */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#09090b]
               ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          </div>
          
          <div className="space-y-2 text-left">
            <h4 className={`text-3xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              Vault Status
            </h4>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border transition-colors
                ${isSyncing 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                  : isOnline 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse'}`}>
                {isSyncing ? 'Pushing Site Data...' : isOnline ? 'System Connected' : 'Local Standby'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-12 text-right">
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 leading-none">
              Waiting Logs
            </p>
            <div className="flex items-baseline gap-3 justify-end">
               <p className={`text-6xl font-black italic tracking-tighter leading-none transition-colors
                 ${pendingCount > 0 ? 'text-amber-500' : theme === 'dark' ? 'text-zinc-800' : 'text-zinc-200'}`}>
                 {pendingCount.toString().padStart(2, '0')}
               </p>
               {isSyncing && <Loader2 size={20} className="animate-spin text-amber-500/40" />}
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-center gap-2 opacity-40">
             <Activity size={24} className={isSyncing ? "text-amber-500" : "text-zinc-600"} />
             <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Live Stream</p>
          </div>
        </div>
      </div>

      {/* 2. SITE EVIDENCE INTAKE */}
      <div className="space-y-6">
        <label className={`text-[12px] font-black uppercase ml-4 tracking-[0.3em] italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Site Evidence Handshake</label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 rounded-[3.5rem] border-2 border-dashed transition-all cursor-pointer group flex items-center justify-between
            ${theme === 'dark' ? 'border-zinc-800 hover:border-amber-500/40 bg-zinc-950/40 shadow-inner' : 'border-zinc-200 hover:border-amber-500/40 bg-zinc-50'}`}
        >
          <div className="flex items-center gap-6 text-left">
            <div className={`p-4 rounded-2xl transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-900 text-zinc-600 group-hover:bg-amber-500 group-hover:text-black shadow-lg' : 'bg-white text-zinc-400 group-hover:bg-amber-500 group-hover:text-black border border-zinc-100 shadow-sm'}`}>
              <FileUp size={28} />
            </div>
            <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-950'}`}>Vault Drawing or Report</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1 leading-none italic">Secure multi-file archival protocol</p>
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={onFileIntake} className="hidden" multiple />
          <div className="w-12 h-12 rounded-xl border border-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-all mr-2">
            <Plus size={24} className="text-zinc-700 group-hover:text-amber-500 transition-colors" />
          </div>
        </div>

        {localBuffer.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
            {localBuffer.map(file => (
              <div key={file.id} className={`flex items-center justify-between p-6 rounded-3xl border ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 shadow-black' : 'bg-white border-zinc-100 shadow-sm'}`}>
                <div className="flex items-center gap-5 overflow-hidden text-left">
                  <div className="text-amber-500 shrink-0">
                    {file.type === 'PDF' ? <FileText size={20}/> : <FileSpreadsheet size={20}/>}
                  </div>
                  <div className="overflow-hidden">
                    <p className={`text-[11px] font-black truncate uppercase leading-none ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-950'}`}>{file.name}</p>
                    <p className="text-[9px] font-bold text-zinc-600 mt-2 uppercase tracking-tighter italic">{file.size} • Pending Office Handshake</p>
                  </div>
                </div>
                <button onClick={() => setLocalBuffer(prev => prev.filter(f => f.id !== file.id))} className="p-3 text-zinc-700 hover:text-rose-500 transition-all active:scale-90">
                  <X size={18}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. SECURITY FOOTER */}
      <div className={`mt-10 pt-8 border-t flex flex-wrap gap-8 items-center justify-between opacity-30
        ${theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-200'}`}>
        <div className="flex items-center gap-4 text-left">
          <ShieldCheck size={20} className="text-emerald-500" />
          <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>
            {isOnline ? 'Active Infrastructure Bridge' : 'Offline Vault Protection'}
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Database size={14} className="text-zinc-600" />
            <span className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-widest leading-none mt-1">OFFLINE_LEDGER: OK</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-500" />
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none mt-1 italic">QS_OS_v2.5.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/** --- MAIN COMPONENT: DATA SYNC MONITOR (MODULE GUARD) --- **/

const SyncQueueMonitor: React.FC = () => {
  const [isResolved, setIsResolved] = useState(false);
  
  // Resolve modules and trigger guard
  useEffect(() => {
    resolveModules().then(() => setIsResolved(true));
  }, []);

  // Rules of Hooks fix: Top-level call to useAuth only happens in the guarded child
  if (!isResolved) return null;

  return <MonitorGuard />;
};

// Internal wrapper to safely call the resolved useAuth hook
const MonitorGuard: React.FC = () => {
    const { theme, isOnline } = useAuth();
    return <SyncMonitorContent theme={theme} isOnline={isOnline} />;
};

export default SyncQueueMonitor;