/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Database,
  Hash,
  Maximize2,
  Ruler,
  Trash2,
  Info,
  ShieldCheck,
  MousePointer2
} from "lucide-react";

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
    console.warn("Ledger Engine: Waiting for database nodes...");
  }
};

resolveModules();

/** --- TYPES --- **/
import type { Measurement } from "../types/takeoff";

interface TakeoffLedgerProps {
  measurements: Measurement[];
  onDelete: (id: string) => void;
  activeSection: string;
}

/** --- SUB-COMPONENT: MEASUREMENT RECORD CARD --- **/
const MeasurementEntry: React.FC<{
  item: Measurement;
  onDeleteRequest: (id: string) => void;
  theme: string;
}> = ({ item, onDeleteRequest, theme }) => (
  <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 group hover:scale-[1.01] relative shadow-xl
    ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/30' : 'bg-white border-zinc-100 hover:border-amber-500/30'}`}>
    
    <div className="flex justify-between items-start mb-5 gap-4">
      <div className="flex items-center gap-4 text-left min-w-0">
        <div className={`p-3 rounded-xl border-2 transition-colors ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} group-hover:text-amber-500`}>
          {item.type === "length" ? (
            <Ruler size={18} />
          ) : item.type === "area" ? (
            <Maximize2 size={18} />
          ) : (
            <CheckSquare size={18} />
          )}
        </div>
        <div className="text-left min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-1.5 italic">
            {item.sectionCode} · {item.type}
          </p>
          <h5 className={`text-sm font-bold uppercase truncate leading-none tracking-tight ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {item.label || "Measurement Node"}
          </h5>
        </div>
      </div>

      <button
        onClick={() => onDeleteRequest(item.id)}
        className="p-3 text-zinc-600 hover:text-rose-500 transition-all active:scale-90"
        title="Remove Record"
      >
        <Trash2 size={18} />
      </button>
    </div>

    <div className={`pt-5 border-t-2 flex justify-between items-end gap-4 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-100'}`}>
      <div className="text-left min-w-0">
        <p className="text-[8px] font-black uppercase mb-2 text-zinc-500 tracking-[0.2em]">Quantity Found</p>
        <p className={`text-3xl font-black tracking-tighter leading-none italic ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
          {item.value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          <span className="text-sm ml-2 opacity-40 uppercase font-bold tracking-widest not-italic text-amber-500">
            {item.unit}
          </span>
        </p>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[7px] font-mono font-bold uppercase text-zinc-700">REF: {item.id.slice(0, 8).toUpperCase()}</span>
      </div>
    </div>
  </div>
);

/** --- MAIN COMPONENT: MEASUREMENT LIST --- **/
const TakeoffLedger: React.FC<TakeoffLedgerProps> = ({
  measurements,
  onDelete,
  activeSection,
}) => {
  const { theme } = useAuth();

  // Filter based on the selected work section
  const filteredMeasurements = measurements.filter(
    (item) => item.sectionCode === activeSection || activeSection === "All Sections",
  );

  /** * DATA PURGE PROTOCOL
   * Ensures the measurement is removed from both local and cloud vaults.
   */
  const handleDeleteMeasurement = async (id: string) => {
    if (!window.confirm("Permanently erase this measurement from the project?")) return;
    
    if (db) {
      try {
        await db.measurements.delete(id);
        if (syncEngine) {
          await syncEngine.queueChange("measurements", id, "DELETE", null);
        }
      } catch (err) {
        console.error("Vault access denied.");
      }
    }
    onDelete(id);
  };

  return (
    <aside className="w-full h-full flex flex-col p-6 sm:p-10 space-y-8 overflow-hidden transition-colors duration-500">
      
      {/* 1. HEADER: SUMMARY */}
      <div className="flex flex-col gap-4 shrink-0 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-left space-y-2">
          <h3 className={`text-3xl font-black italic tracking-tighter uppercase leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Measurement List<span className="text-emerald-500">.</span>
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">
            Saved quantities for this project
          </p>
        </div>
        <div className={`px-5 py-2 border-2 flex items-center gap-3 rounded-full ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          <Hash size={14} className="text-emerald-500" />
          <span className="text-[10px] font-black tracking-widest uppercase">
            {filteredMeasurements.length} Items Found
          </span>
        </div>
      </div>

      {/* 2. NEWBIE GUIDE PANEL */}
      <div className={`p-6 rounded-[2.5rem] border-2 border-l-8 border-emerald-500 shadow-xl
        ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
        <div className="flex items-start gap-5">
          <Info size={20} className="text-emerald-500 shrink-0 mt-1" />
          <div className="text-left space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 leading-none italic">Quick Guide</p>
            <p className={`text-xs sm:text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Everything you measure on the plan appears here. These numbers are used to create your <span className="text-emerald-500 font-bold">Reports</span> and <span className="text-emerald-500 font-bold">BoQ</span>.
            </p>
          </div>
        </div>
      </div>

      {/* 3. DATA STREAM (Scrollable Container) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-6 min-h-0">
        {filteredMeasurements.length > 0 ? (
          filteredMeasurements.map((item) => (
            <MeasurementEntry
              key={item.id}
              item={item}
              onDeleteRequest={handleDeleteMeasurement}
              theme={theme}
            />
          ))
        ) : (
          <div className={`rounded-[3.5rem] border-2 border-dashed py-24 px-10 text-center space-y-8 opacity-20
            ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <Database size={60} className="mx-auto text-zinc-500" />
            <div className="space-y-3 max-w-xs mx-auto">
              <p className="font-black uppercase text-sm tracking-[0.4em]">No Work Found</p>
              <p className="text-xs font-medium leading-relaxed">
                Choose a tool and mark the drawing to see your quantities appear in this list.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. FOOTER: VERIFICATION STATUS */}
      <div className={`p-6 rounded-[2rem] border-2 shrink-0 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ShieldCheck size={20} className="text-emerald-500" />
            <div className="text-left">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 leading-none mb-1">Vault Status</p>
              <p className={`text-[11px] font-bold leading-none ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-900'}`}>
                Section: <span className="text-amber-500 uppercase">{activeSection}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Verified</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </aside>
  );
};

export default TakeoffLedger;