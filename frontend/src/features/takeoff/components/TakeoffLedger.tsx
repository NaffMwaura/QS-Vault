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

const MeasurementEntry: React.FC<{
  item: Measurement;
  onDeleteRequest: (id: string) => void;
  theme: "light" | "dark";
}> = ({ item, onDeleteRequest, theme }) => (
  <div
    className={`p-5 sm:p-6 rounded-4xl border transition-all duration-300 group hover:scale-[1.01] relative ${
      theme === "dark"
        ? "bg-zinc-900/40 border-zinc-800 hover:border-amber-500/30 shadow-xl"
        : "bg-white border-zinc-200 hover:border-amber-500/30 shadow-lg"
    }`}
  >
    <div className="flex justify-between items-start mb-5 gap-4">
      <div className="flex items-center gap-4 text-left min-w-0">
        <div
          className={`p-3 rounded-xl border transition-all shrink-0 ${
            theme === "dark"
              ? "bg-zinc-950 border-zinc-800 text-zinc-600"
              : "bg-zinc-50 border-zinc-100 text-zinc-400"
          } group-hover:text-black group-hover:border-amber-500 group-hover:bg-amber-500`}
        >
          {item.type === "length" ? (
            <Ruler size={16} />
          ) : item.type === "area" ? (
            <Maximize2 size={16} />
          ) : (
            <CheckSquare size={16} />
          )}
        </div>
        <div className="text-left min-w-0">
          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1.5">
            {item.sectionCode} · {item.type}
          </p>
          <h5
            className={`text-sm font-black uppercase truncate leading-none tracking-tight ${
              theme === "dark"
                ? "text-zinc-200 group-hover:text-white"
                : "text-zinc-900"
            }`}
          >
            {item.label || "Site Record"}
          </h5>
        </div>
      </div>

      <button
        onClick={() => onDeleteRequest(item.id)}
        className="p-2.5 text-zinc-700 hover:text-rose-500 transition-colors active:scale-90 shrink-0"
        title="Delete Record"
      >
        <Trash2 size={16} />
      </button>
    </div>

    <div
      className={`pt-5 border-t flex justify-between items-end gap-4 ${
        theme === "dark" ? "border-zinc-800/60" : "border-zinc-100"
      }`}
    >
      <div className="text-left min-w-0">
        <p className="text-[8px] font-black uppercase text-zinc-600 mb-2 leading-none tracking-widest">
          Measured Quantity
        </p>
        <p className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tighter leading-none italic">
          {item.value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          <span className="text-[10px] ml-1.5 opacity-40 not-italic uppercase font-bold">
            {item.unit}
          </span>
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-widest leading-none">
          REF: {item.id.slice(0, 8).toUpperCase()}
        </span>
      </div>
    </div>
  </div>
);

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
    <aside
      className={`w-full h-full flex flex-col p-5 sm:p-8 space-y-6 sm:space-y-8 overflow-hidden transition-colors duration-500 ${
        theme === "dark" ? "bg-transparent" : "bg-zinc-50/50"
      }`}
    >
      <div className="flex flex-col gap-4 shrink-0 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-left space-y-1">
          <h3
            className={`text-2xl font-black italic tracking-tighter uppercase leading-none ${
              theme === "dark" ? "text-white" : "text-zinc-900"
            }`}
          >
            Takeoff Ledger<span className="text-amber-500">.</span>
          </h3>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
            Live measurement stream for quantity capture and review
          </p>
        </div>
        <div
          className={`px-4 py-2 rounded-2xl border flex items-center gap-3 self-start ${
            theme === "dark"
              ? "bg-zinc-950 border-zinc-800"
              : "bg-white border-zinc-200 shadow-sm"
          }`}
        >
          <Hash size={12} className="text-amber-500" />
          <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">
            {filteredMeasurements.length} Records
          </span>
        </div>
      </div>

      <div
        className={`rounded-[2rem] border p-4 sm:p-5 ${
          theme === "dark"
            ? "bg-zinc-950/50 border-zinc-800/80"
            : "bg-white border-zinc-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <ClipboardList size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
              Current Focus
            </p>
            <p className="text-sm font-bold text-zinc-300 dark:text-zinc-300">
              Capture and verify measurements as you work through the drawing and prepare them for reporting.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 sm:pr-3 space-y-4">
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
          <div
            className={`py-16 px-6 text-center space-y-6 border-2 border-dashed rounded-[2.5rem] ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950/20"
                : "border-zinc-200 bg-white"
            }`}
          >
            <Database size={52} className="mx-auto text-zinc-600" />
            <div className="space-y-3 max-w-md mx-auto">
              <p className="font-black uppercase text-xs tracking-[0.35em] text-zinc-500">
                No Records Yet
              </p>
              <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-400">
                Upload a drawing, confirm the scale, then start marking quantities for the active work section.
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        className={`p-5 rounded-[2rem] border shrink-0 text-left ${
          theme === "dark"
            ? "bg-zinc-950/40 border-zinc-800/60"
            : "bg-white border-zinc-200 shadow-xl"
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle size={16} className="text-amber-500 opacity-70" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Audit Trail Active
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p
            className={`text-[11px] font-bold leading-snug ${
              theme === "dark" ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            Active section:{" "}
            <span className="text-amber-500 italic uppercase">
              {activeSection}
            </span>
          </p>
          <CheckCircle2 size={14} className="text-emerald-500/50 shrink-0" />
        </div>
      </div>
    </aside>
  );
};

export default TakeoffLedger;
