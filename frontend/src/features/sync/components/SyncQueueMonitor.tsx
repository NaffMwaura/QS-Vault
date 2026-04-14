import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, Cloud, CloudOff, Database, Zap, FileUp, FileText, 
  FileSpreadsheet, FileCode, Loader2, X, Plus, ShieldCheck
} from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine } from "../../../lib/database/database";

const SyncQueueMonitor: React.FC = () => {
  const { isOnline } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localBuffer, setLocalBuffer] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkOutbox = async () => {
      try {
        if (db?.sync_queue) {
          const count = await db.sync_queue.count();
          setPendingCount(count);
        }
      } catch (err) {
        console.warn("Sync Hub: Monitoring deferred.");
      }
    };

    const interval = setInterval(checkOutbox, 3000);
    checkOutbox();
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing || !syncEngine) return;
    setIsSyncing(true);
    try {
      await syncEngine.processQueue();
      setLocalBuffer([]); 
    } catch (err) {
      console.error("Manual Handshake Failed:", err);
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
  };

  return (
    <div className="theme-panel p-8 rounded-[3rem] transition-all duration-500 shadow-2xl backdrop-blur-3xl">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 text-left">
        <div className="flex items-center gap-6">
          <div className={`theme-card p-5 rounded-[1.8rem] transition-all duration-500 shadow-inner
            ${pendingCount > 0 && isOnline ? 'theme-border ring-2 ring-amber-500/20' : ''}`}>
            {isOnline ? (
              <Cloud className={`${pendingCount > 0 ? 'theme-total-value animate-pulse' : 'text-emerald-500'}`} size={28} />
            ) : (
              <CloudOff className="theme-icon" size={28} />
            )}
          </div>
          
          <div className="space-y-1">
            <h4 className="theme-heading text-xl font-black uppercase italic tracking-tighter leading-none">
              Cloud Sync Status
            </h4>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border
                ${isOnline 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse'}`}>
                {isOnline ? 'System Online' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="theme-meta text-[10px] font-black uppercase tracking-[0.3em] mb-2 leading-none">
              Pending Records
            </p>
            <p className={`text-4xl font-black italic tracking-tighter leading-none
              ${pendingCount > 0 ? 'theme-total-value' : 'theme-meta opacity-50'}`}>
              {pendingCount.toString().padStart(2, '0')}
            </p>
          </div>

          <button 
            onClick={handleManualSync}
            disabled={!isOnline || isSyncing}
            className={`p-5 rounded-2xl transition-all active:scale-95 shadow-2xl
              ${!isOnline || isSyncing 
                ? 'theme-button-secondary cursor-not-allowed opacity-50' 
                : 'theme-button-primary'}`}
            title="Force Office Sync"
          >
            {isSyncing ? <Loader2 size={24} className="animate-spin stroke-[3px]" /> : <RefreshCw size={24} className="stroke-[3px]" />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="theme-card border-2 border-dashed p-6 rounded-[2.5rem] transition-all cursor-pointer group flex items-center justify-between hover:theme-border shadow-inner"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="theme-panel p-3 rounded-xl transition-colors group-hover:theme-accent">
              <FileUp size={22} />
            </div>
            <div>
              <p className="theme-heading text-[11px] font-black uppercase tracking-widest">Upload Site Evidence</p>
              <p className="theme-meta text-[9px] font-bold uppercase mt-1 leading-none italic">Photos, PDF Reports, or Excel Specs</p>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileIntake} 
            className="hidden" 
            multiple 
          />
          <Plus size={20} className="theme-icon group-hover:theme-accent transition-colors" />
        </div>

        {localBuffer.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2 animate-in fade-in duration-500">
            {localBuffer.map(file => (
              <div key={file.id} className="theme-card flex items-center justify-between p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4 overflow-hidden text-left">
                  <div className="theme-accent shrink-0">
                    {file.type === 'PDF' ? <FileText size={16}/> : file.type === 'XLSX' || file.type === 'XLS' ? <FileSpreadsheet size={16}/> : <FileCode size={16}/>}
                  </div>
                  <div className="overflow-hidden">
                    <p className="theme-heading text-[10px] font-bold truncate uppercase leading-none">{file.name}</p>
                    <p className="theme-meta text-[8px] font-black mt-1.5 uppercase tracking-tighter">{file.size} • QUEUED FOR OFFICE</p>
                  </div>
                </div>
                <button onClick={() => setLocalBuffer(prev => prev.filter(f => f.id !== file.id))} className="theme-icon p-2 hover:text-rose-500 transition-colors">
                  <X size={14}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="theme-border/60 mt-8 pt-8 border-t flex flex-wrap gap-6 items-center justify-between opacity-40">
        <div className="flex items-center gap-3">
          <ShieldCheck size={14} className="text-emerald-500" />
          <p className="theme-meta text-[9px] font-black uppercase tracking-widest leading-none">
            {isOnline ? 'Active Cloud Handshake' : 'Local Vault Protection'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Database size={12} className="theme-icon" />
            <span className="theme-meta text-[8px] font-bold uppercase tracking-widest">Encrypted Database</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={12} className="theme-accent" />
            <span className="theme-meta text-[8px] font-bold uppercase tracking-widest italic">QS OS V2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncQueueMonitor;
