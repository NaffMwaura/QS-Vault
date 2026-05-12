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
import { db, syncEngine } from "../../../lib/database/database";

/* ======================================================
    OFFICE MODULE RESOLUTION (OFFLINE-FIRST)
   ====================================================== */

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

/** --- SUB-COMPONENT: MEASUREMENT ENTRY --- **/

const MeasurementEntry: React.FC<{ 
  item: Measurement; 
  onDeleteRequest: (id: string) => void;
}> = ({ item, onDeleteRequest }) => (
  <div className={`p-6 rounded-sm transition-all duration-300 group hover:scale-[1.01] relative theme-card hover:border-(--app-accent-strong)] shadow-lg`}>
    
    <div className="flex justify-between items-start mb-5">
      <div className="flex items-center gap-4 text-left">
        <div className={`p-3 rounded-sm theme-card text-(--app-meta)] group-hover:text-(--app-primary-fg)] group-hover:border-(--app-accent-strong) group-hover:bg-(--app-accent-strong)]`}>
          {item.type === 'length' ? <Ruler size={16} /> : item.type === 'area' ? <Maximize2 size={16} /> : <CheckSquare size={16} />}
        </div>
        <div className="text-left">
          <p className="text-[9px] font-black uppercase text-(--app-meta)] tracking-widest leading-none mb-1.5">
            {item.sectionCode} • {item.type}
          </p>
          <h5 className={`text-sm font-black uppercase truncate max-w-45 leading-none tracking-tight text-(--app-heading)]`}>
            {item.label || 'Site Record'}
          </h5>
        </div>
      </div>

      <div className="relative group/tooltip">
        <button 
          onClick={() => onDeleteRequest(item.id)}
          className="p-2.5 text-(--app-meta)] hover:text-(--app-error)] transition-colors active:scale-90"
          title="Delete Record"
        >
          <Trash2 size={16} />
        </button>
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-(--app-error)] text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
           Delete Record
           <div className="absolute top-full right-3 border-4 border-transparent border-t-(--app-error)]" />
        </div>
      </div>
    </div>

    <div className={`pt-5 border-t flex justify-between items-end border-(--app-border)]`}>
      <div className="text-left">
        <p className="text-[8px] font-black uppercase text-(--app-meta)] mb-2 leading-none tracking-widest">Measured Quantity</p>
        <p className="text-3xl font-black tracking-tighter leading-none italic theme-accent">
          {item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-[10px] ml-1.5 opacity-40 not-italic uppercase font-bold text-(--app-heading)]">{item.unit}</span>
        </p>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[7px] font-mono text-(--app-meta)] uppercase tracking-widest leading-none">
          REF: {item.id.slice(0, 8)}
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


  // 1. FILTER: Show only the selected work section
  const filteredMeasurements = measurements.filter(m => m.sectionCode === activeSection || activeSection === 'All Sections');

  // 2. HANDLER: Local Vault Deletion + Parent State Sync
  const handleDelete = async (id: string) => {
    // A. Remove from Local Device (Offline Security)
    if (db) {
      try {
        await db.measurements.delete(id);
        if (syncEngine) {
          await syncEngine.queueChange('measurements', id, 'DELETE', null);
        }
      } catch (err) {
        console.error("Vault Error: Could not delete record.", err);
      }
    }
    
    // B. Tell the Parent (Dashboard) to update the screen
    if (typeof onDelete === 'function') {
      onDelete(id);
    } else {
      console.warn("Takeoff Ledger: No delete instruction received from Dashboard.");
    }
  };

  return (
    <aside className={`w-full h-full flex flex-col p-6 sm:p-10 space-y-10 overflow-hidden transition-colors duration-500 bg-transparent`}>
      
      <div className="flex justify-between items-end shrink-0">
        <div className="text-left space-y-1">
          <h3 className={`text-2xl font-black italic tracking-tighter uppercase leading-none text-(--app-heading)]`}>
            Takeoff Ledger<span className="text-(--app-accent-strong)]">.</span>
          </h3>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-(--app-meta)]">
            Recorded Measurements
          </p>
        </div>
        <div className={`px-4 py-2 rounded-sm flex items-center gap-3 theme-card`}>
          <Hash size={12} className="text-(--app-accent-strong)]" />
          <span className="text-[10px] font-black text-(--app-meta)] uppercase">
            {filteredMeasurements.length} Items
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-5">
        {filteredMeasurements.length > 0 ? (
          filteredMeasurements.map((m) => (
            <MeasurementEntry 
              key={m.id} 
              item={m} 
              onDeleteRequest={handleDelete}
            />
          ))
        ) : (
          <div className="py-24 text-center space-y-8 opacity-20 border-2 border-dashed border-(--app-border)] rounded-sm">
            <Database size={64} className="mx-auto text-(--app-icon)] animate-pulse" />
            <p className="font-black uppercase text-xs tracking-[0.4em] text-(--app-heading)]">Ledger Node Empty</p>
          </div>
        )}
      </div>

      <div className={`p-6 rounded-sm shrink-0 text-left theme-card`}>
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle size={16} className="text-(--app-accent-strong)] opacity-60" />
          <p className="text-[10px] font-black uppercase tracking-widest text-(--app-meta)]">
            Vault Integrity Active
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
           <p className={`text-[11px] font-bold leading-none text-[--app-meta)]`}>
             Section: <span className="text-(--app-accent-strong)] italic uppercase">{activeSection}</span>
           </p>
           <CheckCircle2 size={14} className="text-(--app-success)] opacity-40" />
        </div>
      </div>
    </aside>
  );
};

export default GeometricRegistry;
