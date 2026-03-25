/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Trash2, 
  Ruler, 
  Maximize2, 
  CheckSquare,
  AlertCircle,
  Hash,
  Database,
  CheckCircle2
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (OFFLINE-FIRST)
   ====================================================== */

let useAuth: any = () => ({
  theme: 'dark',
});

let db: any = null;
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {
    // Sandbox shims active
  }
};

resolveModules();

/** --- TYPES --- **/

interface Measurement {
  id: string;
  label: string;
  type: 'length' | 'area' | 'count';
  value: number;
  unit: string;
  sectionCode: string;
  timestamp: string;
}

interface GeometricRegistryProps {
  measurements: Measurement[];
  onDelete: (id: string) => void;
  activeSection: string;
}

/** --- SUB-COMPONENT: MEASUREMENT NODE --- **/

const MeasurementEntry: React.FC<{ 
  item: Measurement; 
  onDelete: (id: string) => void; 
  theme: 'light' | 'dark' 
}> = ({ item, onDelete, theme }) => (
  <div className={`p-6 rounded-4xl border transition-all duration-300 group hover:scale-[1.01] relative
    ${theme === 'dark' 
      ? 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/30 shadow-xl shadow-black/20' 
      : 'bg-white border-zinc-200 hover:border-amber-500/30 shadow-lg'}`}>
    
    <div className="flex justify-between items-start mb-5">
      <div className="flex items-center gap-4 text-left">
        <div className={`p-3 rounded-xl border transition-all
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}
          group-hover:text-black group-hover:border-amber-500 group-hover:bg-amber-500`}>
          {item.type === 'length' ? <Ruler size={16} /> : item.type === 'area' ? <Maximize2 size={16} /> : <CheckSquare size={16} />}
        </div>
        <div className="text-left">
          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1.5">
            {item.sectionCode} • {item.type}
          </p>
          <h5 className={`text-sm font-black uppercase truncate max-w-180px] leading-none tracking-tight
            ${theme === 'dark' ? 'text-zinc-200 group-hover:text-white' : 'text-zinc-900'}`}>
            {item.label || 'Untitled Measurement'}
          </h5>
        </div>
      </div>

      <div className="relative group/tooltip">
        <button 
          onClick={() => onDelete(item.id)}
          className="p-2.5 text-zinc-700 hover:text-rose-500 transition-colors active:scale-90"
          title="Remove Entry"
        >
          <Trash2 size={16} />
        </button>
        {/* Hover Label */}
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
           Purge Node
           <div className="absolute top-full right-3 border-4 border-transparent border-t-rose-500" />
        </div>
      </div>
    </div>

    <div className={`pt-5 border-t flex justify-between items-end ${theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
      <div className="text-left">
        <p className="text-[8px] font-black uppercase text-zinc-600 mb-2 leading-none tracking-widest text-left">Measured Quantity</p>
        <p className="text-3xl font-black text-amber-500 tracking-tighter leading-none italic">
          {item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-[10px] ml-1.5 opacity-40 not-italic uppercase font-bold">{item.unit}</span>
        </p>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-widest leading-none mb-1">
          ID: {item.id.slice(0, 8).toUpperCase()}
        </span>
        <span className="text-[7px] font-bold text-zinc-800 uppercase tracking-widest leading-none">
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  </div>
);

/** --- MAIN COMPONENT: TAKEOFF REGISTRY --- **/

const GeometricRegistry: React.FC<GeometricRegistryProps> = ({ 
  measurements, 
  onDelete, 
  activeSection
}) => {
  const { theme } = useAuth();

  // Filter based on the selected Work Section
  const filteredMeasurements = measurements.filter(m => m.sectionCode === activeSection || activeSection === 'All Sections');

  return (
    <aside className={`w-full h-full flex flex-col p-6 sm:p-10 space-y-10 overflow-hidden transition-colors duration-500
      ${theme === 'dark' ? 'bg-transparent' : 'bg-zinc-50/50'}`}>
      
      {/* 1. LEDGER HEADER */}
      <div className="flex justify-between items-end shrink-0">
        <div className="text-left space-y-1">
          <h3 className={`text-2xl font-black italic tracking-tighter uppercase leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Takeoff Ledger<span className="text-amber-500">.</span>
          </h3>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
            Recorded Site Measurements
          </p>
        </div>
        <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
          <Hash size={12} className="text-amber-500" />
          <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">
            {filteredMeasurements.length} Nodes
          </span>
        </div>
      </div>

      {/* 2. SCROLLABLE DATA STREAM */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-5">
        {filteredMeasurements.length > 0 ? (
          filteredMeasurements.map((m) => (
            <MeasurementEntry 
              key={m.id} 
              item={m} 
              onDelete={async (id) => {
                // LOCAL VAULT DELETION (Offline Support)
                if (db) {
                  try {
                    await db.measurements.delete(id);
                    // Queue for cloud cleanup
                    if (syncEngine) {
                      await syncEngine.queueChange('measurements', id, 'DELETE', null);
                    }
                  } catch (err) {
                    console.error("Ledger: Access to vault denied.", err);
                  }
                }
                onDelete(id);
              }} 
              theme={theme} 
            />
          ))
        ) : (
          <div className="py-24 text-center space-y-8 opacity-20 border-2 border-dashed border-zinc-800 rounded-[3rem] bg-zinc-950/20">
            <Database size={64} className="mx-auto text-zinc-700 animate-pulse" />
            <div className="space-y-3 px-8">
              <p className="font-black uppercase text-sm tracking-[0.4em]">Ledger Node Empty</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 max-w-200px] mx-auto leading-relaxed">
                Generate a measurement on the drawing to initialize records
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. AUDIT CONTROL FOOTER */}
      <div className={`p-6 rounded-4xl border shrink-0 text-left
        ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/60' : 'bg-white border-zinc-200 shadow-xl'}`}>
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle size={16} className="text-amber-500 opacity-60" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Vault Integrity Monitor
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
           <p className={`text-[11px] font-bold leading-none
             ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
             Active View: <span className="text-amber-500 italic uppercase">{activeSection}</span>
           </p>
           <CheckCircle2 size={14} className="text-emerald-500/40" />
        </div>
      </div>
    </aside>
  );
};

export default GeometricRegistry;

