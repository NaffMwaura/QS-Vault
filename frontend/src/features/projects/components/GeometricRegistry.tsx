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
  Database
} from 'lucide-react';

/* ======================================================
    OFFICE DATABASE HANDSHAKE
   ====================================================== */

let useAuth: any = () => ({
  theme: 'dark',
});

let db: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db; 
  } catch (e) {
    // Sandbox fallback
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

/** --- SUB-COMPONENT: MEASUREMENT_ENTRY --- **/

const MeasurementEntry: React.FC<{ 
  item: Measurement; 
  onDelete: (id: string) => void; 
  theme: 'light' | 'dark' 
}> = ({ item, onDelete, theme }) => (
  <div className={`p-5 rounded-4xl border transition-all duration-300 group hover:scale-[1.01]
    ${theme === 'dark' 
      ? 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/30 shadow-xl shadow-black/20' 
      : 'bg-white border-zinc-200 hover:border-amber-500/30 shadow-lg'}`}>
    
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl border transition-all
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}
          group-hover:text-black group-hover:border-amber-500 group-hover:bg-amber-500`}>
          {item.type === 'length' ? <Ruler size={14} /> : item.type === 'area' ? <Maximize2 size={14} /> : <CheckSquare size={14} />}
        </div>
        <div className="text-left">
          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1">
            {item.sectionCode} • {item.type}
          </p>
          <h5 className={`text-xs font-bold uppercase truncate max-w-150px] leading-none
            ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {item.label}
          </h5>
        </div>
      </div>
      <button 
        onClick={() => onDelete(item.id)}
        className="p-2 text-zinc-700 hover:text-rose-500 transition-colors active:scale-90"
        title="Remove Entry"
      >
        <Trash2 size={14} />
      </button>
    </div>

    <div className={`pt-4 border-t flex justify-between items-end ${theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
      <div className="text-left">
        <p className="text-[8px] font-black uppercase text-zinc-600 mb-1 leading-none tracking-tighter">
          Quantified Output
        </p>
        <p className="text-2xl font-black text-amber-500 tracking-tighter leading-none italic">
          {item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-[10px] ml-1 opacity-40 not-italic uppercase font-bold">{item.unit}</span>
        </p>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-widest leading-none mb-1">
          REF: {item.id.slice(0, 8).toUpperCase()}
        </span>
      </div>
    </div>
  </div>
);

/** --- MAIN COMPONENT: TAKEOFF LEDGER --- **/

const GeometricRegistry: React.FC<GeometricRegistryProps> = ({ 
  measurements, 
  onDelete, 
  activeSection
}) => {
  const { theme } = useAuth();

  // Filter the list based on the active SMM section (Concrete, Walling, etc.)
  const filteredMeasurements = measurements.filter(m => m.sectionCode === activeSection || activeSection === 'All Sections');

  return (
    <aside className={`w-full h-full flex flex-col p-6 sm:p-8 space-y-8 overflow-hidden transition-colors duration-500
      ${theme === 'dark' ? 'bg-transparent' : 'bg-zinc-50/50'}`}>
      
      {/* 1. Ledger Header */}
      <div className="flex justify-between items-end shrink-0">
        <div className="text-left space-y-1">
          <h3 className={`text-2xl font-black italic tracking-tighter uppercase leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Takeoff Ledger<span className="text-amber-500">.</span>
          </h3>
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
            Recorded Measurement Stream
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
          <Hash size={10} className="text-amber-500" />
          <span className="text-[10px] font-black text-zinc-500 tracking-tighter uppercase">
            {filteredMeasurements.length} Entries
          </span>
        </div>
      </div>

      {/* 2. Scrollable Data List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
        {filteredMeasurements.length > 0 ? (
          filteredMeasurements.map((m) => (
            <MeasurementEntry 
              key={m.id} 
              item={m} 
              onDelete={async (id) => {
                // If a database is present, we remove it from local storage first
                if (db) {
                  try {
                    await db.measurements.delete(id);
                  } catch (err) {
                    console.error("Ledger delete failed:", err);
                  }
                }
                onDelete(id);
              }} 
              theme={theme} 
            />
          ))
        ) : (
          <div className="py-24 text-center space-y-6 opacity-20 border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <Database size={64} className="mx-auto text-zinc-700 animate-pulse" />
            <div className="space-y-2 px-6">
              <p className="font-black uppercase text-xs tracking-[0.4em]">Ledger Record Empty</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                Begin project takeoff to generate records
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Audit History Footer */}
      <div className={`p-6 rounded-4xl border shrink-0 text-left
        ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/60' : 'bg-white border-zinc-200 shadow-xl'}`}>
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle size={14} className="text-amber-500 opacity-60" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Audit Trail History
          </p>
        </div>
        <p className={`text-[11px] font-bold leading-relaxed
          ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Currently viewing <span className="text-amber-500 italic">{activeSection}</span> measurements. All changes are saved locally.
        </p>
      </div>
    </aside>
  );
};

export default GeometricRegistry;


