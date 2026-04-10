import React from "react";
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
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine } from "../../../lib/database/database";
import type { Measurement } from "../types/takeoff";

interface TakeoffLedgerProps {
  measurements: Measurement[];
  onDelete: (id: string) => void;
  activeSection: string;
}

/** --- SUB-COMPONENT: HIGH-VISIBILITY DATA ROW --- **/
const MeasurementEntry: React.FC<{
  item: Measurement;
  onDeleteRequest: (id: string) => void;
  theme: "light" | "dark";
}> = ({ item, onDeleteRequest, theme }) => (
  <div
    className={`p-6 sm:p-8 rounded-[2.5rem] border-2 transition-all duration-300 group hover:scale-[1.01] relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 ${
      theme === "dark"
        ? "bg-zinc-950/80 border-zinc-800 hover:border-amber-500/50 shadow-xl"
        : "bg-white border-zinc-200 hover:border-amber-500/50 shadow-md"
    }`}
  >
    {/* Left Side: Identity */}
    <div className="flex items-center gap-6 text-left min-w-0 flex-1">
      <div
        className={`p-4 rounded-2xl border-2 transition-all shrink-0 ${
          theme === "dark"
            ? "bg-zinc-900 border-zinc-800 text-zinc-500"
            : "bg-zinc-50 border-zinc-200 text-zinc-400"
        } group-hover:text-black group-hover:border-amber-500 group-hover:bg-amber-500`}
      >
        {item.type === "length" ? (
          <Ruler size={24} strokeWidth={2.5} />
        ) : item.type === "area" ? (
          <Maximize2 size={24} strokeWidth={2.5} />
        ) : (
          <CheckSquare size={24} strokeWidth={2.5} />
        )}
      </div>
      <div className="text-left min-w-0">
        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] leading-none mb-2 italic">
          {item.sectionCode} • {item.type}
        </p>
        <h5
          className={`text-xl font-black uppercase truncate leading-tight tracking-tight ${
            theme === "dark"
              ? "text-zinc-200 group-hover:text-white"
              : "text-zinc-900"
          }`}
        >
          {item.label || "Captured Site Record"}
        </h5>
        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em] leading-none block mt-2">
          REF: {item.id.slice(0, 8).toUpperCase()}
        </span>
      </div>
    </div>

    {/* Right Side: Values & Actions */}
    <div className="flex items-center gap-8 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-800/40">
      <div className="text-left sm:text-right">
        <p className="text-[9px] font-black uppercase text-zinc-500 mb-1 leading-none tracking-widest italic">
          Measured Quantity
        </p>
        <p className="text-3xl sm:text-4xl font-black text-amber-500 tracking-tighter leading-none">
          {item.value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          <span className="text-sm ml-2 opacity-50 uppercase font-bold tracking-widest">
            {item.unit}
          </span>
        </p>
      </div>

      <button
        onClick={() => onDeleteRequest(item.id)}
        className={`p-4 rounded-2xl transition-all active:scale-90 shrink-0 ${
          theme === "dark" ? 'bg-zinc-900 text-zinc-600 hover:bg-rose-500 hover:text-white' : 'bg-zinc-100 text-zinc-400 hover:bg-rose-500 hover:text-white'
        }`}
        title="Delete Record"
      >
        <Trash2 size={20} strokeWidth={2.5} />
      </button>
    </div>
  </div>
);

/** --- MAIN COMPONENT: TAKEOFF LEDGER --- **/
const TakeoffLedger: React.FC<TakeoffLedgerProps> = ({
  measurements,
  onDelete,
  activeSection,
}) => {
  const { theme } = useAuth();

  const filteredMeasurements = measurements.filter(
    (item) =>
      item.sectionCode === activeSection || activeSection === "All Sections",
  );

  // EXACT ORIGINAL DB LOGIC PRESERVED
  const handleDeleteMeasurement = async (id: string) => {
    if (db) {
      try {
        await db.measurements.delete(id);
        if (syncEngine) {
          await syncEngine.queueChange("measurements", id, "DELETE", null);
        }
      } catch (err) {
        console.error("Ledger: Access to local vault denied.", err);
      }
    }
    onDelete(id);
  };

  return (
    <div
      className={`w-full flex flex-col p-6 sm:p-12 space-y-8 sm:space-y-10 transition-colors duration-500 ${
        theme === "dark" ? "bg-transparent" : "bg-transparent"
      }`}
    >
      {/* 1. FILTER SUMMARY HEADER */}
      <div className={`p-6 sm:p-8 rounded-[2.5rem] border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-colors duration-500 ${
          theme === "dark"
            ? "bg-zinc-950/50 border-zinc-800"
            : "bg-white border-zinc-200 shadow-sm"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
             <ClipboardList size={24} strokeWidth={2.5} />
          </div>
          <div className="text-left space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">
              Active Filter
            </p>
            <p className={`text-lg font-bold leading-snug ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
              Displaying records for: <span className="text-emerald-500 uppercase">{activeSection}</span>
            </p>
          </div>
        </div>

        <div
          className={`px-6 py-4 rounded-2xl border-2 flex items-center gap-4 self-start sm:self-auto shrink-0 ${
            theme === "dark"
              ? "bg-zinc-900 border-zinc-800 text-zinc-300"
              : "bg-zinc-50 border-zinc-200 text-zinc-700 shadow-inner"
          }`}
        >
          <Hash size={18} className="text-emerald-500" />
          <span className="text-xs font-black tracking-widest uppercase">
            {filteredMeasurements.length} Records Found
          </span>
        </div>
      </div>

      {/* 2. DATA GRID (Scrollable Container) */}
      <div className="flex-1 max-h-600px] overflow-y-auto custom-scrollbar pr-2 sm:pr-4 space-y-4">
        {filteredMeasurements.length > 0 ? (
          filteredMeasurements.map((item) => (
            <MeasurementEntry
              key={item.id}
              item={item}
              onDeleteRequest={handleDeleteMeasurement}
              theme={theme as "light" | "dark"}
            />
          ))
        ) : (
          <div
            className={`py-24 px-8 text-center flex flex-col items-center justify-center space-y-8 border-2 border-dashed rounded-[3.5rem] transition-colors duration-500 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950/30"
                : "border-zinc-300 bg-zinc-50/50"
            }`}
          >
            <div className={`p-8 rounded-full border-2 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
               <Database size={64} className="text-zinc-500" strokeWidth={1.5} />
            </div>
            <div className="space-y-3 max-w-lg mx-auto">
              <p className="font-black uppercase text-sm tracking-[0.4em] text-zinc-500 italic">
                Registry Empty
              </p>
              <p className={`text-base font-bold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Draw on the blueprint above to automatically populate this ledger with measured quantities.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. AUDIT STATUS */}
      <div
        className={`p-6 sm:p-8 rounded-[2.5rem] border-2 flex items-center justify-between transition-colors duration-500 ${
          theme === "dark"
            ? "bg-zinc-950 border-zinc-800"
            : "bg-white border-zinc-200 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-4">
          <AlertCircle size={20} className="text-amber-500" />
          <div className="text-left">
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-1.5">
               System Audit Trail
             </p>
             <p className={`text-[11px] font-bold leading-none ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
               All measurements are tracked and synced to the secure vault.
             </p>
          </div>
        </div>
        <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
      </div>

    </div>
  );
};

export default TakeoffLedger;
