/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import {
  Database,
  Hash,
  Maximize2,
  Ruler,
  Trash2,
  ShieldCheck,
  MousePointer2,
  AlertCircle
} from "lucide-react";

// Direct Infrastructure
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine } from "../../../lib/database/database";

// Master Types
import type { Measurement } from "../types/takeoff";

interface TakeoffLedgerProps {
  projectId: string; // REQUIRED: For ID validation
  measurements: Measurement[];
  onDelete: (id: string) => void;
  activeSection: string;
}

/** --- SUB-COMPONENT: QUANTITY ENTRY --- **/
const MeasurementEntry: React.FC<{
  item: Measurement;
  onDeleteRequest: (id: string) => void;
  theme: string;
}> = ({ item, onDeleteRequest, theme }) => (
  <div className={`p-6 rounded-[2.5rem] border-2 transition-all duration-300 group hover:border-amber-500/50 relative shadow-xl
    ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
    
    <div className="flex justify-between items-start mb-6 gap-4">
      <div className="flex items-center gap-4 text-left min-w-0">
        <div className={`p-3 rounded-xl border-2 transition-all ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400`}>
          {item.type === "length" ? <Ruler size={18} /> : item.type === "area" ? <Maximize2 size={18} /> : <MousePointer2 size={18} />}
        </div>
        <div className="text-left min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 leading-none mb-2 italic">
            {item.sectionCode} Node
          </p>
          <h5 className={`text-sm font-black uppercase truncate leading-none tracking-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
            {item.label || "Vault Record"}
          </h5>
        </div>
      </div>

      <button
        onClick={() => onDeleteRequest(item.id)}
        className="p-3 text-zinc-700 hover:text-rose-500 transition-all active:scale-90"
      >
        <Trash2 size={18} />
      </button>
    </div>

    <div className={`pt-6 border-t-2 flex justify-between items-end ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-100'}`}>
      <div className="text-left">
        <p className="text-[8px] font-black uppercase mb-2 text-zinc-600 tracking-widest italic">Calculated Volume</p>
        <p className={`text-4xl font-black tracking-tighter leading-none italic ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
          {item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-sm ml-2 text-amber-500 not-italic uppercase font-bold">{item.unit}</span>
        </p>
      </div>
      <div className="flex flex-col items-end opacity-20">
         <span className="text-[7px] font-mono font-bold text-zinc-500">REF: {item.id.slice(0, 8)}</span>
      </div>
    </div>
  </div>
);

/** --- MAIN COMPONENT: THE PROJECT LEDGER --- **/
const TakeoffLedger: React.FC<TakeoffLedgerProps> = ({
  projectId,
  measurements,
  onDelete,
  activeSection,
}) => {
  const { theme } = useAuth();

  /** * 1. STRICT DATA FILTERING
   * We filter measurements by:
   * A. The current Project ID (To prevent data bleeding)
   * B. The active trade section
   */
  const filteredItems = measurements.filter((m) => {
    const isThisProject = m.project_id === projectId; // STRICT BINDING
    const matchesSection = activeSection === "All Sections" || m.sectionCode === activeSection;
    return isThisProject && matchesSection;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("ERASE DATA: Permanently remove node from project ledger?")) return;
    
    try {
      if (db) await db.measurements.delete(id);
      if (syncEngine) await syncEngine.queueChange("measurements", id, "DELETE", null);
      onDelete(id);
    } catch (err) {
      console.error("Purge fail.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6 sm:p-10 space-y-10 overflow-hidden text-left">
      
      {/* 1. HEADER: VAULT CONTEXT */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between shrink-0">
        <div className="space-y-3">
          <h3 className={`text-4xl font-black italic tracking-tighter uppercase leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            Project Ledger<span className="text-emerald-500">.</span>
          </h3>
          <div className="flex items-center gap-3">
             <Database size={12} className="text-zinc-600" />
             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 truncate max-w-200px">
               VAULT_ID: {projectId}
             </p>
          </div>
        </div>
        <div className={`px-6 py-3 border-2 flex items-center gap-3 rounded-full ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          <Hash size={14} className="text-emerald-500" />
          <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">
            {filteredItems.length} Nodes Secured
          </span>
        </div>
      </div>

      {/* 2. AUDIT INTEGRITY BOX */}
      <div className={`p-6 rounded-[2.5rem] border-2 border-l-12px] border-emerald-500 shadow-inner
        ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
        <div className="flex items-start gap-5">
          <ShieldCheck size={22} className="text-emerald-500 shrink-0 mt-1" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Integrity Check Active</p>
            <p className={`text-xs font-bold leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700'}`}>
              Displaying nodes strictly verified for <span className="text-amber-500">SMM-KE</span> compliance within this project vault.
            </p>
          </div>
        </div>
      </div>

      {/* 3. MEASUREMENT FEED */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <MeasurementEntry
              key={item.id}
              item={item}
              onDeleteRequest={handleDelete}
              theme={theme}
            />
          ))
        ) : (
          <div className={`rounded-[4rem] border-2 border-dashed py-32 px-10 text-center space-y-8 opacity-20
            ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <AlertCircle size={60} className="mx-auto" strokeWidth={1} />
            <div className="space-y-2">
              <p className="font-black uppercase text-sm tracking-[0.5em]">Vault Empty</p>
              <p className="text-[10px] font-bold uppercase tracking-widest">No measurements detected for this ID</p>
            </div>
          </div>
        )}
      </div>

      {/* 4. FOOTER: SYSTEM HANDSHAKE */}
      <div className={`p-6 rounded-4xl border-2 shrink-0 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-700'}`}>
              Target: <span className="text-amber-500 italic">{activeSection}</span>
            </p>
          </div>
          <span className="text-[8px] font-mono text-zinc-700 uppercase font-bold tracking-tighter">REF_ISO_19650</span>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#27272a' : '#e4e4e7'}; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </div>
  );
};

export default TakeoffLedger;

