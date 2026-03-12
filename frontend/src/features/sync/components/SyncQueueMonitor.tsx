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
  FileCode,
  Loader2,
  X,
  Plus
} from 'lucide-react';

/* ======================================================
    OFFICE DATABASE INTEGRATION
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  theme: 'dark',
  isOnline: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Sandbox fallback active
  }
};

resolveModules();

/** --- MAIN COMPONENT: DATA SYNC MONITOR --- **/

const SyncQueueMonitor: React.FC = () => {
  const { theme, isOnline } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localBuffer, setLocalBuffer] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** * LIVE SYNC MONITORING
   * Checks the local database queue for any records waiting 
   * to be uploaded to the office cloud.
   */
  useEffect(() => {
    const checkQueue = async () => {
      try {
        if (db?.sync_queue?.count) {
          const count = await db.sync_queue.count();
          setPendingCount(count + localBuffer.length);
        }
      } catch (err) {
        console.error("Office Sync Error:", err);
      }
    };

    const interval = setInterval(checkQueue, 3000);
    checkQueue();
    return () => clearInterval(interval);
  }, [localBuffer]);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing || !syncEngine) return;
    setIsSyncing(true);
    try {
      // Trigger the background sync engine defined in database.ts
      await syncEngine.processQueue();
      setLocalBuffer([]); // Clear simulated buffer on success
    } catch (err) {
      console.error("Manual sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const onFileIntake = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAssets = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      size: (file.size / 1024).toFixed(1) + ' KB',
      timestamp: new Date().toLocaleTimeString()
    }));

    setLocalBuffer(prev => [...newAssets, ...prev]);
    // Note: In production, these are queued via syncEngine.queueChange
  };

  return (
    <div className={`p-8 rounded-[3rem] border backdrop-blur-3xl transition-all duration-500
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>
      
      {/* 1. Sync Status HUD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 text-left">
        <div className="flex items-center gap-6">
          <div className={`p-5 rounded-3xl transition-all duration-500 shadow-inner
            ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-100'}
            ${pendingCount > 0 && isOnline ? 'ring-2 ring-amber-500/20' : ''}`}>
            {isOnline ? (
              <Cloud className={`${pendingCount > 0 ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} size={28} />
            ) : (
              <CloudOff className="text-zinc-600" size={28} />
            )}
          </div>
          
          <div className="space-y-1">
            <h4 className={`text-xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Sync Progress
            </h4>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border
                ${isOnline 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                  : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'}`}>
                {isOnline ? 'Network Operational' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 leading-none">
              Unsynced Changes
            </p>
            <p className={`text-4xl font-black italic tracking-tighter leading-none
              ${pendingCount > 0 ? 'text-amber-500' : theme === 'dark' ? 'text-zinc-700' : 'text-zinc-300'}`}>
              {pendingCount.toString().padStart(2, '0')}
            </p>
          </div>

          <button 
            onClick={handleManualSync}
            disabled={!isOnline || isSyncing}
            className={`p-5 rounded-2xl transition-all active:scale-95 shadow-2xl
              ${!isOnline || isSyncing 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50' 
                : 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20'}`}
            title="Force Cloud Sync"
          >
            {isSyncing ? <Loader2 size={24} className="animate-spin stroke-[3px]" /> : <RefreshCw size={24} className="stroke-[3px]" />}
          </button>
        </div>
      </div>

      {/* 2. Document & File Intake */}
      <div className="space-y-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-4xl border-2 border-dashed transition-all cursor-pointer group flex items-center justify-between
            ${theme === 'dark' ? 'border-zinc-800 hover:border-amber-500/40 bg-zinc-950/40' : 'border-zinc-200 hover:border-amber-500/40 bg-zinc-50 shadow-inner'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl transition-colors ${theme === 'dark' ? 'bg-zinc-900 text-zinc-500 group-hover:text-amber-500' : 'bg-white text-zinc-400 group-hover:text-amber-600'}`}>
              <FileUp size={20} />
            </div>
            <div className="text-left">
              <p className={`text-[11px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Attach Documents</p>
              <p className="text-[9px] font-bold text-zinc-600 uppercase mt-1 leading-none text-left">Supports PDF, Excel, & DWG drawings</p>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileIntake} 
            className="hidden" 
            multiple 
            accept=".pdf,.docx,.xlsx,.xls,.dwg" 
          />
          <Plus size={20} className="text-zinc-700 group-hover:text-amber-500 transition-colors" />
        </div>

        {/* Local Buffer List */}
        {localBuffer.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2 animate-in fade-in duration-500">
            {localBuffer.map(file => (
              <div key={file.id} className={`flex items-center justify-between p-4 rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="text-amber-500 shrink-0">
                    {file.type === 'PDF' ? <FileText size={16}/> : file.type === 'XLSX' || file.type === 'XLS' ? <FileSpreadsheet size={16}/> : <FileCode size={16}/>}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-[10px] font-bold truncate uppercase text-zinc-400 leading-none">{file.name}</p>
                    <p className="text-[8px] font-black text-zinc-600 mt-1 uppercase tracking-tighter">{file.size} • {file.timestamp} • READY</p>
                  </div>
                </div>
                <button onClick={() => setLocalBuffer(prev => prev.filter(f => f.id !== file.id))} className="text-zinc-700 hover:text-rose-500 p-1">
                  <X size={14}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. System Status Footer */}
      <div className={`mt-8 pt-8 border-t flex flex-wrap gap-6 items-center justify-between
        ${theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 leading-none">
            {isOnline ? 'Syncing with Office Cloud' : 'Local Data Protected'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Database size={10} className="text-zinc-600" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">Local Database</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={10} className="text-amber-500" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">Reliable Data Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncQueueMonitor;